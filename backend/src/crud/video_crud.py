"""Operaciones de base de datos sobre la tabla videos."""
import unicodedata

from sqlalchemy import func, or_, select, update
from sqlalchemy.orm import Session, joinedload

from ..models.user import User
from ..models.video import Video


# Búsqueda sin distinguir tildes ni mayúsculas: "musica" encuentra "Música" y viceversa
_ACCENTED = "áéíóúüàèìòùâêîôû"
_PLAIN = "aeiouuaeiouaeiou"


def _normalize_text(text: str) -> str:
    """Quita tildes y pasa a minúsculas (lado Python: el texto que escribe el usuario)."""
    decomposed = unicodedata.normalize("NFD", text.lower())
    return "".join(c for c in decomposed if unicodedata.category(c) != "Mn" or c == "\u0303")


def _normalize_column(column):
    """Lo mismo del lado de PostgreSQL: lower() + translate() (sin extensiones)."""
    return func.translate(func.lower(column), _ACCENTED, _PLAIN)


def _with_author():
    # Carga el autor en la misma consulta (evita N+1 al listar)
    return select(Video).options(joinedload(Video.user))


def list_videos(
    db: Session,
    q: str | None = None,
    user_id: int | None = None,
    limit: int = 50,
    *,
    short: bool | None = None,
    user_ids: list[int] | None = None,
    ids: list[int] | None = None,
    sort: str = "recent",
) -> list[Video]:
    """Catálogo con filtros opcionales.

    short     True = solo Shorts · False = solo videos normales · None = ambos
    user_ids  videos de varios canales (feed de suscripciones)
    ids       videos concretos (historial, guardados, me gusta), respetando el orden recibido
    sort      "recent" (más nuevos) o "views" (tendencias)
    """
    stmt = _with_author()
    if q:
        # Busca en título, descripción y nombre del usuario que publicó
        pattern = f"%{unicodedata.normalize('NFC', _normalize_text(q.strip()))}%"
        stmt = stmt.join(Video.user).where(
            or_(
                _normalize_column(Video.title).like(pattern),
                _normalize_column(Video.description).like(pattern),
                _normalize_column(User.name).like(pattern),
            )
        )
    if user_id is not None:
        stmt = stmt.where(Video.user_id == user_id)
    if user_ids is not None:
        stmt = stmt.where(Video.user_id.in_(user_ids or [-1]))
    if short is not None:
        stmt = stmt.where(Video.is_short.is_(short))
    if ids is not None:
        stmt = stmt.where(Video.id.in_(ids or [-1]))
        found = {v.id: v for v in db.scalars(stmt).unique().all()}
        return [found[i] for i in ids if i in found][:limit]
    if sort == "views":
        stmt = stmt.order_by(Video.views.desc(), Video.created_at.desc())
    else:
        stmt = stmt.order_by(Video.created_at.desc(), Video.id.desc())
    return list(db.scalars(stmt.limit(limit)).all())


def get_video(db: Session, video_id: int) -> Video | None:
    return db.scalar(_with_author().where(Video.id == video_id))


def create_video(
    db: Session, *, title: str, description: str, video_url: str, thumbnail_url: str, user_id: int, is_short: bool = False,
    duration: float | None = None,
) -> Video:
    video = Video(
        title=title.strip(),
        description=description.strip(),
        video_url=video_url,
        thumbnail_url=thumbnail_url,
        user_id=user_id,
        is_short=is_short,
        duration=duration,
    )
    db.add(video)
    db.commit()
    return get_video(db, video.id)


def update_video(db: Session, video: Video, title: str | None, description: str | None) -> Video:
    if title is not None:
        video.title = title.strip()
    if description is not None:
        video.description = description.strip()
    db.commit()
    return get_video(db, video.id)


def delete_video(db: Session, video: Video) -> None:
    db.delete(video)
    db.commit()


def increment_views(db: Session, video_id: int) -> int | None:
    """Suma 1 vista con un UPDATE atómico (views = views + 1) y devuelve el nuevo total."""
    new_views = db.scalar(
        update(Video).where(Video.id == video_id).values(views=Video.views + 1).returning(Video.views)
    )
    db.commit()
    return new_views


def recommended_videos(db: Session, video: Video, limit: int = 12) -> list[Video]:
    """Recomendados del mismo formato (video o Short): primero del mismo autor, luego los más vistos."""
    same_author = list(
        db.scalars(
            _with_author()
            .where(Video.user_id == video.user_id, Video.id != video.id, Video.is_short.is_(video.is_short))
            .order_by(Video.views.desc(), Video.created_at.desc())
            .limit(limit)
        ).all()
    )
    remaining = limit - len(same_author)
    if remaining <= 0:
        return same_author
    others = list(
        db.scalars(
            _with_author()
            .where(Video.user_id != video.user_id, Video.is_short.is_(video.is_short))
            .order_by(Video.views.desc(), Video.created_at.desc())
            .limit(remaining)
        ).all()
    )
    return same_author + others
