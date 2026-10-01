from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

from .user import UserBrief


class VideoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    description: str
    video_url: str
    thumbnail_url: str
    views: int
    is_short: bool = False
    duration: Optional[float] = None
    user_id: int
    created_at: datetime
    user: UserBrief


class VideoDetail(VideoOut):
    """Detalle para el reproductor: reacciones, guardado y datos del canal."""
    likes: int = 0
    dislikes: int = 0
    my_reaction: int = 0          # 1 me gusta · -1 no me gusta · 0 nada
    saved: bool = False
    comment_count: int = 0
    author_subscribers: int = 0
    subscribed: bool = False       # el usuario actual está suscrito al autor


class VideoUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=5000)


class ViewsOut(BaseModel):
    id: int
    views: int


class ReactionIn(BaseModel):
    value: Literal[-1, 0, 1]  # 0 quita la reacción


class ReactionOut(BaseModel):
    likes: int
    dislikes: int
    my_reaction: int


class SavedOut(BaseModel):
    saved: bool
