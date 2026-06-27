'use client';
import { useEffect, useState, useRef } from 'react';
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
  const [isAdmin, setIsAdmin] = useState(false);

  // Notes: { [questionId]: noteText }
  const [notes, setNotes] = useState({});
  // Which question's note panel is open
  const [notePanel, setNotePanel] = useState(null); // questionId or null
  const [editText, setEditText] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    const raw = localStorage.getItem('user');
    if (!raw) { router.push('/login'); return; }
    const u = JSON.parse(raw);
    setUserId(u.id);
    setIsAdmin(u.role === 'admin');
    apiFetch(`/topics/${id}/questions`).then(async data => {
      setTopic(data.topic);
      setQuestions(data.questions);
      setLoading(false);
      // Load notes for all questions in this topic
      const qIds = data.questions.map(q => q.id).join(',');
      if (qIds) {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/notes?ids=${qIds}`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const arr = await res.json();
          const map = {};
          arr.forEach(n => { map[n.questionId] = n.text; });
          setNotes(map);
        }
      }
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
    setNotePanel(null);
    if (idx + 1 >= questions.length) { setDone(true); saveResult(); return; }
    setIdx(i => i + 1); setSelected(null);
  }

  function saveResult() {
    const total = questions.length;
    const lastCorrect = correct + (selected === questions[idx]?.variants.findIndex(v => v.is_correct) ? 1 : 0);
    const pct = Math.round((lastCorrect / total) * 100);
    localStorage.setItem(`topic_result_${userId}_${id}`, JSON.stringify({ correct: lastCorrect, total, percent: pct, date: Date.now() }));
  }

  function restart() { setIdx(0); setCorrect(0); setSelected(null); setDone(false); setNotePanel(null); }

  function openNotePanel(questionId) {
    if (notePanel === questionId) { setNotePanel(null); return; }
    setNotePanel(questionId);
    setEditText(notes[questionId] || '');
    setTimeout(() => textareaRef.current?.focus(), 50);
  }

  async function saveNote(questionId) {
    if (!editText.trim()) return;
    setNoteSaving(true);
    await apiFetch('/notes', { method: 'POST', body: JSON.stringify({ questionId, text: editText.trim() }) });
    setNotes(prev => ({ ...prev, [questionId]: editText.trim() }));
    setNotePanel(null);
    setNoteSaving(false);
  }

  async function deleteNote(questionId) {
    if (!confirm("Izohni o'chirasizmi?")) return;
    const token = localStorage.getItem('token');
    await fetch(`/api/notes/${questionId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setNotes(prev => { const n = { ...prev }; delete n[questionId]; return n; });
    setNotePanel(null);
  }

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
  const hasNote = !!notes[q.id];
  const panelOpen = notePanel === q.id;

  return (
    <>
      <Navbar />
      <div style={{maxWidth:720,margin:'0 auto',padding:'1.5rem 1rem'}}>

        {/* Header */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.25rem'}}>
          <Link href="/mavzular" style={{fontSize:'0.875rem',color:'var(--text-muted)',textDecoration:'none'}}>&larr; {topic?.name.uz}</Link>
          <span style={{fontSize:'0.875rem',color:'var(--text-muted)'}}>
            <strong style={{color:'var(--text)'}}>{idx+1}</strong> / {total}
          </span>
        </div>

        {/* Progress bar */}
        <div className="progress-bar-wrap" style={{marginBottom:'1.5rem'}}>
          <div style={{height:'100%',borderRadius:99,background:'var(--primary)',width:`${pct}%`,transition:'width 0.3s'}} />
        </div>

        {/* Question card */}
        <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:10,overflow:'hidden'}}>
          {q.image_url && (
            <img src={q.image_url} alt="" style={{width:'100%',maxHeight:260,objectFit:'contain',background:'var(--bg)',display:'block'}}
              onError={e=>e.target.style.display='none'} />
          )}

          <div style={{padding:'1.25rem'}}>

            {/* Question text + 💡 button */}
            <div style={{display:'flex',alignItems:'flex-start',gap:'0.75rem',marginBottom:'1.1rem'}}>
              <p style={{fontSize:'0.975rem',fontWeight:500,lineHeight:1.5,color:'var(--text)',flex:1,margin:0}}>{q.text.uz}</p>

              {/* Show button: admin always, user only if note exists */}
              {(isAdmin || hasNote) && (
                <button
                  onClick={() => openNotePanel(q.id)}
                  title={hasNote ? 'Izohni ko\'rish' : 'Izoh qo\'shish'}
                  style={{
                    flexShrink: 0,
                    display: 'flex', alignItems: 'center', gap: '0.3rem',
                    padding: '0.3rem 0.65rem',
                    border: `1.5px solid ${panelOpen ? '#2563EB' : hasNote ? '#F59E0B' : 'var(--border)'}`,
                    borderRadius: 6,
                    background: panelOpen ? '#EFF6FF' : hasNote ? '#FFFBEB' : 'var(--surface)',
                    color: panelOpen ? '#2563EB' : hasNote ? '#92400E' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    transition: 'all 0.15s',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span style={{fontSize:'1rem'}}>💡</span>
                  <span>Izoh</span>
                  {hasNote && !isAdmin && <span style={{width:6,height:6,borderRadius:'50%',background:'#F59E0B',display:'inline-block'}} />}
                </button>
              )}
            </div>

            {/* Note panel */}
            {panelOpen && (
              <div style={{
                marginBottom:'1rem',
                border:'1.5px solid #FDE68A',
                borderRadius:8,
                background:'#FFFBEB',
                overflow:'hidden',
              }}>
                <div style={{display:'flex',alignItems:'center',gap:'0.5rem',padding:'0.6rem 0.875rem',borderBottom:'1px solid #FDE68A',background:'#FEF3C7'}}>
                  <span style={{fontSize:'0.9rem'}}>💡</span>
                  <span style={{fontSize:'0.85rem',fontWeight:600,color:'#92400E'}}>
                    {isAdmin ? (hasNote ? 'Izohni tahrirlash' : "Izoh qo'shish") : 'Izoh'}
                  </span>
                  <button
                    onClick={() => setNotePanel(null)}
                    style={{marginLeft:'auto',background:'none',border:'none',cursor:'pointer',fontSize:'1.1rem',color:'#92400E',lineHeight:1,padding:'0 0.25rem'}}
                  >✕</button>
                </div>

                <div style={{padding:'0.875rem'}}>
                  {isAdmin ? (
                    /* Admin: editable textarea */
                    <>
                      <textarea
                        ref={textareaRef}
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        placeholder="Bu savol bo'yicha izoh yozing..."
                        rows={3}
                        style={{
                          width:'100%', padding:'0.6rem 0.75rem',
                          border:'1px solid #FDE68A', borderRadius:6,
                          fontSize:'0.875rem', fontFamily:'inherit',
                          background:'white', color:'#1E293B',
                          resize:'vertical', outline:'none',
                          boxSizing:'border-box',
                        }}
                      />
                      <div style={{display:'flex',gap:'0.5rem',marginTop:'0.6rem',flexWrap:'wrap'}}>
                        <button
                          onClick={() => saveNote(q.id)}
                          disabled={!editText.trim() || noteSaving}
                          style={{padding:'0.4rem 1rem',background:'#2563EB',color:'white',border:'none',borderRadius:6,fontSize:'0.85rem',fontWeight:600,cursor:'pointer',opacity:(!editText.trim()||noteSaving)?0.5:1}}
                        >
                          {noteSaving ? 'Saqlanmoqda...' : 'Saqlash'}
                        </button>
                        {hasNote && (
                          <button
                            onClick={() => deleteNote(q.id)}
                            style={{padding:'0.4rem 1rem',background:'#FEF2F2',color:'#DC2626',border:'1px solid #FCA5A5',borderRadius:6,fontSize:'0.85rem',fontWeight:600,cursor:'pointer'}}
                          >
                            O'chirish
                          </button>
                        )}
                        <button
                          onClick={() => setNotePanel(null)}
                          style={{padding:'0.4rem 0.875rem',background:'var(--surface)',color:'var(--text-muted)',border:'1px solid var(--border)',borderRadius:6,fontSize:'0.85rem',cursor:'pointer'}}
                        >
                          Bekor
                        </button>
                      </div>
                    </>
                  ) : (
                    /* User: read-only */
                    <p style={{fontSize:'0.9rem',color:'#78350F',lineHeight:1.6,margin:0}}>
                      {notes[q.id]}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Answer variants */}
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
            <div style={{padding:'1rem 1.25rem',borderTop:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',background:'var(--surface)',gap:'1rem'}}>
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
