from conftest import register, upload


def test_upload_requires_auth(client):
    r = client.post("/videos", data={"title": "x"}, files={"video": ("a.mp4", b"1"), "thumbnail": ("a.png", b"1")})
    assert r.status_code == 401


def test_upload_and_catalog(client, auth):
    headers, user = auth
    r = upload(client, headers)
    assert r.status_code == 201, r.text
    video = r.json()
    assert video["views"] == 0 and video["user"]["name"] == "Ana"
    assert video["video_url"].endswith(".mp4") and video["thumbnail_url"].endswith(".png")

    # El archivo quedó accesible
    assert client.get(video["video_url"].replace("http://localhost:8000", "")).status_code == 200

    catalog = client.get("/videos").json()
    assert [v["id"] for v in catalog] == [video["id"]]
    assert client.get("/videos", params={"q": "mi vid"}).json()[0]["id"] == video["id"]
    assert client.get("/videos", params={"q": "nada"}).json() == []
    assert len(client.get("/videos", params={"user_id": user["id"]}).json()) == 1


def test_search_by_author_name(client, auth):
    headers, _ = auth
    other_headers, _ = register(client, name="Camila Andrade", email="camila@test.com")
    upload(client, headers, title="Video de Ana")
    camila = upload(client, other_headers, title="Tutorial de Tailwind").json()["id"]

    results = client.get("/videos", params={"q": "camila"}).json()
    assert [v["id"] for v in results] == [camila]
    # la búsqueda por título sigue funcionando
    assert len(client.get("/videos", params={"q": "tailwind"}).json()) == 1


def test_search_ignores_accents_and_case(client, auth):
    headers, _ = auth
    sin_tilde = upload(client, headers, title="musica relajante").json()["id"]
    con_tilde = upload(client, headers, title="Música para estudiar").json()["id"]
    upload(client, headers, title="Deportes extremos")

    for query in ("música", "musica", "MÚSICA", "Musica"):
        ids = {v["id"] for v in client.get("/videos", params={"q": query}).json()}
        assert ids == {sin_tilde, con_tilde}, query


def test_invalid_formats(client, auth):
    headers, _ = auth
    assert upload(client, headers, video=("a.avi", b"1")).status_code == 400
    assert upload(client, headers, thumb=("a.gif", b"1")).status_code == 400
    assert upload(client, headers, thumb=("a.jpeg", b"1")).status_code == 201
    webm = upload(client, headers, video=("clip.webm", b"1"))
    assert webm.status_code == 201 and webm.json()["video_url"].endswith(".webm")


def test_get_does_not_count_views_but_post_does(client, auth):
    headers, _ = auth
    vid = upload(client, headers).json()["id"]
    for _ in range(3):
        client.get(f"/videos/{vid}")
    assert client.get(f"/videos/{vid}").json()["views"] == 0

    assert client.post(f"/videos/{vid}/views").json()["views"] == 1
    assert client.post(f"/videos/{vid}/views").json()["views"] == 2
    assert client.post("/videos/999/views").status_code == 404


def test_update_and_delete_only_owner(client, auth):
    headers, _ = auth
    vid = upload(client, headers).json()["id"]
    other_headers, _ = register(client, name="Luis", email="luis@test.com")

    assert client.put(f"/videos/{vid}", headers=other_headers, json={"title": "hack"}).status_code == 403
    assert client.delete(f"/videos/{vid}", headers=other_headers).status_code == 403

    r = client.put(f"/videos/{vid}", headers=headers, json={"title": "Nuevo título", "description": "Nueva"})
    assert r.status_code == 200 and r.json()["title"] == "Nuevo título"

    assert client.delete(f"/videos/{vid}", headers=headers).status_code == 204
    assert client.get(f"/videos/{vid}").status_code == 404


def test_recommended(client, auth):
    headers, _ = auth
    other_headers, _ = register(client, name="Luis", email="luis@test.com")
    a = upload(client, headers, title="A").json()["id"]
    b = upload(client, headers, title="B").json()["id"]
    c = upload(client, other_headers, title="C").json()["id"]

    ids = [v["id"] for v in client.get(f"/videos/{a}/recommended").json()]
    assert a not in ids
    assert ids == [b, c]  # primero el mismo autor, luego el resto


def test_duration_is_optional_and_saved(client, auth):
    headers, _ = auth
    files = {"video": ("d.mp4", b"x", "video/mp4"), "thumbnail": ("d.png", b"x", "image/png")}
    r = client.post("/videos", data={"title": "Con duración", "duration": "83.5"}, files=files, headers=headers)
    assert r.status_code == 201 and r.json()["duration"] == 83.5
    assert upload(client, headers).json()["duration"] is None
    bad = client.post("/videos", data={"title": "x", "duration": "-3"}, files=files, headers=headers)
    assert bad.status_code == 422


def test_demo_seed_duration_parsers():
    import struct

    from src.services.demo_seed import _mp4_duration, _webm_duration, make_title
    from pathlib import Path

    mvhd = b"\x00\x00\x00\x6cmvhd" + b"\x00" * 4 + b"\x00" * 8 + struct.pack(">II", 1000, 125500)
    assert _mp4_duration(b"...." + mvhd) == 125.5
    ebml = b"\x2a\xd7\xb1\x83\x0f\x42\x40" + b"\x44\x89\x88" + struct.pack(">d", 4200.0)
    assert _webm_duration(ebml) == 4.2
    assert make_title(Path("01.jpg"), Path("Mi_clip (480p).mp4"), 2) == "Mi clip · parte 2"
    assert make_title(Path("Atardecer en Quito.png"), Path("a.mp4"), 1) == "Atardecer en Quito"
