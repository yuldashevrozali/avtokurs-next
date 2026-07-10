'use client';
import { useEffect, useState } from 'react';

export default function PremiumCongrats() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onCongrats = () => setShow(true);
    window.addEventListener('premium-congrats', onCongrats);
    return () => window.removeEventListener('premium-congrats', onCongrats);
  }, []);

  if (!show) return null;

  return (
    <div onClick={() => setShow(false)}
      style={{
        position: 'fixed', inset: 0, zIndex: 100001, background: 'rgba(15,23,42,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        animation: 'pc-fade 0.2s ease',
      }}>
      <div onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface,#fff)', borderRadius: 18, padding: '2.25rem 1.75rem', maxWidth: 420, width: '100%',
          textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.35)', animation: 'pc-pop 0.25s ease',
        }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>🎉</div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text,#0f172a)', margin: '0 0 0.75rem' }}>
          Tabriklaymiz!
        </h2>
        <p style={{ color: 'var(--text-muted,#475569)', lineHeight: 1.65, fontSize: '1rem', margin: '0 0 1.75rem' }}>
          Siz admin tomonidan <strong style={{ color: '#2563EB' }}>Premium</strong> foydalanuvchiga aylandingiz.
          Endi <strong>hech qanday cheklovlarsiz</strong> tayyorlanishingiz mumkin! 🚗
        </p>
        <button onClick={() => setShow(false)}
          style={{
            width: '100%', padding: '0.85rem', borderRadius: 10, border: 'none', cursor: 'pointer',
            fontWeight: 700, fontSize: '1rem', color: 'white',
            background: 'linear-gradient(180deg,#2563EB,#1D4ED8)', boxShadow: '0 3px 10px rgba(37,99,235,0.35)',
          }}>
          Boshlash 🚀
        </button>
      </div>
      <style>{`
        @keyframes pc-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes pc-pop { from { transform: scale(0.9); opacity: 0 } to { transform: scale(1); opacity: 1 } }
      `}</style>
    </div>
  );
}
