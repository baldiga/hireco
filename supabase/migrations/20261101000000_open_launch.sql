-- Open sign-up on free tiers: settings, rate limits, capacity, BYOK enrichment keys,
-- and extension job polling that runs on Supabase instead of Vercel functions.
-- Additive only, so the current app keeps working until the new code ships.

create extension if not exists pgcrypto with schema extensions;

-- ---------- Settings (one row) ----------
create table public.app_settings (
  id int primary key default 1 check (id = 1),
  -- Members with data on file. Each one is ~1-2 MB of the free 500 MB database.
  max_active_users int not null default 250,
  -- Treat the service as full past this size, whatever the member count.
  max_db_bytes bigint not null default 420000000,
  -- Resend free: 100 emails a day. Keep a few spare for the daily report.
  email_daily_budget int not null default 95,
  -- Most of the budget may go to new sign-ups; the rest stays for sign-in links.
  signup_email_budget int not null default 70,
  -- Kill switch: MCP tools and the extension answer with a friendly pause message.
  paused boolean not null default false,
  -- Per user per day.
  tool_limits jsonb not null default '{"find_hiring_paths": 30, "search_my_network": 60, "publish_map": 40, "enrich_prospects": 20, "import_profiles": 40, "all": 150}',
  -- Profiles enriched per user per day with their own provider key.
  byok_daily_profiles int not null default 500
);
insert into public.app_settings default values;
alter table public.app_settings enable row level security;

-- ---------- Rate limits ----------
create table public.usage_counters (
  subject text not null,
  key text not null,
  window_start timestamptz not null,
  count int not null default 0,
  primary key (subject, key, window_start)
);
alter table public.usage_counters enable row level security;

-- Counts one hit in a fixed window (aligned to UTC) and says whether it is within p_limit.
create function public.hit(p_subject text, p_key text, p_limit int, p_window_seconds int, p_amount int default 1)
returns table (allowed boolean, used int, reset_at timestamptz)
language plpgsql security definer set search_path = '' as $$
declare
  w timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  n int;
begin
  insert into public.usage_counters as u (subject, key, window_start, count)
  values (p_subject, p_key, w, p_amount)
  on conflict (subject, key, window_start) do update set count = u.count + p_amount
  returning u.count into n;
  return query select n <= p_limit, n, w + make_interval(secs => p_window_seconds);
end $$;
revoke execute on function public.hit from public, anon, authenticated;

-- ---------- Members (the waitlist table becomes the member list) ----------
alter table public.waitlist
  -- 'waitlist' = asked for early access before sign-up opened; 'signup' = signed up after.
  add column source text not null default 'waitlist' check (source in ('waitlist', 'signup')),
  add column terms_version text,
  add column terms_accepted_at timestamptz,
  add column marketing_opt_in boolean not null default false,
  add column marketing_opt_in_at timestamptz,
  add column unsubscribe_token uuid not null default gen_random_uuid() unique,
  -- Signed up on a day the email budget ran out; the daily job sends the link.
  add column link_pending boolean not null default false;

alter table public.profiles add column last_active_at timestamptz not null default now();

-- Members who count against capacity: approved and active (or new) in the last 45 days.
create function public.capacity()
returns table (active int, max_active int, db_bytes bigint, full boolean)
language sql security definer set search_path = '' as $$
  with s as (select * from public.app_settings where id = 1),
  a as (
    select count(*)::int as n
    from public.waitlist w
    left join public.profiles p on lower(p.email) = w.email
    where w.approved and greatest(w.created_at, coalesce(p.last_active_at, w.created_at)) > now() - interval '45 days'
  )
  select a.n, s.max_active_users, pg_database_size(current_database()),
         a.n >= s.max_active_users or pg_database_size(current_database()) >= s.max_db_bytes
  from a, s
$$;
revoke execute on function public.capacity from public, anon, authenticated;

-- ---------- Bring-your-own-key enrichment ----------
create table public.provider_keys (
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null check (provider in ('apify', 'zooq')),
  -- AES-256-GCM, encrypted by the server (PROVIDER_KEY_SECRET). Never sent back to the browser.
  secret_enc text not null,
  last4 text not null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  last_error text,
  primary key (user_id, provider)
);
alter table public.provider_keys enable row level security;

-- Who paid for each enriched prospect: the early-access allowance (house) or the member's own key.
alter table public.enrichments add column paid_by text not null default 'house' check (paid_by in ('house', 'own', 'import'));

-- ---------- Extension job polling, served by Supabase ----------
-- The extension checks for company searches every 30 seconds. Answering that from a
-- Vercel function costs ~2,900 invocations per user per day, so it calls these instead.
create function public.ext_user(p_key text) returns uuid
language sql stable security definer set search_path = '' as $$
  select user_id from public.api_keys
  where key_hash = encode(extensions.digest(p_key, 'sha256'), 'hex') and revoked_at is null
$$;
revoke execute on function public.ext_user from public, anon, authenticated;

create function public.ext_claim_jobs(p_key text)
returns table (id uuid, company_id text, company_name text, relation text)
language plpgsql security definer set search_path = '' as $$
declare uid uuid := public.ext_user(p_key);
begin
  if uid is null then raise exception 'invalid API key' using errcode = '28000'; end if;
  return query
    with claimed as (
      update public.company_searches c set status = 'running', started_at = now()
      where c.id in (
        select j.id from public.company_searches j
        where j.user_id = uid and j.status = 'pending'
        order by j.requested_at limit 3
        for update skip locked
      )
      returning c.id, c.company_id, c.company_name, c.relation, c.requested_at
    )
    select k.id, k.company_id, k.company_name, k.relation from claimed k order by k.requested_at;
end $$;

create function public.ext_finish_job(p_key text, p_id uuid, p_company_id text default null, p_public_ids text[] default '{}', p_error text default null)
returns void
language plpgsql security definer set search_path = '' as $$
declare uid uuid := public.ext_user(p_key);
begin
  if uid is null then raise exception 'invalid API key' using errcode = '28000'; end if;
  update public.company_searches set
    status = case when p_error is null then 'done' else 'error' end,
    error = p_error,
    public_ids = coalesce(p_public_ids, '{}'),
    company_id = coalesce(p_company_id, company_id),
    finished_at = now()
  where user_id = uid and id = p_id;
end $$;

revoke execute on function public.ext_claim_jobs, public.ext_finish_job from public;
grant execute on function public.ext_claim_jobs, public.ext_finish_job to anon;

-- ---------- Housekeeping ----------
select cron.schedule('hireco-usage-cleanup', '30 3 * * *',
  $$delete from public.usage_counters where window_start < now() - interval '2 days'$$);

-- Free the space of members who stopped using Hireco. They keep their account and can sync again.
select cron.schedule('hireco-inactive-cleanup', '45 3 * * *', $$
  with gone as (select id from public.profiles where last_active_at < now() - interval '45 days')
  delete from public.connections c using gone where c.user_id = gone.id;
  delete from public.company_searches c using public.profiles p
    where c.user_id = p.id and p.last_active_at < now() - interval '45 days';
$$);

-- Members approved so far already have their welcome; only new ones get the "you're in" email.
update public.waitlist set approved_email_sent_at = coalesce(approved_email_sent_at, created_at) where approved;

-- Premium enrichment on the operator's key is only for the early-access members approved
-- before sign-up opened. Everyone else brings their own Apify or Zooq key.
alter table public.waitlist add column early_access boolean not null default false;
update public.waitlist set early_access = true where approved;
alter table public.profiles alter column enrich_quota set default 0;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, enrich_quota)
  values (
    new.id, new.email,
    case when exists (select 1 from public.waitlist w where w.email = lower(new.email) and w.early_access) then 300 else 0 end
  );
  return new;
end;
$$;
