"""Configuración de la API.

Todo se lee desde variables de entorno (archivo .env en local, .env en la EC2).
No hay credenciales escritas en el código: en AWS, boto3 obtiene credenciales
temporales del IAM Role asociado a la instancia EC2.
"""
import os

from dotenv import load_dotenv

load_dotenv()


def _required(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Falta la variable de entorno {name}. Revisa backend/.env (usa .env.example).")
    return value


# PostgreSQL (local o Amazon RDS): cada dato en su propia variable.
# La URL de conexión se arma en database/connection.py (codifica la contraseña).
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "postgres")
DB_SSLMODE = os.getenv("DB_SSLMODE", "")  # "require" en RDS; vacío en local
# Opcional: si se define DATABASE_URL completa, tiene prioridad (lo usan las pruebas y GitHub Actions)
DATABASE_URL = os.getenv("DATABASE_URL", "")

if not DATABASE_URL and not DB_PASSWORD:
    raise RuntimeError("Falta la variable de entorno DB_PASSWORD. Revisa backend/.env (usa .env.example).")

JWT_SECRET = _required("JWT_SECRET")
JWT_EXPIRE_HOURS = int(os.getenv("JWT_EXPIRE_HOURS", "24"))

STORAGE_MODE = os.getenv("STORAGE_MODE", "local")  # "local" | "s3"
PUBLIC_API_URL = os.getenv("PUBLIC_API_URL", "http://localhost:8000").rstrip("/")

AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
S3_VIDEOS_BUCKET = os.getenv("S3_VIDEOS_BUCKET", "")
S3_THUMBNAILS_BUCKET = os.getenv("S3_THUMBNAILS_BUCKET", "")
S3_URL_EXPIRES_SECONDS = int(os.getenv("S3_URL_EXPIRES_SECONDS", "3600"))

CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",") if o.strip()]

MAX_VIDEO_MB = int(os.getenv("MAX_VIDEO_MB", "100"))
MAX_THUMBNAIL_MB = int(os.getenv("MAX_THUMBNAIL_MB", "5"))

if STORAGE_MODE == "s3" and not (S3_VIDEOS_BUCKET and S3_THUMBNAILS_BUCKET):
    raise RuntimeError("STORAGE_MODE=s3 requiere S3_VIDEOS_BUCKET y S3_THUMBNAILS_BUCKET.")
