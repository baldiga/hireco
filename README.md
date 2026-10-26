# Hireco

Find the people in your LinkedIn network who can get you hired — served to your AI agent over MCP.

- `extension/` — Chrome extension (MV3). Syncs your 1st-degree connections from your logged-in LinkedIn session, then slowly enriches them with work history.
- `src/app/api/ext/*` — endpoints the extension posts to (Bearer API key).
- `src/app/api/mcp` — remote MCP server (Bearer API key): `get_sync_status`, `get_my_profile`, `find_hiring_paths`, `search_my_network`, `get_person`, `request_enrichment`.
- `src/app/dashboard` — sign in (email magic link), generate API key, setup instructions.
- `supabase/migrations` — database schema.

## Develop

```sh
npm install
npm run dev          # needs .env.local (see below)
npx supabase db push # apply migrations to the linked project
```

`.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## Use

1. Sign in at `/dashboard`, generate an API key.
2. `chrome://extensions` → Developer mode → Load unpacked → `extension/`. Paste server URL + key, press **Sync now**.
3. `claude mcp add --transport http hireco https://<host>/api/mcp --header "Authorization: Bearer <key>"`
