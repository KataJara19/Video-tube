from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from .user import UserBrief


class NotificationOut(BaseModel):
    id: int
    type: str  # new_video | comment | reply | subscribe
    is_read: bool
    created_at: datetime
    actor: UserBrief
    video_id: Optional[int] = None
    video_title: Optional[str] = None
    video_thumbnail: Optional[str] = None
    video_is_short: bool = False


class NotificationList(BaseModel):
    unread_count: int
    items: list[NotificationOut]
