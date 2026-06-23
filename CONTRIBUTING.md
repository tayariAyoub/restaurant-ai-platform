# Contributing to RestaurantAI

## First setup

```powershell
git clone https://github.com/tayariAyoub/restaurant-ai-platform.git
cd restaurant-ai-platform
Copy-Item .env.example .env
docker compose up --build -d
```

Ask the repository owner for development credentials through a private channel. Never send secrets through Git commits, pull requests, or issue comments.

## Branch workflow

Update your local main branch:

```powershell
git switch main
git pull origin main
```

Create a focused branch:

```powershell
git switch -c feature/waiter-dashboard
```

Use branch names such as:

- `feature/online-payments`
- `fix/order-status-transition`
- `docs/deployment-guide`
- `refactor/tenant-access`

Commit and push:

```powershell
git status
git add .
git commit -m "Add waiter table management"
git push -u origin feature/waiter-dashboard
```

Open a pull request on GitHub. Explain what changed, how it was tested, and whether environment variables or database changes are required.

## Before requesting review

```powershell
docker compose exec backend pytest
docker compose exec frontend npm run build
```

Also verify:

- One restaurant cannot read or modify another restaurant's data.
- Prices and permissions are validated by the backend.
- `.env`, API keys, passwords, uploads, and generated files are not staged.
- Existing public website, admin, ordering, reservation, and chatbot flows still work.

## Collaboration rules

- Keep pull requests small enough to review.
- Do not commit directly to `main` after collaboration begins.
- Do not rewrite or force-push another developer's branch.
- Document new environment variables in `.env.example` and `README.md`.
- Add a database migration whenever a persistent model changes.
- Prefer clear code over clever abstractions.
