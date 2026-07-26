-- Column-level protection for the privilege-bearing columns on public.profiles.
--
-- The UPDATE RLS policy on profiles ("Users can update own profile") is
-- row-scoped (id = auth.uid()) but not column-scoped, so an authenticated user
-- can PATCH their own row directly against PostgREST and set role = 'admin' /
-- approval_status = 'approved', escalating privilege without touching app code.
-- Postgres WITH CHECK cannot compare against OLD, so a BEFORE UPDATE trigger
-- enforces the column-level rule. See docs/adr/0006-profiles-protected-column-enforcement.md.

CREATE OR REPLACE FUNCTION public.guard_profile_protected_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  -- Privileged connections bypass the guard: service_role (the admin approval
  -- flow authenticates as service_role via createServiceClient() — see
  -- app/admin/approvals/actions.ts) and direct superuser/admin DB connections
  -- (migrations, seeds). A normal request runs as the 'authenticated' role and
  -- is never any of these. SECURITY INVOKER (the default) is required so that
  -- current_user reflects the real caller, not the function owner.
  IF current_user IN ('service_role', 'supabase_admin', 'postgres') THEN
    RETURN NEW;
  END IF;

  -- An already-privileged admin may still change these columns (e.g. demoting
  -- another admin, or correcting their own row); a non-admin never can. The
  -- carve-out keys on OLD.role so a user cannot grant themselves privilege in
  -- the first place. COALESCE keeps the check safe if role is ever NULL.
  IF COALESCE(OLD.role, '') <> 'admin' THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'permission denied: role is a protected column';
    END IF;
    IF NEW.approval_status IS DISTINCT FROM OLD.approval_status THEN
      RAISE EXCEPTION 'permission denied: approval_status is a protected column';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_profile_protected_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_profile_protected_columns();
