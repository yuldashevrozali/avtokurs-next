'use client';
import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useLang, T } from '@/lib/lang';

const RULES = [
  { id: 'len',   test: p => p.length >= 8,                      label: 'Kamida 8 ta belgi' },
  { id: 'upper', test: p => /[A-Z]/.test(p),                    label: 'Katta harf (A-Z)' },
  { id: 'lower', test: p => /[a-z]/.test(p),                    label: 'Kichik harf (a-z)' },
  { id: 'digit', test: p => /[0-9]/.test(p),                    label: 'Raqam (0-9)' },
  { id: 'spec',  test: p => /[!@#$%^&*()\-_=+\[\]{};:'",.<>/?\\|`~]/.test(p), label: 'Maxsus belgi (!@#$% ...)' },
];

function passStrength(p) {
  if (!p) return 0;
  return RULES.filter(r => r.test(p)).length;
}

function LoginForm() {
  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const kicked = params.get('reason') === 'kicked';
  const { lang } = useLang();
  const t = T[lang];

  const strength = tab === 'register' ? passStrength(form.password) : 0;
  const allRulesMet = strength === RULES.length;

  async function submit(e) {
    e.preventDefault();
    setError(''); setPending(false);

    // Frontend validation for register
    if (tab === 'register' && !allRulesMet) {
      setError("Parol barcha talablarga javob bermayapdi");
      return;
    }

    setLoading(true);
    try {
      const endpoint = tab === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body = tab === 'login' ? { email: form.email, password: form.password } : form;
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { setError(data.message); return; }

      if (data.pending) { setPending(true); return; }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      router.push('/mavzular');
    } catch { setError('Server xatosi'); }
    finally { setLoading(false); }
  }

  // ── Telegram orqali kirish (o'zimizning tugma) ──
  const [tgReady, setTgReady] = useState(false);
  async function handleTelegram(tgUser) {
    setError(''); setPending(false); setLoading(true);
    try {
      const res = await fetch('/api/auth/telegram', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(tgUser),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Telegram xatosi'); return; }
      if (data.pending) { setPending(true); return; }
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      router.push('/mavzular');
    } catch { setError('Server xatosi'); }
    finally { setLoading(false); }
  }

  // Telegram widget kutubxonasini yuklaymiz (Telegram.Login.auth uchun)
  useEffect(() => {
    if (window.Telegram?.Login) { setTgReady(true); return; }
    const existing = document.getElementById('tg-widget-js');
    if (existing) { existing.addEventListener('load', () => setTgReady(true)); return; }
    const s = document.createElement('script');
    s.id = 'tg-widget-js';
    s.src = 'https://telegram.org/js/telegram-widget.js?22';
    s.async = true;
    s.onload = () => setTgReady(true);
    document.body.appendChild(s);
  }, []);

  function loginWithTelegram() {
    const botId = process.env.NEXT_PUBLIC_TELEGRAM_BOT_ID;
    if (!window.Telegram?.Login || !botId) {
      setError("Telegram hali yuklanmadi, birozdan so'ng urinib ko'ring");
      return;
    }
    window.Telegram.Login.auth({ bot_id: botId, request_access: 'write' }, (data) => {
      if (!data) return; // foydalanuvchi bekor qildi
      handleTelegram(data);
    });
  }

  const strengthColor = ['#E2E8F0', '#DC2626', '#F59E0B', '#F59E0B', '#16A34A', '#16A34A'];
  const strengthLabel = ['', 'Juda zaif', 'Zaif', "O'rtacha", 'Yaxshi', 'Kuchli'];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: '#F8FAFC' }}>
      <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: '2rem', width: '100%', maxWidth: 420 }}>
        <Link href="/" style={{ display: 'block', fontWeight: 700, fontSize: '1.1rem', color: '#2563EB', textDecoration: 'none', marginBottom: '1.5rem' }}>Avtotest</Link>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {['login', 'register'].map(tb => (
            <button key={tb} onClick={() => { setTab(tb); setError(''); setPending(false); setForm({ name: '', email: '', password: '' }); }}
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

        {pending ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
            <h3 style={{ color: '#1E293B', marginBottom: '0.5rem' }}>{t.pending_done}</h3>
            <p style={{ color: '#64748B', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1.25rem' }}>{t.pending_msg}</p>
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

              {/* Password field */}
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
              </div>

              {/* Password strength (register only) */}
              {tab === 'register' && form.password && (
                <div style={{ marginTop: '-0.5rem', marginBottom: '1rem' }}>
                  {/* Strength bar */}
                  <div style={{ display: 'flex', gap: 3, marginBottom: '0.5rem' }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < strength ? strengthColor[strength] : '#E2E8F0', transition: 'background 0.2s' }} />
                    ))}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: strengthColor[strength], fontWeight: 600, marginBottom: '0.5rem' }}>
                    {strengthLabel[strength]}
                  </div>
                  {/* Rules checklist */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    {RULES.map(r => {
                      const ok = r.test(form.password);
                      return (
                        <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: ok ? '#16A34A' : '#94A3B8' }}>
                          <span style={{ fontSize: '0.75rem' }}>{ok ? '✅' : '⬜'}</span>
                          <span>{r.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <button type="submit" className="btn btn-primary"
                style={{ width: '100%', padding: '0.7rem', opacity: (loading || (tab === 'register' && !allRulesMet)) ? 0.6 : 1 }}
                disabled={loading || (tab === 'register' && !allRulesMet)}>
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
