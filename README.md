# Marea

**Marea — Where ideas become worlds.**

**Marea — Nơi ý tưởng trở thành thế giới.**

Marea is a Vietnamese–English creative network for writers, worldbuilders, artists, game designers and learners. This repository contains the production-oriented React application backed by Supabase and designed for Vercel.

The application contains no seeded users, posts, projects, courses or platform statistics. A new database starts empty.

## Stack

- Vite + React
- React Router
- Supabase Auth, Postgres and Storage
- Row Level Security (RLS) and database-checked Admin RPCs
- Vercel SPA hosting

## 1. Create and configure Supabase

1. Create a Supabase project.
2. Open **SQL Editor** and run [`supabase/migrations/202609220001_initial_marea.sql`](supabase/migrations/202609220001_initial_marea.sql). Alternatively, link the Supabase CLI and run `supabase db push`.
3. In **Authentication → URL Configuration**, set:
   - Site URL: your production Vercel URL, for example `https://marea.example`.
   - Redirect URLs: `http://localhost:5173/**`, your Vercel preview pattern, and your production URL with `/**`.
4. Keep email/password enabled. Configure SMTP before production email verification and password recovery.
5. Google and Apple buttons remain hidden unless their providers are configured in Supabase and the corresponding environment flags are enabled.

The migration creates these Storage buckets with file-size and MIME restrictions:

- `avatars`
- `covers`
- `world-media`
- `project-media`
- `course-media`
- `site-assets`

Storage policies require uploads to use the path `user_id/file`. `world-media` is private. Public profile and published-content assets use public buckets.

## 2. Environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in values from **Supabase → Project Settings → API**:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
VITE_ENABLE_GOOGLE_OAUTH=false
VITE_ENABLE_APPLE_OAUTH=false
```

Only use the browser-safe publishable/anon key. **Never expose the Supabase service-role key in Vite, GitHub, or the browser.** RLS is still required even with the publishable key.

## 3. First Owner account

1. Register normally through Marea and verify the email.
2. Complete onboarding once.
3. In the Supabase SQL Editor, run the following after replacing the email:

```sql
update public.profiles
set platform_role = 'owner'
where id = (select id from auth.users where email = 'owner@example.com');
```

Do this only once for the initial trusted Owner. Later role changes must go through Marea Admin and are written to `audit_logs`.

Owner/Admin accounts should enable MFA or passkeys in Supabase before production launch. Authentication assurance and short Admin sessions should also be enforced at the Supabase/Auth gateway level; hiding the Admin navigation is never treated as authorization.

## 4. Local development

```bash
npm install
npm run dev
```

Verification:

```bash
npm run lint
npm run build
npm run preview
```

Without the two required Supabase variables, Marea intentionally shows a configuration notice instead of fake content or a simulated login.

## 5. Deploy to Vercel

1. Import `labmourstudio/Marea` into Vercel.
2. Use the Vite preset. The standard build command is `npm run build` and output directory is `dist`.
3. Add the four `VITE_*` variables above under **Project Settings → Environment Variables** for Production and Preview.
4. Deploy, then add the final Vercel URL to Supabase Auth redirect URLs.
5. Redeploy after changing any `VITE_*` variable because Vite embeds browser-safe values at build time.

`vercel.json` provides the SPA fallback, so routes such as `/studio`, `/admin`, and `/reset-password` work after a direct reload.

## Product areas

- `/feed`, `/friends`, `/worlds`, `/projects`, `/learn`, `/profile`
- `/studio`: private creator workspace for worlds, characters, projects, post drafts and course drafts
- `/admin`: separate platform workspace for authorized Owner/Admin/Moderator roles
- `/admin/settings/appearance`: safe brand settings, logo and favicon upload; no arbitrary CSS, JavaScript or HTML

## Security model

- Private content is excluded from public Feed, Projects, Learn and search queries.
- Every application table has RLS enabled.
- Creator mutations check row ownership or explicit membership in Postgres.
- Admin role/status/course-review/appearance mutations use `SECURITY DEFINER` RPCs that re-check the caller's role and write audit logs.
- Unauthorized Admin database access is denied even if a caller manually invokes the API. The application displays an HTTP 403-style screen for unauthorized routes.
- Image uploads validate type and size in both the client and Storage bucket configuration.
- User-authored content is stored as plain data and React escapes it; arbitrary user HTML/CSS/JavaScript is not accepted.

Review [`docs/SECURITY_AND_BACKEND.md`](docs/SECURITY_AND_BACKEND.md) before production launch for operational controls that remain the responsibility of the Supabase and Vercel accounts.
