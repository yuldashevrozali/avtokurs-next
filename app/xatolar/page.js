'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { apiFetch } from '@/lib/api';
import { useLang, T } from '@/lib/lang';

const LABELS = ['F1', 'F2', 'F3', 'F4', 'F5'];

export default function XatolarPage() {
  const router = useRouter();
  const [phase, setPhase] = useState('loading'); // loading | empty | playing | done
  const [questions, setQuestions] = useState([]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selected, setSelected] = useState(null);
  const [savedIds, setSavedIds] = useState(new Set());
  const autoRef = useRef(null);
  const { lang } = useLang();
  const t = T[lang];

  useEffect(() => {
    const raw = localStorage.getItem('user');
    if (!raw) { router.push('/login'); return; }
    Promise.all([
      apiFetch('/xatolar'),
      apiFetch('/saved').catch(() => []),
    ]).then(([qs, ids]) => {
      setSavedIds(new Set(ids));
      if (!qs || qs.length === 0) { setPhase('empty'); return; }
      setQuestions(qs);
      setPhase('playing');
    });
  }, []);

  function select(i) {
    if (selected !== null) return;
    const q = questions[idx];
    const correctIdx = q.variants.findIndex(v => v.is_correct);
    const isCorrect = i === correctIdx;
    setSelected(i);
    setAnswers(prev => ({ ...prev, [idx]: { selected: i, correctIdx, isCorrect } }));
    if (isCorrect) {
      const cur = idx;
      clearTimeout(autoRef.current);
      autoRef.current = setTimeout(() => {
        if (cur + 1 >= questions.length) return; // oxirgi savol — foydalanuvchi Yakunlash tugmasini bossin
        setIdx(cur + 1);
        setSelected(null);
      }, 600);
    }
  }

  function next() {
    if (idx + 1 >= questions.length) { setPhase('done'); return; }
    setIdx(i => i + 1);
    setSelected(answers[idx + 1]?.selected ?? null);
  }

  function goTo(i) {
    clearTimeout(autoRef.current);
    setIdx(i);
    setSelected(answers[i]?.selected ?? null);
  }

  async function toggleSave(questionId) {
    const isSaved = savedIds.has(questionId);
    setSavedIds(prev => { const n = new Set(prev); isSaved ? n.delete(questionId) : n.add(questionId); return n; });
    try { await apiFetch('/saved', { method: 'POST', body: JSON.stringify({ questionId }) }); }
    catch { setSavedIds(prev => { const n = new Set(prev); isSaved ? n.add(questionId) : n.delete(questionId); return n; }); }
  }

  function restart() {
    setIdx(0); setAnswers({}); setSelected(null); setPhase('playing');
  }

  const correctCount = Object.values(answers).filter(a => a.isCorrect).length;
  const total = questions.length;

  // ── LOADING ──
  if (phase === 'loading') {
    return <><Navbar /><div className="container" style={{ textAlign: 'center', paddingTop: '4rem' }}><p style={{ color: 'var(--text-muted)' }}>{t.loading}</p></div></>;
  }

  // ── EMPTY ──
  if (phase === 'empty') {
    return (
      <>
        <Navbar />
        <div style={{ maxWidth: 480, margin: '4rem auto', padding: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🎉</div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.5rem' }}>{t.xato_empty}</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: 1.6 }}>{t.xato_empty_sub}</p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/mavzular" className="btn btn-primary">{t.topics}</Link>
            <Link href="/" className="btn btn-outline">{t.home_l}</Link>
          </div>
        </div>
      </>
    );
  }

  // ── DONE ──
  if (phase === 'done') {
    const score = Math.round((correctCount / total) * 100);
    const pass = score >= 80;
    return (
      <>
        <Navbar />
        <div style={{ maxWidth: 520, margin: '2rem auto', padding: '1rem' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '2.5rem 1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>{pass ? '🎉' : '💪'}</div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.5rem' }}>
              {pass ? t.congrats : t.study_more}
            </h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>{t.xato_title} · {total} {t.q_count}</p>
            <div style={{ fontSize: '3rem', fontWeight: 800, color: pass ? '#16A34A' : '#DC2626', margin: '0.5rem 0 1.5rem' }}>{score}%</div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
              <span style={{ padding: '0.5rem 1.25rem', borderRadius: 8, background: '#DCFCE7', color: '#166534', fontWeight: 600 }}>{t.correct_l}: {correctCount}</span>
              <span style={{ padding: '0.5rem 1.25rem', borderRadius: 8, background: '#FEE2E2', color: '#991B1B', fontWeight: 600 }}>{t.wrong_l}: {total - correctCount}</span>
            </div>

            {/* Review grid */}
            <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '0.875rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center' }}>
                {questions.map((_, i) => {
                  const a = answers[i];
                  return (
                    <div key={i} onClick={() => { goTo(i); setPhase('playing'); }}
                      style={{ width: 28, height: 28, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer',
                        background: !a ? 'var(--border)' : a.isCorrect ? '#DCFCE7' : '#FEE2E2',
                        color: !a ? 'var(--text-muted)' : a.isCorrect ? '#166534' : '#991B1B' }}>
                      {i + 1}
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={restart} className="btn btn-primary">{t.restart}</button>
              <Link href="/" className="btn btn-outline">{t.home_l}</Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── PLAYING ──
  const q = questions[idx];
  if (!q) return null;
  const correctIdx = q.variants.findIndex(v => v.is_correct);
  const isSaved = savedIds.has(q.id);
  const pct = Math.round((idx / total) * 100);

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '1.5rem 1rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.1rem' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#DC2626', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            ❌ {t.xato_title}
          </span>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            <strong style={{ color: 'var(--text)' }}>{idx + 1}</strong> / {total}
          </span>
        </div>

        {/* Progress */}
        <div className="progress-bar-wrap" style={{ marginBottom: '1.25rem' }}>
          <div style={{ height: '100%', borderRadius: 99, background: '#DC2626', width: `${pct}%`, transition: 'width 0.3s' }} />
        </div>

        {/* Question card */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
          {q.image_url && <img src={q.image_url} alt="" style={{ width: '100%', maxHeight: 260, objectFit: 'contain', background: 'var(--bg)', display: 'block' }} onError={e => e.target.style.display = 'none'} />}
          <div style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1.1rem' }}>
              <p style={{ flex: 1, fontSize: '0.975rem', fontWeight: 500, lineHeight: 1.55, color: 'var(--text)', margin: 0 }}>{q.text[lang] || q.text.uz}</p>
              <button onClick={() => toggleSave(q.id)}
                style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', lineHeight: 1, padding: '0.1rem', color: isSaved ? '#F59E0B' : 'var(--text-muted)', transition: 'color 0.15s' }}>
                🔖
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {q.variants.map((v, i) => {
                let bg = 'var(--surface)', border = '1.5px solid var(--border)', color = 'var(--text)';
                if (selected !== null) {
                  if (i === correctIdx) { bg = '#F0FDF4'; border = '1.5px solid #16A34A'; color = '#166534'; }
                  if (i === selected && selected !== correctIdx) { bg = '#FEF2F2'; border = '1.5px solid #DC2626'; color = '#991B1B'; }
                }
                return (
                  <button key={i} onClick={() => select(i)} disabled={selected !== null}
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
                {idx + 1 < total ? t.next_q : t.finish}
              </button>
            </div>
          )}
        </div>

        {/* Navigation grid */}
        <div className="q-nav-grid">
          {questions.map((_, i) => {
            const a = answers[i];
            const isCurr = i === idx;
            return (
              <div key={i} onClick={() => goTo(i)} className="q-nav-cell"
                style={{
                  background: a ? (a.isCorrect ? '#DCFCE7' : '#FEE2E2') : isCurr ? '#DC2626' : 'var(--border)',
                  color: a ? (a.isCorrect ? '#166534' : '#991B1B') : isCurr ? 'white' : 'var(--text-muted)',
                  border: isCurr && !a ? '2px solid #DC2626' : '2px solid transparent',
                }}>
                {i + 1}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
