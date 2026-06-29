'use client';

import { useMemo, useState } from 'react';
import { ACCOUNTS, type Account } from '@/lib/accounts';

type ResearchResult = {
  status: 'idle' | 'researching' | 'done' | 'error';
  researchStatus?: string;
  driverType?: string;
  confidence?: number;
  plainEnglishSummary?: string;
  evidenceBullets?: string[];
  sellerAngle?: string;
  recommendedNextStep?: string;
  verificationQuery?: string;
  sources?: { title: string; url: string }[];
  caveat?: string;
  searchProviderConfigured?: boolean;
  error?: string;
};

type ResultMap = Record<number, ResearchResult>;

const colors: Record<string, string> = {
  'Verified Driver': '#245f43',
  'Plausible Driver': '#9b6a22',
  'Weak Evidence': '#806b57',
  'No Driver Found': '#7a332b',
  'Search Not Configured': '#4c5f75'
};

async function researchAccount(account: Account): Promise<ResearchResult> {
  const response = await fetch('/api/research', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ account })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Research failed.');
  return { status: 'done', ...data };
}

export default function ResearchPage() {
  const accounts = useMemo(() => ACCOUNTS.filter((account) => account.fitScore >= 88), []);
  const [results, setResults] = useState<ResultMap>({});
  const [activeId, setActiveId] = useState(accounts[0]?.id || 1);
  const [running, setRunning] = useState(false);
  const active = accounts.find((account) => account.id === activeId) || accounts[0];
  const activeResult = active ? results[active.id] : undefined;

  async function runOne(account: Account) {
    setResults((current) => ({ ...current, [account.id]: { status: 'researching' } }));
    try {
      const result = await researchAccount(account);
      setResults((current) => ({ ...current, [account.id]: result }));
      setActiveId(account.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown research error.';
      setResults((current) => ({ ...current, [account.id]: { status: 'error', researchStatus: 'Weak Evidence', plainEnglishSummary: message, error: message } }));
    }
  }

  async function runAll() {
    setRunning(true);
    for (const account of accounts) await runOne(account);
    setRunning(false);
  }

  function exportCsv() {
    const rows = [
      ['Account', 'Fit Score', 'Research Status', 'Driver Type', 'Confidence', 'Summary', 'Seller Angle', 'Next Step', 'Verification Query'],
      ...accounts.map((account) => {
        const result = results[account.id] || { status: 'idle' };
        return [account.name, String(account.fitScore), result.researchStatus || '', result.driverType || '', String(result.confidence || ''), result.plainEnglishSummary || '', result.sellerAngle || '', result.recommendedNextStep || '', result.verificationQuery || ''];
      })
    ];
    const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'strong-fit-driver-research.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  const done = Object.values(results).filter((result) => result.status === 'done').length;
  const verified = Object.values(results).filter((result) => result.researchStatus === 'Verified Driver').length;
  const plausible = Object.values(results).filter((result) => result.researchStatus === 'Plausible Driver').length;

  if (!active) return null;

  return (
    <main style={{ width: 'min(1400px, calc(100% - 28px))', margin: '0 auto', padding: '34px 0 60px' }}>
      <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.3fr) minmax(280px, .7fr)', gap: 18 }}>
        <div style={panel}>
          <p style={eyebrow}>Second-level verification</p>
          <h1 style={{ margin: 0, fontFamily: 'Georgia, serif', fontSize: 'clamp(3rem, 7vw, 6.8rem)', lineHeight: .88, letterSpacing: '-.08em' }}>Strong fit is not enough. Find the real driver.</h1>
          <p style={{ color: '#675f55', fontSize: 19, lineHeight: 1.55 }}>This page only looks at strong-fit accounts, then checks whether there is a real learning, virtual learning, CE, certification, workforce, or member education driver behind the account.</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button style={primary} onClick={runAll} disabled={running}>{running ? 'Researching...' : 'Research all strong fits'}</button>
            <button style={secondary} onClick={exportCsv}>Export research</button>
          </div>
          <p style={{ color: '#675f55' }}>For live web evidence, add <strong>TAVILY_API_KEY</strong> in Vercel. Without it, the app returns conservative manual verification queries instead of pretending.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          <Stat label="strong fits" value={accounts.length} />
          <Stat label="researched" value={done} />
          <Stat label="verified" value={verified} />
          <Stat label="plausible" value={plausible} />
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 420px', gap: 18, marginTop: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: 14 }}>
          {accounts.map((account) => {
            const result = results[account.id];
            const tone = colors[result?.researchStatus || ''] || '#1f1a15';
            return (
              <article key={account.id} onClick={() => setActiveId(account.id)} style={{ ...card, borderColor: activeId === account.id ? tone : 'rgba(31,26,21,.14)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ ...badge, background: tone }}>{account.fitScore}</span>
                  <button style={smallButton} onClick={(event) => { event.stopPropagation(); runOne(account); }} disabled={result?.status === 'researching'}>{result?.status === 'researching' ? 'Checking...' : 'Verify driver'}</button>
                </div>
                <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 28, lineHeight: 1, letterSpacing: '-.05em' }}>{account.name}</h2>
                <p style={{ color: '#675f55', fontWeight: 800 }}>{account.category} · {account.state}</p>
                <p style={{ color: '#675f55' }}>{account.note}</p>
                <div style={{ borderTop: '1px solid rgba(31,26,21,.12)', paddingTop: 12, display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                  <strong>{result?.researchStatus || 'Not researched'}</strong>
                  <span>{result?.confidence ? `${result.confidence}%` : 'driver unknown'}</span>
                </div>
              </article>
            );
          })}
        </div>

        <aside style={{ ...panel, position: 'sticky', top: 18 }}>
          <p style={eyebrow}>active account</p>
          <h2 style={{ margin: 0, fontFamily: 'Georgia, serif', fontSize: 42, lineHeight: .95, letterSpacing: '-.06em' }}>{active.name}</h2>
          <p style={{ color: '#675f55', fontWeight: 800 }}>{active.website} · Fit {active.fitScore}</p>
          <div style={{ borderRadius: 22, padding: 16, color: '#fff8ed', background: colors[activeResult?.researchStatus || ''] || '#1f1a15' }}>
            <strong>{activeResult?.researchStatus || 'No driver check yet'}</strong>
            <p style={{ margin: '6px 0 0' }}>{activeResult?.driverType || 'Run research to classify the driver'}</p>
          </div>
          <Block title="Summary">{activeResult?.plainEnglishSummary || 'Run the driver check to see whether a real learning program driver shows up.'}</Block>
          <Block title="Evidence">
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {(activeResult?.evidenceBullets?.length ? activeResult.evidenceBullets : ['No evidence reviewed yet.']).map((item) => <li key={item}>{item}</li>)}
            </ul>
          </Block>
          <Block title="Seller angle">{activeResult?.sellerAngle || 'After verification, this will give you a simple reason to reach out without overplaying it.'}</Block>
          <Block title="Next step">{activeResult?.recommendedNextStep || 'Run the check, then verify the query before using the angle.'}</Block>
          <Block title="Verification query"><code style={{ whiteSpace: 'normal' }}>{activeResult?.verificationQuery || `${active.name} LMS virtual learning continuing education certification workforce training`}</code></Block>
          {!!activeResult?.sources?.length && <Block title="Sources">{activeResult.sources.map((source) => <p key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a></p>)}</Block>}
          {activeResult?.caveat && <p style={{ color: '#675f55' }}>{activeResult.caveat}</p>}
        </aside>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div style={{ ...panel, minHeight: 130, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}><strong style={{ fontFamily: 'Georgia, serif', fontSize: 56 }}>{value}</strong><span style={{ color: '#675f55', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.08em' }}>{label}</span></div>;
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return <section style={{ borderTop: '1px solid rgba(31,26,21,.12)', padding: '16px 0' }}><h3 style={eyebrow}>{title}</h3><div style={{ color: '#403a34', lineHeight: 1.55 }}>{children}</div></section>;
}

const panel: React.CSSProperties = { border: '1px solid rgba(31,26,21,.14)', borderRadius: 30, padding: 22, background: 'rgba(255,250,241,.8)', boxShadow: '0 24px 70px rgba(42,30,19,.14)' };
const card: React.CSSProperties = { border: '2px solid rgba(31,26,21,.14)', borderRadius: 26, padding: 18, background: 'rgba(255,250,241,.78)', boxShadow: '0 20px 54px rgba(42,30,19,.12)', cursor: 'pointer' };
const eyebrow: React.CSSProperties = { margin: '0 0 10px', color: '#8a5b20', fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.16em' };
const primary: React.CSSProperties = { border: 0, borderRadius: 999, padding: '13px 18px', background: '#1f1a15', color: '#fff8ed', fontWeight: 900, cursor: 'pointer' };
const secondary: React.CSSProperties = { border: '1px solid rgba(31,26,21,.16)', borderRadius: 999, padding: '13px 18px', background: 'rgba(255,255,255,.58)', color: '#1f1a15', fontWeight: 900, cursor: 'pointer' };
const smallButton: React.CSSProperties = { ...primary, padding: '9px 12px', fontSize: 13 };
const badge: React.CSSProperties = { borderRadius: 999, padding: '8px 11px', color: '#fff8ed', fontWeight: 950 };
