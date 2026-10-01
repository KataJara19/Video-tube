#!/bin/bash
# Preparación inicial de la EC2. Funciona en Ubuntu 24.04 (usuario "ubuntu") y en Amazon Linux 2023 ("ec2-user").
# Se ejecuta UNA vez, como el usuario normal de la instancia (no como root):
#   git clone https://github.com/KataJara19/Video-tube.git ~/videotube
#   cd ~/videotube/backend && cp .env.example .env && nano .env
#   bash ~/videotube/infra/ec2/setup_ec2.sh
# Después, cada push a main actualiza la API automáticamente (GitHub Actions + SSM).
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/../.." && pwd)"   # carpeta del repositorio clonado
APP_USER="$(whoami)"                               # ubuntu (Ubuntu) o ec2-user (Amazon Linux)

# 1. Paquetes del sistema
if command -v apt-get >/dev/null; then
  sudo apt-get update -y
  sudo apt-get install -y python3 python3-venv python3-pip git nginx curl
  PYTHON=python3
  sudo rm -f /etc/nginx/sites-enabled/default   # el sitio de ejemplo de Ubuntu ocupa el puerto 80
else
  sudo dnf install -y python3.11 python3.11-pip git nginx
  PYTHON=python3.11
fi

# 2. Entorno de Python y dependencias de la API
cd "$APP_DIR/backend"
if [ ! -f .env ]; then
  echo "Falta backend/.env (copia .env.example y completa DB_*, JWT_SECRET, buckets, CORS)."
  exit 1
fi
chmod 600 .env   # solo el dueño puede leer los secretos
$PYTHON -m venv venv
./venv/bin/pip install --upgrade pip
./venv/bin/pip install -r requirements.txt

# 3. Servicio systemd (usuario y carpeta según la instancia) y Nginx
sed -e "s#__APP_USER__#$APP_USER#g" -e "s#__APP_DIR__#$APP_DIR#g" \
  "$APP_DIR/infra/ec2/videotube-api.service" | sudo tee /etc/systemd/system/videotube-api.service >/dev/null
sudo cp "$APP_DIR/infra/ec2/nginx-videotube.conf" /etc/nginx/conf.d/videotube.conf
sudo nginx -t

# 4. Tablas en RDS y arranque
bash "$APP_DIR/infra/ec2/run_migrations.sh"
sudo systemctl daemon-reload
sudo systemctl enable --now videotube-api nginx
sudo systemctl restart videotube-api nginx

sleep 3
curl -fsS http://127.0.0.1/health && echo "  ← API lista. Abre http://<IP-PUBLICA>/docs"
