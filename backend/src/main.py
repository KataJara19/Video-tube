"""Punto de entrada de la API.  Ejecutar:  uvicorn src.main:app --reload"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config import CORS_ORIGINS, S3_THUMBNAILS_BUCKET, S3_VIDEOS_BUCKET, STORAGE_MODE
from .database.connection import Base, engine
from .database.migrations import run_migrations

# Importar cada módulo de modelos registra su tabla en Base.metadata (no hay __init__.py)
from .models import comment as comment_model  # noqa: F401
from .models import social as social_model  # noqa: F401
from .models import user as user_model  # noqa: F401
from .models import video as video_model  # noqa: F401
from .routers import comments, notifications, social, users, videos
from .services.storage import LOCAL_UPLOAD_DIR


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Crea las tablas users, videos y comments si todavía no existen (PostgreSQL / RDS)
    Base.metadata.create_all(bind=engine)
    run_migrations(engine)  # agrega columnas nuevas a bases existentes
    yield


app = FastAPI(
    title="VideoTube API",
    description="API de la plataforma de videos: React (S3) · FastAPI (EC2) · PostgreSQL (RDS) · S3",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(users.router)
app.include_router(videos.router)
app.include_router(comments.router)
app.include_router(social.router)
app.include_router(notifications.router)

# Solo en desarrollo: sirve los archivos guardados en backend/uploads
if STORAGE_MODE == "local":
    LOCAL_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=LOCAL_UPLOAD_DIR), name="uploads")


@app.get("/health", tags=["Salud"])
def health():
    """Usado por GitHub Actions para comprobar el despliegue.
    Indica dónde se guardan los archivos (en AWS debe ser "s3" con ambos buckets)."""
    storage = {"storage": STORAGE_MODE}
    if STORAGE_MODE == "s3":
        storage["buckets"] = {"videos": S3_VIDEOS_BUCKET, "thumbnails": S3_THUMBNAILS_BUCKET}
    return {"status": "ok", **storage}
