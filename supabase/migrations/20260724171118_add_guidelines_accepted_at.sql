-- Track when a member agreed to the Community Guidelines.
--
-- Nullable with no default: existing members have NULL (they predate the
-- guidelines and have not yet agreed), and new members get the timestamp set
-- when they accept during onboarding (app/onboarding/actions.ts). Storing the
-- timestamp rather than a boolean lets us tell *when* someone agreed, which is
-- what we'll need if the guidelines are ever versioned and re-consent required.
--
-- Not a privilege-bearing column (unlike role / approval_status). Members may
-- attest on their own session, but the trigger below still prevents forging,
-- clearing, or rewriting the timestamp after first acceptance.

ALTER TABLE public.profiles
  ADD COLUMN guidelines_accepted_at timestamptz;

-- Consent integrity: allow only the first acceptance, stamped with server time.
-- Privileged connections (service_role / migrations) bypass for admin repair.
CREATE OR REPLACE FUNCTION public.guard_guidelines_accepted_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF current_user IN ('service_role', 'supabase_admin', 'postgres') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.guidelines_accepted_at IS NOT NULL THEN
      NEW.guidelines_accepted_at := now();
    END IF;
    RETURN NEW;
  END IF;

  -- UPDATE: unchanged is a no-op.
  IF NEW.guidelines_accepted_at IS NOT DISTINCT FROM OLD.guidelines_accepted_at THEN
    RETURN NEW;
  END IF;

  -- First acceptance only: NULL -> non-null, always server-stamped.
  IF OLD.guidelines_accepted_at IS NULL AND NEW.guidelines_accepted_at IS NOT NULL THEN
    NEW.guidelines_accepted_at := now();
    RETURN NEW;
  END IF;

  RAISE EXCEPTION
    'permission denied: guidelines_accepted_at cannot be cleared or rewritten';
END;
$$;

CREATE TRIGGER profiles_guard_guidelines_accepted_at
  BEFORE INSERT OR UPDATE OF guidelines_accepted_at ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_guidelines_accepted_at();
