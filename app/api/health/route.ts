import { NextResponse } from 'next/server';

export function GET() {
  return NextResponse.json({
    ok: true,
    app: 'lms-hiring-scanner',
    openaiConfigured: Boolean(process.env.OPENAI_API_KEY)
  });
}
