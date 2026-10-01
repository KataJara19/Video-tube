"""Configuración de pruebas.

Las pruebas usan una base PostgreSQL SEPARADA (videotube_test) para no tocar
los datos de desarrollo, y guardan archivos en una carpeta temporal.
Crear una vez:  CREATE DATABASE videotube_test;
"""
import os
import tempfile

os.environ["DATABASE_URL"] = os.getenv(
    "TEST_DATABASE_URL", "postgresql+psycopg2://postgres:postgres@localhost:5432/videotube_test"
)
os.environ["JWT_SECRET"] = "test-secret"
os.environ["STORAGE_MODE"] = "local"
os.environ["LOCAL_UPLOAD_DIR"] = tempfile.mkdtemp(prefix="videotube-test-")

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import text  # noqa: E402

from src.database.connection import Base, engine  # noqa: E402
from src.main import app  # noqa: E402


@pytest.fixture(scope="session", autouse=True)
def _schema():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(autouse=True)
def _clean_tables():
    yield
    with engine.begin() as conn:
        conn.execute(text("TRUNCATE comments, videos, users RESTART IDENTITY CASCADE"))


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


def register(client, name="Ana", email="ana@test.com", password="secret1"):
    r = client.post("/users", json={"name": name, "email": email, "password": password})
    assert r.status_code == 201, r.text
    body = r.json()
    return {"Authorization": f"Bearer {body['access_token']}"}, body["user"]


def upload(client, headers, title="Mi video", video=("clip.mp4", b"fake-mp4"), thumb=("thumb.png", b"fake-png"), short=False):
    return client.post(
        "/videos",
        headers=headers,
        data={"title": title, "description": "Descripción de prueba", "is_short": str(short).lower()},
        files={"video": (video[0], video[1], "video/mp4"), "thumbnail": (thumb[0], thumb[1], "image/png")},
    )


@pytest.fixture
def auth(client):
    return register(client)
