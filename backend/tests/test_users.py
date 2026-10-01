from conftest import register


def test_register_and_login(client):
    headers, user = register(client)
    assert user["email"] == "ana@test.com"
    assert "password" not in user and "password_hash" not in user

    ok = client.post("/login", json={"email": "ANA@test.com", "password": "secret1"})
    assert ok.status_code == 200 and ok.json()["access_token"]

    bad = client.post("/login", json={"email": "ana@test.com", "password": "incorrecta"})
    assert bad.status_code == 401


def test_duplicate_email(client):
    register(client)
    r = client.post("/users", json={"name": "Otra", "email": "ana@test.com", "password": "secret1"})
    assert r.status_code == 409


def test_validation(client):
    r = client.post("/users", json={"name": "A", "email": "no-es-correo", "password": "123"})
    assert r.status_code == 422


def test_get_user_with_video_count(client):
    headers, user = register(client)
    from conftest import upload

    upload(client, headers)
    r = client.get(f"/users/{user['id']}")
    assert r.status_code == 200
    assert r.json()["video_count"] == 1
    assert client.get("/users/999").status_code == 404


def test_database_url_codifica_la_contrasena(monkeypatch):
    """La URL se arma con DB_* y la contraseña se codifica (puede tener @ : / #)."""
    from src.database import connection

    monkeypatch.setattr(connection, "DATABASE_URL", "")
    monkeypatch.setattr(connection, "DB_USER", "postgres")
    monkeypatch.setattr(connection, "DB_PASSWORD", "p@ss:w/rd#1")
    monkeypatch.setattr(connection, "DB_HOST", "db.example.rds.amazonaws.com")
    monkeypatch.setattr(connection, "DB_PORT", "5432")
    monkeypatch.setattr(connection, "DB_NAME", "postgres")
    monkeypatch.setattr(connection, "DB_SSLMODE", "require")
    assert connection.build_database_url() == (
        "postgresql+psycopg2://postgres:p%40ss%3Aw%2Frd%231@db.example.rds.amazonaws.com:5432/postgres?sslmode=require"
    )
