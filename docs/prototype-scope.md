# Prototype Scope

## What works now

- Territory-style account list for association and member-training prospects.
- State and signal filters.
- Single-account AI scan.
- Batch scan for the first six visible accounts.
- Account detail panel with reasoning, likely roles, verification query, and next action.
- CSV export of current scan results.
- Server-side OpenAI route so the API key is not exposed in the browser.
- Health check endpoint at `/api/health`.

## What the AI scan does

The current scan is a conservative hypothesis generator. It looks at account category, notes, fit score, and Brightspace-relevant learning use cases. It returns structured seller guidance.

It does **not** claim to verify live job postings. The app intentionally returns a Google query so the seller can verify before using the signal in outreach.

## Recommended next build

1. Add upload/import for CSV account lists.
2. Add a live search provider for public job pages and career pages.
3. Store scan history in Supabase.
4. Add account brief generation.
5. Add Pat-style outreach draft generation from verified signals.
6. Add authentication if this becomes a team tool.

## Seller workflow

1. Filter territory.
2. Scan likely accounts.
3. Open the strongest signals.
4. Run the verification query.
5. Use the timing angle and next action to send a short, relevant opener.
