"""Suscripciones a canales y listas personales (feed, guardados, me gusta)."""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ..crud import notification_crud, social_crud, user_crud, video_crud
from ..database.connection import get_db
from ..models.user import User
from ..schemas.user import ChannelOut, SubscriptionOut
from ..schemas.video import VideoOut
from ..security.auth import get_current_user
from .videos import to_out

router = APIRouter(tags=["Suscripciones y listas"])


def _channel_or_404(db: Session, channel_id: int) -> User:
    channel = user_crud.get_user(db, channel_id)
    if channel is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Canal no encontrado")
    return channel


@router.post("/users/{channel_id}/subscribe", response_model=SubscriptionOut)
def subscribe(channel_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _channel_or_404(db, channel_id)
    if channel_id == current_user.id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "No puedes suscribirte a tu propio canal")
    if social_crud.subscribe(db, current_user.id, channel_id):
        notification_crud.notify(db, user_ids=[channel_id], actor_id=current_user.id, type="subscribe")
    return SubscriptionOut(subscribed=True, subscriber_count=social_crud.subscriber_count(db, channel_id))


@router.delete("/users/{channel_id}/subscribe", response_model=SubscriptionOut)
def unsubscribe(channel_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _channel_or_404(db, channel_id)
    social_crud.unsubscribe(db, current_user.id, channel_id)
    return SubscriptionOut(subscribed=False, subscriber_count=social_crud.subscriber_count(db, channel_id))


@router.get("/me/subscriptions", response_model=list[ChannelOut])
def my_subscriptions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Canales a los que estás suscrito (guía lateral)."""
    return social_crud.subscribed_channels(db, current_user.id)


@router.get("/me/feed", response_model=list[VideoOut])
def subscriptions_feed(
    short: bool | None = Query(None, description="true = solo Shorts · false = solo videos"),
    limit: int = Query(60, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Videos y Shorts de los canales a los que estás suscrito."""
    channel_ids = social_crud.subscribed_channel_ids(db, current_user.id)
    return [to_out(v) for v in video_crud.list_videos(db, user_ids=channel_ids, short=short, limit=limit)]


@router.get("/me/saved", response_model=list[VideoOut])
def saved_videos(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Videos guardados (Ver más tarde)."""
    return [to_out(v) for v in video_crud.list_videos(db, ids=social_crud.saved_video_ids(db, current_user.id), limit=100)]


@router.get("/me/liked", response_model=list[VideoOut])
def liked_videos(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Videos que te gustan."""
    return [to_out(v) for v in video_crud.list_videos(db, ids=social_crud.liked_video_ids(db, current_user.id), limit=100)]
