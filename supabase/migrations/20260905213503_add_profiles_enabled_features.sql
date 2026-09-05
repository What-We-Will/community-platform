-- Platform features a member opted into at onboarding. Data layer only; the
-- onboarding step, settings surface, nav filtering, and admin counts build on it.
--
-- FeatureKey is not FeatureFlag. The values here are member-facing preference
-- keys (lib/feature-keys.ts). They are a separate key space from the global
-- rollout flags in public.feature_flags / lib/feature-flags.ts: no key in one
-- space maps to a key in the other by name, and nothing derives one from the
-- other. A surface governed by both must declare both keys explicitly at the
-- call site.
--
-- The vocabulary is enforced in the database, not only in TypeScript, because
-- direct PostgREST writes, stale clients, and manual SQL bypass the type layer,
-- and invalid or duplicated values would corrupt the admin adoption counts.
-- Extending the vocabulary later means dropping and recreating both constraints;
-- an enum would also need a migration and would still permit duplicates.
--
-- Containment (<@) accepts the empty array: all-deselected is a valid state.
--
-- Member-writable without any change to guard_profile_protected_columns(): the
-- trigger inspects only role and approval_status, and the UPDATE policy
-- "Users can update own profile" is row-scoped to auth.uid().
--
-- Read visibility: the profiles SELECT policy is USING (true) for authenticated,
-- so every member can read every other member's preferences. Consistent with
-- the rest of the profile row; accepted.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS enabled_features text[] NOT NULL
  DEFAULT '{events,discussions,job_referrals,resource_hub}';

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_enabled_features_supported
  CHECK (enabled_features <@ ARRAY['events','discussions','job_referrals','resource_hub']::text[]);

-- No duplicates. A CHECK cannot contain a subquery, and a helper function in
-- public would be exposed as a PostgREST RPC, so count the four fixed keys inline.
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_enabled_features_distinct
  CHECK (
    cardinality(enabled_features) =
        (CASE WHEN 'events'        = ANY (enabled_features) THEN 1 ELSE 0 END)
      + (CASE WHEN 'discussions'   = ANY (enabled_features) THEN 1 ELSE 0 END)
      + (CASE WHEN 'job_referrals' = ANY (enabled_features) THEN 1 ELSE 0 END)
      + (CASE WHEN 'resource_hub'  = ANY (enabled_features) THEN 1 ELSE 0 END)
  );

COMMENT ON COLUMN public.profiles.enabled_features IS
  'Platform features the member opted into at onboarding (PRD 3.5). Defaults to all. Member-facing preference keys only — no implicit mapping to the global feature-flag keys in lib/feature-flags.ts, and distinct from open_to_referrals (whether the member is open to being referred).';
