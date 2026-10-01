"""Operaciones de base de datos sobre la tabla users."""
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..models.user import User
from ..models.video import Video


def get_user(db: Session, user_id: int) -> User | None:
    return db.get(User, user_id)


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(User.email == email.lower()))


def create_user(db: Session, name: str, email: str, password_hash: str) -> User:
    user = User(name=name.strip(), email=email.lower(), password_hash=password_hash)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def count_user_videos(db: Session, user_id: int) -> int:
    return db.scalar(select(func.count(Video.id)).where(Video.user_id == user_id)) or 0
