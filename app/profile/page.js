'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { apiFetch } from '@/lib/api';
import { useLang, T } from '@/lib/lang';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const router = useRouter();
  const { lang } = useLang();
  const t = T[lang];

  useEffect(() => {
    const raw = localStorage.getItem('user');
    if (!raw) { router.push('/login'); return; }
    setUser(JSON.parse(raw));
  }, []);

  async function handleLogout() {
    try { await apiFetch('/auth/logout', { method: 'POST' }); } catch {}
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  }

  if (!user) return null;

  const initials = user.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 480, margin: '2rem auto', padding: '1rem' }}>

        {/* Avatar + name */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '2rem 1.5rem', textAlign: 'center', marginBottom: '1rem' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--primary)', color: 'white', fontSize: '1.6rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            {initials}
          </div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.35rem' }}>{user.name}</h2>
          {user.role === 'admin' && (
            <span style={{ display: 'inline-block', background: '#EFF6FF', color: '#2563EB', fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.75rem', borderRadius: 99, marginBottom: '0.5rem' }}>
              Admin
            </span>
          )}
        </div>

        {/* Quick links */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', marginBottom: '1rem' }}>
          {[
            { href: '/mavzular',  icon: '📚', label: t.topics   },
            { href: '/biletlar',  icon: '🎫', label: t.tickets  },
            { href: '/imtihon',   icon: '⏱',  label: t.exam     },
            { href: '/saqlangan', icon: '🔖', label: t.saved    },
            { href: '/xatolar',   icon: '❌', label: t.xato_title },
          ].map((item, i, arr) => (
            <Link key={item.href} href={item.href}
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.9rem 1.25rem', textDecoration: 'none', color: 'var(--text)', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none', fontSize: '0.9rem', fontWeight: 500 }}>
              <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
              <span>{item.label}</span>
              <span style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>›</span>
            </Link>
          ))}
        </div>

        {user.role === 'admin' && (
          <Link href="/admin"
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.9rem 1.25rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, textDecoration: 'none', color: '#2563EB', fontWeight: 600, marginBottom: '1rem', fontSize: '0.9rem' }}>
            <span>⚙️</span> Admin panel <span style={{ marginLeft: 'auto' }}>›</span>
          </Link>
        )}

        <button onClick={handleLogout}
          style={{ width: '100%', padding: '0.85rem', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 12, fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}>
          {t.logout}
        </button>
      </div>
    </>
  );
}
