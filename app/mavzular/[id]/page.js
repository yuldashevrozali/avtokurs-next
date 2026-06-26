'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { apiFetch } from '@/lib/api';

const LABELS = ['A','B','C','D','E'];

export default function TopicTestPage() {
  const { id } = useParams();
  const router = useRouter();
  const [questions, setQuestions] = useState([]);
  const [topic, setTopic] = useState(null);
  const [idx, setIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [selected, setSelected] = useState(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');

  useEffect(() => {
    const raw = localStorage.getItem('user');
    if (!raw) { router.push('/login'); return; }
    setUserId(JSON.parse(raw).id);
    apiFetch(`/topics/${id}/questions`).then(data => {
      setTopic(data.topic); setQuestions(data.questions); setLoading(false);
    });
  }, [id]);

  function select(i) {
    if (selected !== null) return;
    setSelected(i);
    const q = questions[idx];
    const correctIdx = q.variants.findIndex(v => v.is_correct);
    if (i === correctIdx) setCorrect(c => c + 1);
  }

  function next() {
    if (idx + 1 >= questions.length) { setDone(true); saveResult(); return; }
    setIdx(i => i + 1); setSelected(null);
  }

  function saveResult() {
    const total = questions.length;
    const lastCorrect = correct + (selected === questions[idx]?.variants.findIndex(v => v.is_correct) ? 1 : 0);
    const pct = Math.round((lastCorrect / total) * 100);
    localStorage.setItem(`topic_result_${userId}_${id}`, JSON.stringify({ correct: lastCorrect, total, percent: pct, date: Date.now() }));
  }

  function restart() { setIdx(0); setCorrect(0); setSelected(null); setDone(false); }

  if (loading) return <><Navbar /><div className="container"><p style={{color:'var(--text-muted)'}}>Yuklanmoqda...</p></div></>;

  const total = questions.length;
  const pct = Math.round((idx / total) * 100);

  if (done) {
    const score = Math.round((correct / total) * 100);
    const pass = score >= 80;
    return (
      <>
        <Navbar />
        <div style={{maxWidth:720,margin:'0 auto',padding:'1.5rem 1rem'}}>
          <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:10,padding:'2.5rem 1.5rem',textAlign:'center'}}>
            <h2 style={{fontSize:'1.3rem',marginBottom:'0.5rem',color:'var(--text)'}}>{pass ? 'Tabriklaymiz!' : "Yana o'qing"}</h2>
            <p style={{color:'var(--text-muted)',marginBottom:'1rem'}}>{topic?.name.uz}</p>
            <div style={{fontSize:'2.5rem',fontWeight:700,color:pass?'#16A34A':'#DC2626',margin:'1rem 0'}}>{score}%</div>
            <div style={{display:'flex',gap:'1rem',justifyContent:'center',marginBottom:'2rem',flexWrap:'wrap'}}>
              <span style={{padding:'0.5rem 1rem',borderRadius:8,background:'#DCFCE7',color:'#166534',fontSize:'0.875rem'}}>To'g'ri: {correct}</span>
              <span style={{padding:'0.5rem 1rem',borderRadius:8,background:'#FEE2E2',color:'#991B1B',fontSize:'0.875rem'}}>Noto'g'ri: {total - correct}</span>
              <span style={{padding:'0.5rem 1rem',borderRadius:8,background:'#DBEAFE',color:'#1E40AF',fontSize:'0.875rem'}}>Jami: {total}</span>
            </div>
            <div style={{display:'flex',gap:'0.75rem',justifyContent:'center'}}>
              <button onClick={restart} className="btn btn-primary">Qayta urinish</button>
              <Link href="/mavzular" className="btn btn-outline">Mavzularga qaytish</Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  const q = questions[idx];
  const correctIdx = q.variants.findIndex(v => v.is_correct);

  return (
    <>
      <Navbar />
      <div style={{maxWidth:720,margin:'0 auto',padding:'1.5rem 1rem'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.25rem'}}>
          <Link href="/mavzular" style={{fontSize:'0.875rem',color:'var(--text-muted)',textDecoration:'none'}}>&larr; {topic?.name.uz}</Link>
          <span style={{fontSize:'0.875rem',color:'var(--text-muted)'}}>
            <strong style={{color:'var(--text)'}}>{idx+1}</strong> / {total}
          </span>
        </div>

        <div className="progress-bar-wrap" style={{marginBottom:'1.5rem'}}>
          <div style={{height:'100%',borderRadius:99,background:'var(--primary)',width:`${pct}%`,transition:'width 0.3s'}} />
        </div>

        <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:10,overflow:'hidden'}}>
          {q.image_url && (
            <img src={q.image_url} alt="" style={{width:'100%',maxHeight:260,objectFit:'contain',background:'var(--bg)',display:'block'}}
              onError={e=>e.target.style.display='none'} />
          )}
          <div style={{padding:'1.25rem'}}>
            <p style={{fontSize:'0.975rem',fontWeight:500,marginBottom:'1.1rem',lineHeight:1.5,color:'var(--text)'}}>{q.text.uz}</p>
            <div style={{display:'flex',flexDirection:'column',gap:'0.6rem'}}>
              {q.variants.map((v, i) => {
                let bg = 'var(--surface)';
                let border = '1.5px solid var(--border)';
                let color = 'var(--text)';
                if (selected !== null) {
                  if (i === correctIdx) { bg = '#F0FDF4'; border = '1.5px solid #16A34A'; color = '#166534'; }
                  if (i === selected && selected !== correctIdx) { bg = '#FEF2F2'; border = '1.5px solid #DC2626'; color = '#991B1B'; }
                }
                return (
                  <button key={i} onClick={() => select(i)} disabled={selected !== null}
                    style={{padding:'0.8rem 1rem',border,borderRadius:8,background:bg,color,textAlign:'left',fontSize:'0.9rem',
                      cursor:selected===null?'pointer':'default',display:'flex',gap:'0.75rem',alignItems:'flex-start',lineHeight:1.4}}>
                    <span style={{minWidth:22,height:22,borderRadius:'50%',border:'1.5px solid var(--border)',background:'var(--bg)',
                      display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.75rem',fontWeight:600,flexShrink:0,color:'var(--text-muted)'}}>
                      {LABELS[i]}
                    </span>
                    <span>{v.text.uz}</span>
                  </button>
                );
              })}
            </div>
          </div>
          {selected !== null && (
            <div style={{padding:'1rem 1.25rem',borderTop:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',background:'var(--surface)'}}>
              <span style={{fontSize:'0.875rem',fontWeight:500,color:selected===correctIdx?'#16A34A':'#DC2626'}}>
                {selected === correctIdx ? "To'g'ri javob!" : "Noto'g'ri"}
              </span>
              <button onClick={next} className="btn btn-primary">
                {idx + 1 < total ? 'Keyingi savol' : "Natijani ko'rish"}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
