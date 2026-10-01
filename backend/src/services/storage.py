"""Almacenamiento de videos y miniaturas.

- STORAGE_MODE=local : guarda en backend/uploads (desarrollo en tu PC).
- STORAGE_MODE=s3    : sube a S3 Videos / S3 Miniaturas con boto3.
                       Las credenciales llegan del IAM Role de la EC2 (no hay keys).

En modo S3 los buckets pueden ser privados: al responder, la API entrega
URLs prefirmadas temporales (presigned URLs) para que el navegador pueda
reproducir el video y ver la miniatura sin hacer público el bucket.
"""
import os
import uuid
from pathlib import Path
from urllib.parse import urlparse

from fastapi import UploadFile

from ..config import (
    AWS_REGION,
    PUBLIC_API_URL,
    S3_THUMBNAILS_BUCKET,
    S3_URL_EXPIRES_SECONDS,
    S3_VIDEOS_BUCKET,
    STORAGE_MODE,
)

VIDEOS = "videos"
THUMBNAILS = "thumbnails"

LOCAL_UPLOAD_DIR = Path(os.getenv("LOCAL_UPLOAD_DIR", Path(__file__).resolve().parents[2] / "uploads"))

_s3_client = None


def _s3():
    global _s3_client
    if _s3_client is None:
        import boto3  # solo se necesita en modo S3
        from botocore.config import Config

        # Firma SigV4: URLs prefirmadas válidas en cualquier región
        _s3_client = boto3.client(
            "s3",
            region_name=AWS_REGION,
            config=Config(signature_version="s3v4", s3={"addressing_style": "virtual"}),
        )
    return _s3_client


def _bucket(kind: str) -> str:
    return S3_VIDEOS_BUCKET if kind == VIDEOS else S3_THUMBNAILS_BUCKET


def upload_file(file: UploadFile, kind: str, extension: str) -> str:
    """Guarda el archivo y devuelve la URL que se almacena en la base de datos."""
    key = f"{kind}/{uuid.uuid4().hex}{extension}"

    if STORAGE_MODE == "local":
        destination = LOCAL_UPLOAD_DIR / key
        destination.parent.mkdir(parents=True, exist_ok=True)
        with destination.open("wb") as out:
            while chunk := file.file.read(1024 * 1024):
                out.write(chunk)
        return f"{PUBLIC_API_URL}/uploads/{key}"

    bucket = _bucket(kind)
    _s3().upload_fileobj(
        file.file, bucket, key, ExtraArgs={"ContentType": file.content_type or "application/octet-stream"}
    )
    return f"https://{bucket}.s3.{AWS_REGION}.amazonaws.com/{key}"


def delete_file(stored_url: str, kind: str) -> None:
    """Elimina el archivo. Si ya no existe no interrumpe el borrado del registro."""
    try:
        if STORAGE_MODE == "local":
            key = stored_url.split("/uploads/", 1)[1]
            (LOCAL_UPLOAD_DIR / key).unlink(missing_ok=True)
        else:
            _s3().delete_object(Bucket=_bucket(kind), Key=urlparse(stored_url).path.lstrip("/"))
    except Exception:  # noqa: BLE001 - el archivo huérfano no debe bloquear la operación
        pass


def public_url(stored_url: str, kind: str) -> str:
    """URL que recibe el navegador: la misma en local, prefirmada y temporal en S3."""
    if STORAGE_MODE == "local":
        return stored_url
    key = urlparse(stored_url).path.lstrip("/")
    return _s3().generate_presigned_url(
        "get_object", Params={"Bucket": _bucket(kind), "Key": key}, ExpiresIn=S3_URL_EXPIRES_SECONDS
    )
