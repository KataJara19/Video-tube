from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ..crud import comment_crud, notification_crud, social_crud, video_crud
from ..database.connection import get_db
from ..models.comment import Comment
from ..models.user import User
from ..schemas.comment import CommentCreate, CommentOut
from ..schemas.video import ReactionIn, ReactionOut
from ..security.auth import get_current_user, get_optional_user

router = APIRouter(tags=["Comentarios"])


def _ensure_video_exists(db: Session, video_id: int):
    video = video_crud.get_video(db, video_id)
    if video is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Video no encontrado")
    return video


def _decorate(db: Session, comments: list[Comment], user: User | None) -> list[CommentOut]:
    """Agrega me gusta, no me gusta, reacción propia y número de respuestas."""
    ids = [c.id for c in comments]
    counts = social_crud.comment_reaction_counts(db, ids)
    mine = social_crud.my_comment_reactions(db, ids, user.id if user else None)
    replies = comment_crud.reply_counts(db, ids)
    out = []
    for c in comments:
        likes, dislikes = counts.get(c.id, (0, 0))
        out.append(
            CommentOut.model_validate(c).model_copy(
                update={"likes": likes, "dislikes": dislikes, "my_reaction": mine.get(c.id, 0), "reply_count": replies.get(c.id, 0)}
            )
        )
    return out


@router.post("/videos/{video_id}/comments", response_model=CommentOut, status_code=status.HTTP_201_CREATED)
def add_comment(
    video_id: int,
    data: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Comenta un video. Con parent_id se publica como respuesta a otro comentario."""
    video = _ensure_video_exists(db, video_id)
    parent = None
    if data.parent_id is not None:
        parent = comment_crud.get_comment(db, data.parent_id)
        if parent is None or parent.video_id != video_id:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "El comentario al que respondes no existe en este video")
        if parent.parent_id is not None:  # las respuestas se agrupan bajo el comentario principal
            parent = comment_crud.get_comment(db, parent.parent_id)

    comment = comment_crud.create_comment(db, video_id, current_user.id, data.content, parent.id if parent else None)

    if parent:
        notification_crud.notify(db, user_ids=[parent.user_id], actor_id=current_user.id, type="reply", video_id=video_id, comment_id=comment.id)
    else:
        notification_crud.notify(db, user_ids=[video.user_id], actor_id=current_user.id, type="comment", video_id=video_id, comment_id=comment.id)
    return _decorate(db, [comment], current_user)[0]


@router.get("/videos/{video_id}/comments", response_model=list[CommentOut])
def list_comments(
    video_id: int,
    sort: Literal["new", "top"] = Query("new", description="new = más recientes · top = principales (más me gusta)"),
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
):
    """Comentarios principales del video (las respuestas se piden aparte)."""
    _ensure_video_exists(db, video_id)
    comments = _decorate(db, comment_crud.list_comments(db, video_id), current_user)
    if sort == "top":
        comments.sort(key=lambda c: (c.likes - c.dislikes, c.reply_count, c.created_at), reverse=True)
    return comments


@router.get("/comments/{comment_id}/replies", response_model=list[CommentOut])
def list_replies(comment_id: int, db: Session = Depends(get_db), current_user: User | None = Depends(get_optional_user)):
    if comment_crud.get_comment(db, comment_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Comentario no encontrado")
    return _decorate(db, comment_crud.list_replies(db, comment_id), current_user)


@router.post("/comments/{comment_id}/reaction", response_model=ReactionOut)
def react_to_comment(
    comment_id: int, data: ReactionIn, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    if comment_crud.get_comment(db, comment_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Comentario no encontrado")
    social_crud.set_comment_reaction(db, current_user.id, comment_id, data.value)
    likes, dislikes = social_crud.comment_reaction_counts(db, [comment_id]).get(comment_id, (0, 0))
    return ReactionOut(likes=likes, dislikes=dislikes, my_reaction=data.value)
