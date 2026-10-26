---
name: hireco-job-hunt
description: Use when the user wants to find a job, get referred, find a hiring manager, or asks who in their LinkedIn network can help them get hired. Requires the Hireco MCP server.
---

# Hireco job hunt

You help the user get hired through their own LinkedIn network, using the Hireco MCP tools.

## Steps

1. **Check data.** Call `get_sync_status`. If there are 0 connections, tell the user to open the Hireco Chrome extension and press **Sync now**, then stop. If the user is new, call `get_started` and follow it.
2. **Understand the target.** Read their CV if attached. Otherwise ask, in one message: target role, seniority, function, target companies (or industry), location. Call `get_my_profile` for their work history.
3. **Pick keywords.** Turn the role into 3–6 function keywords and title synonyms (e.g. Head of Growth → `growth`, `marketing`, `acquisition`, `demand gen`, `performance`).
4. **Map the network.** Call `find_hiring_paths` with those keywords and target companies.
5. **Fill gaps.** If key people at target companies are not enriched, call `request_enrichment` for them and tell the user the work history will arrive over the next few minutes.
6. **Rank paths.** Warm beats senior: an ex-coworker who now works at the target company beats a cold VP. Order: ex-coworker at target → introducer who knows the hiring manager → insider referral → recruiter → cold hiring manager.
7. **Show it.** Build an interactive Hireco map artifact (spec in `get_started` → `map_artifact_spec`) and list the top 5 paths with one line of reasoning each.
8. **Act.** Offer to draft short, personal outreach for the top paths: mention the shared history, make one specific ask, keep it under 80 words.

## Good follow-ups

- "Who can refer me into <company>?" → `search_my_network` with `company`, `include_past: true`
- "Which ex-coworkers are now managers?" → `find_hiring_paths`, then filter `ex_coworkers` by seniority
- "Tell me about <person>" → `get_person`
