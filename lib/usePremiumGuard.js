'use client';
import { useEffect, useState } from 'react';

// Kirish huquqini tekshiradi. check(user) => true (ruxsat) / false (premium kerak)
// Qaytadi: 'loading' | 'ok' | 'denied'
export function useGuard(check) {
  const [status, setStatus] = useState('loading');
  useEffect(() => {
    let u = null;
    try { u = JSON.parse(localStorage.getItem('user') || 'null'); } catch {}
    setStatus(check(u) ? 'ok' : 'denied');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return status;
}
