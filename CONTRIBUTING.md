# Contributing to RestaurantAI

RestaurantAI uses a simple protected-branch workflow.

## Main safe branch

`ai-production-saas-upgrade` is the protected working branch.

- Do not push directly to `ai-production-saas-upgrade`.
- Do not force-push protected branches.
- Do not delete protected branches.

## Developer workflow

Create a branch for each task:

```powershell
git switch ai-production-saas-upgrade
git pull origin ai-production-saas-upgrade
git switch -c feature/task-name
```

Work normally, then commit and push:

```powershell
git status
git add <files>
git commit -m "Describe the task"
git push -u origin feature/task-name
```

Open a Pull Request into `ai-production-saas-upgrade`.

## Before merge

Every Pull Request must have:

- A short explanation of the change.
- Frontend build passing.
- Backend tests passing.
- Screenshots only if UI changed.

Validation commands:

```powershell
cd frontend
pnpm.cmd install
pnpm.cmd test
pnpm.cmd build

cd ../backend
python -m pytest
```

## Review

- The repository owner reviews manually.
- Codex reviews technically.
- Merge only after both reviews and passing checks.

## Security

- Never share `.env`.
- Never share API keys.
- Never commit secrets.
- Collaborators should create their own local `.env` from `.env.example`.

See [docs/GITHUB_WORKFLOW.md](docs/GITHUB_WORKFLOW.md) for GitHub branch protection and backup instructions.
