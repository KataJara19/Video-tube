from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..crud import social_crud, user_crud
from ..database.connection import get_db
from ..models.user import User
from ..schemas.user import LoginRequest, PublicProfile, TokenOut, UserCreate
from ..security.auth import create_access_token, get_optional_user, hash_password, verify_password

router = APIRouter(tags=["Usuarios"])


@router.post("/users", response_model=TokenOut, status_code=status.HTTP_201_CREATED)
def register(data: UserCreate, db: Session = Depends(get_db)):
    """Crea una cuenta y devuelve el token para iniciar sesión directamente."""
    if user_crud.get_user_by_email(db, data.email):
        raise HTTPException(status.HTTP_409_CONFLICT, "El correo ya está registrado")
    user = user_crud.create_user(db, data.name, data.email, hash_password(data.password))
    return TokenOut(access_token=create_access_token(user.id), user=user)


@router.post("/login", response_model=TokenOut)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = user_crud.get_user_by_email(db, data.email)
    if user is None or not verify_password(data.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Correo o contraseña incorrectos")
    return TokenOut(access_token=create_access_token(user.id), user=user)


@router.get("/users/{user_id}", response_model=PublicProfile)
def get_user(user_id: int, db: Session = Depends(get_db), current_user: User | None = Depends(get_optional_user)):
    """Información del usuario, cantidad de videos y suscriptores.
    El correo solo se incluye cuando lo consulta el propio usuario."""
    user = user_crud.get_user(db, user_id)
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Usuario no encontrado")
    viewer_id = current_user.id if current_user else None
    return PublicProfile(
        id=user.id,
        name=user.name,
        created_at=user.created_at,
        email=user.email if viewer_id == user.id else None,
        video_count=user_crud.count_user_videos(db, user.id),
        subscriber_count=social_crud.subscriber_count(db, user.id),
        subscribed=social_crud.is_subscribed(db, viewer_id, user.id),
    )
