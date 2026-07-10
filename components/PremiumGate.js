'use client';
import { useState } from 'react';

const TG_ADMIN = 'https://t.me/yuldashev_frontend';

export default function PremiumGate() {
  const [requested, setRequested] = useState(() => {
    if (typeof window === 'undefined') return false;
    try { return !!JSON.parse(localStorage.getItem('user') || '{}').premiumRequested; } catch { return false; }
  });
  const [sending, setSending] = useState(false);

  async function send() {
    setSending(true);
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/premium/request', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      u.premiumRequested = true;
      localStorage.setItem('user', JSON.stringify(u));
      setRequested(true);
    } catch {}
    finally { setSending(false); }
    window.open(TG_ADMIN, '_blank');
  }

  return (
    <div className="container" style={{ maxWidth: 520 }}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16,
        padding: '2.5rem 1.75rem', textAlign: 'center', marginTop: '1.5rem',
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%', margin: '0 auto 1.25rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(180deg,#FEF3C7,#FDE68A)', fontSize: '2.2rem',
        }}>🔒</div>

        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 0.6rem' }}>
          Bu bo'lim Premium uchun
        </h1>
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '1.75rem' }}>
          Bu bo'limdan foydalanish uchun <strong>Premium</strong> sotib olishingiz kerak.
          {requested ? '' : ' So\'rov yuborishni istaysizmi?'}
        </p>

        {requested ? (
          <>
            <div style={{
              background: '#DCFCE7', color: '#166534', border: '1px solid #86EFAC',
              borderRadius: 10, padding: '0.9rem 1rem', fontWeight: 600, marginBottom: '1rem',
            }}>
              ✅ Siz allaqachon so'rov yuborgansiz. Admin tez orada siz bilan bog'lanadi.
            </div>
            <a href={TG_ADMIN} target="_blank" rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                padding: '0.75rem 1.5rem', borderRadius: 10, textDecoration: 'none', fontWeight: 700,
                background: 'linear-gradient(180deg,#2AABEE,#229ED9)', color: 'white',
              }}>
              💬 Telegramda yozish — @yuldashev_frontend
            </a>
          </>
        ) : (
          <button onClick={send} disabled={sending}
            style={{
              width: '100%', maxWidth: 320, margin: '0 auto', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '0.5rem', padding: '0.85rem 1.5rem', borderRadius: 10,
              border: 'none', cursor: sending ? 'default' : 'pointer', fontWeight: 700, fontSize: '1rem',
              background: 'linear-gradient(180deg,#2563EB,#1D4ED8)', color: 'white',
              boxShadow: '0 3px 10px rgba(37,99,235,0.35)', opacity: sending ? 0.6 : 1,
            }}>
            📩 Yuborish
          </button>
        )}

        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '1.25rem' }}>
          Yuborgach <strong>@yuldashev_frontend</strong> ga yozing — Premium ochib beriladi.
        </p>
      </div>
    </div>
  );
}
