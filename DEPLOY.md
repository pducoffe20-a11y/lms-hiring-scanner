# Deploy the LMS Hiring Signal Scanner

This is a hosted, Vercel-ready Next.js app.

## Vercel steps

1. Go to Vercel.
2. Choose **Add New > Project**.
3. Import this GitHub repo: `pducoffe20-a11y/lms-hiring-scanner`.
4. Add this environment variable:
   - `OPENAI_API_KEY`
5. Optional environment variable:
   - `OPENAI_MODEL` default: `gpt-4o-mini`
6. Click **Deploy**.

## What the app does

- Shows a curated list of association accounts
- Scores account fit
- Uses OpenAI through a protected server route
- Suggests likely LMS/eLearning roles to verify
- Creates a search query for manual validation
- Gives a practical next action
- Exports results to CSV

## Important note

The app does not browse live job boards. It creates a practical sales hypothesis and a verification query. Confirm the signal before outreach.
