'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { apiFetch } from '@/lib/api';
import { useLang, T } from '@/lib/lang';

const LABELS = ['F1', 'F2', 'F3', 'F4', 'F5'];

export default function BiletTestPage() {
  const { id } = useParams();
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
  const { lang } = useLang();
  const t = T[lang];

  useEffect(() => {
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
    setAnswers(prev => ({ ...prev, [idx]: { selected: i, correct: correctIdx, isCorrect } }));
  }

  function next() {
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
    setDone(true);
  }

  function restart() {
    setIdx(0);
    setAnswers({});
    setSelected(null);
    setDone(false);
  }

  if (loading) return <><Navbar /><div className="container"><p style={{color:'var(--text-muted)'}}>{t.loading}</p></div></>;

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
      <div style={{maxWidth:760,margin:'0 auto',padding:'1.5rem 1rem'}}>

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
              <div key={i} onClick={() => { setIdx(i); setSelected(answers[i]?.selected ?? null); }}
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

        <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,overflow:'hidden'}}>
          {q.image_url && (
            <img src={q.image_url} alt="" style={{width:'100%',maxHeight:280,objectFit:'contain',background:'var(--bg)',display:'block'}}
              onError={e=>e.target.style.display='none'} />
          )}
          <div style={{padding:'1.25rem'}}>
            {/* Question text + save button */}
            <div style={{display:'flex',alignItems:'flex-start',gap:'0.75rem',marginBottom:'1.1rem'}}>
              <p style={{flex:1,fontSize:'0.975rem',fontWeight:500,lineHeight:1.55,color:'var(--text)',margin:0}}>{q.text[lang] || q.text.uz}</p>
              <button onClick={() => toggleSave(q.id)} title={isSaved ? "Saqlanganlardan o'chirish" : 'Saqlash'}
                style={{flexShrink:0,background:'none',border:'none',cursor:'pointer',fontSize:'1.25rem',lineHeight:1,padding:'0.1rem',
                  color:isSaved?'#F59E0B':'var(--text-muted)',transition:'color 0.15s'}}>
                🔖
              </button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'0.6rem'}}>
              {q.variants.map((v, i) => {
                let bg = 'var(--surface)', border = '1.5px solid var(--border)', color = 'var(--text)';
                if (selected !== null) {
                  if (i === correctIdx) { bg = '#F0FDF4'; border = '1.5px solid #16A34A'; color = '#166534'; }
                  if (i === selected && selected !== correctIdx) { bg = '#FEF2F2'; border = '1.5px solid #DC2626'; color = '#991B1B'; }
                }
                return (
                  <button key={i} onClick={() => select(i)} disabled={selected !== null}
                    style={{padding:'0.8rem 1rem',border,borderRadius:8,background:bg,color,textAlign:'left',fontSize:'0.9rem',
                      cursor:selected===null?'pointer':'default',display:'flex',gap:'0.75rem',alignItems:'flex-start',lineHeight:1.4}}>
                    <span style={{minWidth:22,height:22,borderRadius:'50%',border:'1.5px solid var(--border)',background:'var(--bg)',
                      display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.75rem',fontWeight:700,flexShrink:0,color:'var(--text-muted)'}}>
                      {LABELS[i]}
                    </span>
                    <span>{v.text[lang] || v.text.uz}</span>
                  </button>
                );
              })}
            </div>
          </div>
          {selected !== null && (
            <div style={{padding:'1rem 1.25rem',borderTop:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',background:'var(--surface)',gap:'1rem'}}>
              <span style={{fontSize:'0.875rem',fontWeight:600,color:selected===correctIdx?'#16A34A':'#DC2626'}}>
                {selected === correctIdx ? t.correct : t.wrong}
              </span>
              <button onClick={next} className="btn btn-primary">
                {idx + 1 < questions.length ? t.next_q : t.see_result}
              </button>
            </div>
          )}
        </div>

        <div style={{marginTop:'0.75rem',fontSize:'0.8rem',color:'var(--text-muted)',textAlign:'center'}}>
          {answeredCount} {t.answered} · {questions.length - answeredCount} {t.unanswered.toLowerCase()}
        </div>
      </div>
    </>
  );
}
