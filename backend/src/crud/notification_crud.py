"""Notificaciones: nuevo video de un canal, comentario, respuesta y nuevo suscriptor."""
from sqlalchemy import func, select, update
from sqlalchemy.orm import Session, joinedload

from ..models.social import Notification


def notify(db: Session, *, user_ids: list[int], actor_id: int, type: str, video_id=None, comment_id=None) -> None:
    """Crea una notificación por destinatario (nunca para el propio autor de la acción)."""
    for uid in {u for u in user_ids if u != actor_id}:
        db.add(Notification(user_id=uid, actor_id=actor_id, type=type, video_id=video_id, comment_id=comment_id))
    db.commit()


def list_notifications(db: Session, user_id: int, limit: int = 30) -> list[Notification]:
    stmt = (
        select(Notification)
        .options(joinedload(Notification.actor), joinedload(Notification.video))
        .where(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc(), Notification.id.desc())
        .limit(limit)
    )
    return list(db.scalars(stmt).all())


def unread_count(db: Session, user_id: int) -> int:
    return (
        db.scalar(select(func.count(Notification.id)).where(Notification.user_id == user_id, Notification.is_read.is_(False)))
        or 0
    )


def mark_all_read(db: Session, user_id: int) -> None:
    db.execute(update(Notification).where(Notification.user_id == user_id).values(is_read=True))
    db.commit()


def mark_read(db: Session, user_id: int, notification_id: int) -> None:
    db.execute(
        update(Notification).where(Notification.user_id == user_id, Notification.id == notification_id).values(is_read=True)
    )
    db.commit()
