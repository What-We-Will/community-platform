-- Flag definitions (keys, type, fail mode, expiry) change only through migrations.
-- The API role may flip `enabled` and nothing else; RLS still limits that to admins.
-- The insert and delete policies are dropped, not just made unreachable by the
-- revoke, so a later grant cannot silently re-enable flag creation or deletion.
-- Revoking everything also clears the schema's default grants (truncate, references,
-- trigger) that anon and authenticated picked up when the table was created.
revoke all on public.feature_flags from public, anon, authenticated;
grant select (key, enabled, fail_mode, updated_at) on public.feature_flags to authenticated;
grant update (enabled) on public.feature_flags to authenticated;

drop policy "Admins can insert feature flags" on public.feature_flags;
drop policy "Admins can delete feature flags" on public.feature_flags;

create table public.feature_flag_changes (
  id bigint generated always as identity primary key,
  -- No foreign key: history must outlive a dropped flag.
  flag_key text not null,
  old_enabled boolean not null,
  new_enabled boolean not null,
  -- Null when the change came from outside an API session (SQL, migrations).
  changed_by uuid,
  changed_at timestamptz not null default now(),
  seed_id text
);

create unique index feature_flag_changes_seed_id_key
  on public.feature_flag_changes (seed_id)
  where seed_id is not null;

create index feature_flag_changes_flag_key_changed_at_idx
  on public.feature_flag_changes (flag_key, changed_at desc);

alter table public.feature_flag_changes enable row level security;

revoke all on public.feature_flag_changes from anon, authenticated;
grant select on public.feature_flag_changes to authenticated;

-- Keep this predicate inline until a shared authorization helper is introduced.
create policy "Admins can read feature flag changes"
  on public.feature_flag_changes for select to authenticated
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

-- SECURITY DEFINER so the trigger can append to a table the API role cannot write.
create function public.log_feature_flag_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.feature_flag_changes (flag_key, old_enabled, new_enabled, changed_by)
  values (new.key, old.enabled, new.enabled, auth.uid());
  return new;
end;
$$;

revoke execute on function public.log_feature_flag_change() from public, anon, authenticated;

create trigger feature_flag_changes_log
  after update of enabled on public.feature_flags
  for each row
  when (old.enabled is distinct from new.enabled)
  execute function public.log_feature_flag_change();
