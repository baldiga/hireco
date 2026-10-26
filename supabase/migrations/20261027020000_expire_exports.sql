-- Maps (exports) are kept for 14 days, then deleted nightly.
create extension if not exists pg_cron with schema pg_catalog;

create index if not exists exports_user_created_idx on public.exports (user_id, created_at desc);

select cron.schedule(
  'hireco-expire-exports',
  '15 3 * * *',
  $$delete from public.exports where created_at < now() - interval '14 days'$$
);
