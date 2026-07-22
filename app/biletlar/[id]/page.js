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
import { canAccessTicket } from '@/lib/access';
import { isComingSoon } from '@/lib/comingSoon';
import QuizQuestion from '@/components/QuizQuestion';
import { preloadImages } from '@/lib/preload';
import { recordAnswer, recordExam } from '@/lib/gamification';

const LABELS = ['F1', 'F2', 'F3', 'F4', 'F5'];

export default function BiletTestPage() {
  const { id } = useParams();
  const guard = useGuard(u => canAccessTicket(u, id));
  const router = useRouter();
  const [questions, setQuestions] = useState([]);
  const [ticket, setTicket] = useState(null);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selected, setSelected] = useState(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [savedIds, setSavedIds] = useState(new Set());
  const [lightbox, setLightbox] = useState(null);
  const autoRef = useRef(null);
  const { lang } = useLang();
  const t = T[lang];

  const soon = isComingSoon(id);

  useEffect(() => {
    if (soon) { setLoading(false); return; }
    const raw = localStorage.getItem('user');
    if (!raw) { router.push('/login'); return; }
    setUserId(JSON.parse(raw).id);
    apiFetch(`/tickets/${id}`).then(data => {
      setTicket(data.ticket);
      setQuestions(data.questions);
      setLoading(false);
    });
    apiFetch('/saved').then(ids => setSavedIds(new Set(ids))).catch(() => {});
  }, [id]);

  async function toggleSave(questionId) {
    const isSaved = savedIds.has(questionId);
    setSavedIds(prev => {
      const next = new Set(prev);
      isSaved ? next.delete(questionId) : next.add(questionId);
      return next;
    });
    try {
      await apiFetch('/saved', { method: 'POST', body: JSON.stringify({ questionId }) });
    } catch {
      setSavedIds(prev => {
        const next = new Set(prev);
        isSaved ? next.add(questionId) : next.delete(questionId);
        return next;
      });
    }
  }

  function select(i) {
    if (selected !== null) return;
    const q = questions[idx];
    const correctIdx = q.variants.findIndex(v => v.is_correct);
    const isCorrect = i === correctIdx;
    setSelected(i);
    recordAnswer(isCorrect);
    setAnswers(prev => ({ ...prev, [idx]: { selected: i, correct: correctIdx, isCorrect } }));
    if (isCorrect) {
      // To'g'ri javob — avtomatik keyingi savolga o'tamiz (mavzulardagi kabi)
      const currentIdx = idx;
      clearTimeout(autoRef.current);
      autoRef.current = setTimeout(() => {
        if (currentIdx + 1 >= questions.length) return; // oxirgi savol — foydalanuvchi "Yakunlash"ni bossin
        setIdx(currentIdx + 1);
        setSelected(null);
      }, 600);
    }
  }

  function next() {
    clearTimeout(autoRef.current);
    if (idx + 1 >= questions.length) {
      finishExam();
    } else {
      setIdx(i => i + 1);
      setSelected(answers[idx + 1]?.selected ?? null);
    }
  }

  function finishExam() {
    const total = questions.length;
    const correctCount = Object.values(answers).filter(a => a.isCorrect).length;
    const pct = Math.round((correctCount / total) * 100);
    const uid = userId || JSON.parse(localStorage.getItem('user') || '{}').id;
    localStorage.setItem(`bilet_result_${uid}_${id}`, JSON.stringify({ correct: correctCount, total, percent: pct, date: Date.now() }));
    recordExam(pct);
    setDone(true);
  }

  useQuestionNav({
    // Oxirgi savolda gesture testni yakunlamaydi — faqat "Yakunlash" tugmasi yakunlaydi
    next: () => { if (idx + 1 < questions.length) { clearTimeout(autoRef.current); setIdx(idx + 1); setSelected(answers[idx + 1]?.selected ?? null); } },
    prev: () => { if (idx > 0) { clearTimeout(autoRef.current); setIdx(idx - 1); setSelected(answers[idx - 1]?.selected ?? null); } },
    enabled: !done && questions.length > 0 && !lightbox,
  });

  // Lightbox ochiq bo'lsa Escape bilan yopiladi
  useEffect(() => {
    if (!lightbox) return;
    const onKey = e => { if (e.key === 'Escape') setLightbox(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox]);

  // Komponent yopilganda avtomatik o'tish taymerini tozalaymiz
  useEffect(() => () => clearTimeout(autoRef.current), []);

  useEffect(() => {
    preloadImages([questions[idx + 1]?.image_url, questions[idx + 2]?.image_url]);
  }, [idx, questions]);

  function restart() {
    setIdx(0);
    setAnswers({});
    setSelected(null);
    setDone(false);
  }

  if (soon) {
    return (
      <>
        <Navbar />
        <div style={{maxWidth:520,margin:'3rem auto',padding:'1rem',textAlign:'center'}}>
          <div style={{fontSize:'3.5rem',marginBottom:'0.75rem'}}>⏳</div>
          <h1 style={{fontSize:'1.5rem',fontWeight:700,color:'var(--text)',marginBottom:'0.5rem'}}>{t.coming_soon}</h1>
          <p style={{color:'var(--text-muted)',marginBottom:'1.5rem'}}>{t.coming_soon_sub}</p>
          <Link href="/biletlar" className="btn btn-primary">{t.back_tickets}</Link>
        </div>
      </>
    );
  }

  if (guard === 'loading') return null;
  if (guard === 'denied') return (<><Navbar /><PremiumGate /></>);

  if (loading) return <><Navbar /><Loading label={t.loading} /></>;

  if (done) {
    const total = questions.length;
    const correctCount = Object.values(answers).filter(a => a.isCorrect).length;
    const score = Math.round((correctCount / total) * 100);
    const pass = score >= 80;
    return (
      <>
        <Navbar />
        <div style={{maxWidth:720,margin:'0 auto',padding:'1.5rem 1rem'}}>
          <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,padding:'2.5rem 1.5rem',textAlign:'center'}}>
            <h2 style={{fontSize:'1.4rem',marginBottom:'0.5rem',color:'var(--text)'}}>{pass ? t.congrats : t.exam_more}</h2>
            <p style={{color:'var(--text-muted)',marginBottom:'1.25rem'}}>{t.ticket_l} #{ticket?.number} · 20 {t.q_count}</p>
            <div style={{fontSize:'3rem',fontWeight:800,color:pass?'#16A34A':'#DC2626',margin:'0.75rem 0'}}>{score}%</div>
            <div style={{display:'flex',gap:'1rem',justifyContent:'center',marginBottom:'2rem',flexWrap:'wrap'}}>
              <span style={{padding:'0.5rem 1.25rem',borderRadius:8,background:'#DCFCE7',color:'#166534',fontSize:'0.9rem',fontWeight:500}}>{t.correct_l}: {correctCount}</span>
              <span style={{padding:'0.5rem 1.25rem',borderRadius:8,background:'#FEE2E2',color:'#991B1B',fontSize:'0.9rem',fontWeight:500}}>{t.wrong_l}: {total - correctCount}</span>
            </div>
            <div style={{textAlign:'left',marginBottom:'1.5rem'}}>
              <p style={{fontSize:'0.85rem',fontWeight:600,color:'var(--text-muted)',marginBottom:'0.75rem',textTransform:'uppercase',letterSpacing:'0.05em'}}>{t.results_l}</p>
              <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
                {questions.map((_, i) => {
                  const a = answers[i];
                  const ok = a?.isCorrect;
                  return (
                    <div key={i} onClick={() => { setIdx(i); setSelected(answers[i]?.selected ?? null); setDone(false); }}
                      style={{width:32,height:32,borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',
                        fontSize:'0.8rem',fontWeight:600,cursor:'pointer',
                        background:ok?'#DCFCE7':'#FEE2E2',color:ok?'#166534':'#991B1B',
                        border:`1.5px solid ${ok?'#86EFAC':'#FCA5A5'}`}}>
                      {i+1}
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{display:'flex',gap:'0.75rem',justifyContent:'center',flexWrap:'wrap'}}>
              <button onClick={restart} className="btn btn-primary">{t.restart}</button>
              <Link href="/biletlar" className="btn btn-outline">{t.back_tickets}</Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  const q = questions[idx];
  if (!q) return null;
  const correctIdx = q.variants.findIndex(v => v.is_correct);
  const pct = Math.round((idx / questions.length) * 100);
  const answeredCount = Object.keys(answers).length;
  const isSaved = savedIds.has(q.id);

  return (
    <>
      <Navbar />

      {/* Lightbox — rasmni kattalashtirish */}
      {lightbox && (
        <div onClick={() => setLightbox(null)}
          style={{position:'fixed',inset:0,zIndex:1000,background:'rgba(0,0,0,0.85)',display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem',cursor:'zoom-out'}}>
          <button onClick={() => setLightbox(null)}
            style={{position:'absolute',top:16,right:16,width:40,height:40,borderRadius:'50%',background:'rgba(255,255,255,0.15)',border:'none',color:'white',fontSize:'1.4rem',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',lineHeight:1}}>
            ✕
          </button>
          <img src={lightbox} alt="" onClick={e => e.stopPropagation()}
            style={{maxWidth:'100%',maxHeight:'90vh',objectFit:'contain',borderRadius:8,cursor:'default',boxShadow:'0 8px 40px rgba(0,0,0,0.5)'}} />
        </div>
      )}

      <div style={{maxWidth:1100,margin:'0 auto',padding:'1.5rem 1rem'}}>

        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1rem',gap:'0.5rem',flexWrap:'wrap'}}>
          <Link href="/biletlar" style={{fontSize:'0.875rem',color:'var(--text-muted)',textDecoration:'none'}}>&#8592; {t.tickets_title}</Link>
          <span style={{fontSize:'0.95rem',fontWeight:600,color:'var(--text)'}}>{t.ticket_l} #{ticket?.number}</span>
          <span style={{fontSize:'0.875rem',color:'var(--text-muted)'}}>
            <strong style={{color:'var(--text)'}}>{idx+1}</strong> / {questions.length}
          </span>
        </div>

        <div className="progress-bar-wrap" style={{marginBottom:'0.5rem'}}>
          <div style={{height:'100%',borderRadius:99,background:'var(--primary)',width:`${pct}%`,transition:'width 0.3s'}} />
        </div>

        <div style={{display:'flex',gap:4,flexWrap:'wrap',marginBottom:'1.25rem'}}>
          {questions.map((_, i) => {
            const a = answers[i];
            const isCurr = i === idx;
            return (
              <div key={i} onClick={() => { clearTimeout(autoRef.current); setIdx(i); setSelected(answers[i]?.selected ?? null); }}
                style={{width:24,height:24,borderRadius:4,display:'flex',alignItems:'center',justifyContent:'center',
                  fontSize:'0.7rem',fontWeight:600,cursor:'pointer',
                  background: a ? (a.isCorrect ? '#DCFCE7' : '#FEE2E2') : isCurr ? 'var(--primary)' : 'var(--border)',
                  color: a ? (a.isCorrect ? '#166534' : '#991B1B') : isCurr ? 'white' : 'var(--text-muted)',
                  border: isCurr ? '2px solid var(--primary)' : 'none'}}>
                {i+1}
              </div>
            );
          })}
        </div>

        <QuizQuestion
          q={q} idx={idx} total={questions.length} lang={lang}
          selected={selected} correctIdx={correctIdx}
          onSelect={select} onImageClick={() => setLightbox(q.image_url)}
          isSaved={isSaved} onToggleSave={toggleSave}
        />
        {selected !== null && (
          <div style={{marginTop:'0.75rem',padding:'1rem 1.25rem',border:'1px solid var(--border)',borderRadius:12,background:'var(--surface)',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'1rem'}}>
            <span style={{fontSize:'1rem',fontWeight:600,color:selected===correctIdx?'#16A34A':'#DC2626'}}>
              {selected === correctIdx ? t.correct : t.wrong}
            </span>
            <button onClick={next} className="btn btn-primary">
              {idx + 1 < questions.length ? t.next_q : t.finish}
            </button>
          </div>
        )}

        <div style={{marginTop:'0.75rem',fontSize:'0.8rem',color:'var(--text-muted)',textAlign:'center'}}>
          {answeredCount} {t.answered} · {questions.length - answeredCount} {t.unanswered.toLowerCase()}
        </div>
      </div>
    </>
  );
}
