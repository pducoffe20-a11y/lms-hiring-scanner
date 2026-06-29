# Deploy LMS Hiring Scanner to Vercel

This app is built for Vercel's free tier.

## 1. Import the repo

Go to Vercel and choose **Add New Project**. Import:

`pducoffe20-a11y/lms-hiring-scanner`

Vercel should detect Next.js automatically.

## 2. Add environment variables

In Project Settings -> Environment Variables, add:

```txt
OPENAI_API_KEY=your OpenAI API key
OPENAI_MODEL=gpt-4o-mini
```

Use `gpt-4o-mini` for inexpensive prototype scans. You can switch to a stronger model later.

## 3. Deploy

Click **Deploy**.

## 4. Test

After deploy, open:

`/api/health`

You should see:

```json
{
  "ok": true,
  "app": "lms-hiring-scanner",
  "openaiConfigured": true
}
```

Then open the homepage and run one scan.

## Important note

The scanner does not browse live job boards yet. The current prototype uses OpenAI to generate a conservative hiring-signal hypothesis and a verification query. Live job/web research can be added in a later phase with a search API or controlled browsing service.
