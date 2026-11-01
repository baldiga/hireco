-- Members' Apify/Zooq keys never reach Hireco: enrichment with their own key runs in their
-- own AI agent (its provider MCP), which sends the results back with import_profiles.
drop table if exists public.provider_keys;
alter table public.app_settings drop column if exists byok_daily_profiles;
