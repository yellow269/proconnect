# ProConnect

A production-oriented marketplace connecting customers with local professionals. This first delivery includes the Next.js application foundation, responsive landing page, dark mode, Supabase authentication, route protection, and the complete initial PostgreSQL/RLS schema.

## Stack

- Next.js 15 App Router, React 19, TypeScript
- Tailwind CSS and React Server Components
- Supabase Auth, PostgreSQL, Storage, Realtime, and Row Level Security
- Vitest and Playwright
- Vercel deployment target

## Installation

Requirements: Node.js 20+, npm 10+, a Supabase project, and optionally the Supabase CLI for local development.

1. Install packages with `npm install`.
2. Copy `.env.example` to `.env.local` and enter the project URL and keys from Supabase project settings.
3. Apply `supabase/migrations/0001_initial_schema.sql` with `supabase db push`, or paste it into the Supabase SQL editor.
4. In Supabase Auth, enable Email and Google. Add `http://localhost:3000/auth/callback` and your production callback URL to allowed redirects.
5. Start the app with `npm run dev` and open `http://localhost:3000`.

Never expose `SUPABASE_SERVICE_ROLE_KEY` through a `NEXT_PUBLIC_` variable or browser code.

## Environment variables

See `.env.example`. The two public Supabase variables are required at build/runtime. Service-role, PayFast, and Resend secrets are server-only and become required as their modules are enabled.

## Database and security

The initial migration creates marketplace entities, geospatial indexes, rating aggregation, automatic user profiles, storage buckets, and RLS for all public tables. Admin access is checked server-side through `public.is_admin()`. Promote the first admin only from a trusted SQL session:

```sql
update public.profiles set role = 'admin' where id = '<auth-user-uuid>';
```

## Quality checks

```bash
npm run typecheck
npm test
npm run build
```

## Deploy to Vercel

1. Import the repository into Vercel.
2. Add all production environment variables in Project Settings.
3. Set `NEXT_PUBLIC_APP_URL` to the canonical HTTPS domain.
4. Add `https://your-domain.com/auth/callback` and `https://your-domain.com/reset-password` to Supabase Auth redirect URLs.
5. Apply migrations to the production Supabase project before deploying the app.
6. Deploy. Vercel detects Next.js automatically.

## Current delivery boundary

Completed: project structure/configuration, core database and RLS, auth flows, protected dashboard entry, landing page, metadata, sitemap, robots, health endpoint, and initial validation tests. The role dashboards, jobs, quotes, search, reviews, notifications, PayFast billing, administration, and their end-to-end tests are subsequent folders/modules.
