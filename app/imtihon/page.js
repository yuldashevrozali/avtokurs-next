'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { apiFetch } from '@/lib/api';
import { useLang, T } from '@/lib/lang';

const LABELS = ['A', 'B', 'C', 'D', 'E'];

export default function ImtihonPage() {
  const router = useRouter();
  const [phase, setPhase] = useState('select'); // select | loading | exam | result
  const [mode, setMode] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selected, setSelected] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [savedIds, setSavedIds] = useState(new Set());
  const timerRef = useRef(null);
  const { lang } = useLang();
  const t = T[lang];

  const MODES = [
    { count: 50,  label: `50 ${t.q_count}`, time: 50 * 60, desc: `Tezkor mashq — 50 ${t.min_l}` },
    { count: 100, label: `100 ${t.q_count}`, time: 100 * 60, desc: `To'liq tayyorlov — 100 ${t.min_l}` },
  ];

  useEffect(() => {
    const raw = localStorage.getItem('user');
    if (!raw) { router.push('/login'); return; }
    apiFetch('/saved').then(ids => setSavedIds(new Set(ids))).catch(() => {});
  }, []);

  useEffect(() => {
    if (phase !== 'exam') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(tm => {
        if (tm <= 1) { clearInterval(timerRef.current); finishExam(); return 0; }
        return tm - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  async function startExam(m) {
    setMode(m);
    setPhase('loading');
    const qs = await apiFetch(`/exam?count=${m.count}`);
    setQuestions(qs);
    setIdx(0);
    setAnswers({});
    setSelected(null);
    setTimeLeft(m.time);
    setPhase('exam');
  }

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
    setSelected(i);
    setAnswers(prev => ({ ...prev, [idx]: { selected: i, correct: correctIdx, isCorrect: i === correctIdx } }));
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
    clearInterval(timerRef.current);
    setPhase('result');
  }

  function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  }

  const timerDanger = timeLeft < 120;

  if (phase === 'select') {
    return (
      <>
        <Navbar />
        <div className="container" style={{maxWidth:680}}>
          <div style={{marginBottom:'2rem',textAlign:'center'}}>
            <h1 style={{fontSize:'1.6rem',marginBottom:'0.4rem',color:'var(--text)'}}>{t.exam_title}</h1>
            <p style={{color:'var(--text-muted)'}}>{t.exam_sub}</p>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))',gap:'1.25rem'}}>
            {MODES.map(m => (
              <button key={m.count} onClick={() => startExam(m)}
                style={{background:'var(--surface)',border:'2px solid var(--border)',borderRadius:12,padding:'2rem 1.5rem',cursor:'pointer',textAlign:'left',transition:'all 0.15s'}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--primary)';e.currentTarget.style.boxShadow='0 4px 16px rgba(37,99,235,0.15)';}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.boxShadow='none';}}>
                <div style={{fontSize:'2rem',fontWeight:800,color:'var(--primary)',marginBottom:'0.5rem'}}>{m.count}</div>
                <div style={{fontSize:'1rem',fontWeight:600,color:'var(--text)',marginBottom:'0.3rem'}}>{m.label}</div>
                <div style={{fontSize:'0.875rem',color:'var(--text-muted)',marginBottom:'1.25rem'}}>{m.desc}</div>
                <div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap'}}>
                  <span style={{fontSize:'0.8rem',background:'#EFF6FF',color:'#1D4ED8',borderRadius:6,padding:'3px 8px'}}>{Math.floor(m.time/60)} {t.min_l}</span>
                  <span style={{fontSize:'0.8rem',background:'#F0FDF4',color:'#15803D',borderRadius:6,padding:'3px 8px'}}>{t.pass_l}</span>
                </div>
              </button>
            ))}
          </div>
          <p style={{marginTop:'1.5rem',fontSize:'0.85rem',color:'var(--text-muted)',textAlign:'center'}}>
            {t.timer_warn}
          </p>
        </div>
      </>
    );
  }

  if (phase === 'loading') {
    return <><Navbar /><div className="container" style={{textAlign:'center',paddingTop:'4rem'}}><p style={{color:'var(--text-muted)'}}>{t.exam_prep}</p></div></>;
  }

  if (phase === 'result') {
    const total = questions.length;
    const correctCount = Object.values(answers).filter(a => a.isCorrect).length;
    const score = Math.round((correctCount / total) * 100);
    const pass = score >= 80;
    return (
      <>
        <Navbar />
        <div style={{maxWidth:720,margin:'0 auto',padding:'1.5rem 1rem'}}>
          <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,padding:'2.5rem 1.5rem',textAlign:'center'}}>
            <h2 style={{fontSize:'1.4rem',marginBottom:'0.4rem',color:'var(--text)'}}>{pass ? t.exam_great : t.exam_more}</h2>
            <p style={{color:'var(--text-muted)',marginBottom:'1.25rem'}}>{total} {t.q_count} · {mode?.label}</p>
            <div style={{fontSize:'3.5rem',fontWeight:800,color:pass?'#16A34A':'#DC2626',margin:'0.5rem 0 1.25rem'}}>{score}%</div>
            <div style={{display:'flex',gap:'1rem',justifyContent:'center',marginBottom:'2rem',flexWrap:'wrap'}}>
              <span style={{padding:'0.5rem 1.25rem',borderRadius:8,background:'#DCFCE7',color:'#166534',fontWeight:500}}>{t.correct_l}: {correctCount}</span>
              <span style={{padding:'0.5rem 1.25rem',borderRadius:8,background:'#FEE2E2',color:'#991B1B',fontWeight:500}}>{t.wrong_l}: {total - correctCount}</span>
              <span style={{padding:'0.5rem 1.25rem',borderRadius:8,background:'#F1F5F9',color:'var(--text-muted)',fontWeight:500}}>{t.unanswered}: {total - Object.keys(answers).length}</span>
            </div>
            <div style={{textAlign:'left',marginBottom:'1.5rem'}}>
              <p style={{fontSize:'0.8rem',fontWeight:600,color:'var(--text-muted)',marginBottom:'0.6rem',textTransform:'uppercase',letterSpacing:'0.05em'}}>{t.q_count}</p>
              <div style={{display:'flex',flexWrap:'wrap',gap:'5px'}}>
                {questions.map((_, i) => {
                  const a = answers[i];
                  return (
                    <div key={i} style={{width:28,height:28,borderRadius:5,display:'flex',alignItems:'center',justifyContent:'center',
                      fontSize:'0.72rem',fontWeight:600,
                      background: !a ? 'var(--border)' : a.isCorrect ? '#DCFCE7' : '#FEE2E2',
                      color: !a ? 'var(--text-muted)' : a.isCorrect ? '#166534' : '#991B1B'}}>
                      {i+1}
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{display:'flex',gap:'0.75rem',justifyContent:'center',flexWrap:'wrap'}}>
              <button onClick={() => setPhase('select')} className="btn btn-primary">{t.exam_restart}</button>
              <Link href="/" className="btn btn-outline">{t.home_l}</Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Exam phase
  const q = questions[idx];
  if (!q) return null;
  const correctIdx = q.variants.findIndex(v => v.is_correct);
  const answeredCount = Object.keys(answers).length;
  const pct = Math.round((idx / questions.length) * 100);
  const isSaved = savedIds.has(q.id);

  return (
    <>
      <Navbar />
      <div style={{maxWidth:760,margin:'0 auto',padding:'1rem 1rem'}}>

        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'0.875rem',gap:'1rem'}}>
          <div style={{fontSize:'0.875rem',color:'var(--text-muted)'}}>
            <strong style={{color:'var(--text)'}}>{idx+1}</strong> / {questions.length}
            <span style={{marginLeft:'0.75rem',color:'var(--text-muted)'}}>{answeredCount} {t.answered}</span>
          </div>
          <div style={{
            display:'flex',alignItems:'center',gap:'0.4rem',
            background: timerDanger ? '#FEF2F2' : 'var(--surface)',
            border:`1.5px solid ${timerDanger?'#DC2626':'var(--border)'}`,
            borderRadius:8,padding:'0.35rem 0.75rem',fontWeight:700,fontSize:'1rem',
            color: timerDanger ? '#DC2626' : 'var(--text)'
          }}>
            <span style={{fontSize:'0.9rem'}}>{timerDanger ? '⚠' : '⏱'}</span>
            {formatTime(timeLeft)}
          </div>
          <button onClick={finishExam} className="btn btn-outline" style={{padding:'0.35rem 0.75rem',fontSize:'0.8rem'}}>
            {t.finish}
          </button>
        </div>

        <div className="progress-bar-wrap" style={{marginBottom:'0.5rem'}}>
          <div style={{height:'100%',borderRadius:99,background:'var(--primary)',width:`${pct}%`,transition:'width 0.3s'}} />
        </div>

        <div style={{display:'flex',gap:3,flexWrap:'wrap',marginBottom:'1rem'}}>
          {questions.map((_, i) => {
            const a = answers[i];
            const isCurr = i === idx;
            return (
              <div key={i} onClick={() => { setIdx(i); setSelected(answers[i]?.selected ?? null); }}
                style={{width:22,height:22,borderRadius:4,display:'flex',alignItems:'center',justifyContent:'center',
                  fontSize:'0.65rem',fontWeight:700,cursor:'pointer',
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
                {idx + 1 < questions.length ? t.next_q : t.finish}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
