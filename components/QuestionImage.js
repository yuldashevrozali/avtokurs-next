'use client';
import { useState, useEffect } from 'react';

// Savol rasmi: yuklanmaguncha skeleton ko'rsatadi, eski rasm turib qolmaydi,
// xato bo'lsa qayta urinish tugmasi chiqadi.
export default function QuestionImage({ src, onClick, maxHeight = 280 }) {
  const [status, setStatus] = useState('loading'); // loading | loaded | error
  const [bust, setBust] = useState(0);

  // src o'zgarganda holatni tiklaymiz — eski rasm darrov yashiriladi
  useEffect(() => { setStatus('loading'); setBust(0); }, [src]);

  if (!src) return null;
  const url = bust ? `${src}${src.includes('?') ? '&' : '?'}r=${bust}` : src;

  return (
    <div style={{ position: 'relative', width: '100%', background: 'var(--bg)', borderRadius: 8, overflow: 'hidden', minHeight: status === 'loaded' ? 0 : 140 }}>
      {status === 'loading' && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="qimg-spinner" />
        </div>
      )}
      {status === 'error' && (
        <button type="button" onClick={() => { setStatus('loading'); setBust(b => b + 1); }}
          style={{ width: '100%', minHeight: 140, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          <span style={{ fontSize: '1.5rem' }}>🖼</span>
          Rasm yuklanmadi — qayta urinish uchun bosing
        </button>
      )}
      <img
        key={url}
        src={url}
        alt=""
        onClick={onClick}
        onLoad={() => setStatus('loaded')}
        onError={() => setStatus('error')}
        style={{ width: '100%', maxHeight, objectFit: 'contain', display: status === 'loaded' ? 'block' : 'none', cursor: onClick ? 'zoom-in' : 'default' }}
      />
      <style>{`.qimg-spinner{width:26px;height:26px;border:3px solid var(--border);border-top-color:var(--primary);border-radius:50%;animation:qimgspin .7s linear infinite}@keyframes qimgspin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
