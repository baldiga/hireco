# Security

Found a vulnerability? Please email **hello@hireco.help** instead of opening a public issue. We'll reply within a few days and credit you if you'd like.

How secrets are handled:

- Hireco API keys (`hk_…`) are stored only as SHA-256 hashes.
- Hireco never asks for members' keys to other services: enrichment with their own Apify/Zooq account runs in their AI client, which sends only the results.
- The Supabase anon key in `extension/config.js` is public by design: it can only call the extension's job functions, which check the caller's Hireco key. Every table has row-level security, and server code uses the service role.
