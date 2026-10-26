-- Radar map layout (hubs, ordered starting points, per-hub notes) stored with each export.
alter table public.exports add column spec jsonb;
