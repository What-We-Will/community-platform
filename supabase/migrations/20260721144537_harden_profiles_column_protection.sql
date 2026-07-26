-- Hardens the profiles column-protection shipped in 20260721134035, following
-- security review of PR #225. Two changes, both forward-only (the prior
-- migration is already applied on the preview DB, so we do not edit it):
--
--   1. Narrow the UPDATE guard from "block any change to role/approval_status"
--      to "block privilege-granting changes only". The original blocked any
--      approval_status change, which broke onboarding: completeOnboarding()
--      writes approval_status = 'pending' on the user's own session
--      (app/onboarding/actions.ts), a legitimate approved -> pending downgrade
--      that the guard must permit. The only privilege-granting transition a
--      non-admin can attempt is -> 'approved' (self-approval); that stays
--      blocked. role changes stay fully blocked (no legitimate self-role change
--      exists). The admin carve-out is now self-enforcing on OLD.id = auth.uid()
--      so it holds even if the row-scoped UPDATE policy is later loosened.
--
--   2. Close the INSERT path. The "Users can insert own profile" policy had no
--      column restriction, so a user with no existing profiles row (e.g. an
--      orphaned session after a partially-failed rejectUser) could INSERT one
--      with role = 'admin', bypassing the UPDATE-only trigger. We add
--      role = 'member' to the policy's WITH CHECK. approval_status is not
--      constrained here: the column defaults to 'approved', so an INSERT check
--      would be inert today and would break onboarding's pending-insert path;
--      INSERT-time approval_status enforcement is deferred to the separate
--      approval_status default-flip work.

-- 1. Replace the guard function (the existing BEFORE UPDATE trigger picks up
--    the new body; no trigger DDL needed).
CREATE OR REPLACE FUNCTION public.guard_profile_protected_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  -- Privileged connections bypass: service_role (the admin approval flow
  -- authenticates as service_role via createServiceClient() — see
  -- app/admin/approvals/actions.ts) and direct superuser/admin DB connections
  -- (migrations, seeds). A normal request runs as the 'authenticated' role and
  -- is never any of these. SECURITY INVOKER (the default) is required so that
  -- current_user reflects the real caller, not the function owner.
  IF current_user IN ('service_role', 'supabase_admin', 'postgres') THEN
    RETURN NEW;
  END IF;

  -- An admin may change these columns on their OWN row. Keying the carve-out on
  -- OLD.id = auth.uid() makes it self-enforcing: it never applies to another
  -- user's row even if the row-scoped UPDATE policy is later loosened for
  -- cross-row moderation.
  IF COALESCE(OLD.role, '') = 'admin' AND OLD.id = (SELECT auth.uid()) THEN
    RETURN NEW;
  END IF;

  -- Non-admin caller: block privilege-granting changes to their own row.
  -- role: no legitimate self-role change exists, so block any change.
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'permission denied: role is a protected column';
  END IF;
  -- approval_status: the only privilege-granting transition is -> 'approved'
  -- (self-approval). Setting a non-approved value (e.g. onboarding marking
  -- oneself 'pending' for review) grants nothing and is permitted.
  IF NEW.approval_status IS DISTINCT FROM OLD.approval_status
     AND NEW.approval_status = 'approved' THEN
    RAISE EXCEPTION 'permission denied: cannot self-approve (approval_status is a protected column)';
  END IF;

  RETURN NEW;
END;
$$;

-- 2. Constrain the INSERT policy so a self-insert cannot set a privileged role.
DROP POLICY "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid() AND role = 'member');
