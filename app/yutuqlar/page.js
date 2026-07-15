'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Loading from '@/components/Loading';
import { useLang, T } from '@/lib/lang';
import { getStreak, getStats, getAchievements } from '@/lib/gamification';

export default function YutuqlarPage() {
  const router = useRouter();
  const { lang } = useLang();
  const t = T[lang];
  const [user, setUser] = useState(null);
  const [streak, setStreak] = useState({ count: 0, best: 0 });
  const [stats, setStats] = useState({});
  const [achs, setAchs] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem('user');
    if (!raw) { router.push('/login'); return; }
    const u = JSON.parse(raw);
    setUser(u);
    setStreak(getStreak(u.id));
    setStats(getStats(u.id));
    setAchs(getAchievements(u.id, t));
    setReady(true);
  }, [lang]);

  if (!ready) return <><Navbar /><Loading label={t.loading} /></>;

  const doneCount = achs.filter(a => a.done).length;
  const allDone = doneCount === achs.length && achs.length > 0;

  function printCert() { window.print(); }

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '1.5rem 1rem' }}>

        {/* Sarlavha */}
        <div style={{ marginBottom: '1.25rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 0.25rem' }}>🏆 {t.ach_title}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>{t.ach_sub}</p>
        </div>

        {/* Streak + progress */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.875rem', marginBottom: '1.5rem' }}>
          <div style={{ background: 'linear-gradient(135deg,#F97316 0%,#EF4444 100%)', borderRadius: 12, padding: '1.1rem 1.25rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <span style={{ fontSize: '2.2rem', lineHeight: 1 }}>🔥</span>
            <div>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, lineHeight: 1 }}>{streak.count}</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>{t.streak_l} · {t.streak_best}: {streak.best}</div>
            </div>
          </div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '1.1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <span style={{ fontSize: '2.2rem', lineHeight: 1 }}>🏆</span>
            <div>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, lineHeight: 1, color: 'var(--primary)' }}>{doneCount}/{achs.length}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.ach_unlocked_l}</div>
            </div>
          </div>
        </div>

        {/* Achievements grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '0.875rem', marginBottom: '2rem' }}>
          {achs.map(a => {
            const pct = Math.round((a.progress / a.goal) * 100);
            return (
              <div key={a.id}
                style={{
                  background: 'var(--surface)',
                  border: `1.5px solid ${a.done ? '#16A34A' : 'var(--border)'}`,
                  borderRadius: 12, padding: '1.1rem',
                  opacity: a.done ? 1 : 0.85,
                  position: 'relative',
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '2rem', lineHeight: 1, filter: a.done ? 'none' : 'grayscale(1)' }}>{a.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text)' }}>{a.title}</div>
                  </div>
                  {a.done
                    ? <span style={{ fontSize: '0.7rem', background: '#DCFCE7', color: '#166534', borderRadius: 99, padding: '2px 8px', fontWeight: 700 }}>✓</span>
                    : <span style={{ fontSize: '1rem' }}>🔒</span>}
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4, margin: '0 0 0.7rem' }}>{a.desc}</p>
                <div style={{ background: 'var(--border)', borderRadius: 99, height: 6, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 99, background: a.done ? '#16A34A' : 'var(--primary)', width: `${pct}%`, transition: 'width 0.4s' }} />
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem', textAlign: 'right' }}>
                  {a.progress} / {a.goal}
                </div>
              </div>
            );
          })}
        </div>

        {/* Sertifikat */}
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.75rem' }}>🎓 {t.cert_title}</h2>
        {allDone ? (
          <>
            <div className="certificate" style={{
              background: 'var(--surface)',
              border: '3px double var(--primary)',
              borderRadius: 14, padding: '2.5rem 1.5rem', textAlign: 'center',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🏅</div>
              <div style={{ fontSize: '0.8rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--primary)', fontWeight: 700, marginBottom: '0.5rem' }}>Avtoqoida.uz</div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 0.75rem' }}>{t.cert_congrats}</h3>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)', margin: '0.5rem 0 1rem', borderBottom: '2px solid var(--border)', display: 'inline-block', padding: '0 1rem 0.4rem' }}>
                {user?.name || ''}
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, maxWidth: 480, margin: '0 auto 1.25rem' }}>
                — {t.cert_body}
              </p>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.cert_date}: {new Date().toLocaleDateString('uz-UZ')}</div>
            </div>
            <div style={{ textAlign: 'center', marginTop: '1rem' }} className="no-print">
              <button onClick={printCert} className="btn btn-primary">🖨 {t.cert_print}</button>
            </div>
          </>
        ) : (
          <div style={{ background: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: 14, padding: '2rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem', filter: 'grayscale(1)', opacity: 0.6 }}>🎓</div>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>🔒 {t.cert_locked}</p>
            <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>{doneCount} / {achs.length}</div>
          </div>
        )}
      </div>

      <style>{`
        @media print {
          nav, .no-print, footer, .mobile-bottom-nav { display: none !important; }
          .certificate { border-color: #2563EB !important; box-shadow: none; }
        }
      `}</style>
    </>
  );
}
