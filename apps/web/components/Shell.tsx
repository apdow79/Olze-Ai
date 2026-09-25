'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase/client';

const nav = [
  { href: '/dashboard', label: 'Overview', icon: '◧' },
  { href: '/projects', label: 'Projects', icon: '🗂' },
  { href: '/settings', label: 'Settings', icon: '⚙' },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [email, setEmail] = useState<string | null>(null);
  const supabase = getSupabaseBrowser();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace('/login');
      else setEmail(data.session.user.email ?? 'you');
    });
    const { data: sub } = supabase.auth.onAuthStateChange((ev) => {
      if (ev === 'SIGNED_OUT') router.replace('/login');
    });
    return () => sub.subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function logout() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-56 shrink-0 border-r border-slate-800/70 p-4 md:block">
        <Link href="/" className="mb-8 flex items-center gap-2 font-bold text-white"><img src="/olze-icon.svg" className="h-6 w-6" alt="" /> Olze</Link>
        <nav className="space-y-1">
          {nav.map(n => (
            <Link key={n.href} href={n.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${pathname.startsWith(n.href) ? 'bg-brand-600/20 text-white' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'}`}>
              <span>{n.icon}</span> {n.label}
            </Link>
          ))}
        </nav>
        <p className="mt-8 rounded-lg border border-slate-800 p-3 text-xs text-slate-500">Free plan · fair-use AI limits apply. No Ollama required.</p>
      </aside>
      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-slate-800/70 px-6 py-3">
          <span className="text-sm text-slate-500">{email ?? '…'}</span>
          <button onClick={logout} className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:border-brand-500 hover:text-white">Log out</button>
        </header>
        <main className="p-6 md:p-10">{children}</main>
      </div>
    </div>
  );
}
