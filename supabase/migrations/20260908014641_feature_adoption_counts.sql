-- Admin aggregate over profiles.enabled_features: one row per supported feature
-- plus the cohort size, in a single round trip.
--
-- Counted cohort: approved members only (approval_status = 'approved'),
-- regardless of role. Pending and rejected applicants are not members yet, so
-- counting them would overstate both the numerator and the denominator.
--
-- The four keys are listed literally, matching the CHECK constraints on the
-- column. Driving the aggregate off unnest(...) LEFT JOIN keeps a feature that
-- nobody selected in the result as a zero row, and lets a member with an empty
-- selection count toward member_total without counting toward any feature.
--
-- The admin check is the function's own, independent of the /admin route gate:
-- a route guard is not a data boundary, and this function is reachable over
-- PostgREST by any authenticated caller who knows its name.
--
-- SECURITY INVOKER (the default) is deliberate: the profiles SELECT policy is
-- USING (true), so an admin can already read every profile row directly.
-- Definer rights would add privilege this aggregate does not need.

CREATE FUNCTION public.get_feature_adoption_counts()
RETURNS TABLE (feature text, enabled_count bigint, member_total bigint)
LANGUAGE plpgsql
STABLE
SET search_path = ''
AS $$
BEGIN
  IF (
    SELECT p.role FROM public.profiles p WHERE p.id = (SELECT auth.uid())
  ) IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'permission denied: admin role required'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN QUERY
  WITH cohort AS (
    SELECT p.enabled_features
    FROM public.profiles p
    WHERE p.approval_status = 'approved'
  )
  SELECT
    k.feature,
    count(c.enabled_features)::bigint,
    (SELECT count(*)::bigint FROM cohort)
  FROM unnest(
    ARRAY['events', 'discussions', 'job_referrals', 'resource_hub']::text[]
  ) AS k(feature)
  LEFT JOIN cohort c ON k.feature = ANY (c.enabled_features)
  GROUP BY k.feature
  ORDER BY k.feature;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_feature_adoption_counts() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_feature_adoption_counts() TO authenticated;

COMMENT ON FUNCTION public.get_feature_adoption_counts() IS
  'Per-feature adoption counts over profiles.enabled_features, with the cohort size on every row. '
  'Cohort: approved members only (approval_status = ''approved''), any role. '
  'Raises insufficient_privilege unless the caller''s profile role is admin.';
