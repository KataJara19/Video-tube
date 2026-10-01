"""Conexión a PostgreSQL (local o Amazon RDS) mediante SQLAlchemy."""
from urllib.parse import quote_plus

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from ..config import DATABASE_URL, DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT, DB_SSLMODE, DB_USER


def build_database_url() -> str:
    """Arma la URL de conexión a partir de DB_USER, DB_PASSWORD, DB_HOST, DB_PORT y DB_NAME.

    quote_plus codifica la contraseña, así puede llevar símbolos como @ : / # sin romper la URL.
    Si existe DATABASE_URL (pruebas / GitHub Actions), se usa tal cual.
    """
    if DATABASE_URL:
        return DATABASE_URL
    url = f"postgresql+psycopg2://{quote_plus(DB_USER)}:{quote_plus(DB_PASSWORD)}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    if DB_SSLMODE:
        url += f"?sslmode={DB_SSLMODE}"  # RDS: conexión cifrada
    return url


# pool_pre_ping evita errores con conexiones cerradas por RDS tras inactividad
engine = create_engine(build_database_url(), pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


def get_db():
    """Dependencia de FastAPI: abre una sesión por petición y la cierra al terminar."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
