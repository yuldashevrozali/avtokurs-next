'use client';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useLang, T } from '@/lib/lang';

function LoginForm() {
  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const kicked = params.get('reason') === 'kicked';
  const { lang } = useLang();
  const t = T[lang];

  async function submit(e) {
    e.preventDefault();
    setError(''); setPending(false); setLoading(true);
    try {
      const endpoint = tab === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body = tab === 'login' ? { email: form.email, password: form.password } : form;
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { setError(data.message); return; }

      // Register: no token, just pending message
      if (data.pending) { setPending(true); return; }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      router.push('/mavzular');
    } catch { setError('Server xatosi'); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: '#F8FAFC' }}>
      <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 10, padding: '2rem', width: '100%', maxWidth: 400 }}>
        <Link href="/" style={{ display: 'block', fontWeight: 700, fontSize: '1.1rem', color: '#2563EB', textDecoration: 'none', marginBottom: '1.5rem' }}>Avtotest</Link>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {['login', 'register'].map(tb => (
            <button key={tb} onClick={() => { setTab(tb); setError(''); setPending(false); }}
              style={{ flex: 1, padding: '0.5rem', borderRadius: 6, border: '1px solid #E2E8F0', background: tab === tb ? '#2563EB' : 'white', color: tab === tb ? 'white' : '#64748B', fontWeight: 500, cursor: 'pointer' }}>
              {tb === 'login' ? t.login_tab : t.reg_tab}
            </button>
          ))}
        </div>

        {kicked && (
          <div style={{ background: '#FFF7ED', color: '#C2410C', border: '1px solid #FED7AA', padding: '0.75rem', borderRadius: 6, fontSize: '0.875rem', marginBottom: '1rem' }}>
            {t.kicked}
          </div>
        )}

        {pending ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
            <h3 style={{ color: '#1E293B', marginBottom: '0.5rem' }}>{t.pending_done}</h3>
            <p style={{ color: '#64748B', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              {t.pending_msg}
            </p>
            <button onClick={() => { setTab('login'); setPending(false); setForm({ name: '', email: '', password: '' }); }}
              style={{ padding: '0.6rem 1.5rem', background: '#2563EB', color: 'white', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>
              {t.go_login}
            </button>
          </div>
        ) : (
          <>
            {error && <div style={{ background: '#FEF2F2', color: '#DC2626', padding: '0.75rem', borderRadius: 6, fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</div>}
            <form onSubmit={submit}>
              {tab === 'register' && (
                <div className="form-group">
                  <label>{t.name_l}</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ismingiz" required />
                </div>
              )}
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" required />
              </div>
              <div className="form-group">
                <label>{t.password_l}</label>
                <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" required />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.7rem' }} disabled={loading}>
                {loading ? t.loading : (tab === 'login' ? t.login_tab : t.reg_tab)}
              </button>
            </form>
          </>
        )}

        <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem', color: '#64748B' }}>
          <Link href="/setup" style={{ color: '#2563EB' }}>{t.admin_setup}</Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
