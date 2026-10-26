-- Hireco core schema.
-- All writes go through the server (service role). Owners can read their own rows.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  linkedin_public_id text,
  linkedin_urn text,
  full_name text,
  headline text,
  positions jsonb not null default '[]'::jsonb,
  educations jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null default 'default',
  prefix text not null,
  key_hash text not null unique,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);
create index api_keys_user_idx on public.api_keys (user_id);

create table public.connections (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  public_id text not null,
  urn text,
  first_name text,
  last_name text,
  headline text,
  picture_url text,
  connected_at timestamptz,
  -- Derived from positions when enriched, otherwise parsed from headline.
  current_title text,
  current_company text,
  positions jsonb,
  educations jsonb,
  location text,
  enriched_at timestamptz,
  enrich_priority int not null default 0,
  enrich_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, public_id)
);
create index connections_enrich_queue_idx
  on public.connections (user_id, enrich_priority desc, connected_at desc)
  where enriched_at is null and enrich_error is null;

create table public.sync_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null,
  status text not null default 'running',
  item_count int not null default 0,
  error text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);
create index sync_runs_user_idx on public.sync_runs (user_id, started_at desc);

alter table public.profiles enable row level security;
alter table public.api_keys enable row level security;
alter table public.connections enable row level security;
alter table public.sync_runs enable row level security;

create policy "own profile" on public.profiles for select using ((select auth.uid()) = id);
create policy "own api keys" on public.api_keys for select using ((select auth.uid()) = user_id);
create policy "own connections" on public.connections for select using ((select auth.uid()) = user_id);
create policy "own sync runs" on public.sync_runs for select using ((select auth.uid()) = user_id);

-- Create a profile row for every new auth user.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
