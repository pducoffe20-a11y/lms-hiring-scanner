import Link from 'next/link';

const links = [
  {
    href: '/',
    title: 'Main scanner',
    description: 'Run first-pass LMS hiring signal scans across seeded association accounts.'
  },
  {
    href: '/upload',
    title: 'CSV import',
    description: 'Drag and drop a CSV, preview imported accounts, scan visible rows, and export results.'
  },
  {
    href: '/research',
    title: 'Second-level research',
    description: 'Focus on strong-fit accounts and verify whether there is a real learning program driver.'
  }
];

export default function StartPage() {
  return (
    <main style={{ width: 'min(1100px, calc(100% - 28px))', margin: '0 auto', padding: '42px 0 70px', color: '#17130f' }}>
      <section style={{ border: '1px solid rgba(31,26,21,.14)', borderRadius: 34, padding: 'clamp(28px, 6vw, 64px)', background: 'rgba(255,250,241,.8)', boxShadow: '0 24px 70px rgba(42,30,19,.14)' }}>
        <p style={{ margin: '0 0 12px', color: '#8a5b20', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.18em', fontSize: 12 }}>LMS Hiring Scanner</p>
        <h1 style={{ margin: 0, fontFamily: 'Georgia, serif', fontSize: 'clamp(3.2rem, 8vw, 7rem)', lineHeight: .88, letterSpacing: '-.08em' }}>Choose your workflow.</h1>
        <p style={{ color: '#675f55', fontSize: 20, lineHeight: 1.55, maxWidth: 760 }}>Use the scanner for first-pass account fit, import your own CSV list, or run second-level driver research on strong-fit accounts.</p>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginTop: 18 }}>
        {links.map((item) => (
          <Link key={item.href} href={item.href} style={{ display: 'block', minHeight: 220, border: '1px solid rgba(31,26,21,.14)', borderRadius: 28, padding: 22, background: 'rgba(255,250,241,.78)', boxShadow: '0 20px 54px rgba(42,30,19,.12)', color: '#17130f', textDecoration: 'none' }}>
            <span style={{ display: 'inline-grid', placeItems: 'center', width: 44, height: 44, borderRadius: 999, background: '#1f1a15', color: '#fff8ed', fontWeight: 900 }}>→</span>
            <h2 style={{ margin: '24px 0 10px', fontFamily: 'Georgia, serif', fontSize: 32, lineHeight: 1, letterSpacing: '-.05em' }}>{item.title}</h2>
            <p style={{ margin: 0, color: '#675f55', lineHeight: 1.5 }}>{item.description}</p>
          </Link>
        ))}
      </section>
    </main>
  );
}
