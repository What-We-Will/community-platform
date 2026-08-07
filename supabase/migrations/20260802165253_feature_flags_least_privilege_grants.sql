-- 20260730033146_feature_flags.sql granted table-level select on feature_flags to
-- authenticated, wider than the resolver reads (lib/feature-flags.ts:110-112). Removing
-- that grant statement from the original migration would not revoke it on any database
-- where the migration already ran, so the narrowing is a new revoke/grant pair here.
revoke select on public.feature_flags from authenticated;

grant select (key, enabled, fail_mode, updated_at)
  on public.feature_flags
  to authenticated;

-- Restates 20260730033146_feature_flags.sql:24. Within this migration set it is the
-- only grant of `authenticated` SELECT on public.profiles: no other GRANT on this table
-- appears in any migration, and 001_profiles.sql grants nothing. Confirmed against the
-- local stack that revoking it drops authenticated's SELECT privilege to none; not
-- verified against any hosted project, which could carry an out-of-band grant. Do not
-- drop this without adding a replacement grant first.
grant select on public.profiles to authenticated;
