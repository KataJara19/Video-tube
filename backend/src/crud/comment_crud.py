"""Operaciones de base de datos sobre la tabla comments (comentarios y respuestas)."""
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from ..models.comment import Comment


def get_comment(db: Session, comment_id: int) -> Comment | None:
    return db.scalar(select(Comment).options(joinedload(Comment.user)).where(Comment.id == comment_id))


def create_comment(db: Session, video_id: int, user_id: int, content: str, parent_id: int | None = None) -> Comment:
    comment = Comment(content=content.strip(), video_id=video_id, user_id=user_id, parent_id=parent_id)
    db.add(comment)
    db.commit()
    return get_comment(db, comment.id)


def list_comments(db: Session, video_id: int) -> list[Comment]:
    """Comentarios principales (sin respuestas), del más nuevo al más antiguo."""
    stmt = (
        select(Comment)
        .options(joinedload(Comment.user))
        .where(Comment.video_id == video_id, Comment.parent_id.is_(None))
        .order_by(Comment.created_at.desc(), Comment.id.desc())
    )
    return list(db.scalars(stmt).all())


def list_replies(db: Session, parent_id: int) -> list[Comment]:
    """Respuestas de un comentario, en orden cronológico."""
    stmt = (
        select(Comment)
        .options(joinedload(Comment.user))
        .where(Comment.parent_id == parent_id)
        .order_by(Comment.created_at.asc(), Comment.id.asc())
    )
    return list(db.scalars(stmt).all())


def reply_counts(db: Session, comment_ids: list[int]) -> dict[int, int]:
    if not comment_ids:
        return {}
    rows = db.execute(
        select(Comment.parent_id, func.count(Comment.id)).where(Comment.parent_id.in_(comment_ids)).group_by(Comment.parent_id)
    ).all()
    return {r[0]: r[1] for r in rows}


def count_comments(db: Session, video_id: int) -> int:
    return db.scalar(select(func.count(Comment.id)).where(Comment.video_id == video_id)) or 0
