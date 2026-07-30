create table public.feature_flags (
  key text primary key,
  enabled boolean not null default false,
  type text not null,
  fail_mode text not null default 'closed',
  owner text,
  description text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  seed_id text,
  constraint feature_flags_type_check
    check (type in ('release', 'experiment', 'ops', 'permission')),
  constraint feature_flags_fail_mode_check
    check (fail_mode in ('open', 'closed')),
  constraint feature_flags_expires_at_check
    check (type not in ('release', 'experiment') or expires_at is not null)
);

create unique index feature_flags_seed_id_key
  on public.feature_flags (seed_id)
  where seed_id is not null;

grant select on public.profiles to authenticated;
grant select, insert, update, delete on public.feature_flags to authenticated;

create trigger feature_flags_updated_at
  before update on public.feature_flags
  for each row execute function public.update_updated_at();

alter table public.feature_flags enable row level security;

-- Keep this predicate inline until a shared authorization helper is introduced.
create policy "Authenticated users can read feature flags"
  on public.feature_flags for select to authenticated
  using (true);

create policy "Admins can insert feature flags"
  on public.feature_flags for insert to authenticated
  with check ((select role from public.profiles where id = auth.uid()) = 'admin');

create policy "Admins can update feature flags"
  on public.feature_flags for update to authenticated
  using ((select role from public.profiles where id = auth.uid()) = 'admin')
  with check ((select role from public.profiles where id = auth.uid()) = 'admin');

create policy "Admins can delete feature flags"
  on public.feature_flags for delete to authenticated
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

insert into public.feature_flags (
  key,
  enabled,
  type,
  fail_mode,
  owner,
  description,
  expires_at,
  seed_id
)
values
  (
    'jobApplicationTracker',
    false,
    'release',
    'closed',
    'platform',
    'Controls access to the Job Application Tracker.',
    '2027-07-29T00:00:00Z',
    'feature-flag-job-application-tracker'
  ),
  (
    'learningTracker',
    false,
    'release',
    'closed',
    'platform',
    'Controls access to the Learning Tracker.',
    '2027-07-29T00:00:00Z',
    'feature-flag-learning-tracker'
  ),
  (
    'ghostJobBoard',
    false,
    'release',
    'closed',
    'platform',
    'Controls access to the community Job Board.',
    '2027-07-29T00:00:00Z',
    'feature-flag-ghost-job-board'
  );
