'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Loading from '@/components/Loading';
import { apiFetch } from '@/lib/api';
import { useLang, T } from '@/lib/lang';
import { useQuestionNav } from '@/lib/useQuestionNav';
import PremiumGate from '@/components/PremiumGate';
import { useGuard } from '@/lib/usePremiumGuard';
import { isPremiumUser } from '@/lib/access';
import QuizQuestion from '@/components/QuizQuestion';
import { preloadImages } from '@/lib/preload';
import { recordAnswer } from '@/lib/gamification';

const LABELS = ['F1', 'F2', 'F3', 'F4', 'F5'];

export default function MashqPage() {
  const { count: countParam } = useParams();
  const count = parseInt(countParam) || 50;
  const router = useRouter();
  const guard = useGuard(isPremiumUser);
  const [phase, setPhase] = useState('loading');
  const [questions, setQuestions] = useState([]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selected, setSelected] = useState(null);
  const [timeLeft, setTimeLeft] = useState(count * 60);
  const [savedIds, setSavedIds] = useState(new Set());
  const timerRef = useRef(null);
  const { lang } = useLang();
  const t = T[lang];

  useEffect(() => {
    const raw = localStorage.getItem('user');
    if (!raw) { router.push('/login'); return; }
    apiFetch('/saved').then(ids => setSavedIds(new Set(ids))).catch(() => {});
    apiFetch(`/exam?count=${count}`).then(qs => {
      setQuestions(qs);
      setTimeLeft(count * 60);
      setPhase('playing');
    });
  }, [count]);

  useEffect(() => {
    if (phase !== 'playing') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(tm => {
        if (tm <= 1) { clearInterval(timerRef.current); setPhase('done'); return 0; }
        return tm - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  function select(i) {
    if (selected !== null) return;
    const q = questions[idx];
    const correctIdx = q.variants.findIndex(v => v.is_correct);
    setSelected(i);
    const isCorrect = i === correctIdx;
    recordAnswer(isCorrect);
    setAnswers(prev => ({ ...prev, [idx]: { selected: i, correct: correctIdx, isCorrect } }));
    if (!isCorrect) {
      apiFetch('/xatolar', { method: 'POST', body: JSON.stringify({ questionId: q.id }) }).catch(() => {});
    }
  }

  function next() {
    if (idx + 1 >= questions.length) { clearInterval(timerRef.current); setPhase('done'); }
    else { setIdx(i => i + 1); setSelected(answers[idx + 1]?.selected ?? null); }
  }

  function goTo(i) { setIdx(i); setSelected(answers[i]?.selected ?? null); }

  useQuestionNav({
    // Oxirgi savolda gesture testni yakunlamaydi
    next: () => { if (idx + 1 < questions.length) next(); },
    prev: () => { if (idx > 0) goTo(idx - 1); },
    enabled: phase === 'playing',
  });

  useEffect(() => {
    preloadImages([questions[idx + 1]?.image_url, questions[idx + 2]?.image_url]);
  }, [idx, questions]);

  async function toggleSave(questionId) {
    const isSaved = savedIds.has(questionId);
    setSavedIds(prev => { const n = new Set(prev); isSaved ? n.delete(questionId) : n.add(questionId); return n; });
    try { await apiFetch('/saved', { method: 'POST', body: JSON.stringify({ questionId }) }); }
    catch { setSavedIds(prev => { const n = new Set(prev); isSaved ? n.add(questionId) : n.delete(questionId); return n; }); }
  }

  function formatTime(s) {
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }

  const correctCount = Object.values(answers).filter(a => a.isCorrect).length;
  const timerDanger = timeLeft < 120;

  if (guard === 'loading') return null;
  if (guard === 'denied') return (<><Navbar /><PremiumGate /></>);

  if (phase === 'loading') {
    return <><Navbar /><Loading label={t.loading} /></>;
  }

  if (phase === 'done') {
    const total = questions.length;
    const score = Math.round((correctCount / total) * 100);
    const pass = score >= 80;
    return (
      <>
        <Navbar />
        <div style={{ maxWidth: 560, margin: '2rem auto', padding: '1rem' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '2.5rem 1.5rem', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.4rem', color: 'var(--text)', marginBottom: '0.5rem' }}>{pass ? t.congrats : t.exam_more}</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.25rem' }}>{count} {t.q_count}</p>
            <div style={{ fontSize: '3.5rem', fontWeight: 800, color: pass ? '#16A34A' : '#DC2626', margin: '0.5rem 0 1.5rem' }}>{score}%</div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '2rem', flexWrap: 'wrap' }}>
              <span style={{ padding: '0.5rem 1.25rem', borderRadius: 8, background: '#DCFCE7', color: '#166534', fontWeight: 600 }}>{t.correct_l}: {correctCount}</span>
              <span style={{ padding: '0.5rem 1.25rem', borderRadius: 8, background: '#FEE2E2', color: '#991B1B', fontWeight: 600 }}>{t.wrong_l}: {total - correctCount}</span>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => { setIdx(0); setAnswers({}); setSelected(null); setTimeLeft(count * 60); apiFetch(`/exam?count=${count}`).then(qs => { setQuestions(qs); setPhase('playing'); }); }} className="btn btn-primary">{t.restart}</button>
              <Link href="/" className="btn btn-outline">{t.home_l}</Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  const q = questions[idx];
  if (!q) return null;
  const correctIdx = q.variants.findIndex(v => v.is_correct);
  const isSaved = savedIds.has(q.id);
  const pct = Math.round((idx / questions.length) * 100);

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1rem 1rem' }}>

        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem', gap: '1rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            <strong style={{ color: 'var(--text)' }}>{idx + 1}</strong> / {questions.length}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: timerDanger ? '#FEF2F2' : 'var(--surface)', border: `1.5px solid ${timerDanger ? '#DC2626' : 'var(--border)'}`, borderRadius: 8, padding: '0.3rem 0.75rem', fontWeight: 700, fontSize: '1rem', color: timerDanger ? '#DC2626' : 'var(--text)' }}>
            <span>{timerDanger ? '⚠' : '⏱'}</span>
            {formatTime(timeLeft)}
          </div>
          <button onClick={() => { clearInterval(timerRef.current); setPhase('done'); }} className="btn btn-outline" style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}>
            {t.finish}
          </button>
        </div>

        <div className="progress-bar-wrap" style={{ marginBottom: '1.25rem' }}>
          <div style={{ height: '100%', borderRadius: 99, background: 'var(--primary)', width: `${pct}%`, transition: 'width 0.3s' }} />
        </div>

        {/* Question card */}
        <QuizQuestion
          q={q} idx={idx} total={questions.length} lang={lang}
          selected={selected} correctIdx={correctIdx}
          onSelect={select} isSaved={isSaved} onToggleSave={toggleSave}
        />
        {selected !== null && (
          <div style={{ marginTop: '0.75rem', padding: '1rem 1.25rem', border: '1px solid var(--border)', borderRadius: 12, background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
            <span style={{ fontSize: '1rem', fontWeight: 600, color: selected === correctIdx ? '#16A34A' : '#DC2626' }}>
              {selected === correctIdx ? t.correct : t.wrong}
            </span>
            <button onClick={next} className="btn btn-primary">
              {idx + 1 < questions.length ? t.next_q : t.finish}
            </button>
          </div>
        )}

        {/* Navigation grid */}
        <div className="q-nav-grid">
          {questions.map((_, i) => {
            const a = answers[i];
            const isCurr = i === idx;
            return (
              <div key={i} onClick={() => goTo(i)} className="q-nav-cell"
                style={{
                  background: a ? (a.isCorrect ? '#DCFCE7' : '#FEE2E2') : isCurr ? 'var(--primary)' : 'var(--border)',
                  color: a ? (a.isCorrect ? '#166534' : '#991B1B') : isCurr ? 'white' : 'var(--text-muted)',
                  border: isCurr && !a ? '2px solid var(--primary)' : '2px solid transparent',
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
