from src.database.connection import engine
from src.database.migrations import run_migrations

from conftest import register, upload


def test_migrations_are_idempotent():
    run_migrations(engine)
    run_migrations(engine)


def test_shorts_filter_and_recommended_same_format(client, auth):
    headers, _ = auth
    normal = upload(client, headers, title="Video normal").json()["id"]
    short = upload(client, headers, title="Mi short", short=True).json()
    assert short["is_short"] is True
    assert [v["id"] for v in client.get("/videos", params={"short": "true"}).json()] == [short["id"]]
    assert [v["id"] for v in client.get("/videos", params={"short": "false"}).json()] == [normal]
    upload(client, headers, title="Otro short", short=True)
    rec = client.get(f"/videos/{short['id']}/recommended").json()
    assert rec and all(v["is_short"] for v in rec)


def test_sort_by_views_and_ids(client, auth):
    headers, _ = auth
    a = upload(client, headers, title="A").json()["id"]
    b = upload(client, headers, title="B").json()["id"]
    client.post(f"/videos/{a}/views")
    assert client.get("/videos", params={"sort": "views"}).json()[0]["id"] == a
    assert [v["id"] for v in client.get("/videos", params={"ids": f"{b},{a}"}).json()] == [b, a]


def test_subscribe_feed_and_notifications(client, auth):
    creator_h, creator = auth
    fan_h, fan = register(client, name="Luis", email="luis@test.com")

    r = client.post(f"/users/{creator['id']}/subscribe", headers=fan_h)
    assert r.json() == {"subscribed": True, "subscriber_count": 1}
    assert client.post(f"/users/{fan['id']}/subscribe", headers=fan_h).status_code == 400  # a sí mismo

    profile = client.get(f"/users/{creator['id']}", headers=fan_h).json()
    assert profile["subscribed"] is True and profile["subscriber_count"] == 1 and profile["email"] is None
    assert client.get(f"/users/{creator['id']}", headers=creator_h).json()["email"] == "ana@test.com"

    # El creador recibe aviso del nuevo suscriptor
    notes = client.get("/notifications", headers=creator_h).json()
    assert notes["unread_count"] == 1 and notes["items"][0]["type"] == "subscribe"

    # Nuevo video → aviso al suscriptor y aparece en su feed
    vid = upload(client, creator_h, title="Nuevo").json()["id"]
    short = upload(client, creator_h, title="Short", short=True).json()["id"]
    fan_notes = client.get("/notifications", headers=fan_h).json()
    assert fan_notes["unread_count"] == 2 and fan_notes["items"][0]["video_id"] == short
    feed = {v["id"] for v in client.get("/me/feed", headers=fan_h).json()}
    assert feed == {vid, short}
    assert [v["id"] for v in client.get("/me/feed", headers=fan_h, params={"short": "true"}).json()] == [short]
    channels = client.get("/me/subscriptions", headers=fan_h).json()
    assert channels == [{"id": creator["id"], "name": "Ana", "has_new": True}]

    client.post("/notifications/read", headers=fan_h)
    assert client.get("/notifications", headers=fan_h).json()["unread_count"] == 0

    r = client.delete(f"/users/{creator['id']}/subscribe", headers=fan_h)
    assert r.json() == {"subscribed": False, "subscriber_count": 0}
    assert client.get("/me/feed", headers=fan_h).json() == []


def test_video_reactions_save_and_detail(client, auth):
    headers, _ = auth
    other_h, _ = register(client, name="Luis", email="luis@test.com")
    vid = upload(client, headers).json()["id"]

    assert client.post(f"/videos/{vid}/reaction", json={"value": 1}).status_code == 401
    assert client.post(f"/videos/{vid}/reaction", headers=other_h, json={"value": 1}).json() == {"likes": 1, "dislikes": 0, "my_reaction": 1}
    assert client.post(f"/videos/{vid}/reaction", headers=headers, json={"value": -1}).json()["dislikes"] == 1
    assert client.post(f"/videos/{vid}/reaction", headers=other_h, json={"value": 0}).json()["likes"] == 0
    client.post(f"/videos/{vid}/reaction", headers=other_h, json={"value": 1})
    assert [v["id"] for v in client.get("/me/liked", headers=other_h).json()] == [vid]

    assert client.post(f"/videos/{vid}/save", headers=other_h).json() == {"saved": True}
    assert [v["id"] for v in client.get("/me/saved", headers=other_h).json()] == [vid]

    detail = client.get(f"/videos/{vid}", headers=other_h).json()
    assert detail["likes"] == 1 and detail["dislikes"] == 1 and detail["my_reaction"] == 1 and detail["saved"] is True
    anon = client.get(f"/videos/{vid}").json()
    assert anon["my_reaction"] == 0 and anon["saved"] is False

    assert client.delete(f"/videos/{vid}/save", headers=other_h).json() == {"saved": False}
    assert client.get("/me/saved", headers=other_h).json() == []


def test_comment_replies_reactions_sort_and_notifications(client, auth):
    owner_h, _ = auth
    luis_h, _ = register(client, name="Luis", email="luis@test.com")
    vid = upload(client, owner_h).json()["id"]

    first = client.post(f"/videos/{vid}/comments", headers=luis_h, json={"content": "Primero"}).json()
    second = client.post(f"/videos/{vid}/comments", headers=luis_h, json={"content": "Segundo"}).json()
    reply = client.post(f"/videos/{vid}/comments", headers=owner_h, json={"content": "Gracias", "parent_id": first["id"]}).json()
    assert reply["parent_id"] == first["id"]
    # responder a una respuesta queda agrupado bajo el comentario principal
    nested = client.post(f"/videos/{vid}/comments", headers=luis_h, json={"content": "De nada", "parent_id": reply["id"]}).json()
    assert nested["parent_id"] == first["id"]

    client.post(f"/comments/{first['id']}/reaction", headers=owner_h, json={"value": 1})
    top = client.get(f"/videos/{vid}/comments", params={"sort": "top"}).json()
    assert [c["id"] for c in top] == [first["id"], second["id"]]
    assert top[0]["likes"] == 1 and top[0]["reply_count"] == 2
    new = client.get(f"/videos/{vid}/comments", params={"sort": "new"}).json()
    assert [c["id"] for c in new] == [second["id"], first["id"]]
    assert [c["content"] for c in client.get(f"/comments/{first['id']}/replies").json()] == ["Gracias", "De nada"]

    types = sorted(n["type"] for n in client.get("/notifications", headers=owner_h).json()["items"])
    assert types == ["comment", "comment"]
    luis_types = sorted(n["type"] for n in client.get("/notifications", headers=luis_h).json()["items"])
    assert luis_types == ["reply"]
    assert client.get(f"/videos/{vid}").json()["comment_count"] == 4

    other_vid = upload(client, owner_h, title="Otro").json()["id"]
    bad = client.post(f"/videos/{other_vid}/comments", headers=luis_h, json={"content": "x", "parent_id": first["id"]})
    assert bad.status_code == 400


def test_health_reports_storage(client):
    assert client.get("/health").json() == {"status": "ok", "storage": "local"}
