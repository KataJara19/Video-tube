from conftest import upload


def test_comments_flow(client, auth):
    headers, _ = auth
    vid = upload(client, headers).json()["id"]

    assert client.post(f"/videos/{vid}/comments", json={"content": "Hola"}).status_code == 401
    assert client.post(f"/videos/{vid}/comments", headers=headers, json={"content": ""}).status_code == 422

    r = client.post(f"/videos/{vid}/comments", headers=headers, json={"content": "Excelente video"})
    assert r.status_code == 201 and r.json()["user"]["name"] == "Ana"

    comments = client.get(f"/videos/{vid}/comments").json()
    assert len(comments) == 1 and comments[0]["content"] == "Excelente video"
    assert client.get("/videos/999/comments").status_code == 404


def test_comments_deleted_with_video(client, auth):
    headers, _ = auth
    vid = upload(client, headers).json()["id"]
    client.post(f"/videos/{vid}/comments", headers=headers, json={"content": "x"})
    client.delete(f"/videos/{vid}", headers=headers)
    assert client.get(f"/videos/{vid}/comments").status_code == 404
