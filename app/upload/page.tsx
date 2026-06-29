'use client';

import { DragEvent, useMemo, useRef, useState } from 'react';

type ImportedAccount = {
  id: number;
  name: string;
  state: string;
  category: string;
  website: string;
  note: string;
  fitScore: number;
};

type ScanResult = {
  signal?: string;
  confidence?: number;
  reasoning?: string;
  searchQuery?: string;
  nextAction?: string;
  status: 'idle' | 'ready' | 'scanning' | 'done' | 'error';
};

const sampleCsv = `name,state,category,website,note,fitScore
Ohio Hospital Association,OH,Healthcare association,ohiohospitals.org,Healthcare workforce education and compliance learning,94
Michigan Bankers Association,MI,Banking association,mibankers.com,Compliance heavy member training and continuing education,92
Minnesota Medical Association,MN,Medical association,mnmed.org,Professional development CME and physician education,91`;

function splitCsvLine(line: string) {
  const cells: string[] = [];
  let current = '';
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      cells.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  cells.push(current.trim());
  return cells;
}

function parseCsv(text: string): ImportedAccount[] {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  const headers = splitCsvLine(lines[0]).map((header) => header.toLowerCase().replace(/\s+/g, ''));
  const getIndex = (...names: string[]) => names.map((name) => headers.indexOf(name)).find((index) => index >= 0) ?? -1;

  const nameIndex = getIndex('name', 'account', 'company', 'organization');
  const stateIndex = getIndex('state', 'region');
  const categoryIndex = getIndex('category', 'industry', 'segment', 'type');
  const websiteIndex = getIndex('website', 'url', 'domain');
  const noteIndex = getIndex('note', 'notes', 'description', 'context');
  const fitIndex = getIndex('fitscore', 'fit', 'score');

  return lines.slice(1).map((line, rowIndex) => {
    const cells = splitCsvLine(line);
    return {
      id: rowIndex + 1,
      name: cells[nameIndex] || `Imported account ${rowIndex + 1}`,
      state: cells[stateIndex] || 'NA',
      category: cells[categoryIndex] || 'Unknown',
      website: cells[websiteIndex] || '',
      note: cells[noteIndex] || 'Imported from CSV.',
      fitScore: Number(cells[fitIndex] || 75)
    };
  }).filter((account) => account.name.trim().length > 0);
}

function csvFromAccounts(accounts: ImportedAccount[]) {
  const rows = [
    ['name', 'state', 'category', 'website', 'note', 'fitScore'],
    ...accounts.map((account) => [account.name, account.state, account.category, account.website, account.note, String(account.fitScore)])
  ];
  return rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(',')).join('\n');
}

export default function UploadPage() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [accounts, setAccounts] = useState<ImportedAccount[]>([]);
  const [results, setResults] = useState<Record<number, ScanResult>>({});
  const [dragging, setDragging] = useState(false);
  const [message, setMessage] = useState('Drop a CSV to start, or load the sample file.');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return accounts;
    return accounts.filter((account) => [account.name, account.state, account.category, account.website, account.note].join(' ').toLowerCase().includes(needle));
  }, [accounts, query]);

  const stats = useMemo(() => {
    const scanned = Object.values(results).filter((result) => result.status === 'done').length;
    const strong = Object.values(results).filter((result) => result.signal === 'Strong Signal').length;
    const averageFit = accounts.length ? Math.round(accounts.reduce((sum, account) => sum + account.fitScore, 0) / accounts.length) : 0;
    return { scanned, strong, averageFit };
  }, [accounts, results]);

  function ingest(text: string) {
    const parsed = parseCsv(text);
    setAccounts(parsed);
    setResults(Object.fromEntries(parsed.map((account) => [account.id, { status: 'ready' as const }])));
    setMessage(parsed.length ? `Imported ${parsed.length} accounts.` : 'No rows found. Check your header row.');
  }

  async function handleFiles(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setMessage('Please upload a .csv file.');
      return;
    }
    ingest(await file.text());
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    handleFiles(event.dataTransfer.files);
  }

  async function scan(account: ImportedAccount) {
    setResults((current) => ({ ...current, [account.id]: { status: 'scanning' } }));
    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Scan failed');
      setResults((current) => ({ ...current, [account.id]: { status: 'done', ...data } }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setResults((current) => ({ ...current, [account.id]: { status: 'error', reasoning: errorMessage, signal: 'No Signal Found' } }));
    }
  }

  async function scanVisible() {
    for (const account of filtered.slice(0, 10)) {
      await scan(account);
    }
  }

  function downloadTemplate() {
    const blob = new Blob([sampleCsv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'lms-hiring-scanner-template.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  function exportImported() {
    const blob = new Blob([csvFromAccounts(accounts)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'imported-accounts.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main style={styles.shell}>
      <section style={styles.hero}>
        <div>
          <p style={styles.eyebrow}>CSV import lab</p>
          <h1 style={styles.title}>Drop accounts in. Turn signals out.</h1>
          <p style={styles.lede}>Upload a CSV of associations, companies, or territory accounts. Preview the rows, scan them with the existing OpenAI route, and export the cleaned list.</p>
          <div style={styles.actions}>
            <button style={styles.primary} onClick={() => inputRef.current?.click()}>Choose CSV</button>
            <button style={styles.secondary} onClick={() => ingest(sampleCsv)}>Load sample</button>
            <button style={styles.secondary} onClick={downloadTemplate}>Download template</button>
          </div>
        </div>
        <div style={styles.statsGrid}>
          <div style={styles.stat}><strong>{accounts.length}</strong><span>imported</span></div>
          <div style={styles.stat}><strong>{stats.scanned}</strong><span>scanned</span></div>
          <div style={styles.stat}><strong>{stats.strong}</strong><span>strong</span></div>
          <div style={styles.stat}><strong>{stats.averageFit}</strong><span>avg fit</span></div>
        </div>
      </section>

      <input ref={inputRef} type="file" accept=".csv,text/csv" hidden onChange={(event) => handleFiles(event.target.files)} />

      <section
        style={{ ...styles.dropzone, ...(dragging ? styles.dropzoneActive : {}) }}
        onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => { if (event.key === 'Enter') inputRef.current?.click(); }}
      >
        <div style={styles.dropIcon}>CSV</div>
        <div>
          <h2 style={styles.dropTitle}>Drag and drop your CSV here</h2>
          <p style={styles.dropText}>{message}</p>
          <p style={styles.hint}>Recommended headers: name, state, category, website, note, fitScore</p>
        </div>
      </section>

      <section style={styles.toolbar}>
        <input style={styles.search} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search imported accounts..." />
        <button style={styles.primarySmall} onClick={scanVisible} disabled={!filtered.length}>Scan visible</button>
        <button style={styles.secondarySmall} onClick={exportImported} disabled={!accounts.length}>Export imported</button>
      </section>

      <section style={styles.grid}>
        {filtered.map((account) => {
          const result = results[account.id];
          return (
            <article key={account.id} style={styles.card}>
              <div style={styles.cardTop}>
                <span style={styles.badge}>{account.state}</span>
                <button style={styles.scanButton} onClick={() => scan(account)} disabled={result?.status === 'scanning'}>{result?.status === 'scanning' ? 'Scanning...' : 'Scan'}</button>
              </div>
              <h3 style={styles.cardTitle}>{account.name}</h3>
              <p style={styles.meta}>{account.category} {account.website ? `· ${account.website}` : ''}</p>
              <p style={styles.note}>{account.note}</p>
              <div style={styles.meter}><i style={{ ...styles.meterFill, width: `${Math.max(0, Math.min(100, account.fitScore))}%` }} /></div>
              <div style={styles.resultBox}>
                <strong>{result?.signal || 'Ready to scan'}</strong>
                <span>{result?.confidence ? `${result.confidence}% confidence` : `Fit ${account.fitScore}`}</span>
                {result?.reasoning && <p>{result.reasoning}</p>}
                {result?.searchQuery && <code style={styles.code}>{result.searchQuery}</code>}
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  shell: { width: 'min(1440px, calc(100% - 28px))', margin: '0 auto', padding: '34px 0 60px', color: '#17130f' },
  hero: { display: 'grid', gridTemplateColumns: 'minmax(0,1.35fr) minmax(280px,.65fr)', gap: 20, alignItems: 'stretch' },
  eyebrow: { margin: '0 0 10px', color: '#8a5b20', fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.18em', fontFamily: 'ui-sans-serif, system-ui' },
  title: { margin: 0, maxWidth: 850, fontFamily: 'Georgia, Times New Roman, serif', fontSize: 'clamp(3.4rem, 8vw, 7.8rem)', lineHeight: .86, letterSpacing: '-0.08em' },
  lede: { maxWidth: 780, color: '#675f55', fontSize: 'clamp(1rem, 1.7vw, 1.28rem)', lineHeight: 1.58 },
  actions: { display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 24 },
  primary: { border: 0, borderRadius: 999, padding: '14px 20px', background: '#1f1a15', color: '#fff8ed', fontWeight: 900, cursor: 'pointer' },
  secondary: { border: '1px solid rgba(31,26,21,.16)', borderRadius: 999, padding: '14px 20px', background: 'rgba(255,255,255,.55)', color: '#1f1a15', fontWeight: 900, cursor: 'pointer' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 },
  stat: { minHeight: 132, border: '1px solid rgba(31,26,21,.14)', borderRadius: 26, padding: 18, background: 'rgba(255,250,241,.76)', boxShadow: '0 24px 70px rgba(42,30,19,.14)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' },
  dropzone: { marginTop: 22, border: '2px dashed rgba(31,26,21,.24)', borderRadius: 32, padding: 28, minHeight: 170, display: 'flex', gap: 20, alignItems: 'center', background: 'rgba(255,250,241,.66)', boxShadow: '0 24px 70px rgba(42,30,19,.12)', cursor: 'pointer' },
  dropzoneActive: { borderColor: '#245f43', background: 'rgba(183,240,109,.2)', transform: 'translateY(-2px)' },
  dropIcon: { width: 86, height: 86, borderRadius: 24, background: '#1f1a15', color: '#fff8ed', display: 'grid', placeItems: 'center', fontWeight: 950, letterSpacing: '.1em' },
  dropTitle: { margin: '0 0 6px', fontFamily: 'Georgia, Times New Roman, serif', fontSize: 'clamp(1.7rem, 4vw, 3rem)', letterSpacing: '-.05em' },
  dropText: { margin: '0 0 8px', color: '#675f55', fontWeight: 800 },
  hint: { margin: 0, color: '#8a8176', fontSize: 14 },
  toolbar: { marginTop: 20, display: 'flex', flexWrap: 'wrap', gap: 10, padding: 12, border: '1px solid rgba(31,26,21,.14)', borderRadius: 24, background: 'rgba(255,250,241,.72)' },
  search: { flex: '1 1 280px', border: '1px solid rgba(31,26,21,.16)', borderRadius: 999, padding: '13px 16px', background: 'rgba(255,255,255,.72)', color: '#1f1a15' },
  primarySmall: { border: 0, borderRadius: 999, padding: '12px 16px', background: '#245f43', color: '#fff8ed', fontWeight: 900, cursor: 'pointer' },
  secondarySmall: { border: '1px solid rgba(31,26,21,.16)', borderRadius: 999, padding: '12px 16px', background: 'rgba(255,255,255,.55)', color: '#1f1a15', fontWeight: 900, cursor: 'pointer' },
  grid: { marginTop: 18, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 },
  card: { border: '1px solid rgba(31,26,21,.14)', borderRadius: 26, padding: 18, background: 'rgba(255,250,241,.78)', boxShadow: '0 20px 54px rgba(42,30,19,.12)' },
  cardTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  badge: { borderRadius: 999, padding: '8px 11px', background: 'rgba(31,26,21,.08)', color: '#675f55', fontWeight: 950 },
  scanButton: { border: 0, borderRadius: 999, padding: '9px 13px', background: '#1f1a15', color: '#fff8ed', fontWeight: 900, cursor: 'pointer' },
  cardTitle: { margin: '22px 0 8px', fontFamily: 'Georgia, Times New Roman, serif', fontSize: 27, lineHeight: 1, letterSpacing: '-.05em' },
  meta: { margin: '0 0 10px', color: '#675f55', fontWeight: 800 },
  note: { minHeight: 44, margin: 0, color: '#675f55', lineHeight: 1.45 },
  meter: { height: 8, margin: '18px 0', borderRadius: 999, overflow: 'hidden', background: 'rgba(31,26,21,.1)' },
  meterFill: { display: 'block', height: '100%', borderRadius: 999, background: 'linear-gradient(90deg,#245f43,#d7a63f)' },
  resultBox: { borderTop: '1px solid rgba(31,26,21,.12)', paddingTop: 14, display: 'grid', gap: 6 },
  code: { whiteSpace: 'normal', borderRadius: 16, padding: 10, background: 'rgba(36,95,67,.08)', color: '#245f43', fontSize: 13 }
};
