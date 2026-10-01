from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    # bcrypt admite como máximo 72 bytes
    password: str = Field(min_length=6, max_length=72)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserBrief(BaseModel):
    """Datos públicos mínimos del autor (para tarjetas de video y comentarios)."""
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    email: EmailStr
    created_at: datetime


class UserProfile(UserOut):
    video_count: int
    subscriber_count: int = 0
    subscribed: bool = False  # el usuario actual está suscrito a este canal


class PublicProfile(BaseModel):
    """Perfil visto por otra persona: sin correo."""
    id: int
    name: str
    created_at: datetime
    video_count: int
    subscriber_count: int = 0
    subscribed: bool = False
    email: Optional[str] = None


class ChannelOut(BaseModel):
    """Canal en la lista de suscripciones de la guía lateral."""
    id: int
    name: str
    has_new: bool = False  # publicó en los últimos 7 días


class SubscriptionOut(BaseModel):
    subscribed: bool
    subscriber_count: int


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
