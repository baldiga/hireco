-- Email people when their waitlist row is approved.
-- Flipping `approved` to true calls /api/hooks/waitlist-approved, which claims the row by setting
-- approved_email_sent_at (so each person gets the email once) and sends it through Resend.
create extension if not exists pg_net with schema extensions;

alter table public.waitlist add column approved_email_sent_at timestamptz;

create or replace function public.notify_waitlist_approved() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.approved and new.approved_email_sent_at is null
     and (tg_op = 'INSERT' or not old.approved) then
    perform net.http_post(
      url := 'https://hireco.help/api/hooks/waitlist-approved',
      body := jsonb_build_object('email', new.email),
      headers := '{"Content-Type": "application/json"}'::jsonb
    );
  end if;
  return new;
end $$;

create trigger waitlist_approved
  after insert or update of approved on public.waitlist
  for each row execute function public.notify_waitlist_approved();
