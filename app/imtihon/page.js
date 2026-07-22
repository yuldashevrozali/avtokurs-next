'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
import { recordAnswer, recordExam } from '@/lib/gamification';

const LABELS = ['F1', 'F2', 'F3', 'F4', 'F5'];
const TOTAL = 20;
const EXAM_TIME = 25 * 60;
const MAX_ERRORS = 3;
const PASS_COUNT = 17;

export default function ImtihonPage() {
  const router = useRouter();
  const guard = useGuard(isPremiumUser);
  const [phase, setPhase] = useState('start'); // start | loading | playing | done
  const [questions, setQuestions] = useState([]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selected, setSelected] = useState(null);
  const [timeLeft, setTimeLeft] = useState(EXAM_TIME);
  const [errorCount, setErrorCount] = useState(0);
  const [failed, setFailed] = useState(false);
  const [savedIds, setSavedIds] = useState(new Set());
  const [lightbox, setLightbox] = useState(null);
  const timerRef = useRef(null);
  const failRef = useRef(null);
  const autoRef = useRef(null);
  const { lang } = useLang();
  const t = T[lang];

  useEffect(() => {
    const raw = localStorage.getItem('user');
    if (!raw) { router.push('/login'); return; }
    apiFetch('/saved').then(ids => setSavedIds(new Set(ids))).catch(() => {});
    return () => { clearTimeout(autoRef.current); clearTimeout(failRef.current); };
  }, []);

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

  async function startExam() {
    setPhase('loading');
    const qs = await apiFetch(`/exam?count=${TOTAL}`);
    setQuestions(qs);
    setIdx(0); setAnswers({}); setSelected(null);
    setTimeLeft(EXAM_TIME); setErrorCount(0); setFailed(false);
    setPhase('playing');
  }

  function select(i) {
    if (selected !== null) return;
    const q = questions[idx];
    const correctIdx = q.variants.findIndex(v => v.is_correct);
    const isCorrect = i === correctIdx;
    setSelected(i);
    recordAnswer(isCorrect);
    setAnswers(prev => ({ ...prev, [idx]: { selected: i, correct: correctIdx, isCorrect } }));
    if (!isCorrect) {
      apiFetch('/xatolar', { method: 'POST', body: JSON.stringify({ questionId: q.id }) }).catch(() => {});
      setErrorCount(prev => {
        const next = prev + 1;
        if (next >= MAX_ERRORS) {
          clearTimeout(failRef.current);
          failRef.current = setTimeout(() => {
            clearInterval(timerRef.current);
            setFailed(true);
            setPhase('done');
          }, 700);
        }
        return next;
      });
    } else {
      // To'g'ri javob — avtomatik keyingi savolga o'tamiz
      const currentIdx = idx;
      clearTimeout(autoRef.current);
      autoRef.current = setTimeout(() => {
        if (currentIdx + 1 >= questions.length) { clearInterval(timerRef.current); setPhase('done'); return; }
        setIdx(currentIdx + 1);
        setSelected(answers[currentIdx + 1]?.selected ?? null);
      }, 600);
    }
  }

  function next() {
    clearTimeout(autoRef.current);
    if (idx + 1 >= questions.length) {
      clearInterval(timerRef.current);
      setPhase('done');
    } else {
      setIdx(i => i + 1);
      setSelected(answers[idx + 1]?.selected ?? null);
    }
  }

  function goTo(i) {
    clearTimeout(autoRef.current);
    setIdx(i);
    setSelected(answers[i]?.selected ?? null);
  }

  useQuestionNav({
    // Oxirgi savolda gesture imtihonni yakunlamaydi
    next: () => { if (idx + 1 < questions.length) next(); },
    prev: () => { if (idx > 0) goTo(idx - 1); },
    enabled: phase === 'playing' && !lightbox,
  });

  // Lightbox ochiq bo'lsa Escape bilan yopiladi
  useEffect(() => {
    if (!lightbox) return;
    const onKey = e => { if (e.key === 'Escape') setLightbox(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox]);

  useEffect(() => {
    preloadImages([questions[idx + 1]?.image_url, questions[idx + 2]?.image_url]);
  }, [idx, questions]);

  // Imtihon yakunlanganda natijani gamification'ga yozamiz (100% imtihon yutug'i uchun)
  useEffect(() => {
    if (phase !== 'done') return;
    const cc = Object.values(answers).filter(a => a.isCorrect).length;
    recordExam((cc / TOTAL) * 100);
  }, [phase]);

  async function toggleSave(questionId) {
    const isSaved = savedIds.has(questionId);
    setSavedIds(prev => { const n = new Set(prev); isSaved ? n.delete(questionId) : n.add(questionId); return n; });
    try {
      await apiFetch('/saved', { method: 'POST', body: JSON.stringify({ questionId }) });
    } catch {
      setSavedIds(prev => { const n = new Set(prev); isSaved ? n.add(questionId) : n.delete(questionId); return n; });
    }
  }

  function formatTime(s) {
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }

  const correctCount = Object.values(answers).filter(a => a.isCorrect).length;
  const answeredCount = Object.keys(answers).length;
  const timerDanger = timeLeft < 120;

  if (guard === 'loading') return null;
  if (guard === 'denied') return (<><Navbar /><PremiumGate /></>);

  // ── START ──
  if (phase === 'start') {
    return (
      <>
        <Navbar />
        <div className="container" style={{ maxWidth: 520 }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📋</div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text)', margin: '0 0 0.5rem' }}>{t.sim_title}</h1>
            <p style={{ color: 'var(--text-muted)' }}>{t.sim_sub}</p>
          </div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text)', marginBottom: '1rem' }}>📌 {t.sim_rules_t}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {[t.sim_rule1, t.sim_rule2, t.sim_rule3, t.sim_rule4].map((r, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.75rem', fontSize: '0.9rem', color: 'var(--text)' }}>
                  <span style={{ color: ['#2563EB','#DC2626','#D97706','#16A34A'][i], fontWeight: 700, minWidth: 20, fontSize: '1rem' }}>
                    {['📝','❌','⏱','✅'][i]}
                  </span>
                  <span style={{ lineHeight: 1.45 }}>{r}</span>
                </div>
              ))}
            </div>
          </div>
          <button onClick={startExam} className="btn btn-primary" style={{ width: '100%', padding: '0.9rem', fontSize: '1.05rem', fontWeight: 700 }}>
            {t.sim_start}
          </button>
        </div>
      </>
    );
  }

  // ── LOADING ──
  if (phase === 'loading') {
    return <><Navbar /><Loading label={t.loading} /></>;
  }

  // ── DONE ──
  if (phase === 'done') {
    const timedOut = timeLeft === 0 && !failed;
    const passed = !failed && !timedOut && correctCount >= PASS_COUNT;
    const passedTimedOut = timedOut && correctCount >= PASS_COUNT;
    const isPass = passed || passedTimedOut;
    return (
      <>
        <Navbar />
        <div style={{ maxWidth: 540, margin: '2rem auto', padding: '1rem' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '2.5rem 1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '0.75rem' }}>
              {failed ? '❌' : isPass ? '🎉' : '😞'}
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.5rem' }}>
              {failed ? t.sim_fail_t : timedOut ? t.sim_time_up : isPass ? t.sim_pass_t : t.sim_not_pass}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              {failed ? t.sim_fail_s : isPass ? t.sim_pass_s : ''}
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <span style={{ padding: '0.5rem 1.25rem', borderRadius: 8, background: '#DCFCE7', color: '#166534', fontWeight: 700, fontSize: '1rem' }}>
                ✅ {correctCount} / {TOTAL}
              </span>
              <span style={{ padding: '0.5rem 1.25rem', borderRadius: 8, background: errorCount > 0 ? '#FEE2E2' : '#F1F5F9', color: errorCount > 0 ? '#991B1B' : 'var(--text-muted)', fontWeight: 700, fontSize: '1rem' }}>
                ❌ {errorCount} {t.sim_errors_made}
              </span>
            </div>

            {/* Question review grid */}
            <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '0.875rem', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t.results_l}</div>
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
              <button onClick={startExam} className="btn btn-primary">{t.restart}</button>
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
  const pct = Math.round((answeredCount / TOTAL) * 100);

  return (
    <>
      <Navbar />

      {/* Lightbox */}
      {lightbox && (
        <div onClick={() => setLightbox(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', cursor: 'zoom-out' }}>
          <button onClick={() => setLightbox(null)}
            style={{ position: 'absolute', top: 16, right: 16, width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', fontSize: '1.4rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
            ✕
          </button>
          <img src={lightbox} alt="" onClick={e => e.stopPropagation()}
            style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8, cursor: 'default', boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }} />
        </div>
      )}

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1rem 1rem' }}>

        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.875rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            <strong style={{ color: 'var(--text)' }}>{idx + 1}</strong> / {TOTAL}
          </span>

          {/* Error dots */}
          <div style={{ display: 'flex', gap: 5, alignItems: 'center', flex: 1 }}>
            {Array.from({ length: MAX_ERRORS }).map((_, i) => (
              <div key={i} style={{ width: 14, height: 14, borderRadius: '50%', background: i < errorCount ? '#DC2626' : 'var(--border)', transition: 'background 0.2s' }} />
            ))}
            <span style={{ fontSize: '0.8rem', color: errorCount > 0 ? '#DC2626' : 'var(--text-muted)', fontWeight: 600, marginLeft: 2 }}>
              {errorCount}/{MAX_ERRORS} {t.sim_errors}
            </span>
          </div>

          {/* Timer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: timerDanger ? '#FEF2F2' : 'var(--surface)', border: `1.5px solid ${timerDanger ? '#DC2626' : 'var(--border)'}`, borderRadius: 8, padding: '0.3rem 0.75rem', fontWeight: 700, fontSize: '1rem', color: timerDanger ? '#DC2626' : 'var(--text)' }}>
            <span>{timerDanger ? '⚠' : '⏱'}</span>
            {formatTime(timeLeft)}
          </div>

          <button onClick={() => { clearInterval(timerRef.current); setPhase('done'); }} className="btn btn-outline" style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}>
            {t.finish}
          </button>
        </div>

        {/* Progress */}
        <div className="progress-bar-wrap" style={{ marginBottom: '1.25rem' }}>
          <div style={{ height: '100%', borderRadius: 99, background: 'var(--primary)', width: `${pct}%`, transition: 'width 0.3s' }} />
        </div>

        {/* Question card */}
        <QuizQuestion
          q={q} idx={idx} total={TOTAL} lang={lang}
          selected={selected} correctIdx={correctIdx}
          onSelect={select} onImageClick={() => setLightbox(q.image_url)}
          isSaved={isSaved} onToggleSave={toggleSave}
        />
        {selected !== null && (
          <div style={{ marginTop: '0.75rem', padding: '1rem 1.25rem', border: '1px solid var(--border)', borderRadius: 12, background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
            <span style={{ fontSize: '1rem', fontWeight: 600, color: selected === correctIdx ? '#16A34A' : '#DC2626' }}>
              {selected === correctIdx ? t.correct : t.wrong}
            </span>
            <button onClick={next} className="btn btn-primary">
              {idx + 1 < TOTAL ? t.next_q : t.finish}
            </button>
          </div>
        )}

        {/* Navigation grid — bottom */}
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
