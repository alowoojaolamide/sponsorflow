# SponsorFlow

A personal AI-powered UK job acquisition engine: import a list of UK tech
sponsors, generate personalized outreach emails with OpenAI using your real
background, review and approve every email before it sends, and track
replies and pipeline in one dashboard.

Full product spec: [`SPONSORFLOW-DESIGN.md`](SPONSORFLOW-DESIGN.md).
Build plan this repo follows: [`PROMPT-PACK-SPONSORFLOW-PHASE-1.md`](PROMPT-PACK-SPONSORFLOW-PHASE-1.md).

## Status

All 12 phases of the prompt pack are implemented:

| Area | Status |
|---|---|
| Database schema, RLS, migrations | ✅ Live on Supabase |
| Next.js scaffold | ✅ |
| Email/password auth + sessions | ✅ Live-tested |
| Google sign-in | ✅ Code complete — needs a Google Cloud OAuth client |
| 10-step onboarding + DOCX template | ✅ |
| CSV import + dedup | ✅ |
| AI email generation (OpenAI) | ✅ Code complete — needs `OPENAI_API_KEY` |
| Email approval workflow | ✅ |
| Gmail connection | ✅ Code complete — needs a Google Cloud OAuth client |
| Send + rate limiting | ✅ |
| Reply monitoring (Gmail Pub/Sub) | ✅ Code complete — needs a GCP Pub/Sub topic |
| Dashboard & analytics | ✅ |

"Code complete — needs X" means the feature is fully built and fails with a
clear error message rather than crashing until that credential is added to
`.env.local` (or the hosting provider's environment variables).

## Tech stack

Next.js 14 (App Router) + TypeScript + Tailwind · Supabase (Postgres, Auth,
RLS) · OpenAI API · Gmail API.

## Running locally

```bash
npm install
cp .env.example .env.local   # fill in real values, see below
npm run dev
```

Visit `http://localhost:3000`.

### Environment variables

See [`.env.example`](.env.example) for the full list. At minimum, to run
against the shared Supabase project you'll need:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (only required for the Gmail reply webhook)

Ask a teammate for these rather than creating a second Supabase project —
migrations and RLS policies are already deployed to the shared one.

The rest (`GOOGLE_CLIENT_ID`/`SECRET`, `OPENAI_API_KEY`,
`GMAIL_PUBSUB_TOPIC`, `GMAIL_WEBHOOK_SECRET`) are optional for local
development; those features degrade gracefully with a clear "not
configured" message when left as placeholders.

### Database migrations

Schema lives in `supabase/migrations/`. To apply them to a Supabase project:

```bash
npx supabase db push --db-url "<connection-string>"
```

Or paste the migration SQL directly into the Supabase dashboard's SQL Editor.

### Verifying the schema

```bash
npm run verify-schema
```

Checks all expected tables are reachable via the configured Supabase
project.

## Deployment

Deployed on Vercel — zero-config for Next.js. Push to `main` to redeploy.
Environment variables are managed in the Vercel project settings, not
committed to the repo.
