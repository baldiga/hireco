-- "Who in my network works / used to work at company X", answered by the extension
-- running a filtered LinkedIn people search. Doubles as the extension's job queue.
create table public.company_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  -- company id when known, otherwise "name:<normalized name>"
  company_key text not null,
  company_id text,
  company_name text,
  relation text not null check (relation in ('current', 'past')),
  status text not null default 'pending' check (status in ('pending', 'running', 'done', 'error')),
  public_ids text[] not null default '{}',
  error text,
  requested_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  unique (user_id, company_key, relation)
);
create index company_searches_queue_idx on public.company_searches (user_id, status, requested_at);

alter table public.company_searches enable row level security;
create policy "own company searches" on public.company_searches for select using ((select auth.uid()) = user_id);
