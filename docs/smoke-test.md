# Smoke Test (Production / Preview)

Run against your deployed Vercel URL.

## Command

```bash
BASE_URL=https://your-app.vercel.app npm run smoke
```

Windows (PowerShell):

```powershell
$env:BASE_URL="https://your-app.vercel.app"; npm run smoke
```

## What it checks

1. `POST /api/secrets` returns `201`
2. second `POST /api/secrets` returns `201`
3. `GET /api/secrets/random` returns a secret payload
4. `POST /api/secrets/:id/reply` returns `201`
5. `POST /api/secrets/:id/release` returns `200` + `{ ok: true }`
6. second `GET /api/secrets/random` has valid shape (`id` or `empty`)

## Notes

- The script creates data in production.
- Use only for post-deploy verification.
- If rate limit is hit, re-run later or adjust with a fresh session.
