import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LMS Hiring Signal Scanner',
  description: 'OpenAI-powered hiring-signal scanner for LMS and association prospecting.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
