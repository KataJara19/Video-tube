from pathlib import Path
from typing import Literal

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session

from ..config import MAX_THUMBNAIL_MB, MAX_VIDEO_MB
from ..crud import comment_crud, notification_crud, social_crud, video_crud
from ..database.connection import get_db
from ..models.user import User
from ..models.video import Video
from ..schemas.video import ReactionIn, ReactionOut, SavedOut, VideoDetail, VideoOut, VideoUpdate, ViewsOut
from ..security.auth import get_current_user, get_optional_user
from ..services import storage

router = APIRouter(tags=["Videos"])

VIDEO_EXTENSIONS = {".mp4", ".webm"}
THUMBNAIL_EXTENSIONS = {".jpg", ".jpeg", ".png"}


def _validate_file(file: UploadFile, allowed: set[str], max_mb: int, label: str) -> str:
    extension = Path(file.filename or "").suffix.lower()
    if extension not in allowed:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, f"{label}: formato no permitido. Usa {', '.join(sorted(allowed))}"
        )
    if file.size is not None and file.size > max_mb * 1024 * 1024:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, f"{label}: supera {max_mb} MB")
    return extension


def to_out(video: Video) -> VideoOut:
    """Convierte el modelo en respuesta, entregando URLs accesibles para el navegador."""
    out = VideoOut.model_validate(video)
    out.video_url = storage.public_url(video.video_url, storage.VIDEOS)
    out.thumbnail_url = storage.public_url(video.thumbnail_url, storage.THUMBNAILS)
    return out


def _get_or_404(db: Session, video_id: int) -> Video:
    video = video_crud.get_video(db, video_id)
    if video is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Video no encontrado")
    return video


def _ensure_owner(video: Video, user: User) -> None:
    if video.user_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Solo el autor puede modificar este video")


@router.post("/videos", response_model=VideoOut, status_code=status.HTTP_201_CREATED)
def create_video(
    title: str = Form(..., min_length=1, max_length=200),
    description: str = Form("", max_length=5000),
    video: UploadFile = File(..., description="Archivo MP4 o WebM (máx. 100 MB)"),
    thumbnail: UploadFile = File(..., description="Miniatura JPG, JPEG o PNG"),
    is_short: bool = Form(False, description="True si es un Short (video vertical)"),
    duration: float | None = Form(None, ge=0, le=86400, description="Duración en segundos (la mide el navegador)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Publica un video: MP4/WebM → S3 Videos, imagen → S3 Miniaturas, datos → PostgreSQL."""
    video_ext = _validate_file(video, VIDEO_EXTENSIONS, MAX_VIDEO_MB, "Video")
    thumb_ext = _validate_file(thumbnail, THUMBNAIL_EXTENSIONS, MAX_THUMBNAIL_MB, "Miniatura")

    video_url = storage.upload_file(video, storage.VIDEOS, video_ext)
    try:
        thumbnail_url = storage.upload_file(thumbnail, storage.THUMBNAILS, thumb_ext)
    except Exception:
        storage.delete_file(video_url, storage.VIDEOS)
        raise

    created = video_crud.create_video(
        db, title=title, description=description,
        video_url=video_url, thumbnail_url=thumbnail_url, user_id=current_user.id, is_short=is_short,
        duration=duration,
    )
    # Avisar a los suscriptores del canal
    notification_crud.notify(
        db, user_ids=social_crud.subscriber_ids(db, current_user.id), actor_id=current_user.id,
        type="new_video", video_id=created.id,
    )
    return to_out(created)


@router.get("/videos", response_model=list[VideoOut])
def list_videos(
    q: str | None = Query(None, max_length=100, description="Buscar por título, descripción o nombre del usuario"),
    user_id: int | None = Query(None, description="Solo videos de este usuario"),
    short: bool | None = Query(None, description="true = solo Shorts · false = solo videos"),
    sort: Literal["recent", "views"] = Query("recent", description="recent = más nuevos · views = tendencias"),
    ids: str | None = Query(None, max_length=1000, description="Lista de ids separados por coma (historial)"),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    id_list = None
    if ids is not None:
        id_list = [int(x) for x in ids.split(",") if x.strip().isdigit()][:100]
    videos = video_crud.list_videos(db, q=q, user_id=user_id, limit=limit, short=short, ids=id_list, sort=sort)
    return [to_out(v) for v in videos]


@router.get("/videos/{video_id}", response_model=VideoDetail)
def get_video(video_id: int, db: Session = Depends(get_db), current_user: User | None = Depends(get_optional_user)):
    """Detalle del video con reacciones y datos del canal. Es de solo lectura: NO suma vistas."""
    video = _get_or_404(db, video_id)
    uid = current_user.id if current_user else None
    likes, dislikes = social_crud.video_reaction_counts(db, [video.id]).get(video.id, (0, 0))
    return VideoDetail(
        **to_out(video).model_dump(),
        likes=likes,
        dislikes=dislikes,
        my_reaction=social_crud.my_video_reaction(db, video.id, uid),
        saved=social_crud.is_saved(db, uid, video.id),
        comment_count=comment_crud.count_comments(db, video.id),
        author_subscribers=social_crud.subscriber_count(db, video.user_id),
        subscribed=social_crud.is_subscribed(db, uid, video.user_id),
    )


@router.post("/videos/{video_id}/reaction", response_model=ReactionOut)
def react_to_video(
    video_id: int, data: ReactionIn, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """Me gusta (1), No me gusta (-1) o quitar la reacción (0)."""
    _get_or_404(db, video_id)
    social_crud.set_video_reaction(db, current_user.id, video_id, data.value)
    likes, dislikes = social_crud.video_reaction_counts(db, [video_id]).get(video_id, (0, 0))
    return ReactionOut(likes=likes, dislikes=dislikes, my_reaction=data.value)


@router.post("/videos/{video_id}/save", response_model=SavedOut)
def save_video(video_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Botón Guardar (Ver más tarde)."""
    _get_or_404(db, video_id)
    social_crud.save_video(db, current_user.id, video_id)
    return SavedOut(saved=True)


@router.delete("/videos/{video_id}/save", response_model=SavedOut)
def unsave_video(video_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    social_crud.unsave_video(db, current_user.id, video_id)
    return SavedOut(saved=False)


@router.put("/videos/{video_id}", response_model=VideoOut)
def update_video(
    video_id: int,
    data: VideoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    video = _get_or_404(db, video_id)
    _ensure_owner(video, current_user)
    return to_out(video_crud.update_video(db, video, data.title, data.description))


@router.delete("/videos/{video_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_video(
    video_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    video = _get_or_404(db, video_id)
    _ensure_owner(video, current_user)
    video_url, thumbnail_url = video.video_url, video.thumbnail_url
    video_crud.delete_video(db, video)  # los comentarios se eliminan en cascada
    storage.delete_file(video_url, storage.VIDEOS)
    storage.delete_file(thumbnail_url, storage.THUMBNAILS)


@router.post("/videos/{video_id}/views", response_model=ViewsOut)
def register_view(video_id: int, db: Session = Depends(get_db)):
    """Registra UNA reproducción. El frontend lo llama una sola vez por video y sesión."""
    views = video_crud.increment_views(db, video_id)
    if views is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Video no encontrado")
    return ViewsOut(id=video_id, views=views)


@router.get("/videos/{video_id}/recommended", response_model=list[VideoOut])
def recommended(video_id: int, limit: int = Query(12, ge=1, le=30), db: Session = Depends(get_db)):
    video = _get_or_404(db, video_id)
    return [to_out(v) for v in video_crud.recommended_videos(db, video, limit)]
