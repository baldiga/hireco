-- MVP: waitlist gate, premium enrichment quota, shared profile cache, shareable exports.

create table public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text,
  linkedin_url text,
  -- Flip to true in the Supabase table editor to let this email sign in.
  approved boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.waitlist enable row level security;

alter table public.profiles add column enrich_quota int not null default 300;

-- One enriched copy per LinkedIn member, shared across users (refreshed when stale).
create table public.linkedin_profiles (
  public_id text primary key,
  data jsonb not null,
  fetched_at timestamptz not null default now()
);
alter table public.linkedin_profiles enable row level security;

-- Each row is one prospect counted against a user's quota.
create table public.enrichments (
  user_id uuid not null references auth.users (id) on delete cascade,
  public_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, public_id)
);
alter table public.enrichments enable row level security;
create policy "own enrichments" on public.enrichments for select using ((select auth.uid()) = user_id);

-- Result snapshots behind unguessable links (CSV download + map page).
create table public.exports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  rows jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.exports enable row level security;

-- The background enrichment queue is gone; enrichment is now on demand.
drop index if exists public.connections_enrich_queue_idx;
alter table public.connections drop column enrich_priority, drop column enrich_error;
