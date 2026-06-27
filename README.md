# RestaurantAI Platform

RestaurantAI is a multi-restaurant platform that combines professional restaurant websites, online ordering, reservations, delivery management, and a restaurant-specific AI Maître d'.

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
- OpenAI-powered AI Maître d' using restaurant-scoped pgvector retrieval
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

## How to start RestaurantAI demo

This is the simplest way to start the demo on a computer with Docker Desktop installed.

Requirements:

- Git
- Docker Desktop with the Docker engine running

1. Open the project folder:

```powershell
cd restaurant-ai-platform
```

The Docker setup includes local demo values for the database and demo users. You do not need to create a `.env` file just to run the demo.

Optional: if you want to edit the demo values, copy `.env.example` to `.env`:

```powershell
Copy-Item .env.example .env
```

2. Start RestaurantAI:

```powershell
docker compose up --build
```

3. Open these URLs:

- Customer site: http://localhost:3000/restaurants/bella-napoli
- Admin dashboard: http://localhost:3000/admin/login
- API docs: http://localhost:8000/docs

4. Demo login accounts:

| Role | Email | Password |
| --- | --- | --- |
| Super admin | `admin@restaurantai.com` | `admin12345` |
| Restaurant owner | `owner@restaurantai.com` | `owner12345` |

These are demo-only credentials. Change them before using the project outside local development.

## Quick start with Docker

If you cloned the repository for the first time:

```powershell
git clone https://github.com/tayariAyoub/restaurant-ai-platform.git
cd restaurant-ai-platform
Copy-Item .env.example .env
docker compose up --build
```

## How to demo RestaurantAI

Use this flow when showing the product to a restaurant owner.

1. Open the live restaurant website:
   http://localhost:3000/restaurants/bella-napoli

2. Show the first impression:
   - branded hero section
   - menu and online ordering
   - photo gallery
   - opening hours and reservation form
   - AI Maître d' in the bottom-right corner

3. Ask the AI Maître d' customer-style questions:
   - "What should I order?"
   - "Which dishes are vegetarian?"
   - "Do any dishes contain nuts or gluten?"
   - "When are you open?"
   - "How can I reserve a table?"

4. Place a demo order:
   - add menu items to the cart
   - choose pickup, dine-in, or delivery
   - submit the order

5. Open the admin dashboard:
   http://localhost:3000/admin/login

6. Show the restaurant owner workflow:
   - Dashboard: daily orders, reservations, AI Maître d' gaps, setup progress
   - Information: edit restaurant details and opening hours
   - Design: change template, colors, font, and preview the site
   - Menu: add categories, dishes, prices, allergens, and availability
   - Images: upload hero image, logo, food photos, and gallery photos
   - AI Maître d': upload knowledge, review what the AI knows, see missing information, test common questions
   - Orders: use the live operations board and tablet-friendly kitchen mode
   - Reservations: confirm, decline, complete, or reopen booking requests

7. Close with the business value:
   RestaurantAI gives a restaurant a professional website, online ordering, daily operations tools, and a restaurant-trained AI Maître d' from one dashboard.

## How to test the demo

Test as a customer:

1. Open http://localhost:3000/restaurants/bella-napoli
2. Browse the menu.
3. Ask the AI Maître d' a question.
4. Add items to the cart.
5. Submit a pickup, dine-in, or delivery order.
6. Send a reservation request.

Test as a restaurant owner:

1. Open http://localhost:3000/admin/login
2. Sign in with `owner@restaurantai.com` / `owner12345`.
3. Open the assigned restaurant.
4. Edit information, hours, design, menu, images, AI Maître d' knowledge, orders, and reservations.
5. Open Kitchen Mode from the Orders page to update order status.

Test as a super admin:

1. Open http://localhost:3000/admin/login
2. Sign in with `admin@restaurantai.com` / `admin12345`.
3. View all restaurants.
4. Create a new restaurant.
5. Create owner users.
6. Manage any restaurant account.

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
| `APP_ENV` | Runtime environment; set to `production` for stricter startup validation |
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
| `NEXT_PUBLIC_SITE_URL` | Public frontend URL used for canonical SEO metadata |
| `BACKEND_INTERNAL_URL` | Backend URL used by the Next.js proxy |
| `STORAGE_PROVIDER` | Upload storage backend; use `local` for development |
| `RATE_LIMIT_CHAT_PER_MINUTE` | Public chat messages allowed per minute per IP; defaults to `10` for demos |
| `RATE_LIMIT_RESERVATIONS_PER_MINUTE` | Public reservation requests allowed per minute per IP |
| `RATE_LIMIT_ORDERS_PER_MINUTE` | Public order submissions allowed per minute per IP |
| `RATE_LIMIT_PUBLIC_PER_MINUTE` | General public API requests allowed per minute per IP |
| `TRUST_PROXY_HEADERS` | Set to `true` only behind a trusted reverse proxy that controls forwarded IP headers |
| `AUTH_COOKIE_ENABLED` | Enables additive HttpOnly cookie auth support while Bearer auth remains supported |
| `AUTH_COOKIE_SECURE` | Set to `true` in production when cookie auth is enabled |
| `AUTH_COOKIE_SAMESITE` | Cookie SameSite mode |
| `AUTH_COOKIE_MAX_AGE_SECONDS` | Cookie lifetime in seconds |

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
pnpm.cmd install
$env:BACKEND_INTERNAL_URL="http://localhost:8000"
pnpm.cmd dev
```

## Tests and checks

The backend is developed and tested with Python 3.12, matching `backend/Dockerfile`.

Recommended backend test flow:

```powershell
cd backend
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m pytest
```

If you are running the Docker demo:

```powershell
docker compose exec backend pytest
docker compose exec frontend pnpm build
```

Useful quick checks:

```powershell
cd backend
python -m py_compile app\api\admin.py app\api\public.py app\services\chat.py app\services\knowledge.py

cd ..\frontend
pnpm.cmd build
```

Note: Python 3.14 is newer than the backend target and may not have compatible wheels for all pinned dependencies yet. Use Python 3.12 or Docker for backend tests.

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

Read [CONTRIBUTING.md](CONTRIBUTING.md) before making changes. Work in short feature branches and merge reviewed pull requests into `ai-production-saas-upgrade`.

For setup, Docker, environment validation, OpenAI configuration, CI, and common production errors, read [docs/PRODUCTION_READINESS.md](docs/PRODUCTION_READINESS.md).

## License

Private and proprietary. Do not redistribute without the repository owner's permission.
