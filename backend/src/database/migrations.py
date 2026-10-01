"""Migraciones mínimas e idempotentes.

create_all() crea las tablas nuevas, pero no agrega columnas a tablas que ya existen.
Estas sentencias actualizan una base creada con la versión anterior (local o RDS)
y no hacen nada si la columna ya está.
"""
from sqlalchemy import text

STATEMENTS = [
    "ALTER TABLE videos ADD COLUMN IF NOT EXISTS is_short BOOLEAN NOT NULL DEFAULT false",
    "ALTER TABLE comments ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE",
    "CREATE INDEX IF NOT EXISTS ix_comments_parent_id ON comments (parent_id)",
    "ALTER TABLE videos ADD COLUMN IF NOT EXISTS duration DOUBLE PRECISION",
]


def run_migrations(engine) -> None:
    with engine.begin() as conn:
        for sql in STATEMENTS:
            conn.execute(text(sql))
