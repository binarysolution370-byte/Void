# Deployment Guide (Supabase + Vercel)

## 1. Supabase setup

1. Create a new Supabase project.
2. Open SQL Editor.
3. Run `supabase/init.sql`.
4. In Project Settings -> API, copy:
   - `Project URL`
   - `anon public key`
   - `service_role key`

## 2. Local environment

1. Duplicate `.env.example` to `.env.local`.
2. Fill:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ANALYTICS_DASHBOARD_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (future client-side Stripe Elements)
3. Optional Upstash:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

## 3. Local validation

```bash
npm install
npm test
npm run dev
```

Open `http://localhost:3000`.

## 4. Vercel deployment

1. Push repository to GitHub.
2. Import repo in Vercel.
3. Framework preset: `Next.js`.
4. Add environment variables in Vercel Project Settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - optional Upstash vars
5. Deploy.
6. In Stripe dashboard, configure webhook URL:
   - `https://YOUR_DOMAIN/api/payments/webhook`
   - Events: `payment_intent.succeeded`

## 5. Post-deploy checks

1. Run smoke script:

```bash
BASE_URL=https://your-app.vercel.app npm run smoke
```

2. Reply + release actions from UI should work.
3. Verify Vercel logs for runtime errors.

## 6. Manual moderation starter

1. In Supabase SQL Editor, run manual review query:

```sql
select id, content, created_at
from secrets
order by created_at desc
limit 200;
```

2. Delete illegal content directly:

```sql
delete from secrets where id = 'UUID_HERE';
```

3. Maintain a blocked words list via `VOID_BLOCKED_WORDS`.

## 7. Backup plan (weekly)

Minimum free workflow:
1. In Supabase dashboard, export database backup weekly.
2. Store encrypted backup file in cloud storage.
3. Keep at least 4 rolling weekly backups.

## 8. Cost checkpoints

Stay free while low traffic. Expect paid tiers when:
1. Supabase DB/storage exceeds free quota.
2. Vercel bandwidth/build minutes exceed hobby limits.
3. Upstash requests exceed free daily cap.

## 9. CI checks

GitHub Actions workflow: `.github/workflows/ci.yml`

- Trigger: push + pull request
- Steps: `npm ci` then `npm test`
