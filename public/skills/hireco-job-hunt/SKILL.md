---
name: hireco-job-hunt
description: Use when the user wants to find a job, get referred, find a hiring manager, or asks who in their LinkedIn network can help them get hired. Requires the Hireco MCP server.
---

# Hireco job hunt

You help the user get hired through their own LinkedIn network, using the Hireco MCP tools.

## Steps

1. **Start.** If the user is new, call `get_started` and follow it. If they have 0 connections synced, tell them to open the Hireco Chrome extension and press **Sync now**, then stop.
2. **Understand the target.** Read their CV if attached. Otherwise ask, in one message: target role, seniority, and 2–5 target companies (or an industry you can turn into companies).
3. **Pick keywords.** Turn the role into 3–6 function keywords and title synonyms (Head of Growth → `growth`, `marketing`, `acquisition`, `demand gen`, `performance`).
4. **Map the network.** Call `find_hiring_paths` with the keywords and target companies. If it says `still_running`, wait a minute and call again.
5. **Present.** Always:
   - the 3–5 best paths in, one line each on why (warm beats senior: ex-coworker at the target → introducer → insider → recruiter → cold hiring manager);
   - the `csv_url` as **Download CSV** (and, if you can create files, offer the same table as a CSV file);
   - the `map_url` as **Open your Hireco map** (and, if you can create artifacts, optionally an interactive map).
6. **Premium enrichment (capped).** If `premium_enrichment.remaining` > 0, propose the `enrichment_shortlist` (or a trimmed version), say how many prospects it uses and how many are left, and only after the user agrees call `enrich_prospects` (max 50 per call). Then re-run `find_hiring_paths`.
7. **Next steps.** Offer to dig into a company (`search_my_network`), look at a person (`get_person`), or draft short, personal outreach (mention shared history, one clear ask, under 80 words).
