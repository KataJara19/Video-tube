from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from ..crud import notification_crud
from ..database.connection import get_db
from ..models.user import User
from ..schemas.notification import NotificationList, NotificationOut
from ..security.auth import get_current_user
from ..services import storage

router = APIRouter(tags=["Notificaciones"])


@router.get("/notifications", response_model=NotificationList)
def list_notifications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Últimas notificaciones (campana) y cantidad sin leer."""
    items = []
    for n in notification_crud.list_notifications(db, current_user.id):
        items.append(
            NotificationOut(
                id=n.id, type=n.type, is_read=n.is_read, created_at=n.created_at, actor=n.actor,
                video_id=n.video_id,
                video_title=n.video.title if n.video else None,
                video_thumbnail=storage.public_url(n.video.thumbnail_url, storage.THUMBNAILS) if n.video else None,
                video_is_short=bool(n.video and n.video.is_short),
            )
        )
    return NotificationList(unread_count=notification_crud.unread_count(db, current_user.id), items=items)


@router.post("/notifications/read", status_code=status.HTTP_204_NO_CONTENT)
def mark_all_read(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    notification_crud.mark_all_read(db, current_user.id)


@router.post("/notifications/{notification_id}/read", status_code=status.HTTP_204_NO_CONTENT)
def mark_read(notification_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    notification_crud.mark_read(db, current_user.id, notification_id)
