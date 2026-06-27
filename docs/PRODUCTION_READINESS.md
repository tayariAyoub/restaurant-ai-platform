# RestaurantAI Production Readiness

This guide documents the minimum foundation required before real restaurant pilots.

## Local Setup

Install:

- Git
- Docker Desktop
- Node.js 22
- pnpm 11
- Python 3.12

Recommended quick checks:

```powershell
git --version
docker --version
docker compose version
node --version
pnpm.cmd --version
py -3.12 --version
```

Install and validate the frontend:

```powershell
cd frontend
pnpm.cmd install
pnpm.cmd test
pnpm.cmd build
```

Install and validate the backend:

```powershell
cd backend
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m pytest
```

## Docker Setup

For a local full-stack demo:

```powershell
Copy-Item .env.example .env
docker compose up --build
```

Open:

- Public restaurant site: `http://localhost:3000/restaurants/bella-napoli`
- Admin login: `http://localhost:3000/admin/login`
- FastAPI docs: `http://localhost:8000/docs`

Stop the stack:

```powershell
docker compose down
```

Remove local database and upload volumes:

```powershell
docker compose down -v
```

## Required Environment Variables

The backend requires these values:

| Variable | Required | Notes |
| --- | --- | --- |
| `APP_ENV` | Yes | Use `development`, `test`, or `production`. Production enables stricter safety checks. |
| `DATABASE_URL` | Yes | SQLAlchemy database URL. Docker uses PostgreSQL with pgvector. |
| `JWT_SECRET` | Yes | Must be long, random, and private. Never use the local demo value in production. |
| `ADMIN_PASSWORD` | Yes | Initial super-admin password. Replace before pilots. |
| `DEMO_OWNER_PASSWORD` | Yes | Initial demo owner password. Replace before pilots or disable demo seed data later. |
| `FRONTEND_URL` | Yes | Frontend origin allowed by CORS, for example `https://your-domain.com`. |
| `STORAGE_PROVIDER` | Yes | Currently supports `local` only. |

Frontend/public URL variables:

| Variable | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Yes for production SEO | Public canonical site URL, for example `https://your-domain.com`. |
| `BACKEND_INTERNAL_URL` | Yes in Docker | Internal URL used by Next.js rewrites, usually `http://backend:8000`. |

Optional but recommended:

| Variable | Purpose |
| --- | --- |
| `OPENAI_API_KEY` | Enables AI chat and embeddings. Missing key is allowed locally, but public chat shows a temporary unavailable message. |
| `OPENAI_CHAT_MODEL` | Chat model, default `gpt-4.1-mini`. |
| `OPENAI_EMBEDDING_MODEL` | Embedding model, default `text-embedding-3-small`. |
| `RATE_LIMIT_CHAT_PER_MINUTE` | Chat abuse protection, default `10`. |
| `RATE_LIMIT_PUBLIC_PER_MINUTE` | General public API limit, default `100`. |
| `AUTH_COOKIE_ENABLED` | Optional cookie-auth support. Bearer auth still works. |
| `AUTH_COOKIE_SECURE` | Must be `true` if cookie auth is enabled in production. |

## OpenAI Setup

Never commit an OpenAI API key.

1. Copy `.env.example` to `.env`.
2. Add the key locally:

   ```text
   OPENAI_API_KEY=your-private-key-here
   ```

3. Restart the backend or Docker stack:

   ```powershell
   docker compose up --build
   ```

Expected behavior:

- If the key exists, backend startup logs say AI chat and embeddings are enabled.
- If the key is missing, backend startup logs a clear warning.
- Public customers never see technical API-key setup messages.

## GitHub Actions CI

The CI workflow runs on Pull Requests and protected branch pushes.

Checks:

- `frontend`: `pnpm install --frozen-lockfile`, `pnpm test`, `pnpm build`
- `backend`: Python 3.12 dependency install, `python -m pytest`

Pull Requests should not be merged unless CI passes.

## Common Errors

### `pnpm.ps1 cannot be loaded`

PowerShell execution policy can block the pnpm script shim. Use:

```powershell
pnpm.cmd build
pnpm.cmd test
```

### Docker frontend installs with npm

The frontend Dockerfile must use pnpm and `pnpm-lock.yaml`. If Docker output shows `npm install`, rebuild from the latest branch.

### Public AI chat is unavailable

Check:

- `.env` contains `OPENAI_API_KEY`
- The backend or Docker stack was restarted
- The key was not committed to Git

### Production startup fails on environment validation

When `APP_ENV=production`, RestaurantAI rejects unsafe defaults such as demo JWT secrets, demo passwords, unsupported storage providers, or insecure cookie settings. Replace the values in the deployment environment, not in source code.

### Backend tests fail on local Python

Use Python 3.12 or Docker. Very new Python versions may not have compatible wheels for all pinned dependencies.

### Docker database state is stale

For a clean local reset:

```powershell
docker compose down -v
docker compose up --build
```

This deletes local database and upload volumes.
