'use client';

import { useMemo, useState } from 'react';
import { ACCOUNTS, type Account } from '@/lib/accounts';

type Signal = 'Strong Signal' | 'Moderate Signal' | 'Possible Signal' | 'No Signal Found';

type ScanResult = {
  status: 'idle' | 'scanning' | 'done' | 'error';
  signal?: Signal;
  confidence?: number;
  reasoning?: string;
  likelyRoles?: string[];
  whyNow?: string;
  searchQuery?: string;
  nextAction?: string;
  caveat?: string;
};

type ResultMap = Record<number, ScanResult>;

const toneBySignal: Record<Signal, string> = {
  'Strong Signal': 'strong',
  'Moderate Signal': 'moderate',
  'Possible Signal': 'possible',
  'No Signal Found': 'quiet'
};

async function scanAccount(account: Account): Promise<ScanResult> {
  const response = await fetch('/api/scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ account })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Scan failed.');
  return { status: 'done', ...data };
}

export default function Page() {
  const [results, setResults] = useState<ResultMap>({});
  const [stateFilter, setStateFilter] = useState('ALL');
  const [signalFilter, setSignalFilter] = useState('ALL');
  const [activeId, setActiveId] = useState<number | null>(1);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');

  const states = useMemo(() => ['ALL', ...Array.from(new Set(ACCOUNTS.map((account) => account.state))).sort()], []);

  const filteredAccounts = useMemo(() => {
    return ACCOUNTS.filter((account) => {
      const byState = stateFilter === 'ALL' || account.state === stateFilter;
      const result = results[account.id];
      const bySignal = signalFilter === 'ALL' || result?.signal === signalFilter;
      return byState && bySignal;
    });
  }, [results, signalFilter, stateFilter]);

  const done = Object.values(results).filter((result) => result.status === 'done').length;
  const strong = Object.values(results).filter((result) => result.signal === 'Strong Signal').length;
  const moderate = Object.values(results).filter((result) => result.signal === 'Moderate Signal').length;
  const activeAccount = ACCOUNTS.find((account) => account.id === activeId) || ACCOUNTS[0];
  const activeResult = results[activeAccount.id];

  async function runOne(account: Account) {
    setError('');
    setResults((current) => ({ ...current, [account.id]: { status: 'scanning' } }));
    try {
      const result = await scanAccount(account);
      setResults((current) => ({ ...current, [account.id]: result }));
      setActiveId(account.id);
    } catch (scanError) {
      const message = scanError instanceof Error ? scanError.message : 'Unknown scan error.';
      setError(message);
      setResults((current) => ({
        ...current,
        [account.id]: {
          status: 'error',
          signal: 'No Signal Found',
          confidence: 0,
          reasoning: message,
          likelyRoles: [],
          whyNow: 'The scan could not complete.',
          searchQuery: `${account.name} LMS instructional designer jobs continuing education`,
          nextAction: 'Check the Vercel environment variables and try again.',
          caveat: 'This is an application error, not a market signal.'
        }
      }));
    }
  }

  async function runBatch() {
    setIsScanning(true);
    setError('');
    for (const account of filteredAccounts.slice(0, 6)) {
      await runOne(account);
    }
    setIsScanning(false);
  }

  function exportCsv() {
    const rows = [
      ['Account', 'State', 'Category', 'Fit Score', 'Signal', 'Confidence', 'Reasoning', 'Search Query', 'Next Action'],
      ...ACCOUNTS.map((account) => {
        const result = results[account.id];
        return [
          account.name,
          account.state,
          account.category,
          String(account.fitScore),
          result?.signal || '',
          String(result?.confidence || ''),
          result?.reasoning || '',
          result?.searchQuery || '',
          result?.nextAction || ''
        ];
      })
    ];

    const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'lms-hiring-signals.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Brightspace territory scout</p>
          <h1>LMS hiring signal scanner</h1>
          <p className="lede">
            Prioritize association accounts by likely learning-team hiring signals, then hand yourself a practical verification query and next step.
          </p>
          <div className="actions">
            <button onClick={runBatch} disabled={isScanning} className="primary">
              {isScanning ? 'Scanning first six...' : 'Scan first six visible'}
            </button>
            <button onClick={exportCsv} className="secondary">Export CSV</button>
          </div>
          {error && <p className="error">{error}</p>}
        </div>
        <div className="scoreboard">
          <div><strong>{ACCOUNTS.length}</strong><span>accounts</span></div>
          <div><strong>{done}</strong><span>scanned</span></div>
          <div><strong>{strong}</strong><span>strong</span></div>
          <div><strong>{moderate}</strong><span>moderate</span></div>
        </div>
      </section>

      <section className="filters" aria-label="Filters">
        <div>
          <span>State</span>
          {states.map((state) => (
            <button key={state} className={stateFilter === state ? 'active' : ''} onClick={() => setStateFilter(state)}>{state}</button>
          ))}
        </div>
        <div>
          <span>Signal</span>
          {(['ALL', 'Strong Signal', 'Moderate Signal', 'Possible Signal', 'No Signal Found'] as const).map((signal) => (
            <button key={signal} className={signalFilter === signal ? 'active' : ''} onClick={() => setSignalFilter(signal)}>{signal.replace(' Signal', '')}</button>
          ))}
        </div>
      </section>

      <section className="workspace">
        <div className="account-list">
          {filteredAccounts.map((account) => {
            const result = results[account.id];
            const tone = result?.signal ? toneBySignal[result.signal] : 'blank';
            return (
              <article key={account.id} className={`account-card ${tone} ${activeId === account.id ? 'selected' : ''}`} onClick={() => setActiveId(account.id)}>
                <div className="card-top">
                  <span>#{account.id}</span>
                  <button onClick={(event) => { event.stopPropagation(); runOne(account); }} disabled={result?.status === 'scanning'}>
                    {result?.status === 'scanning' ? 'Scanning' : 'Scan'}
                  </button>
                </div>
                <h2>{account.name}</h2>
                <p>{account.category} · {account.state}</p>
                <div className="meter"><i style={{ width: `${account.fitScore}%` }} /></div>
                <div className="signal-line">
                  <strong>{result?.signal || 'Not scanned'}</strong>
                  <span>{result?.confidence ? `${result.confidence}%` : `Fit ${account.fitScore}`}</span>
                </div>
              </article>
            );
          })}
        </div>

        <aside className="detail-panel">
          <div className="panel-header">
            <p className="eyebrow">selected account</p>
            <h2>{activeAccount.name}</h2>
            <span>{activeAccount.website}</span>
          </div>

          <div className="signal-badge">
            <strong>{activeResult?.signal || 'No scan yet'}</strong>
            <span>{activeResult?.confidence ? `${activeResult.confidence}% confidence` : 'Run a scan to generate guidance'}</span>
          </div>

          <div className="detail-block">
            <h3>Account note</h3>
            <p>{activeAccount.note}</p>
          </div>
          <div className="detail-block">
            <h3>Reasoning</h3>
            <p>{activeResult?.reasoning || 'The AI summary will land here after scanning. It will stay conservative and tell you what to verify.'}</p>
          </div>
          <div className="detail-block">
            <h3>Likely roles</h3>
            <div className="chips">
              {(activeResult?.likelyRoles?.length ? activeResult.likelyRoles : ['LMS Administrator', 'Instructional Designer', 'Continuing Education Manager']).map((role) => <span key={role}>{role}</span>)}
            </div>
          </div>
          <div className="detail-block">
            <h3>Verification query</h3>
            <code>{activeResult?.searchQuery || `${activeAccount.name} LMS instructional designer continuing education jobs`}</code>
          </div>
          <div className="detail-block">
            <h3>Next action</h3>
            <p>{activeResult?.nextAction || 'Scan the account, verify any role signal, then use the timing angle in a simple, relevant opener.'}</p>
          </div>
          {activeResult?.caveat && <p className="caveat">{activeResult.caveat}</p>}
        </aside>
      </section>
    </main>
  );
}
