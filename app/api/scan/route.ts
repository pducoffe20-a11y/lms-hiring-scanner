import OpenAI from 'openai';
import { NextResponse } from 'next/server';
import type { Account } from '@/lib/accounts';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const fallbackModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';

type ScanBody = { account?: Account };

function safeJson(text: string) {
  const cleaned = text.replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/i, '').trim();
  return JSON.parse(cleaned);
}

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'Missing OPENAI_API_KEY in environment variables.' }, { status: 500 });
    }

    const body = (await request.json()) as ScanBody;
    const account = body.account;

    if (!account?.name) {
      return NextResponse.json({ error: 'Missing account payload.' }, { status: 400 });
    }

    const prompt = `You are helping a D2L Brightspace seller prioritize association prospects.\n\nAccount:\nName: ${account.name}\nState: ${account.state}\nCategory: ${account.category}\nWebsite: ${account.website}\nFit score: ${account.fitScore}\nAccount note: ${account.note}\n\nCreate a conservative hiring-signal hypothesis for whether this account may have current or likely LMS, eLearning, instructional design, continuing education, member training, certification, or learning technology hiring needs.\n\nDo not claim you verified live job postings. You are not browsing. Give the rep a practical verification query and a next action.\n\nReturn only valid JSON with these exact keys:\nsignal: one of Strong Signal, Moderate Signal, Possible Signal, No Signal Found\nconfidence: number from 0 to 100\nreasoning: short plain-English explanation\nlikelyRoles: array of 3 to 5 likely job titles\nwhyNow: one sentence timing angle\nsearchQuery: a Google search query the seller can run\nnextAction: one low-pressure seller action\ncaveat: one sentence caveat.`;

    const completion = await client.chat.completions.create({
      model: fallbackModel,
      temperature: 0.25,
      messages: [
        { role: 'system', content: 'Return compact, valid JSON only. Be conservative and seller-useful.' },
        { role: 'user', content: prompt }
      ]
    });

    const text = completion.choices[0]?.message?.content || '{}';
    const parsed = safeJson(text);

    return NextResponse.json(parsed);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown OpenAI scan error.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
