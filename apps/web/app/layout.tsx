import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Olze — Build anything with AI',
  description: 'Free-first AI development platform. Design, code, connect your backend, and deploy — all from one place. No Ollama required.',
  icons: { icon: '/olze-icon.svg' },
  openGraph: { title: 'Olze — Build anything with AI', description: 'Build websites and apps with AI. No Ollama required. No credit card required.' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
