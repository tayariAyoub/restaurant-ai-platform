# RestaurantAI Platform

RestaurantAI is a multi-restaurant platform that combines professional restaurant websites, online ordering, reservations, delivery management, and a restaurant-specific AI assistant.

Each restaurant has isolated content, menu data, branding, conversations, and orders. Public websites are available at routes such as `/restaurants/bella-napoli`, while owners manage their restaurant through the admin dashboard.

## Current features

- Responsive public restaurant websites
- Menu categories, items, prices, dietary labels, and allergens
- Opening hours, contact details, gallery, maps, and reservations
- Pickup, eat-in, and delivery ordering
- Live order management, preparation status, drivers, and delivery routes
- Restaurant admin and platform super-admin roles
- Restaurant design templates and branding controls
- PDF/TXT knowledge uploads
- OpenAI-powered RAG chatbot using restaurant-scoped pgvector retrieval
- Saved customer conversations and unanswered-question tracking
- Demo data for the Bella Napoli pizza restaurant

## Technology

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS |
| Backend | Python 3.12, FastAPI, SQLAlchemy |
| Database | PostgreSQL 16 with pgvector |
| AI | OpenAI API, embeddings, restaurant-scoped RAG |
| Deployment | Docker and Docker Compose |

```text
Browser
  -> Next.js frontend
  -> same-origin /api proxy
  -> FastAPI REST API
  -> PostgreSQL + pgvector
  -> OpenAI API when configured
```

## Quick start with Docker

Requirements:

- Git
- Docker Desktop with the Docker engine running

Clone and start the project:

```powershell
git clone https://github.com/tayariAyoub/restaurant-ai-platform.git
cd restaurant-ai-platform
Copy-Item .env.example .env
```

Open `.env` and replace every `CHANGE_ME` value. Then run:

```powershell
docker compose up --build -d
docker compose ps
```

Open:

- Website: http://localhost:3000/restaurants/bella-napoli
- Admin login: http://localhost:3000/admin/login
- API documentation: http://localhost:8000/docs

The admin and demo-owner login details are the `ADMIN_*` and `DEMO_OWNER_*` values you set in your local `.env`.

Stop the application:

```powershell
docker compose down
```

To also remove local database and upload volumes:

```powershell
docker compose down -v
```

## Environment variables

Create `.env` from `.env.example`. Never commit `.env`.

| Variable | Purpose |
| --- | --- |
| `POSTGRES_DB` | PostgreSQL database name |
| `POSTGRES_USER` | PostgreSQL user |
| `POSTGRES_PASSWORD` | Local/production database password |
| `DATABASE_URL` | SQLAlchemy PostgreSQL connection URL |
| `JWT_SECRET` | Long random secret used to sign access tokens |
| `OPENAI_API_KEY` | Optional OpenAI key for embeddings and chat |
| `OPENAI_CHAT_MODEL` | OpenAI chat model |
| `OPENAI_EMBEDDING_MODEL` | OpenAI embedding model |
| `ADMIN_EMAIL` | Initial super-admin email |
| `ADMIN_PASSWORD` | Initial super-admin password |
| `DEMO_OWNER_EMAIL` | Demo restaurant-owner email |
| `DEMO_OWNER_PASSWORD` | Demo restaurant-owner password |
| `FRONTEND_URL` | Allowed frontend origin |
| `BACKEND_INTERNAL_URL` | Backend URL used by the Next.js proxy |

Generate a strong JWT secret in PowerShell:

```powershell
[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 }))
```

## Run without Docker

PostgreSQL with the `vector` extension must already be running.

Backend:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Frontend, in a second terminal:

```powershell
cd frontend
npm install
$env:BACKEND_INTERNAL_URL="http://localhost:8000"
npm run dev
```

## Tests and checks

```powershell
docker compose exec backend pytest
docker compose exec frontend npm run build
```

## Main project structure

```text
backend/
  app/api/          FastAPI routes
  app/core/         configuration, database, security
  app/services/     RAG, uploads, seed data, migration bridge
  models.py         SQLAlchemy database models
  schemas.py        API request/response schemas
  tests/            backend tests
frontend/
  app/              Next.js routes
  components/       public website and admin UI
  lib/              API client, auth helpers, shared types
docker-compose.yml  local full-stack environment
```

## Security notes

- `.env`, keys, build output, dependencies, uploads, and local tool folders are ignored by Git.
- Prices are recalculated by the backend from current menu data.
- Restaurant management and RAG queries are scoped to the authenticated restaurant.
- Passwords are stored as bcrypt hashes.
- Replace all development credentials before deploying.
- Before a public launch, add HTTP-only cookie sessions, rate limiting, password reset, audit logs, backups, object storage, monitoring, and a formal migration system such as Alembic.

## Team workflow

Read [CONTRIBUTING.md](CONTRIBUTING.md) before making changes. Work in short feature branches and merge reviewed pull requests into `main`.

## License

Private and proprietary. Do not redistribute without the repository owner's permission.
