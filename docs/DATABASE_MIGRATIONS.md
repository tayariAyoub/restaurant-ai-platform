# Database Migrations

RestaurantAI now uses Alembic for real database schema migrations.

The old MVP startup bridge still exists for local/demo compatibility, but production must use Alembic explicitly.

## Important Rules

- Back up the database before every production migration.
- Never run schema changes directly in production SQL consoles unless there is an emergency plan.
- Review generated Alembic migrations before committing them.
- Do not run the initial migration on top of an existing database that already has the current tables.
- For existing MVP databases that already match the current models, use `alembic stamp head`.

## Local Setup

From the backend folder:

```powershell
cd backend
python -m pip install -r requirements.txt
```

Alembic reads `DATABASE_URL` from the environment or `.env`.

For a local PostgreSQL database:

```powershell
$env:DATABASE_URL="postgresql+psycopg://restaurant_ai:restaurant_ai_demo_password@localhost:5432/restaurant_ai"
alembic upgrade head
```

## Docker Setup

Start the database:

```powershell
docker compose up -d db
```

Run migrations from the backend container image:

```powershell
docker compose run --rm backend alembic upgrade head
```

Then start the full application:

```powershell
docker compose up --build
```

## Fresh Database

For a new empty database:

```powershell
cd backend
alembic upgrade head
```

This creates all current tables, indexes, foreign keys, and the pgvector extension for PostgreSQL.

## Existing MVP Database

If the database already exists and was created by the old `Base.metadata.create_all()` plus bridge flow:

1. Back up the database.
2. Confirm the app is running against the latest code and the current schema works.
3. Stamp the database as already matching the current baseline:

   ```powershell
   cd backend
   alembic stamp head
   ```

4. Future schema changes should use normal Alembic revisions.

Do not run `alembic upgrade head` against an existing database that already has these tables; the initial migration is for fresh databases.

## Creating a New Migration

After changing SQLAlchemy models:

```powershell
cd backend
alembic revision --autogenerate -m "describe schema change"
```

Before committing:

1. Read the generated file in `backend/alembic/versions/`.
2. Remove accidental destructive changes.
3. Make sure indexes, foreign keys, defaults, and nullable rules are intentional.
4. Test on a copy of real data when the change is risky.
5. Run:

   ```powershell
   python -m pytest
   ```

## Production Deploy Sequence

Recommended production sequence:

1. Back up the database.
2. Set:

   ```text
   APP_ENV=production
   AUTO_MIGRATE_ON_STARTUP=false
   ```

3. Deploy the backend image.
4. Run:

   ```powershell
   alembic upgrade head
   ```

5. Start or restart the backend application.
6. Check `/health` and application logs.

When `APP_ENV=production`, RestaurantAI does not run the old startup schema mutation path.

## Local Demo Compatibility

For local development and Docker demos, `AUTO_MIGRATE_ON_STARTUP=true` keeps the previous startup compatibility behavior:

- create missing tables
- run the old idempotent bridge

Demo content and local demo users are controlled separately with `SEED_DEMO_DATA=true`.

This is intentionally not the production path.

## Rollback

Prefer restoring from a verified database backup.

Alembic `downgrade` can be useful during development, but production downgrades must be reviewed carefully because data may be lost when columns or tables are removed.
