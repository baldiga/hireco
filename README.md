# Hireco

**Find the people in your LinkedIn network who can get you hired, right inside your AI agent.**

Hireco maps your 1st-degree connections into hiring managers, decision makers, insiders, recruiters, introducers and ex-coworkers for the role and companies you want, then hands the result to Claude, Cursor, Codex or any MCP client as a ranked list, a CSV and a visual map.

Free to use at **[hireco.help](https://hireco.help)**, or run your own copy. MIT licensed.

## How it works

```
 Chrome extension ──(your LinkedIn session)──► reads your connections, runs company searches
        │  Hireco API key                         in your own browser
        ▼
 Next.js on Vercel ──► Supabase (Postgres, auth)
        ▲
        │  remote MCP server (/api/mcp, Bearer hk_…)
 Your AI agent: "Who can get me hired as Head of Growth at Stripe?"
```

- `extension/`: Chrome extension (MV3). Syncs your connections from your logged-in LinkedIn and runs the company searches your AI asks for. It polls for those searches through Supabase functions (`ext_claim_jobs`), not the web server.
- `src/app/api/mcp`: the MCP server: `get_started`, `find_hiring_paths`, `search_my_network`, `publish_map`, `enrich_prospects`, `import_profiles`, `get_person`.
- `src/app/api/ext/*`: endpoints the extension posts to.
- `src/app/dashboard`: sign-in (email link), API key, setup steps.
- `supabase/migrations`: the whole schema, including rate limits and capacity (`hit`, `capacity`).

**Premium enrichment** (exact titles and dated work history) runs in the member's own AI: they connect a LinkedIn data MCP (Zooq or Apify) with their own account, the AI fetches the profiles and saves them with `import_profiles`. Hireco never sees their keys. An optional operator allowance (`APIFY_TOKEN`, `profiles.enrich_quota`) powers `enrich_prospects`.

## Built for free tiers

Hireco runs on Vercel Hobby, Supabase Free and Resend Free. The limits that keep it up live in the `app_settings` table, so you can tune them without a deploy:

| Limit | Default | Why |
|---|---|---|
| `max_active_users` / `max_db_bytes` | 250 / 420 MB | ~1–2 MB per member on a 500 MB database. Past it, new sign-ups wait in line. |
| `email_daily_budget` / `signup_email_budget` | 95 / 70 | Resend free sends 100 a day. Sign-up links that don't fit go out the next morning. |
| `tool_limits` | 30 path searches, 150 calls / day | Vercel function time. |
| `paused` | false | Kill switch with a friendly message. |

Members inactive for 45 days have their synced network deleted (pg_cron); maps expire after 14 days. A daily Vercel Cron (`/api/cron/daily`) lets people in from the queue, sends deferred emails and emails you a usage report.

## Run your own

1. **Supabase**: create a project, then `npx supabase link` and `npx supabase db push`.
2. **Resend**: verify a domain and create an API key.
3. **Vercel**: import the repo and set the variables from [`.env.example`](.env.example).
4. **Extension**: set `SERVER`, `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `extension/config.js`, add your hosts to `extension/manifest.json`, then load `extension/` unpacked in `chrome://extensions` (Developer mode).
5. Sign up on your site, approve yourself if needed (`waitlist.approved`), generate a key, sync, and connect your AI:

```sh
claude mcp add --transport http hireco https://your-domain.com/api/mcp --header "Authorization: Bearer hk_…"
```

Develop locally with `npm install` and `npm run dev` (needs `.env.local`).

## A note on LinkedIn

The extension reads only what you can already see, from your own logged-in browser, when you ask it to, and paces its requests. LinkedIn's terms still apply to your account and LinkedIn may restrict accounts it believes are automated. Use it at your own risk, for your own job search.

## License

[MIT](LICENSE) © Amir Baldiga
