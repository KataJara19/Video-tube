"""Carga contenido de demostración usando la propia API (local o AWS).

Rota los archivos: con 10 videos y 20 miniaturas crea 20 publicaciones
(el video 1 se usa en las publicaciones 1 y 11, etc.), y con 5 reels y
10 miniaturas crea 10 Shorts. Cada publicación tiene su propia miniatura.

Como todo pasa por POST /videos, en AWS los archivos terminan en los
buckets S3 igual que si se subieran desde el frontend.

Estructura de la carpeta de origen:

    demo-media/
        videos/              .mp4 o .webm (horizontal)
        miniaturas-videos/   .jpg, .jpeg o .png
        reels/               .mp4 o .webm (vertical)
        miniaturas-reels/    .jpg, .jpeg o .png

Uso (desde la carpeta backend, con la API encendida):

    .\\venv\\Scripts\\python -m src.services.demo_seed --source "C:\\ruta\\demo-media" --api http://localhost:8000
"""
import argparse
import re
import struct
import sys
from pathlib import Path

import httpx

VIDEO_EXT = {".mp4", ".webm"}
IMAGE_EXT = {".jpg", ".jpeg", ".png"}
MAX_VIDEO_BYTES = 100 * 1024 * 1024

# Canales de demostración (los videos se reparten entre ellos)
CHANNELS = [
    ("Canal Andes", "andes"),
    ("Canal Pacífico", "pacifico"),
    ("Canal Amazonía", "amazonia"),
    ("Canal Galápagos", "galapagos"),
]

MIME = {".mp4": "video/mp4", ".webm": "video/webm", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png"}


# ── Duración del archivo (sin ffmpeg) ────────────────────────────────────────
def _mp4_duration(data: bytes) -> float | None:
    i = data.find(b"mvhd")
    if i < 0:
        return None
    version = data[i + 4]
    if version == 1:
        timescale, duration = struct.unpack(">IQ", data[i + 24:i + 36])
    else:
        timescale, duration = struct.unpack(">II", data[i + 16:i + 24])
    return duration / timescale if timescale else None


def _webm_duration(data: bytes) -> float | None:
    head = data[:2_000_000]
    scale = 1_000_000  # TimecodeScale por defecto (ns)
    j = head.find(b"\x2a\xd7\xb1")
    if j >= 0:
        size = head[j + 3] & 0x0F if head[j + 3] & 0x80 else None
        if size:
            scale = int.from_bytes(head[j + 4:j + 4 + size], "big")
    k = head.find(b"\x44\x89")
    while k >= 0:
        marker = head[k + 2]
        if marker == 0x88:
            return struct.unpack(">d", head[k + 3:k + 11])[0] * scale / 1e9
        if marker == 0x84:
            return struct.unpack(">f", head[k + 3:k + 7])[0] * scale / 1e9
        k = head.find(b"\x44\x89", k + 2)
    return None


def file_duration(path: Path) -> float | None:
    try:
        data = path.read_bytes()
        value = _mp4_duration(data) if path.suffix.lower() == ".mp4" else _webm_duration(data)
        return round(value, 2) if value and 0 < value < 86400 else None
    except Exception:
        return None


# ── Utilidades ──────────────────────────────────────────────────────────────
def list_files(folder: Path, allowed: set[str]) -> list[Path]:
    if not folder.is_dir():
        return []
    files = sorted(p for p in folder.iterdir() if p.is_file() and p.suffix.lower() in allowed)
    skipped = sorted(p.name for p in folder.iterdir() if p.is_file() and p.suffix.lower() not in allowed)
    for name in skipped:
        print(f"  · Se omite {folder.name}/{name}: formato no permitido ({', '.join(sorted(allowed))})")
    return files


def make_title(thumb: Path, video: Path, round_number: int) -> str:
    """Usa el nombre de la miniatura; si es solo un número, el del video."""
    base = thumb.stem if len(re.findall(r"[A-Za-zÁÉÍÓÚáéíóúÑñ]", thumb.stem)) >= 3 else video.stem
    title = re.sub(r"[_]+", " ", base)
    title = re.sub(r"\((480|720|1080)p\)", "", title, flags=re.I)
    title = re.sub(r"\s+", " ", title).strip()
    if base == video.stem and round_number > 1:
        title = f"{title} · parte {round_number}"
    return title[:200] or "Video de demostración"


def get_token(client: httpx.Client, name: str, slug: str, password: str) -> tuple[str, int]:
    email = f"demo.{slug}@videodemo.com"
    r = client.post("/login", json={"email": email, "password": password})
    if r.status_code == 200:
        return r.json()["access_token"], r.json()["user"]["id"]
    r = client.post("/users", json={"name": name, "email": email, "password": password})
    if r.status_code not in (200, 201):
        sys.exit(f"No se pudo crear el canal {name}: {r.status_code} {r.text}")
    return r.json()["access_token"], r.json()["user"]["id"]


def publish(client, token, *, title, video: Path, thumb: Path, is_short: bool) -> dict:
    with video.open("rb") as fv, thumb.open("rb") as ft:
        files = {
            "video": (video.name, fv, MIME[video.suffix.lower()]),
            "thumbnail": (thumb.name, ft, MIME[thumb.suffix.lower()]),
        }
        data = {"title": title, "description": f"Contenido de demostración · {video.name}", "is_short": str(is_short).lower()}
        duration = file_duration(video)
        if duration:
            data["duration"] = str(duration)
        r = client.post("/videos", data=data, files=files, headers={"Authorization": f"Bearer {token}"})
    if r.status_code != 201:
        raise RuntimeError(f"{r.status_code} {r.text[:200]}")
    return r.json()


def seed(api: str, source: Path, password: str, dry_run: bool) -> None:
    groups = [
        ("Videos", list_files(source / "videos", VIDEO_EXT), list_files(source / "miniaturas-videos", IMAGE_EXT), False),
        ("Reels", list_files(source / "reels", VIDEO_EXT), list_files(source / "miniaturas-reels", IMAGE_EXT), True),
    ]
    plan = []
    for label, videos, thumbs, is_short in groups:
        for big in [v for v in videos if v.stat().st_size > MAX_VIDEO_BYTES]:
            print(f"  · Se omite {big.name}: supera 100 MB")
        videos = [v for v in videos if v.stat().st_size <= MAX_VIDEO_BYTES]
        print(f"{label}: {len(videos)} archivos y {len(thumbs)} miniaturas → {len(thumbs) if videos else 0} publicaciones")
        if not videos or not thumbs:
            continue
        for i, thumb in enumerate(thumbs):
            video = videos[i % len(videos)]
            title = make_title(thumb, video, i // len(videos) + 1)
            plan.append((title, video, thumb, is_short))

    if not plan:
        sys.exit("No hay nada que publicar. Revisa la estructura de la carpeta (ver la ayuda del script).")
    if dry_run:
        for n, (title, video, thumb, is_short) in enumerate(plan, 1):
            print(f"{n:>2}. {'Short' if is_short else 'Video'} · {title}  ←  {video.name} + {thumb.name}")
        return

    with httpx.Client(base_url=api.rstrip("/"), timeout=300) as client:
        accounts = [get_token(client, name, slug, password) for name, slug in CHANNELS]
        tokens = [token for token, _ in accounts]
        # Si el script se ejecuta otra vez, no repite lo que ya está publicado
        existing = set()
        for _, user_id in accounts:
            existing |= {v["title"] for v in client.get("/videos", params={"user_id": user_id, "limit": 100}).json()}
        for n, (title, video, thumb, is_short) in enumerate(plan, 1):
            channel = (n - 1) % len(CHANNELS)
            if title in existing:
                print(f"{n:>2}/{len(plan)} ya existe · {title}")
                continue
            try:
                created = publish(client, tokens[channel], title=title, video=video, thumb=thumb, is_short=is_short)
                print(f"{n:>2}/{len(plan)} OK  #{created['id']} {CHANNELS[channel][0]} · {title}")
            except Exception as exc:  # sigue con el resto
                print(f"{n:>2}/{len(plan)} ERROR {title}: {exc}")
    print(f"\nListo. Canales demo: demo.<canal>@videodemo.com · contraseña: {password}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Carga videos y reels de demostración por la API.")
    parser.add_argument("--source", required=True, help="Carpeta demo-media")
    parser.add_argument("--api", default="http://localhost:8000", help="URL de la API (local o la IP de la EC2)")
    parser.add_argument("--password", default="Demo12345", help="Contraseña de los canales demo")
    parser.add_argument("--dry-run", action="store_true", help="Solo muestra lo que se publicaría")
    args = parser.parse_args()
    seed(args.api, Path(args.source), args.password, args.dry_run)


if __name__ == "__main__":
    main()
