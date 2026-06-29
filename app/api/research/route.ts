import OpenAI from 'openai';
import { NextResponse } from 'next/server';

type AccountPayload = {
  name: string;
  state?: string;
  category?: string;
  website?: string;
  note?: string;
  fitScore?: number;
};

type SearchResult = {
  title: string;
  url: string;
  content: string;
};

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

function cleanJson(text: string) {
  return text.replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/i, '').trim();
}

function buildQuery(account: AccountPayload) {
  const name = account.name;
  const domain = account.website ? `site:${account.website}` : '';
  return `${domain} "${name}" LMS OR "learning management" OR "virtual learning" OR "continuing education" OR certification OR "online learning" OR workforce OR training`;
}

async function tavilySearch(query: string): Promise<SearchResult[]> {
  if (!process.env.TAVILY_API_KEY) return [];

  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: process.env.TAVILY_API_KEY,
      query,
      search_depth: 'advanced',
      max_results: 6,
      include_answer: false,
      include_raw_content: false
    })
  });

  if (!response.ok) return [];
  const data = await response.json();
  return (data.results || []).map((item: any) => ({
    title: item.title || 'Untitled result',
    url: item.url || '',
    content: item.content || ''
  }));
}

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'Missing OPENAI_API_KEY.' }, { status: 500 });
    }

    const { account } = (await request.json()) as { account?: AccountPayload };
    if (!account?.name) {
      return NextResponse.json({ error: 'Missing account.' }, { status: 400 });
    }

    const query = buildQuery(account);
    const results = await tavilySearch(query);
    const evidence = results.length
      ? results.map((result, index) => `${index + 1}. ${result.title}\nURL: ${result.url}\nSnippet: ${result.content}`).join('\n\n')
      : 'No live search provider configured or no results returned. Use the verificationQuery manually.';

    const prompt = `You are a sales research analyst for D2L Brightspace.\n\nAccount: ${account.name}\nState: ${account.state || 'Unknown'}\nCategory: ${account.category || 'Unknown'}\nWebsite: ${account.website || 'Unknown'}\nFit score: ${account.fitScore || 'Unknown'}\nAccount note: ${account.note || 'None'}\n\nVerification query:\n${query}\n\nSearch evidence:\n${evidence}\n\nDetermine whether there is a real driver behind this organization's learning, virtual learning, continuing education, certification, workforce training, or member education programs.\n\nBe conservative. Do not overclaim. If evidence is weak, say so.\n\nReturn only valid JSON with these exact keys:\nresearchStatus: Verified Driver | Plausible Driver | Weak Evidence | No Driver Found | Search Not Configured\ndriverType: Continuing Education | Certification | Workforce Training | Compliance Training | Member Education | Digital Transformation | Hiring/Team Expansion | Unknown\nconfidence: number 0 to 100\nplainEnglishSummary: 2 sentence summary\nevidenceBullets: array of 2 to 5 bullets, each tied to source evidence or lack of it\nsellerAngle: one human sales angle that does not sound pushy\nrecommendedNextStep: one concrete next step\nverificationQuery: the exact search query\nsources: array of objects with title and url from the evidence, empty if none\ncaveat: one sentence caveat.`;

    const completion = await openai.chat.completions.create({
      model,
      temperature: 0.15,
      messages: [
        { role: 'system', content: 'Return valid compact JSON only. Be skeptical and source-grounded.' },
        { role: 'user', content: prompt }
      ]
    });

    const parsed = JSON.parse(cleanJson(completion.choices[0]?.message?.content || '{}'));
    return NextResponse.json({ ...parsed, searchProviderConfigured: Boolean(process.env.TAVILY_API_KEY), rawSearchResults: results });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown research error.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
