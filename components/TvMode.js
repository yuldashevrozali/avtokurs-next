'use client';
import { useEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';

// TV rejimi qaysi sahifalarda kontentni kattalashtiradi (test / savol sahifalari)
const BIG_ROUTES = [
  '/mavzular/', '/biletlar/', '/imtihon', '/mashq', '/marafon',
  '/xatolar', '/saqlangan', '/battle',
];
function isBigRoute(path) {
  if (!path) return false;
  return BIG_ROUTES.some(r => path === r || path.startsWith(r));
}

// Ekran kengligiga qarab mos boshlang'ich kattalashtirish darajasi
function autoScale() {
  if (typeof window === 'undefined') return 1.6;
  const w = window.innerWidth;
  if (w < 900) return 1; // telefon / kichik ekran — kattalashtirmaymiz
  return Math.min(2.4, Math.max(1.2, +(0.82 * w / 720).toFixed(2)));
}

export default function TvMode() {
  const pathname = usePathname();
  const [on, setOn] = useState(false);
  const [scale, setScale] = useState(1.6);

  // Boshlang'ich holat + boshqa joydan (admin tugmasi) yoqilganini eshitish
  useEffect(() => {
    const read = () => {
      setOn(localStorage.getItem('tvMode') === '1');
      const s = parseFloat(localStorage.getItem('tvScale'));
      setScale(!isNaN(s) && s >= 1 && s <= 3 ? s : autoScale());
    };
    read();
    window.addEventListener('tvmode-change', read);
    window.addEventListener('storage', read);
    return () => {
      window.removeEventListener('tvmode-change', read);
      window.removeEventListener('storage', read);
    };
  }, []);

  // Kontentni kattalashtirish (faqat test sahifalarida)
  useEffect(() => {
    const root = document.getElementById('tv-zoom-root');
    if (!root) return;
    const big = on && isBigRoute(pathname);
    root.style.zoom = big ? String(scale) : '';
    return () => { root.style.zoom = ''; };
  }, [on, scale, pathname]);

  const setOnPersist = useCallback((v) => {
    localStorage.setItem('tvMode', v ? '1' : '0');
    setOn(v);
    window.dispatchEvent(new Event('tvmode-change'));
  }, []);

  const setScalePersist = useCallback((v) => {
    const s = Math.min(3, Math.max(1, +v.toFixed(2)));
    localStorage.setItem('tvScale', String(s));
    setScale(s);
  }, []);

  if (!on) return null;

  const active = isBigRoute(pathname);

  return (
    <div style={{
      position: 'fixed', left: 12, bottom: 12, zIndex: 100000,
      display: 'flex', alignItems: 'center', gap: 6,
      background: '#0F172A', color: '#fff', borderRadius: 999,
      padding: '6px 8px', boxShadow: '0 6px 24px rgba(0,0,0,0.35)',
      fontFamily: 'system-ui,sans-serif', fontSize: 13, userSelect: 'none',
    }}>
      <span style={{ fontWeight: 700, padding: '0 6px', whiteSpace: 'nowrap' }} title={active ? 'Bu sahifa kattalashtirilgan' : 'Testga kirsangiz kattalashadi'}>
        📺 TV {active ? '' : '·'}
      </span>
      <button onClick={() => setScalePersist(scale - 0.15)} disabled={!active} style={btn(!active)} title="Kichraytirish">−</button>
      <span style={{ minWidth: 42, textAlign: 'center', fontVariantNumeric: 'tabular-nums', opacity: active ? 1 : 0.5 }}>
        {Math.round(scale * 100)}%
      </span>
      <button onClick={() => setScalePersist(scale + 0.15)} disabled={!active} style={btn(!active)} title="Kattalashtirish">+</button>
      <button onClick={() => setOnPersist(false)} style={{
        ...btn(false), background: '#DC2626', width: 'auto', padding: '0 10px', marginLeft: 4, fontWeight: 700,
      }} title="TV rejimini o'chirish">O'chirish</button>
    </div>
  );
}

function btn(disabled) {
  return {
    width: 28, height: 28, borderRadius: 999, border: 'none', cursor: disabled ? 'default' : 'pointer',
    background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: 16, fontWeight: 700,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    opacity: disabled ? 0.4 : 1,
  };
}
