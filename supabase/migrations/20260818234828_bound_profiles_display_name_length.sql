-- Bound public.profiles.display_name to the shared product limit (100 characters).
--
-- display_name is free text supplied at onboarding and profile edit. It reaches
-- the admin notification email and every profile surface, so an unbounded value
-- degrades those outputs even though injection itself is already handled by
-- CRLF-stripping on the SMTP subject and escapeHtml() in the HTML body.
-- The limit is mirrored in lib/utils/display-name.ts (DISPLAY_NAME_MAX_LENGTH),
-- both server actions, and the maxLength on both form inputs.
--
-- char_length() counts characters (Unicode code points), which is why the
-- TypeScript guard counts with Array.from() rather than String.length — the two
-- must agree on which names are acceptable, or a name that passes the app layer
-- would be rejected by the database.
--
-- NOT VALID is deliberate. Existing rows were written with no bound, and
-- shortening someone's chosen display name is a product decision, not a
-- migration's call. NOT VALID enforces the limit on every INSERT and UPDATE
-- from now on while leaving stored rows untouched — no silent truncation.
--
-- Follow-up required before this constraint can be validated:
--   1. Identify affected rows:
--        SELECT id, char_length(display_name) AS len
--        FROM public.profiles
--        WHERE char_length(display_name) > 100
--        ORDER BY len DESC;
--   2. Decide the remediation with the product owner (ask the member to rename,
--      or apply an agreed shortening) and apply it.
--   3. In a later forward-only migration, promote the constraint:
--        ALTER TABLE public.profiles
--          VALIDATE CONSTRAINT profiles_display_name_length_check;
--      VALIDATE takes only a SHARE UPDATE EXCLUSIVE lock, so it does not block
--      concurrent reads or writes.

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_display_name_length_check
  CHECK (char_length(display_name) <= 100)
  NOT VALID;

-- handle_new_user() seeds display_name from OAuth metadata or, failing that, the
-- signup email. Addresses may exceed 100 characters, so without a bound here the
-- constraint above would turn a long-email signup into a check violation and fail
-- account creation outright. Bounding the generated value keeps signup working.
-- This truncates a system-generated placeholder the member can edit immediately —
-- it is not user-authored content, and no stored row is rewritten.
-- Otherwise identical to the definition in 002_oauth_profile_display_name.sql.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    left(
      COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        NEW.raw_user_meta_data->>'user_name',
        NEW.email
      ),
      100
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
