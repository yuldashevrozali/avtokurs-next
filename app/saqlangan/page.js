'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { apiFetch } from '@/lib/api';
import { useLang, T } from '@/lib/lang';
import PremiumGate from '@/components/PremiumGate';
import { useGuard } from '@/lib/usePremiumGuard';
import { isPremiumUser } from '@/lib/access';
import QuestionImage from '@/components/QuestionImage';
import { preloadImages } from '@/lib/preload';

const LABELS = ['F1', 'F2', 'F3', 'F4', 'F5'];

export default function SavedPage() {
  const router = useRouter();
  const guard = useGuard(isPremiumUser);
  const [questions, setQuestions] = useState([]);   // asl ro'yxat (list uchun)
  const [testQueue, setTestQueue] = useState([]);   // shuffled (test uchun)
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('list'); // list | test
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const { lang } = useLang();
  const t = T[lang];

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (!u) { router.push('/login'); return; }
    loadQuestions();
  }, []);

  async function loadQuestions() {
    setLoading(true);
    try {
      const qs = await apiFetch('/saved/questions');
      setQuestions(qs);
    } catch {}
    setLoading(false);
  }

  async function unsave(questionId) {
    await apiFetch('/saved', { method: 'POST', body: JSON.stringify({ questionId }) });
    setQuestions(prev => prev.filter(q => q.id !== questionId));
  }

  function startTest() {
    // Har safar yangi random tartibda
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    setTestQueue(shuffled);
    setMode('test');
    setQIdx(0);
    setSelected(null);
    setCorrect(0);
    setDone(false);
  }

  function selectAnswer(i) {
    if (selected !== null) return;
    setSelected(i);
    const q = testQueue[qIdx];
    const correctIdx = q.variants.findIndex(v => v.is_correct);
    if (i === correctIdx) setCorrect(c => c + 1);
  }

  function next() {
    if (qIdx + 1 >= testQueue.length) { setDone(true); return; }
    setQIdx(i => i + 1);
    setSelected(null);
  }

  function restart() {
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    setTestQueue(shuffled);
    setQIdx(0); setSelected(null); setCorrect(0); setDone(false);
  }

  useEffect(() => {
    preloadImages([testQueue[qIdx + 1]?.image_url, testQueue[qIdx + 2]?.image_url]);
  }, [qIdx, testQueue]);

  if (guard === 'loading') return null;
  if (guard === 'denied') return (<><Navbar /><PremiumGate /></>);

  if (loading) return <><Navbar /><div className="container"><p style={{ color: 'var(--text-muted)' }}>{t.loading}</p></div></>;

  // ── LIST MODE ──
  if (mode === 'list') {
    return (
      <>
        <Navbar />
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '1.5rem 1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>{t.saved_title}</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>{questions.length} {t.saved_qs}</p>
            </div>
            {questions.length > 0 && (
              <button onClick={startTest} className="btn btn-primary">
                {t.start_test}
              </button>
            )}
          </div>

          {questions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12 }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔖</div>
              <h3 style={{ color: 'var(--text)', marginBottom: '0.5rem' }}>{t.saved_empty_t}</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                {t.saved_empty_s}
              </p>
              <Link href="/mavzular" className="btn btn-primary">{t.go_topics}</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {questions.map((q, i) => {
                const correctIdx = q.variants.findIndex(v => v.is_correct);
                return (
                  <div key={q.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                    {q.image_url && <QuestionImage src={q.image_url} maxHeight={180} />}
                    <div style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', marginBottom: '0.875rem' }}>
                        <span style={{ minWidth: 24, height: 24, borderRadius: '50%', background: 'var(--bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, flexShrink: 0 }}>{i + 1}</span>
                        <p style={{ color: 'var(--text)', fontSize: '0.9rem', lineHeight: 1.5, margin: 0, flex: 1 }}>{q.text[lang] || q.text.uz}</p>
                        <button onClick={() => unsave(q.id)} title="Saqlanganlardan o'chirish"
                          style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', padding: '0 0.25rem', color: '#F59E0B' }}>🔖</button>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        {q.variants.map((v, vi) => (
                          <div key={vi} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', padding: '0.5rem 0.6rem', borderRadius: 6, background: vi === correctIdx ? '#F0FDF4' : 'var(--bg)', border: `1px solid ${vi === correctIdx ? '#86EFAC' : 'var(--border)'}` }}>
                            <span style={{ minWidth: 18, fontSize: '0.75rem', fontWeight: 600, color: vi === correctIdx ? '#166534' : 'var(--text-muted)', paddingTop: 1 }}>{LABELS[vi]}</span>
                            <span style={{ fontSize: '0.85rem', color: vi === correctIdx ? '#166534' : 'var(--text)', lineHeight: 1.4 }}>{v.text[lang] || v.text.uz}</span>
                            {vi === correctIdx && <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#16A34A', fontWeight: 600, whiteSpace: 'nowrap' }}>✓ {t.correct_l}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </>
    );
  }

  // ── TEST DONE ──
  if (done) {
    const pct = Math.round((correct / testQueue.length) * 100);
    const pass = pct >= 80;
    return (
      <>
        <Navbar />
        <div style={{ maxWidth: 520, margin: '2rem auto', padding: '1rem', textAlign: 'center' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '2.5rem 1.5rem' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: pass ? '#16A34A' : '#DC2626', marginBottom: '0.5rem' }}>{pct}%</div>
            <h2 style={{ color: 'var(--text)', marginBottom: '1rem' }}>{pass ? t.congrats : t.study_more}</h2>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '2rem', flexWrap: 'wrap' }}>
              <span style={{ padding: '0.5rem 1rem', borderRadius: 8, background: '#DCFCE7', color: '#166534', fontSize: '0.875rem' }}>{t.correct_l}: {correct}</span>
              <span style={{ padding: '0.5rem 1rem', borderRadius: 8, background: '#FEE2E2', color: '#991B1B', fontSize: '0.875rem' }}>{t.wrong_l}: {testQueue.length - correct}</span>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={restart} className="btn btn-primary">{t.restart}</button>
              <button onClick={() => setMode('list')} className="btn btn-outline">{t.back_list}</button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── TEST MODE ──
  const q = testQueue[qIdx];
  const correctIdx = q?.variants.findIndex(v => v.is_correct) ?? -1;
  const pct = Math.round((qIdx / testQueue.length) * 100);

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '1.5rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <button onClick={() => setMode('list')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            ← {t.back_list}
          </button>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            <strong style={{ color: 'var(--text)' }}>{qIdx + 1}</strong> / {testQueue.length}
          </span>
        </div>

        <div className="progress-bar-wrap" style={{ marginBottom: '1.25rem' }}>
          <div style={{ height: '100%', borderRadius: 99, background: 'var(--primary)', width: `${pct}%`, transition: 'width 0.3s' }} />
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
          {q.image_url && <QuestionImage src={q.image_url} maxHeight={260} />}
          <div style={{ padding: '1.25rem' }}>
            <p style={{ fontSize: '0.975rem', fontWeight: 500, lineHeight: 1.5, color: 'var(--text)', margin: '0 0 1.1rem' }}>{q.text[lang] || q.text.uz}</p>
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
                    <span style={{ minWidth: 22, height: 22, borderRadius: '50%', border: '1.5px solid var(--border)', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 600, flexShrink: 0, color: 'var(--text-muted)' }}>
                      {LABELS[i]}
                    </span>
                    {v.text[lang] || v.text.uz}
                  </button>
                );
              })}
            </div>
          </div>
          {selected !== null && (
            <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface)', gap: '1rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 500, color: selected === correctIdx ? '#16A34A' : '#DC2626' }}>
                {selected === correctIdx ? t.correct : t.wrong}
              </span>
              <button onClick={next} className="btn btn-primary">
                {qIdx + 1 < testQueue.length ? t.next_q : t.see_result}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
