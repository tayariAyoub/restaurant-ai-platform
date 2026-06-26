# RestaurantAI Codex Handover Report

Generated: 2026-06-26
Scope: safe baseline audit only. No application behavior was changed.

## Public Restaurant Website Luxury Redesign

Files changed:

- `frontend/app/globals.css`
- `frontend/app/page.tsx`
- `frontend/components/ChatWidget.tsx`
- `frontend/components/RestaurantSite.tsx`
- `CODEX_HANDOVER_REPORT.md`

Implementation summary:

- Redesigned the public homepage as a cinematic restaurant entry experience using existing restaurant data and imagery.
- Upgraded `/restaurants/[slug]` hero treatment with stronger identity, refined CTAs, luxury trust signals, and richer visual framing.
- Improved menu presentation with editorial section headings, premium cards, richer price hierarchy, pairing notes, dietary/allergen tags, and sold-out state treatment.
- Refined gallery, visit, reservation, and floating cart styling for a more high-end hospitality feel.
- Reworked chatbot presentation into a more premium AI Maitre d' / concierge layer.
- Added reusable luxury CSS helpers for shadows, dividers, button motion, shell background, and menu card surfaces.
- Did not change backend schema, auth, payments, admin dashboard logic, or API contracts.

Visual validation:

- Verified the fresh built frontend on `http://localhost:3001`.
- Desktop homepage rendered the new premium content with no horizontal overflow.
- Desktop restaurant page rendered the upgraded hero, story, menu, gallery, contact, cart, and AI concierge surfaces with no horizontal overflow.
- Mobile restaurant viewport `390x844` rendered the cinematic hero cleanly with readable headline, clear CTAs, visible trust signals, and no horizontal overflow.
- Mobile menu check found no horizontal overflow and confirmed menu cards rendered.

Validation:

```powershell
cd frontend
pnpm build
```

Result: passed. Next.js compiled successfully and TypeScript passed.

```powershell
cd backend
python -m pytest
```

Result: `19 passed, 59 warnings`.

## French Beginner Developer Guide

Files changed:

- `docs/GUIDE_DEVELOPPEUR_FR.md`
- `CODEX_HANDOVER_REPORT.md`

Implementation summary:

- Added a complete French beginner guide for new RestaurantAI collaborators.
- Covered installation, local setup, VS Code usage, project architecture, Docker/local run commands, branch workflow, testing, commits, pushes, Pull Requests, review flow, basic troubleshooting, security rules, daily workflow, and FAQ.
- Clarified that Ayoub reviews Pull Requests manually and Codex reviews them technically before merge.
- Did not modify application code.

## Simplified Collaboration Workflow

Goal:

- Let another developer work normally on feature branches.
- Keep `ai-production-saas-upgrade` protected as the safe working branch.
- Require the repository owner and Codex to validate work before it becomes official.

Files changed:

- `.github/ISSUE_TEMPLATE/bug_report.md`
- `.github/ISSUE_TEMPLATE/feature_task.md`
- `.github/pull_request_template.md`
- `.github/workflows/ci.yml`
- `CONTRIBUTING.md`
- `docs/GITHUB_WORKFLOW.md`
- `CODEX_HANDOVER_REPORT.md`

Git backup:

- Created backup tag: `backup-before-collaboration`
- Pushed backup tag to GitHub: `origin/backup-before-collaboration`
- Remote verification confirmed the tag exists on GitHub.

Simple workflow:

- `ai-production-saas-upgrade` is the protected working branch.
- No direct pushes to `ai-production-saas-upgrade`.
- Collaborator creates a branch named `feature/task-name`.
- Collaborator edits, commits, pushes, and opens a Pull Request into `ai-production-saas-upgrade`.
- Before merge, the Pull Request must have frontend build passing, backend tests passing, a short explanation, and screenshots only if UI changed.
- Repository owner reviews manually.
- Codex reviews technically.
- Merge only after owner review, Codex review, and passing checks.

GitHub Actions CI:

- Runs on Pull Requests.
- Frontend: `pnpm install`, then `pnpm build`.
- Backend: install Python requirements, then `python -m pytest`.

Manual branch protection still required in GitHub UI:

- Go to `Settings` -> `Branches` -> `Add branch protection rule`.
- Set branch pattern to `ai-production-saas-upgrade`.
- Require Pull Request before merge.
- Require status checks to pass.
- Block force pushes.
- Block branch deletion.

Security rules documented:

- Never share `.env`.
- Never share API keys.
- Collaborator uses `.env.example`.
- No secrets in commits.

Validation:

```powershell
cd frontend
pnpm install
pnpm build
```

Result: passed. Dependencies were already up to date and Next.js compiled successfully.

```powershell
cd backend
python -m pytest
```

Result: `19 passed, 59 warnings`.

## Phase 1.4 - Authentication Hardening Backend Support

Files changed:

- `.env.example`
- `docker-compose.yml`
- `backend/app/api/auth.py`
- `backend/app/core/config.py`
- `backend/app/dependencies.py`
- `backend/tests/test_auth_cookies.py`
- `CODEX_HANDOVER_REPORT.md`

Current authentication architecture:

- Login flow: `POST /api/auth/login` validates email/password against the `User` table and returns the existing `Token` response with `access_token` and `token_type`.
- Logout flow: frontend logout currently removes `restaurant_ai_token` from localStorage and redirects to `/admin/login`; backend now also has `POST /api/auth/logout` to clear the future auth cookie.
- JWT creation: `backend/app/core/security.py` signs JWTs with `sub` set to the user email and `exp` based on `ACCESS_TOKEN_MINUTES`.
- JWT validation: `backend/app/dependencies.py` decodes the JWT, loads the user by email, rejects missing/invalid tokens, and rejects disabled users.
- Frontend auth storage: `frontend/app/admin/login/page.tsx` stores the returned JWT in localStorage under `restaurant_ai_token`; `frontend/lib/auth.ts` reads and clears it.
- Refresh behavior: no refresh-token flow exists; users keep using the same access token until expiry or logout.
- Protected routes: admin API routes use `get_current_user` or `require_super_admin`; public restaurant routes remain unauthenticated.
- Admin dashboard auth: `frontend/components/admin/AdminShell.tsx` requires a localStorage token, calls `/auth/me`, and logs out on failure.
- API dependencies: `frontend/lib/api.ts` sends admin requests with `Authorization: Bearer <token>`.

Migration plan to HttpOnly cookie auth:

1. Backend compatibility phase:
   - Add optional HttpOnly auth cookie support while preserving Bearer JWTs.
   - Keep frontend localStorage behavior unchanged.
   - Validate cookie auth and logout server-side.
2. Dual-read frontend phase:
   - Update frontend requests to include credentials where needed.
   - Keep localStorage token fallback during rollout.
   - Add clear error handling for expired cookie sessions.
3. Cookie-primary phase:
   - Stop writing new tokens to localStorage.
   - Use `/auth/me` with cookie credentials as the admin session source.
   - Keep Bearer support temporarily for rollback and API clients.
4. Cleanup phase:
   - Remove localStorage token dependency from admin UI.
   - Decide whether Bearer auth remains for external integrations.
   - Add CSRF protection if cookie auth is used cross-site or with unsafe methods.

Advantages:

- HttpOnly cookies reduce token exposure from browser JavaScript.
- Server-controlled cookie clearing gives a cleaner logout path.
- The phased rollout avoids breaking existing admin login and API calls.

Risks:

- Cookie auth can introduce CSRF risk if credentials are sent automatically without CSRF controls.
- SameSite and Secure settings must match the deployment topology.
- Cross-origin admin deployments may need CORS credentials configuration in a later phase.

Compatibility:

- Existing Bearer JWT auth still works.
- Existing login response is unchanged.
- Frontend localStorage usage was not modified.
- Cookie setting is disabled by default with `AUTH_COOKIE_ENABLED=false`.

Rollback strategy:

- Leave `AUTH_COOKIE_ENABLED=false` to keep the current Bearer-only behavior.
- If cookie migration causes issues later, disable cookie issuance and keep using Bearer tokens.
- The new logout endpoint only clears the auth cookie and does not invalidate Bearer tokens.

Backend support implemented:

- `POST /api/auth/login` can optionally set an HttpOnly cookie when `AUTH_COOKIE_ENABLED=true`.
- Cookie name, Secure flag, SameSite value, and max age are configurable.
- `get_current_user` continues to prefer Bearer JWTs and falls back to the auth cookie only when cookie auth is enabled.
- `POST /api/auth/logout` clears the configured auth cookie.

Environment variables added:

- `AUTH_COOKIE_ENABLED=false`
- `AUTH_COOKIE_NAME=restaurant_ai_access_token`
- `AUTH_COOKIE_SECURE=false`
- `AUTH_COOKIE_SAMESITE=lax`
- `AUTH_COOKIE_MAX_AGE_SECONDS=43200`

Validation:

```powershell
cd backend
python -m pytest
```

Result: `19 passed, 59 warnings`.

Verification:

- Bearer auth still works for `/auth/me`.
- Cookie auth works when `AUTH_COOKIE_ENABLED=true`.
- Logout clears the configured auth cookie.
- Existing frontend remains compatible because the login response is unchanged and cookie setting is disabled by default.
- Bearer auth takes priority over an invalid auth cookie.

Final review before commit:

- `AUTH_COOKIE_ENABLED` defaults to `false` in backend settings, `.env.example`, and Docker Compose.
- Existing Bearer token auth still works through the same `Authorization: Bearer <token>` flow.
- Cookie auth is additive only and is read only when cookie auth is explicitly enabled.
- The Secure cookie flag can be enabled for production with `AUTH_COOKIE_SECURE=true`.
- SameSite is configurable with `AUTH_COOKIE_SAMESITE`.
- Logout clears the auth cookie using the configured cookie name, path, Secure flag, HttpOnly flag, and SameSite value.
- Tests cover token-only login, Bearer `/auth/me`, enabled cookie `/auth/me`, cookie logout clearing, and Bearer precedence over an invalid cookie.
- No frontend files changed.
- localStorage token storage and removal remain in place.

Final review validation:

```powershell
cd backend
python -m pytest
```

Result: `19 passed, 59 warnings`.

Next migration phase:

- Update frontend requests to support cookie credentials while keeping Bearer fallback.
- Add CSRF strategy before making cookie auth the primary browser authentication mechanism.
- Do not remove localStorage token behavior until the dual-read phase has been validated.

## Phase 1.3 - Backend Rate Limiting

Files changed:

- `.env.example`
- `docker-compose.yml`
- `backend/app/api/public.py`
- `backend/app/core/config.py`
- `backend/app/core/rate_limit.py`
- `backend/tests/test_rate_limit.py`
- `CODEX_HANDOVER_REPORT.md`

Implementation summary:

- Added IP-based rate limiting for public endpoints only.
- Added configurable demo-friendly per-minute limits.
- Added friendly HTTP 429 JSON responses with `Retry-After` headers.
- Added warning logs when a rate limit is exceeded.
- Added optional trusted proxy header support through explicit env configuration.
- Left frontend, auth, admin APIs, database schema, and API response contracts unchanged.

Protected endpoints:

- Chat: `POST /api/restaurants/{slug}/chat`, `POST /api/chat`.
- Reservations: `POST /api/restaurants/{slug}/reservations`, `POST /api/contact`.
- Orders: `POST /api/restaurants/{slug}/orders`.
- General public API: `GET /api/restaurant`, `GET /api/restaurants/{slug}`, `GET /api/restaurants/{slug}/orders/{public_id}`.

Environment variables added:

- `RATE_LIMIT_CHAT_PER_MINUTE=10`
- `RATE_LIMIT_RESERVATIONS_PER_MINUTE=5`
- `RATE_LIMIT_ORDERS_PER_MINUTE=10`
- `RATE_LIMIT_PUBLIC_PER_MINUTE=100`
- `TRUST_PROXY_HEADERS=false`

Validation:

```powershell
cd backend
python -m pytest
```

Result: `14 passed, 41 warnings`.

Manual verification:

- Normal chat, order, and reservation requests returned successful JSON.
- Repeated reservation spam returned HTTP 429.
- 429 body was friendly JSON:
  - `Too many requests. Please wait a moment and try again.`
  - `retry_after_seconds`
- `Retry-After` header was present.
- A rate-limit warning log was emitted.

Review verification:

- Rate-limit buckets are keyed by both category rule name and client IP, so limits are per endpoint category and per IP, not global for all users.
- Chat, reservation, order, and general public endpoints use separate rule names: `public_chat`, `public_reservations`, `public_orders`, and `public_general`.
- With `TRUST_PROXY_HEADERS=false`, spoofable `X-Forwarded-For` and `X-Real-IP` headers are ignored and the direct client host is used.
- Trusted proxy headers remain disabled by default in application settings, `.env.example`, and Docker defaults.
- Test isolation is protected by resetting the in-memory limiter with an autouse pytest fixture.
- HTTP 429 responses include a friendly JSON body and a `Retry-After` header.
- Normal requests are allowed up to the configured limit; verification confirmed one exhausted category does not block another category.
- Docker env values are optional because `docker-compose.yml` provides demo-friendly defaults with `${VAR:-default}`.

Review validation:

```powershell
cd backend
python -m pytest
```

Result: `14 passed, 41 warnings`.

## Public Order Endpoint Repair

Files changed:

- `backend/app/api/public.py`
- `backend/tests/test_tenant_safety.py`
- `CODEX_HANDOVER_REPORT.md`

Root cause:

- `create_order()` started correctly but stopped after loading menu items.
- The order creation, item creation, delivery address creation, commit, and response reload logic had been placed after `return order` inside `order_tracking()`.
- Execution therefore stopped at the end of `create_order()` without returning an order, while the remaining implementation was unreachable after the tracking endpoint's unconditional return.
- This was a return/logic placement issue, not a routing, dependency, authentication, or schema issue.

Repair summary:

- Moved the existing order creation implementation back into `create_order()`.
- Left `order_tracking()` as a pure lookup endpoint.
- Preserved the existing API route, request schema, response model, validation rules, public authentication behavior, order total calculation, delivery fee behavior, status history creation, and delivery address handling.
- Added focused backend regression coverage for public order creation.

Validation:

```powershell
cd backend
python -m pytest
```

Result: `9 passed, 37 warnings`.

Manual verification:

- Direct in-memory endpoint verification created a pickup order, stored it, returned a public id, total `37.50`, one order item, and `NEW` status history.
- Frontend manual verification used the real repaired `public.create_order()` function through a temporary local HTTP shim.
- The customer flow loaded Bella Napoli, added Margherita, submitted an order, displayed the order success state, and the backend shim database showed `{"orders": 1}`.

## Phase 1.1 - Dynamic Restaurant SEO

Files changed:

- `.env.example`
- `docker-compose.yml`
- `frontend/app/restaurants/[slug]/page.tsx`
- `frontend/app/restaurants/[slug]/RestaurantWebsiteClient.tsx`
- `frontend/Dockerfile`
- `frontend/components/RestaurantSite.tsx`
- `CODEX_HANDOVER_REPORT.md`

Implementation summary:

- Added route-level dynamic metadata for public restaurant pages only.
- Kept global/admin metadata under the existing RestaurantAI branding.
- Moved the existing client-side restaurant page loading into a colocated client component so the route file can export `generateMetadata`.
- Added safe fallback metadata for missing or unfetchable restaurants.
- Added Restaurant JSON-LD schema using only existing restaurant fields.
- Added `NEXT_PUBLIC_SITE_URL` as the public frontend URL used for production canonical and Open Graph URLs.
- Removed backend/CORS-oriented `FRONTEND_URL` from SEO URL generation so production metadata does not accidentally emit localhost canonicals.

SEO improvements:

- Dynamic title and description based on restaurant name, city, description, theme/category context, and safe fallbacks.
- Dynamic keywords for restaurant name, city, theme/category context, menu, reservations, ordering, and AI maitre d'.
- Canonical URL for `/restaurants/[slug]`.
- Open Graph title, description, URL, site name, and image.
- Canonical and Open Graph URLs use `NEXT_PUBLIC_SITE_URL` when configured; `http://localhost:3000` is only used as a development fallback.
- Twitter summary/large-image card metadata.
- Robots metadata: published restaurants can be indexed; missing/unavailable restaurant metadata uses `noindex, nofollow`.
- Restaurant schema includes name, description, URL, image, logo, phone, email, address, social links, opening hours text, menu anchor, and reservation support when present.

Validation:

```powershell
cd frontend
pnpm build
```

Result: passed. Next.js compiled successfully, TypeScript passed, and `/restaurants/[slug]` remains a dynamic route.

## Phase 1.2 - Cart Persistence

Files changed:

- `frontend/components/RestaurantSite.tsx`
- `frontend/lib/cartStorage.ts`
- `CODEX_HANDOVER_REPORT.md`

Implementation summary:

- Added reusable cart localStorage helpers.
- Persisted cart data per restaurant using a versioned key.
- Restored cart state after client hydration only, avoiding server/client markup mismatch.
- Stored only menu item IDs and quantities, then rebuilt cart lines from current restaurant menu data.
- Handled corrupted JSON safely by clearing the broken storage entry.
- Ignored old storage versions through the versioned key and payload version.
- Cleared both React cart state and the persisted cart after a successful order.
- Kept backend, routing, auth, tests, and visible UI behavior unchanged.

Storage key format:

```text
restaurantai.cart.{restaurant-slug-or-id}.v1
```

Example:

```text
restaurantai.cart.bella-napoli.v1
```

Validation:

```powershell
cd frontend
pnpm build
```

Result: passed. Next.js compiled successfully and TypeScript passed.

Manual validation:

- Opened Bella Napoli with a temporary local mock API.
- Added 3 menu items.
- Refreshed the restaurant page.
- Cart restored with the 3 selected items.
- Submitted an order against the temporary mock API.
- Cart became empty.
- Refreshed again.
- Cart stayed empty.

Review verification:

- Cart persistence is wired into the existing `submitOrder()` flow used by the public restaurant page.
- The cart is cleared only after `request<RestaurantOrder>(...)` returns a successful order response.
- If order submission fails and the request throws, the catch branch leaves both React cart state and persisted localStorage cart untouched.
- Corrupted localStorage JSON is caught safely and the invalid storage entry is removed.
- Hydration mismatch is avoided because localStorage is read only inside `useEffect`; the initial render keeps the cart empty until client hydration completes.
- The real backend success path cannot be end-to-end verified yet because the known `backend/app/api/public.py` public order creation issue remains intentionally out of scope for Task 1.2.

## Current Architecture Summary

RestaurantAI is a two-service SaaS-style application with a Next.js frontend, a FastAPI backend, PostgreSQL/pgvector persistence, and Docker Compose for local full-stack execution.

### Frontend

- Location: `frontend/`
- Framework: Next.js 16 app router, React 19, TypeScript strict mode, Tailwind CSS.
- Primary app folders:
  - `frontend/app/` contains public routes, admin routes, and dynamic restaurant/order pages.
  - `frontend/components/` contains public restaurant UI, shell/header/footer/chat, and admin dashboards/editors.
  - `frontend/lib/` contains shared API, auth, and type helpers.
- API access:
  - `frontend/lib/api.ts` sends requests to same-origin `/api`.
  - `frontend/next.config.ts` rewrites `/api/:path*` and `/uploads/:path*` to `BACKEND_INTERNAL_URL`, defaulting to `http://localhost:8000`.
- Authentication storage:
  - Admin bearer token is stored in browser `localStorage` under `restaurant_ai_token`.

### Backend

- Location: `backend/`
- Framework: FastAPI with SQLAlchemy ORM.
- Entry point: `backend/app/main.py`.
- Main modules:
  - `app/api/auth.py`: login and current-user endpoint.
  - `app/api/admin.py`: authenticated admin, restaurant, menu, upload, reservation, order, driver, and dashboard endpoints.
  - `app/api/public.py`: public restaurant, reservation, chat, order, and order tracking endpoints.
  - `app/core/config.py`: Pydantic settings loaded from environment or `backend/.env`.
  - `app/core/database.py`: SQLAlchemy engine/session setup.
  - `app/core/security.py`: bcrypt password hashing and JWT creation/decoding.
  - `app/services/knowledge.py`: upload text extraction, chunking, embeddings, and structured knowledge rebuilding.
  - `app/services/chat.py`: restaurant-scoped RAG retrieval and OpenAI chat responses.
  - `app/services/seed.py`: demo themes, users, restaurant, menu, images, and knowledge seeding.
  - `app/services/migrations.py`: idempotent SQL bridge for MVP schema changes.

### Database

- Docker database image: `pgvector/pgvector:pg16`.
- ORM models: `backend/app/models.py`.
- Data model includes users, themes, restaurants, images, menu categories/items, knowledge documents/chunks, conversations/messages, contact requests, orders, order items, status history, delivery addresses, drivers, and delivery assignments.
- Vector search uses `pgvector.sqlalchemy.Vector(1536)` for knowledge embeddings.
- Startup behavior:
  - Creates `vector` extension.
  - Calls `Base.metadata.create_all`.
  - Runs an idempotent migration bridge.
  - Seeds demo data.
- Warning: there is no formal migration system such as Alembic yet.

### Docker

- Root: `docker-compose.yml`.
- Services:
  - `db`: PostgreSQL 16 with pgvector, persistent `postgres_data` volume.
  - `backend`: builds `backend/Dockerfile`, exposes `8000`, mounts `uploads` volume.
  - `frontend`: builds `frontend/Dockerfile`, exposes `3000`, uses Next standalone output.
- Backend Docker image targets Python 3.12.
- Frontend Docker image uses Node 22 Alpine.
- Warning: `frontend/Dockerfile` uses `npm install`/`npm run build`, while the repo has `pnpm-lock.yaml` and the requested local workflow uses `pnpm`.

### Authentication

- Login route: `POST /api/auth/login`.
- Current user route: `GET /api/auth/me`.
- Auth mechanism: JWT bearer token signed with `JWT_SECRET`.
- Role model:
  - `SUPER_ADMIN`
  - `RESTAURANT_OWNER`
- Admin authorization is enforced in backend dependencies and route helpers.
- Frontend persists tokens in `localStorage`.
- Production warning: localStorage bearer tokens are convenient for MVP work but weaker than hardened HTTP-only cookie/session flows.

### AI Integration

- OpenAI dependency: `openai==1.82.0`.
- Chat model setting: `OPENAI_CHAT_MODEL`, default `gpt-4.1-mini`.
- Embedding model setting: `OPENAI_EMBEDDING_MODEL`, default `text-embedding-3-small`.
- If `OPENAI_API_KEY` is missing:
  - Embedding creation returns `None` embeddings.
  - Chat endpoint returns a configured fallback telling the user AI is not configured.
  - Retrieval can fall back to token-overlap matching for local development.
- Knowledge sources:
  - Restaurant profile/opening hours/menu structured facts.
  - Uploaded PDF/TXT documents.

### Uploads

- Upload directory setting: `upload_dir`, default `uploads`.
- Static serving: backend mounts `/uploads`.
- Frontend proxy: `/uploads/:path*` rewrites to backend.
- Image uploads:
  - Endpoint family: `/api/admin/restaurants/{restaurant_id}/images`.
  - Accepted types: JPEG, PNG, WEBP, GIF.
  - Max size: 8 MB.
  - Stored under `uploads/{restaurant_id}/`.
- Knowledge document uploads:
  - Endpoint family: `/api/admin/restaurants/{restaurant_id}/documents`.
  - Accepted content by filename: PDF and TXT.
  - Max size: 10 MB.
  - Stored under `uploads/{restaurant_id}/documents/`.

### Routing

- Public frontend routes:
  - `/`
  - `/menu`
  - `/contact`
  - `/restaurants/[slug]`
  - `/restaurants/[slug]/orders/[publicId]`
- Admin frontend routes:
  - `/admin`
  - `/admin/login`
  - `/admin/dashboard`
  - `/admin/users`
  - `/admin/restaurants`
  - `/admin/restaurants/new`
  - `/admin/restaurants/[id]/edit`
  - `/admin/restaurants/[id]/design`
  - `/admin/restaurants/[id]/images`
  - `/admin/restaurants/[id]/menu`
  - `/admin/restaurants/[id]/chatbot`
  - `/admin/restaurants/[id]/customers`
  - `/admin/restaurants/[id]/orders`
  - `/admin/restaurants/[id]/reservations`
- Backend route prefixes:
  - Auth routes are included under `/api/auth`.
  - Admin routes are included under `/api/admin`.
  - Public routes are included under `/api`.

## Build Status

### Frontend

Commands run from `frontend/`:

```powershell
pnpm install
pnpm build
```

Result: passed.

Notes:

- `pnpm install` reported `Already up to date`.
- `pnpm build` completed successfully with Next.js 16.2.9.
- TypeScript completed successfully during `next build`.
- Static/dynamic route generation completed successfully.

### Backend

Dependency/test-environment work:

- Confirmed `pytest==8.3.5` is declared in `backend/requirements.txt`.
- Updated `psycopg[binary]` from `3.2.9` to `3.2.13` so `python -m pip install -r requirements.txt` can install on the local Python 3.14 runtime.
- Added `backend/tests/conftest.py` to provide test-only defaults for required settings before app modules import.

Command run from `backend/`:

```powershell
python -m pytest
```

Result: passed.

Local environment notes:

- Local `python --version` is Python 3.14.5.
- `py -0p` only listed Python 3.14 runtimes.
- Backend Dockerfile targets Python 3.12.
- Full backend requirements now install successfully in the active local Python environment after the patch-level `psycopg` bump.
- `python -m pytest` collected 8 tests and passed all 8.
- Warnings: 37 FastAPI/Python 3.14 deprecation warnings from `asyncio.iscoroutinefunction`.

Additional static check run from `backend/`:

```powershell
python -m compileall app tests
```

Result: passed. Python files compile syntactically.

## Test Status

- Backend tests exist:
  - `backend/tests/test_knowledge.py`
  - `backend/tests/test_tenant_safety.py`
- Backend tests pass locally: `8 passed, 37 warnings`.
- No frontend test suite is configured in `frontend/package.json`.

## Environment Variables

No local `.env` file was found at:

- project root `.env`
- `backend/.env`

The root `.env.example` documents the expected variables:

- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `DATABASE_URL`
- `JWT_SECRET`
- `OPENAI_API_KEY`
- `OPENAI_CHAT_MODEL`
- `OPENAI_EMBEDDING_MODEL`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `DEMO_OWNER_EMAIL`
- `DEMO_OWNER_PASSWORD`
- `FRONTEND_URL`
- `NEXT_PUBLIC_SITE_URL`
- `BACKEND_INTERNAL_URL`

Important distinction:

- Docker Compose provides local defaults for required backend variables.
- Running backend imports/tests directly outside Docker requires required settings such as `DATABASE_URL`, `JWT_SECRET`, `ADMIN_PASSWORD`, and `DEMO_OWNER_PASSWORD` to be available, unless a test harness overrides settings earlier.

## Immediate Warnings And Technical Debt

### High Priority

1. Public order creation appears broken in `backend/app/api/public.py`.
   - The `create_order` route begins at line 132 but does not finish creating or returning an order before the next route declaration.
   - The order creation logic appears after a `return` inside `order_tracking`, making it unreachable.
   - Frontend ordering calls `POST /restaurants/{slug}/orders`, so this is likely a user-facing runtime failure even though TypeScript build passes.

2. Formal database migrations are missing.
   - Startup currently mixes `Base.metadata.create_all` with an idempotent SQL bridge.
   - This is risky for production SaaS evolution.

### Medium Priority

1. Frontend package manager mismatch in Docker.
   - Local workflow and lockfile use pnpm.
   - `frontend/Dockerfile` uses npm and copies `package*.json`, ignoring `pnpm-lock.yaml`.

2. Authentication is MVP-grade.
   - Bearer tokens are stored in `localStorage`.
   - No refresh-token flow, password reset, rate limiting, audit logging, MFA, or session revocation was found.

3. Upload storage is local filesystem/volume based.
   - Suitable for local demo.
   - Production SaaS should use object storage, content scanning, stricter filename/content validation, and retention policies.

4. AI calls are synchronous from request handlers.
   - OpenAI chat/embedding calls happen in request flow.
   - Production should consider background jobs, timeouts, retries, observability, and cost controls.

5. Demo/default credentials exist in Docker Compose and README.
   - Acceptable for local demo.
   - Must not be used in any real deployment.

### Low Priority

1. No TODO/FIXME comments were found by `rg`.

2. Generated/cache folders exist locally:
   - `frontend/.next`
   - `frontend/node_modules`
   - backend `__pycache__` folders
   These appear to be ignored/generated workspace artifacts, not source folders.

3. Conventional duplicate basenames exist:
   - `Dockerfile` in frontend and backend.
   - `.dockerignore` in frontend and backend.
   - many `page.tsx` files due Next.js routing.
   These are expected, not necessarily a problem.

## Check Results

- Git status before report update: clean working tree on branch `ai-production-saas-upgrade`.
- Broken TypeScript imports: none found by `pnpm build`.
- TypeScript errors: none found by `pnpm build`.
- Python syntax errors: none found by `python -m compileall app tests`.
- Backend pytest: `8 passed, 37 warnings`.
- Python runtime test warnings: FastAPI emits Python 3.14 deprecation warnings for `asyncio.iscoroutinefunction`.
- TODO/FIXME comments: none found.
- Duplicate files: only conventional duplicate basenames were observed.
- Unused folders: no clearly unused source folders identified. Generated folders are present locally.

## Recommendations

1. First approval item: fix the broken public order creation route and add a regression test for `POST /api/restaurants/{slug}/orders`.

2. Standardize backend local testing:
   - Use Python 3.12, matching Docker.
   - Create a `.venv`.
   - Install `backend/requirements.txt`.
   - Run `python -m pytest`.

3. Add Alembic before further schema work.

4. Align frontend Docker build with pnpm and `pnpm-lock.yaml`.

5. Introduce production auth hardening before launch:
   - HTTP-only cookies or a stronger token strategy.
   - rate limiting.
   - password reset.
   - audit logs.
   - secret rotation path.

6. Move uploads to object storage before multi-tenant production use.

7. Add CI checks:
   - frontend `pnpm install --frozen-lockfile` and `pnpm build`.
   - backend Python 3.12 dependency install and `python -m pytest`.
   - optional Python lint/type checks once selected.

## Files Changed By This Baseline Pass

- `CODEX_HANDOVER_REPORT.md`
- `backend/requirements.txt`
- `backend/tests/conftest.py`

No application source behavior was changed.
