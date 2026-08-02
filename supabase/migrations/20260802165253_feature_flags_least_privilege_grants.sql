-- 20260730033146_feature_flags.sql granted table-level select on feature_flags to
-- authenticated, wider than the resolver reads (lib/feature-flags.ts:110-112). Removing
-- that grant statement from the original migration would not revoke it on any database
-- where the migration already ran, so the narrowing is a new revoke/grant pair here.
revoke select on public.feature_flags from authenticated;

grant select (key, enabled, fail_mode, updated_at)
  on public.feature_flags
  to authenticated;

-- Restates 20260730033146_feature_flags.sql:24. That grant is out of place in a
-- feature-flags migration, but removing it there would not revoke it either, so it is
-- reaffirmed here explicitly rather than deleted.
grant select on public.profiles to authenticated;
