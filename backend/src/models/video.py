from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database.connection import Base


class Video(Base):
    __tablename__ = "videos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="", nullable=False)
    # RDS guarda solo la URL; el archivo vive en S3 (o en disco en desarrollo)
    video_url: Mapped[str] = mapped_column(String(500), nullable=False)
    thumbnail_url: Mapped[str] = mapped_column(String(500), nullable=False)
    views: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    # Short: video vertical y breve que se muestra en la sección Shorts
    is_short: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false", nullable=False)
    # Duración en segundos (la mide el navegador al subir). Puede ser NULL en videos antiguos
    duration: Mapped[float | None] = mapped_column(Float, nullable=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    user = relationship("User", back_populates="videos")
    comments = relationship("Comment", back_populates="video", cascade="all, delete-orphan", passive_deletes=True)
