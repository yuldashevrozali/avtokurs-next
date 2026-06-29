'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { apiFetch } from '@/lib/api';
import { useLang, T } from '@/lib/lang';

const LABELS = ['F1', 'F2', 'F3', 'F4', 'F5'];
const START_COUNT = 3;

export default function MarafonPage() {
  const router = useRouter();
  const [phase, setPhase] = useState('menu'); // menu | loading | playing | done
  const [pool, setPool] = useState([]);
  const [queue, setQueue] = useState([]);
  const [poolIdx, setPoolIdx] = useState(START_COUNT);
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [flash, setFlash] = useState(false);
  const [record, setRecord] = useState(0);
  const flashTimer = useRef(null);
  const { lang } = useLang();
  const t = T[lang];

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (!u) { router.push('/login'); return; }
    const saved = parseInt(localStorage.getItem('marathon_record') || '0');
    setRecord(saved);
  }, []);

  async function startMarafon() {
    setPhase('loading');
    try {
      const all = await apiFetch('/marathon');
      setPool(all);
      setQueue(all.slice(0, START_COUNT));
      setPoolIdx(START_COUNT);
      setQIdx(0);
      setSelected(null);
      setCorrectCount(0);
      setWrongCount(0);
      setFlash(false);
      setPhase('playing');
    } catch (e) {
      alert(e.message);
      setPhase('menu');
    }
  }

  function selectAnswer(i) {
    if (selected !== null) return;
    const q = queue[qIdx];
    const correctIdx = q.variants.findIndex(v => v.is_correct);
    setSelected(i);
    if (i === correctIdx) {
      setCorrectCount(c => c + 1);
      if (poolIdx < pool.length) {
        const nextQ = pool[poolIdx];
        setQueue(prev => [...prev, nextQ]);
        setPoolIdx(pi => pi + 1);
        clearTimeout(flashTimer.current);
        setFlash(true);
        flashTimer.current = setTimeout(() => setFlash(false), 1800);
      }
    } else {
      setWrongCount(c => c + 1);
    }
  }

  function next() {
    const nextIdx = qIdx + 1;
    if (nextIdx >= queue.length) {
      finish(correctCount, wrongCount);
    } else {
      setQIdx(nextIdx);
      setSelected(null);
    }
  }

  function finish(correct, wrong) {
    const saved = parseInt(localStorage.getItem('marathon_record') || '0');
    if (correct > saved) {
      localStorage.setItem('marathon_record', String(correct));
      setRecord(correct);
    }
    setPhase('done');
  }

  // ── MENU ──
  if (phase === 'menu') {
    return (
      <>
        <Navbar />
        <div className="container" style={{ maxWidth: 540 }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '0.75rem' }}>🏃</div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text)', margin: '0 0 0.5rem' }}>{t.mar_title}</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>{t.mar_sub}</p>
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '1.5rem', marginBottom: '1.25rem' }}>
            <h3 style={{ color: 'var(--text)', fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.875rem' }}>📋 {t.mar_rules_t}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {[
                { icon: '✅', text: t.mar_rule1 },
                { icon: '❌', text: t.mar_rule2 },
                { icon: '🎯', text: t.mar_rule3 },
              ].map((r, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', fontSize: '0.9rem', color: 'var(--text)' }}>
                  <span style={{ minWidth: 22, fontSize: '1rem' }}>{r.icon}</span>
                  <span style={{ lineHeight: 1.4 }}>{r.text}</span>
                </div>
              ))}
            </div>
          </div>

          {record > 0 && (
            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
              <span style={{ fontSize: '1.75rem' }}>🏆</span>
              <div>
                <div style={{ fontSize: '0.78rem', color: '#92400E', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t.mar_record}</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#B45309', lineHeight: 1.1 }}>{record} <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{t.correct_l}</span></div>
              </div>
            </div>
          )}

          <button onClick={startMarafon} className="btn btn-primary" style={{ width: '100%', padding: '0.9rem', fontSize: '1.05rem', fontWeight: 700 }}>
            {t.mar_start}
          </button>
        </div>
      </>
    );
  }

  // ── LOADING ──
  if (phase === 'loading') {
    return (
      <><Navbar /><div className="container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <p style={{ color: 'var(--text-muted)' }}>{t.loading}</p>
      </div></>
    );
  }

  // ── DONE ──
  if (phase === 'done') {
    const total = correctCount + wrongCount;
    const pct = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    const isNewRecord = correctCount >= record && correctCount > 0;
    return (
      <>
        <Navbar />
        <div style={{ maxWidth: 500, margin: '2rem auto', padding: '1rem' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '2.5rem 1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🏁</div>
            <h2 style={{ color: 'var(--text)', margin: '0 0 0.75rem' }}>{t.mar_done_t}</h2>
            {isNewRecord && (
              <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: '0.45rem 1rem', marginBottom: '1rem', display: 'inline-block', fontSize: '0.875rem', color: '#B45309', fontWeight: 700 }}>
                🏆 {t.mar_new_rec}
              </div>
            )}
            <div style={{ fontSize: '4rem', fontWeight: 800, color: '#16A34A', margin: '0.5rem 0 0.25rem', lineHeight: 1 }}>
              {correctCount}
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{t.mar_total_desc}</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginBottom: '2rem', flexWrap: 'wrap' }}>
              <span style={{ padding: '0.5rem 1.25rem', borderRadius: 8, background: '#DCFCE7', color: '#166534', fontWeight: 600, fontSize: '0.9rem' }}>{t.correct_l}: {correctCount}</span>
              <span style={{ padding: '0.5rem 1.25rem', borderRadius: 8, background: '#FEE2E2', color: '#991B1B', fontWeight: 600, fontSize: '0.9rem' }}>{t.wrong_l}: {wrongCount}</span>
              <span style={{ padding: '0.5rem 1.25rem', borderRadius: 8, background: '#F1F5F9', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem' }}>{pct}%</span>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={startMarafon} className="btn btn-primary">{t.restart}</button>
              <button onClick={() => setPhase('menu')} className="btn btn-outline">{t.home_l}</button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── PLAYING ──
  const q = queue[qIdx];
  if (!q) return null;
  const correctIdx = q.variants.findIndex(v => v.is_correct);
  const queueRemaining = queue.length - qIdx - 1;
  const progressPct = Math.round((qIdx / Math.max(queue.length, 1)) * 100);

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '1.5rem 1rem' }}>

        {/* Stats bar */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.875rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flex: 1, flexWrap: 'wrap' }}>
            <span style={{ padding: '0.35rem 0.875rem', borderRadius: 8, background: '#DCFCE7', color: '#166534', fontSize: '0.85rem', fontWeight: 700 }}>
              ✅ {correctCount}
            </span>
            <span style={{ padding: '0.35rem 0.875rem', borderRadius: 8, background: '#FEE2E2', color: '#991B1B', fontSize: '0.85rem', fontWeight: 700 }}>
              ❌ {wrongCount}
            </span>
            <span style={{ padding: '0.35rem 0.875rem', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '0.85rem', fontWeight: 600 }}>
              📋 {t.mar_queue}: {queueRemaining}
            </span>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            {qIdx + 1} / {queue.length}
          </span>
        </div>

        {/* Progress bar */}
        <div className="progress-bar-wrap" style={{ marginBottom: '0.75rem' }}>
          <div style={{ height: '100%', borderRadius: 99, background: 'var(--primary)', width: `${progressPct}%`, transition: 'width 0.3s' }} />
        </div>

        {/* Flash: +1 savol added */}
        <div style={{ height: 36, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {flash && (
            <div style={{ background: '#DCFCE7', border: '1px solid #86EFAC', borderRadius: 8, padding: '0.4rem 1.1rem', fontSize: '0.875rem', fontWeight: 700, color: '#166534' }}>
              ✨ +1 {t.mar_added}
            </div>
          )}
        </div>

        {/* Question card */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          {q.image_url && (
            <img src={q.image_url} alt="" style={{ width: '100%', maxHeight: 280, objectFit: 'contain', background: 'var(--bg)', display: 'block' }}
              onError={e => e.target.style.display = 'none'} />
          )}
          <div style={{ padding: '1.25rem' }}>
            <p style={{ fontSize: '0.975rem', fontWeight: 500, lineHeight: 1.55, color: 'var(--text)', margin: '0 0 1.1rem' }}>
              {q.text[lang] || q.text.uz}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {q.variants.map((v, i) => {
                let bg = 'var(--surface)', border = '1.5px solid var(--border)', color = 'var(--text)';
                if (selected !== null) {
                  if (i === correctIdx) { bg = '#F0FDF4'; border = '1.5px solid #16A34A'; color = '#166534'; }
                  if (i === selected && selected !== correctIdx) { bg = '#FEF2F2'; border = '1.5px solid #DC2626'; color = '#991B1B'; }
                }
                return (
                  <button key={i} onClick={() => selectAnswer(i)} disabled={selected !== null}
                    style={{ padding: '0.8rem 1rem', border, borderRadius: 8, background: bg, color, textAlign: 'left', fontSize: '0.9rem', cursor: selected === null ? 'pointer' : 'default', display: 'flex', gap: '0.75rem', alignItems: 'flex-start', lineHeight: 1.4 }}>
                    <span style={{ minWidth: 22, height: 22, borderRadius: '50%', border: '1.5px solid var(--border)', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0, color: 'var(--text-muted)' }}>
                      {LABELS[i]}
                    </span>
                    <span>{v.text[lang] || v.text.uz}</span>
                  </button>
                );
              })}
            </div>
          </div>
          {selected !== null && (
            <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface)', gap: '1rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: selected === correctIdx ? '#16A34A' : '#DC2626' }}>
                {selected === correctIdx ? t.correct : t.wrong}
              </span>
              <button onClick={next} className="btn btn-primary">
                {qIdx + 1 < queue.length ? t.next_q : t.see_result}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
