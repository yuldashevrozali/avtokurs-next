'use client';
import { useEffect, useRef } from 'react';

// Savollar bo'ylab klaviatura va swipe bilan harakatlanish.
//   Noutbuk / klaviatura:  → keyingi savol,  ← oldingi savol
//   Telefon (swipe):       o'ngga surish → keyingi,  chapga surish → oldingi
export function useQuestionNav({ next, prev, enabled = true }) {
  const ref = useRef({ next, prev, enabled });
  ref.current = { next, prev, enabled };

  useEffect(() => {
    function onKey(e) {
      if (!ref.current.enabled) return;
      const el = e.target;
      const tag = (el?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || el?.isContentEditable) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); ref.current.next?.(); }
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); ref.current.prev?.(); }
    }

    let sx = 0, sy = 0, tracking = false;
    function onStart(e) {
      if (!ref.current.enabled || e.touches.length !== 1) { tracking = false; return; }
      sx = e.touches[0].clientX; sy = e.touches[0].clientY; tracking = true;
    }
    function onEnd(e) {
      if (!tracking) return;
      tracking = false;
      const t = e.changedTouches[0];
      const dx = t.clientX - sx, dy = t.clientY - sy;
      // Faqat aniq gorizontal surishni hisobga olamiz
      if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      if (dx > 0) ref.current.next?.();   // o'ngga surish → keyingi
      else ref.current.prev?.();          // chapga surish → oldingi
    }

    window.addEventListener('keydown', onKey);
    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchend', onEnd, { passive: true });
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchend', onEnd);
    };
  }, []);
}
