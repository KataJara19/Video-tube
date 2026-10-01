"""Suscripciones, reacciones y videos guardados."""
from datetime import datetime, timedelta, timezone

from sqlalchemy import case, delete, func, select
from sqlalchemy.orm import Session

from ..models.social import CommentReaction, SavedVideo, Subscription, VideoReaction
from ..models.user import User
from ..models.video import Video


# ── Suscripciones ─────────────────────────────────────────────────────────────
def is_subscribed(db: Session, subscriber_id: int | None, channel_id: int) -> bool:
    if subscriber_id is None:
        return False
    return (
        db.scalar(
            select(Subscription.id).where(
                Subscription.subscriber_id == subscriber_id, Subscription.channel_id == channel_id
            )
        )
        is not None
    )


def subscriber_count(db: Session, channel_id: int) -> int:
    return db.scalar(select(func.count(Subscription.id)).where(Subscription.channel_id == channel_id)) or 0


def subscribe(db: Session, subscriber_id: int, channel_id: int) -> bool:
    """Devuelve True si se creó la suscripción (False si ya existía)."""
    if is_subscribed(db, subscriber_id, channel_id):
        return False
    db.add(Subscription(subscriber_id=subscriber_id, channel_id=channel_id))
    db.commit()
    return True


def unsubscribe(db: Session, subscriber_id: int, channel_id: int) -> None:
    db.execute(
        delete(Subscription).where(Subscription.subscriber_id == subscriber_id, Subscription.channel_id == channel_id)
    )
    db.commit()


def subscribed_channel_ids(db: Session, subscriber_id: int) -> list[int]:
    return list(db.scalars(select(Subscription.channel_id).where(Subscription.subscriber_id == subscriber_id)))


def subscribed_channels(db: Session, subscriber_id: int) -> list[dict]:
    """Canales a los que sigue el usuario, con indicador de publicación reciente."""
    recent = datetime.now(timezone.utc) - timedelta(days=7)
    last_video = select(func.max(Video.created_at)).where(Video.user_id == User.id).scalar_subquery()
    rows = db.execute(
        select(User.id, User.name, last_video.label("last"))
        .join(Subscription, Subscription.channel_id == User.id)
        .where(Subscription.subscriber_id == subscriber_id)
        .order_by(last_video.desc().nulls_last(), User.name)
    ).all()
    return [{"id": r.id, "name": r.name, "has_new": bool(r.last and r.last >= recent)} for r in rows]


def subscriber_ids(db: Session, channel_id: int) -> list[int]:
    return list(db.scalars(select(Subscription.subscriber_id).where(Subscription.channel_id == channel_id)))


# ── Reacciones a videos ───────────────────────────────────────────────────────
def _counts(db: Session, model, fk, ids: list[int]) -> dict[int, tuple[int, int]]:
    if not ids:
        return {}
    rows = db.execute(
        select(
            fk,
            func.sum(case((model.value == 1, 1), else_=0)),
            func.sum(case((model.value == -1, 1), else_=0)),
        )
        .where(fk.in_(ids))
        .group_by(fk)
    ).all()
    return {r[0]: (int(r[1] or 0), int(r[2] or 0)) for r in rows}


def _mine(db: Session, model, fk, ids: list[int], user_id: int | None) -> dict[int, int]:
    if not ids or user_id is None:
        return {}
    rows = db.execute(select(fk, model.value).where(fk.in_(ids), model.user_id == user_id)).all()
    return {r[0]: r[1] for r in rows}


def video_reaction_counts(db: Session, video_ids: list[int]) -> dict[int, tuple[int, int]]:
    return _counts(db, VideoReaction, VideoReaction.video_id, video_ids)


def my_video_reaction(db: Session, video_id: int, user_id: int | None) -> int:
    return _mine(db, VideoReaction, VideoReaction.video_id, [video_id], user_id).get(video_id, 0)


def set_video_reaction(db: Session, user_id: int, video_id: int, value: int) -> None:
    existing = db.scalar(select(VideoReaction).where(VideoReaction.user_id == user_id, VideoReaction.video_id == video_id))
    if value == 0:
        if existing:
            db.delete(existing)
    elif existing:
        existing.value = value
    else:
        db.add(VideoReaction(user_id=user_id, video_id=video_id, value=value))
    db.commit()


def liked_video_ids(db: Session, user_id: int) -> list[int]:
    return list(
        db.scalars(
            select(VideoReaction.video_id)
            .where(VideoReaction.user_id == user_id, VideoReaction.value == 1)
            .order_by(VideoReaction.created_at.desc())
        )
    )


# ── Reacciones a comentarios ──────────────────────────────────────────────────
def comment_reaction_counts(db: Session, comment_ids: list[int]) -> dict[int, tuple[int, int]]:
    return _counts(db, CommentReaction, CommentReaction.comment_id, comment_ids)


def my_comment_reactions(db: Session, comment_ids: list[int], user_id: int | None) -> dict[int, int]:
    return _mine(db, CommentReaction, CommentReaction.comment_id, comment_ids, user_id)


def set_comment_reaction(db: Session, user_id: int, comment_id: int, value: int) -> None:
    existing = db.scalar(
        select(CommentReaction).where(CommentReaction.user_id == user_id, CommentReaction.comment_id == comment_id)
    )
    if value == 0:
        if existing:
            db.delete(existing)
    elif existing:
        existing.value = value
    else:
        db.add(CommentReaction(user_id=user_id, comment_id=comment_id, value=value))
    db.commit()


# ── Guardados ─────────────────────────────────────────────────────────────────
def is_saved(db: Session, user_id: int | None, video_id: int) -> bool:
    if user_id is None:
        return False
    return (
        db.scalar(select(SavedVideo.id).where(SavedVideo.user_id == user_id, SavedVideo.video_id == video_id))
        is not None
    )


def save_video(db: Session, user_id: int, video_id: int) -> None:
    if not is_saved(db, user_id, video_id):
        db.add(SavedVideo(user_id=user_id, video_id=video_id))
        db.commit()


def unsave_video(db: Session, user_id: int, video_id: int) -> None:
    db.execute(delete(SavedVideo).where(SavedVideo.user_id == user_id, SavedVideo.video_id == video_id))
    db.commit()


def saved_video_ids(db: Session, user_id: int) -> list[int]:
    return list(
        db.scalars(select(SavedVideo.video_id).where(SavedVideo.user_id == user_id).order_by(SavedVideo.created_at.desc()))
    )
