# VideoTube · Proyecto 1 (tema claro)

Plataforma de videos tipo SPA: **React + Vite** (S3), **FastAPI** (EC2), **PostgreSQL** (RDS) y archivos en **S3**.
La interfaz de Inicio y Reproductor sigue la estructura familiar de una plataforma de videos en tema claro; el Perfil tiene un diseño propio.

```
Navegador ──▶ S3 Frontend (index.html + assets/)             React compilado (dist/)
    │
    │ fetch JSON / multipart  (Authorization: Bearer <JWT>)
    ▼
EC2 · Nginx :80 ──▶ Uvicorn/FastAPI :8000 ──(IAM Role)──▶ S3 Videos (.mp4)
                          │                    └────────▶ S3 Miniaturas (.jpg/.jpeg/.png)
                          │ 5432 (Security Group)
                          ▼
                    RDS PostgreSQL (users · videos · comments)

GitHub Actions ──OIDC──▶ IAM Role temporal ──▶ s3 sync dist/  +  SSM → EC2 (actualiza la API)
```

## Estructura

```
proyecto1-claro/
├── .github/workflows/deploy.yml     CI/CD (PR: valida · main: valida + despliega + verifica)
├── infra/                           Plantillas AWS (IAM, S3, EC2)
├── backend/
│   ├── src/
│   │   ├── crud/                    Consultas a la base de datos
│   │   ├── database/                Conexión SQLAlchemy (PostgreSQL / RDS)
│   │   ├── models/                  Tablas users, videos, comments
│   │   ├── routers/                 Endpoints HTTP
│   │   ├── schemas/                 Validación de entrada/salida (Pydantic)
│   │   ├── security/                (auxiliar) bcrypt + JWT
│   │   ├── services/                (auxiliar) almacenamiento local ↔ S3
│   │   ├── config.py                Variables de entorno
│   │   └── main.py                  App FastAPI, CORS, /docs
│   ├── tests/                       pytest
│   ├── requirements.txt · requirements-dev.txt · .env.example
└── frontend/                        Creado con: npm create vite@latest frontend -- --template react
    └── src/
        ├── components/atoms/        Icon, Button, Avatar, Thumbnail, Logo, Chip…
        ├── components/molecules/    SearchBar, VideoMeta, CommentItem, UserMenu, Modal…
        ├── components/organisms/    Navbar, Sidebar, VideoCard, VideoGrid, VideoPlayer, ProfileHeader…
        ├── pages/                   AuthPage · HomePage · PlayerPage · ProfilePage
        ├── services/                Cliente de la API y formatos
        ├── context/                 Sesión del usuario (AuthContext)
        ├── styles/index.css         Tailwind + tokens del tema claro
        ├── App.jsx · main.jsx
```

## Endpoints

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/users` | — | Registro → token + usuario |
| POST | `/login` | — | Inicio de sesión → token + usuario |
| GET | `/users/{id}` | — | Datos del usuario y `video_count` |
| POST | `/videos` | ✔ | Publicar (multipart: `title`, `description`, `video` MP4 o WebM ≤100 MB, `thumbnail` JPG/JPEG/PNG) |
| GET | `/videos` | — | Catálogo · `?q=` busca en título, descripción y nombre del usuario · `?user_id=` videos de un usuario |
| GET | `/videos/{id}` | — | Detalle (solo lectura) |
| PUT | `/videos/{id}` | ✔ autor | Editar título y descripción |
| DELETE | `/videos/{id}` | ✔ autor | Eliminar registro + archivos |
| POST | `/videos/{id}/comments` | ✔ | Comentar |
| GET | `/videos/{id}/comments` | — | Listar comentarios |
| POST | `/videos/{id}/views` | — | *extra* · registrar una reproducción |
| GET | `/videos/{id}/recommended` | — | *extra* · recomendados |
| GET | `/health` | — | *extra* · usado por el despliegue |

Documentación interactiva: **`/docs`** (botón *Authorize* → pegar el `access_token`).

## Decisiones técnicas

- **Sin `__init__.py`:** ninguna carpeta del backend tiene `__init__.py`. Cada archivo importa el módulo exacto que necesita (`from ..models.user import User`, `from ..schemas.video import VideoOut`), y `main.py` registra cada `APIRouter` con `app.include_router(...)`.

- **Vistas.** `GET /videos/{id}` no modifica datos. La vista se registra con `POST /videos/{id}/views` cuando el video empieza a reproducirse, **una sola vez por video y sesión** (un `Set` en memoria evita duplicados por re-renders/StrictMode y `sessionStorage` evita sumar al recargar). En la base se usa `UPDATE … SET views = views + 1` (atómico).
- **Archivos privados en S3.** RDS guarda la URL del objeto; al responder, la API entrega **URLs prefirmadas temporales** (`S3_URL_EXPIRES_SECONDS`). Así los buckets de videos y miniaturas pueden permanecer privados. La configuración exacta se define en la fase AWS.
- **HashRouter.** Las rutas quedan como `/#/watch/5`. S3 static website hosting siempre entrega `index.html`, y recargar cualquier página no produce 404 (verificado sirviendo `dist/` con un servidor estático sin reglas de reescritura).
- **`base` de Vite.** Se mantiene el valor por defecto (`/`): la SPA se sirve desde la raíz del website del bucket, así que no hace falta cambiarlo.
- **Lint.** La plantilla actual de Vite trae **oxlint** (`npm run lint`), se conservó tal cual.
- **Tipografía.** Roboto desde Google Fonts (licencia abierta). Si no carga, se usa Arial.
- **Perfiles de otros usuarios.** La misma página Perfil atiende `/#/profile` (tu perfil, con publicar/editar/eliminar) y `/#/profile/:id` (otro usuario, solo lectura y sin mostrar su correo). Se llega desde el nombre o avatar del autor, el botón "Ver perfil" del reproductor, los comentarios o la búsqueda por nombre.
- **Guía lateral.** Misma estructura que la guía de las plataformas de video (Inicio · Tú › Tu canal / Mis videos · Explorar con "Mostrar más"). Solo incluye opciones que funcionan: las categorías de Explorar son búsquedas reales (`/?q=música`). Iconos de **Google Material Symbols** (Apache 2.0) en `atoms/MaterialIcon.jsx`.
- **Nombre/logo.** Centralizados en `frontend/src/components/atoms/Logo.jsx` (y `<title>` de `index.html`).

---

## Funciones sociales (versión 2)

Todas funcionan dentro de las **mismas 4 páginas**:

- **Listas:** Inicio muestra cada lista con `?feed=`: `shorts`, `subscriptions`, `trending`, `history`, `saved` y `liked`.
- **Shorts:** se abren en el Reproductor en formato vertical.
- **Perfiles:** el de otro usuario es `/#/profile/:id`.

| Función | Cómo funciona |
|---|---|
| **Shorts** | Al publicar se marca "Es un Short" (`is_short`). Hay una fila de Shorts en Inicio y en la búsqueda, una vista `?feed=shorts` y un reproductor vertical con acciones y navegación ↑/↓. |
| **Suscripciones** | Botón *Suscribirse / Suscrito* en el reproductor, el perfil y la búsqueda. Los canales aparecen en la barra lateral, y `?feed=subscriptions` muestra sus videos y Shorts. |
| **Notificaciones** | Campana con contador. Avisa de un nuevo video de un canal suscrito, de comentarios en tus videos, de respuestas a tus comentarios y de nuevos suscriptores. |
| **Me gusta / No me gusta** | En videos y en comentarios. `?feed=liked` lista los videos que te gustan. |
| **Guardar** | Guarda el video para verlo más tarde en `?feed=saved`. |
| **Comentarios** | Se pueden ordenar (principales / recientes), responder, y ver las respuestas desplegando el hilo. |
| **Historial** | Se guarda en el navegador (últimos 50 videos). |
| **Vista previa** | Al pasar el mouse sobre una miniatura se reproduce el video sin sonido. No aplica en pantallas táctiles. |
| **Búsqueda** | Muestra los creadores que coinciden, una fila de Shorts y la sección "Coincidencias". Los skeletons completan las filas aunque haya pocos resultados. |
| **Enlaces a S3** | La descripción del video enlaza al MP4 y a la miniatura. En AWS son URLs prefirmadas de los buckets S3. |

### Endpoints nuevos

| Método | Ruta | Auth |
|---|---|---|
| POST | `/videos` → acepta además `duration` (segundos, opcional) | ✔ |
| GET | `/videos?short=true\|false&sort=recent\|views&ids=1,2` | — |
| GET | `/videos/{id}` → incluye `likes`, `dislikes`, `my_reaction`, `saved`, `comment_count`, `author_subscribers`, `subscribed` | opcional |
| POST | `/videos/{id}/reaction` `{value: 1 \| -1 \| 0}` | ✔ |
| POST / DELETE | `/videos/{id}/save` | ✔ |
| POST / DELETE | `/users/{id}/subscribe` | ✔ |
| GET | `/me/subscriptions` · `/me/feed` · `/me/saved` · `/me/liked` | ✔ |
| GET | `/videos/{id}/comments?sort=top\|new` · `/comments/{id}/replies` | opcional |
| POST | `/videos/{id}/comments` `{content, parent_id?}` · `/comments/{id}/reaction` | ✔ |
| GET / POST | `/notifications` · `/notifications/read` | ✔ |

- `GET /users/{id}` ahora incluye `subscriber_count` y `subscribed`, y **solo devuelve el correo al propio usuario**.
- `GET /health` indica si los archivos se guardan en `local` o en `s3`, y con qué buckets.

### Base de datos

- **Tablas nuevas:** `subscriptions`, `video_reactions`, `comment_reactions`, `saved_videos` y `notifications`.
- **Columnas nuevas:** `videos.is_short` y `comments.parent_id`.

Al iniciar, la API aplica migraciones idempotentes (`database/migrations.py`), así que una base ya existente, local o RDS, se actualiza sola. En el despliegue, `deploy.yml` también ejecuta `infra/ec2/run_migrations.sh` antes de reiniciar la API.

### Cómo llegan a S3 los archivos subidos

Todo lo que se publica desde el frontend pasa por la API en la EC2:

1. El video va al bucket de videos y la miniatura al de miniaturas (boto3 + IAM Role).
2. RDS guarda las dos URLs.
3. La interfaz muestra ambos enlaces.

`deploy.yml` verifica después de cada despliegue que `/health` responda `storage: "s3"` con los dos buckets configurados.

## Versión 3: duración, reels y contenido de demostración

| Función | Cómo funciona |
|---|---|
| **Duración en las miniaturas** | Al subir, el navegador lee la duración del archivo y la envía en el campo `duration` (segundos). La API la guarda en `videos.duration` y las tarjetas la muestran en la esquina (`3:25`). Si un video antiguo no la tiene, la interfaz lee solo los metadatos del archivo. |
| **Tarjetas completas** | Videos y Shorts muestran el avatar, el título, el creador, las vistas y la fecha ("hace 3 días"). |
| **Reels (Shorts)** | Tienen tres acciones: **Me gusta**, **Comentarios** y **Compartir**. Compartir solo copia el enlace del Short y funciona también en el website HTTP de S3. |
| **Navegar sin cuenta** | Sin iniciar sesión se puede ver todo. Al intentar dar me gusta, comentar, responder, suscribirse, guardar o subir, aparece una ventana **"Inicia sesión"** que, después del login, regresa a la misma página. |
| **Subir reels desde el perfil** | El perfil propio tiene los botones **Subir video** y **Subir Short**, y la biblioteca separa *Todo / Videos / Shorts*. Si el archivo es vertical, el formulario lo marca como Short automáticamente. |
| **Color del tema** | El botón de paleta de la barra superior (y la sección "Color del tema" de la guía lateral en el celular) cambia el fondo, los botones, el logo y los iconos activos: Clásico, Rosa, Morado, Azul, Menta y Durazno. Los colores están en `styles/index.css` y la elección se recuerda en el navegador. |
| **Diseño adaptable** | Las páginas se ajustan desde 360 px (celular) hasta pantallas anchas. |

### Contenido de demostración (10 videos y 5 reels que rotan)

`backend/src/services/demo_seed.py` publica contenido **a través de la API**, igual que el frontend. Por eso, en AWS los archivos terminan en los buckets S3.

1. Crea una carpeta con esta estructura (por ejemplo `C:\Users\diego\Pruebaparcial\demo-media`):

   ```
   demo-media/
   ├── videos/              10 archivos .mp4 o .webm (horizontales)
   ├── miniaturas-videos/   20 imágenes .jpg, .jpeg o .png
   ├── reels/               5 archivos .mp4 o .webm (verticales)
   └── miniaturas-reels/    10 imágenes .jpg, .jpeg o .png
   ```

   El nombre de cada miniatura se usa como título (por ejemplo, `Atardecer en Quito.jpg`). Si la miniatura se llama solo con un número, se usa el nombre del video.

2. Con la API encendida, desde `backend`:

   ```powershell
   # Ver qué se va a publicar, sin subir nada
   .\venv\Scripts\python -m src.services.demo_seed --source "C:\Users\diego\Pruebaparcial\demo-media" --dry-run
   # Publicar en local
   .\venv\Scripts\python -m src.services.demo_seed --source "C:\Users\diego\Pruebaparcial\demo-media" --api http://localhost:8000
   # Publicar en AWS (los archivos van a S3)
   .\venv\Scripts\python -m src.services.demo_seed --source "C:\Users\diego\Pruebaparcial\demo-media" --api http://<IP-ELASTICA-EC2>
   ```

- **Rotación:** la publicación *n* usa la miniatura *n* y el archivo `n mod cantidad_de_archivos`. Así se crean 20 videos con 10 archivos y 10 reels con 5 archivos, cada uno con su propia miniatura.
- **Canales:** el contenido se reparte entre 4 canales demo (`demo.andes@videodemo.com`, `demo.pacifico@…`, `demo.amazonia@…`, `demo.galapagos@…`), todos con la contraseña `Demo12345`.
- **Sin duplicados:** si lo ejecutas otra vez, salta lo que ya está publicado.
- **Formatos:** las imágenes `.webp` y los archivos de más de 100 MB se omiten con un aviso.

### Base de datos

- **Columna nueva:** `videos.duration`, opcional, en segundos.
- **Migración:** se agrega sola al iniciar la API (`database/migrations.py`). En el despliegue también la aplica `run_migrations.sh`.

## 1. Ejecución local (Windows)

**Requisitos:** Python 3.11+, Node.js 20+ y **PostgreSQL 16** (instalador de postgresql.org, incluye pgAdmin).

### 1.1 Base de datos

En pgAdmin o en `psql -U postgres`:

```sql
CREATE DATABASE videotube;        -- desarrollo
CREATE DATABASE videotube_test;   -- solo para pytest
```

### 1.2 Backend

```powershell
cd proyecto1-claro\backend
python -m venv venv
.\venv\Scripts\python -m pip install -r requirements.txt -r requirements-dev.txt
copy .env.example .env      # edita DB_PASSWORD (y DB_NAME) con tus datos de PostgreSQL
.\venv\Scripts\python -m uvicorn src.main:app --reload
```

→ http://localhost:8000/docs  (las tablas se crean automáticamente al iniciar)

### 1.3 Frontend

```powershell
cd proyecto1-claro\frontend
npm install
npm run dev
```

→ http://localhost:5173

### 1.4 Pruebas

```powershell
# Backend (usa la base videotube_test)
cd backend
$env:TEST_DATABASE_URL="postgresql+psycopg2://postgres:TU_PASSWORD@localhost:5432/videotube_test"
.\venv\Scripts\python -m pytest
.\venv\Scripts\ruff check src tests

# Frontend
cd ..\frontend
npm run lint
npm run build
```

**Pruebas manuales:** registro → login → catálogo → búsqueda → reproducir (sube 1 vista) → comentar → recomendados → Perfil → publicar (MP4 + miniatura) → editar → eliminar.

---

## 2. Despliegue en AWS

| Recurso | Configuración clave |
|---|---|
| **VPC** | EC2 en subred pública; RDS en un *DB subnet group* de la misma VPC |
| **SG-EC2** | Entrada 80 desde `0.0.0.0/0` (22 solo desde tu IP, opcional con SSM) |
| **SG-RDS** | Entrada 5432 **solo desde SG-EC2** |
| **RDS** | PostgreSQL, *Public access = No*, base inicial `videotube` |
| **S3 Frontend** | Static website hosting (`index.html`), política `infra/s3/frontend-bucket-policy.json` |
| **S3 Videos / Miniaturas** | Privados (Block Public Access); acceso por IAM Role + URLs prefirmadas |
| **IAM Role EC2** | `infra/iam/ec2-role-s3-policy.json` + política administrada `AmazonSSMManagedInstanceCore` |
| **EC2** | Ubuntu 24.04 LTS (t3.micro); `infra/ec2/setup_ec2.sh` (Python 3, Nginx, systemd). El script también funciona en Amazon Linux 2023 |
| **OIDC** | Proveedor `token.actions.githubusercontent.com` (audiencia `sts.amazonaws.com`) |
| **IAM Role GitHub** | Confianza `infra/iam/github-oidc-trust-policy.json` (el `sub` acepta el formato con IDs de GitHub: `repo:USUARIO@ID/REPO@ID:ref:refs/heads/main`) + permisos `infra/iam/github-deploy-policy.json` |

`.env` en la EC2 (nunca en el repositorio):

```
DB_USER=<usuario maestro de RDS>
DB_PASSWORD=<contraseña de RDS>
DB_HOST=<punto de enlace de RDS>
DB_PORT=5432
DB_NAME=<nombre de la base inicial>
DB_SSLMODE=require
JWT_SECRET=<python -c "import secrets;print(secrets.token_hex(32))">
STORAGE_MODE=s3
AWS_REGION=us-east-1
S3_VIDEOS_BUCKET=<bucket-videos>
S3_THUMBNAILS_BUCKET=<bucket-miniaturas>
CORS_ORIGINS=http://<bucket-frontend>.s3-website-us-east-1.amazonaws.com
```

## 3. CI/CD (`.github/workflows/deploy.yml`)

| Evento | Qué ocurre |
|---|---|
| Pull Request a `main` | backend: `pip install` → `ruff` → `pytest` (PostgreSQL de servicio) · frontend: `npm ci` → `npm run lint` → `npm run build`. **No despliega.** |
| Push / merge a `main` o `workflow_dispatch` | Validaciones → **OIDC** → IAM Role temporal → `dist/` a S3 → SSM ejecuta en la EC2 `git fetch` + `pip install` + `systemctl restart` → verificación de `/health`, `/docs` y la SPA |

Variables del repositorio (*Settings → Secrets and variables → Actions → Variables*):
`AWS_ROLE_ARN`, `AWS_REGION`, `S3_FRONTEND_BUCKET`, `EC2_INSTANCE_ID`, `EC2_APP_DIR`, `VITE_API_URL`, `API_URL`, `FRONTEND_URL`.
No se usan Access Keys: el workflow solo tiene `permissions: contents: read, id-token: write`.

> La EC2 descarga el código con `git fetch`, por lo que el repositorio debe ser **público**. Si es privado, agrega en la EC2 una *deploy key* de solo lectura.
