from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from .user import UserBrief


class CommentCreate(BaseModel):
    content: str = Field(min_length=1, max_length=2000)
    parent_id: Optional[int] = None  # si se envía, es una respuesta


class CommentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    content: str
    user_id: int
    video_id: int
    parent_id: Optional[int] = None
    created_at: datetime
    user: UserBrief
    likes: int = 0
    dislikes: int = 0
    my_reaction: int = 0
    reply_count: int = 0
