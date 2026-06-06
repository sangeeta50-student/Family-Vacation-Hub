# Family Travel Hub

A shared family trip planner built with React, Vite, GitHub Pages, and Supabase Auth.

## Local Setup

1. Create a free Supabase project.
2. In Supabase SQL Editor, run `supabase/schema.sql`.
3. Create the first family row by running the commented `insert into public.families` statement at the bottom of `supabase/schema.sql`.
4. Copy the returned family UUID.
5. Copy `.env.example` to `.env.local` and fill in:

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_SUPABASE_FAMILY_ID=...
```

6. Start the app:

```bash
npm install
npm run dev
```

## Family Access

Each family member should create their own account in the app. After they sign up, add their user to `public.family_members` from the Supabase SQL Editor:

```sql
insert into public.family_members (family_id, user_id, role)
select 'YOUR_FAMILY_UUID', id, 'member'
from auth.users
where email in ('person@example.com');
```

Row Level Security is enabled. A signed-in user can only read or change trips for a family where they have a `family_members` row.

## MFA

The app requires two-factor authentication after login. Each user must scan the QR code with an authenticator app and verify the 6-digit code before trip details are shown.

## GitHub Pages

1. Push this repo to GitHub.
2. In GitHub, open the repo settings.
3. Go to `Settings > Secrets and variables > Actions`.
4. Add these repository secrets:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_SUPABASE_FAMILY_ID
```

5. Go to `Settings > Pages`.
6. Set the source to `GitHub Actions`.
7. Push to `main`, or run the `Deploy to GitHub Pages` workflow manually.

The Supabase anon key is safe to include in a browser app when Row Level Security is configured. Never put the Supabase service role key in this app.
