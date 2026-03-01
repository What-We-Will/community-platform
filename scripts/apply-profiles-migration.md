# Apply profiles migration

The `public.profiles` table must exist before the app can run. Apply it using one of these methods:

## Option 1: Supabase Dashboard (recommended)

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project
2. Go to **SQL Editor**
3. Copy the contents of `supabase/migrations/001_profiles.sql`
4. Paste and click **Run**

## Option 2: Supabase CLI

```bash
# Login first (one-time)
npx supabase login

# Link your project (replace with your project ref from the dashboard URL)
npx supabase link --project-ref asvsvraklentiztwlyou

# Push migrations
npx supabase db push
```

Your project ref is the subdomain: `asvsvraklentiztwlyou` from `https://asvsvraklentiztwlyou.supabase.co`
