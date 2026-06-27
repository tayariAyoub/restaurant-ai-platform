# Simple GitHub Workflow

## Safe branch

`ai-production-saas-upgrade` is the protected working branch.

Nobody pushes directly to this branch.

## Developer workflow

1. Create a task branch:

   ```powershell
   git switch ai-production-saas-upgrade
   git pull origin ai-production-saas-upgrade
   git switch -c feature/task-name
   ```

2. Edit code normally.
3. Commit changes.
4. Push the branch.
5. Open a Pull Request into `ai-production-saas-upgrade`.

## Pull Request requirements

Before merge, the Pull Request must have:

- Short explanation of changes.
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

GitHub Actions runs the same frontend and backend checks automatically on Pull Requests.

## Review

- Repository owner reviews manually.
- Codex reviews technically.
- Merge only after both reviews and passing checks.

## Backup before collaboration

A backup tag was created and pushed:

```powershell
git tag backup-before-collaboration
git push origin backup-before-collaboration
```

To restore from the backup safely:

```powershell
git switch -c restore/backup-before-collaboration backup-before-collaboration
```

Open a Pull Request from the restore branch if protected branch recovery is needed.

## Protect `ai-production-saas-upgrade`

In GitHub:

1. Open the repository.
2. Go to `Settings`.
3. Go to `Branches`.
4. Click `Add branch protection rule`.
5. Set `Branch name pattern` to `ai-production-saas-upgrade`.
6. Enable `Require a pull request before merging`.
7. Enable `Require status checks to pass before merging`.
8. Select the frontend build and backend test CI checks.
9. Disable force pushes.
10. Disable branch deletion.
11. Save the rule.

## Security

- Never share `.env`.
- Never share API keys.
- Never commit secrets.
- Collaborators should use `.env.example` to create their own local `.env`.
