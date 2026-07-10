'use client';
import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useLang, T } from '@/lib/lang';

function LoginForm() {
  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({ name: '', phone: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const kicked = params.get('reason') === 'kicked';
  const { lang } = useLang();
  const t = T[lang];

  const emptyForm = { name: '', phone: '', password: '' };

  const regValid = form.name.trim() && /^\+?\d{7,15}$/.test(form.phone.replace(/[\s()\-]/g, '')) && form.password.length >= 6;
  const canSubmit = tab === 'login' ? (form.phone && form.password) : regValid;

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!canSubmit) return;
    setLoading(true);
    try {
      const endpoint = tab === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body = tab === 'login'
        ? { phone: form.phone, password: form.password }
        : { name: form.name, phone: form.phone, password: form.password };
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { setError(data.message); return; }
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      router.push('/mavzular');
    } catch { setError('Server xatosi'); }
    finally { setLoading(false); }
  }

  // ── Telegram orqali kirish ──
  async function handleTelegram(tgUser) {
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/telegram', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(tgUser),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Telegram xatosi'); return; }
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      router.push('/mavzular');
    } catch { setError('Server xatosi'); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    if (window.Telegram?.Login) return;
    if (document.getElementById('tg-widget-js')) return;
    const s = document.createElement('script');
    s.id = 'tg-widget-js';
    s.src = 'https://telegram.org/js/telegram-widget.js?22';
    s.async = true;
    document.body.appendChild(s);
  }, []);

  function loginWithTelegram() {
    const botId = process.env.NEXT_PUBLIC_TELEGRAM_BOT_ID;
    if (!window.Telegram?.Login || !botId) {
      setError("Telegram hali yuklanmadi, birozdan so'ng urinib ko'ring");
      return;
    }
    window.Telegram.Login.auth({ bot_id: botId, request_access: 'write' }, (data) => {
      if (!data) return;
      handleTelegram(data);
    });
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: '#F8FAFC' }}>
      <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: '2rem', width: '100%', maxWidth: 420 }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1.1rem', color: '#2563EB', textDecoration: 'none', marginBottom: '1.5rem' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-icon.svg" alt="" width={28} height={28} style={{ display: 'block' }} />
          avtoqoida.uz
        </Link>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {['login', 'register'].map(tb => (
            <button key={tb} onClick={() => { setTab(tb); setError(''); setForm(emptyForm); }}
              style={{ flex: 1, padding: '0.5rem', borderRadius: 6, border: '1px solid #E2E8F0', background: tab === tb ? '#2563EB' : 'white', color: tab === tb ? 'white' : '#64748B', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s' }}>
              {tb === 'login' ? t.login_tab : t.reg_tab}
            </button>
          ))}
        </div>

        {kicked && (
          <div style={{ background: '#FFF7ED', color: '#C2410C', border: '1px solid #FED7AA', padding: '0.75rem', borderRadius: 6, fontSize: '0.875rem', marginBottom: '1rem' }}>
            {t.kicked}
          </div>
        )}

        {error && <div style={{ background: '#FEF2F2', color: '#DC2626', padding: '0.75rem', borderRadius: 6, fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</div>}

        <form onSubmit={submit}>
          {tab === 'register' && (
            <div className="form-group">
              <label>{t.name_l}</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ismingiz" required />
            </div>
          )}

          <div className="form-group">
            <label>Telefon raqami</label>
            <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+998901234567" required />
          </div>

          <div className="form-group">
            <label>{t.password_l}</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPwd ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                required
                style={{ paddingRight: '2.5rem', width: '100%', boxSizing: 'border-box' }}
              />
              <button type="button" onClick={() => setShowPwd(v => !v)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: '#94A3B8', lineHeight: 1 }}>
                {showPwd ? '🙈' : '👁'}
              </button>
            </div>
            {tab === 'register' && (
              <p style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.35rem' }}>Kamida 6 ta belgi</p>
            )}
          </div>

          <button type="submit" className="btn btn-primary"
            style={{ width: '100%', padding: '0.7rem', opacity: (loading || !canSubmit) ? 0.6 : 1 }}
            disabled={loading || !canSubmit}>
            {loading ? t.loading : (tab === 'login' ? t.login_tab : t.reg_tab)}
          </button>
        </form>

        {/* Telegram orqali kirish */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1.25rem 0' }}>
          <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
          <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>yoki</span>
          <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
        </div>
        <button type="button" onClick={loginWithTelegram} disabled={loading}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
            padding: '0.7rem', borderRadius: 8, border: 'none', cursor: loading ? 'default' : 'pointer',
            background: 'linear-gradient(180deg,#2AABEE 0%,#229ED9 100%)', color: 'white',
            fontWeight: 600, fontSize: '0.95rem', boxShadow: '0 2px 8px rgba(34,158,217,0.35)',
            opacity: loading ? 0.6 : 1, transition: 'filter 0.15s',
          }}
          onMouseOver={e => (e.currentTarget.style.filter = 'brightness(1.05)')}
          onMouseOut={e => (e.currentTarget.style.filter = 'none')}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71l-4.13-3.05-1.98 1.93c-.23.23-.42.42-.85.42z" />
          </svg>
          Telegram orqali kirish
        </button>

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
