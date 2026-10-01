#!/bin/bash
# Actualiza el esquema de RDS antes de reiniciar la API (lo ejecuta deploy.yml vía SSM).
# Crea tablas nuevas y agrega columnas nuevas; es seguro ejecutarlo varias veces.
set -euo pipefail
cd "$(dirname "$0")/../../backend"
# src/config.py lee backend/.env con python-dotenv (así una contraseña con símbolos no rompe el script)
venv/bin/python -c "import src.models.user, src.models.video, src.models.comment, src.models.social; from src.database.connection import Base, engine; from src.database.migrations import run_migrations; Base.metadata.create_all(engine); run_migrations(engine); print('Migraciones aplicadas')"
