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
import { canAccessTopic } from '@/lib/access';
import QuestionImage from '@/components/QuestionImage';
import { preloadImages } from '@/lib/preload';

const LABELS = ['F1','F2','F3','F4','F5'];

export default function TopicTestPage() {
  const { id } = useParams();
  const guard = useGuard(u => canAccessTopic(u, id));
  const router = useRouter();
  const [questions, setQuestions] = useState([]);
  const [topic, setTopic] = useState(null);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selected, setSelected] = useState(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [lightbox, setLightbox] = useState(null);

  // Saved question IDs
  const [savedIds, setSavedIds] = useState(new Set());

  // Notes: { [questionId]: noteText }
  const [notes, setNotes] = useState({});
  // Which question's note panel is open
  const [notePanel, setNotePanel] = useState(null); // questionId or null
  const [editText, setEditText] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const textareaRef = useRef(null);
  const autoRef = useRef(null);

  const { lang } = useLang();
  const t = T[lang];

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
      // Load saved question IDs
      apiFetch('/saved').then(ids => setSavedIds(new Set(ids))).catch(() => {});
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
    const q = questions[idx];
    const correctIdx = q.variants.findIndex(v => v.is_correct);
    const isCorrect = i === correctIdx;
    setSelected(i);
    setAnswers(prev => ({ ...prev, [idx]: { selected: i, correctIdx, isCorrect } }));
    if (!isCorrect) {
      apiFetch('/xatolar', { method: 'POST', body: JSON.stringify({ questionId: q.id }) }).catch(() => {});
    }
    if (isCorrect) {
      const currentIdx = idx;
      clearTimeout(autoRef.current);
      autoRef.current = setTimeout(() => {
        setNotePanel(null);
        if (currentIdx + 1 >= questions.length) return; // oxirgi savol — foydalanuvchi Yakunlash tugmasini bossin
        const nextIdx = currentIdx + 1;
        setIdx(nextIdx);
        setSelected(null);
      }, 600);
    }
  }

  function next() {
    setNotePanel(null);
    if (idx + 1 >= questions.length) { saveResult(); setDone(true); return; }
    const nextIdx = idx + 1;
    setIdx(nextIdx);
    setSelected(answers[nextIdx]?.selected ?? null);
  }

  function goTo(i) {
    clearTimeout(autoRef.current);
    setNotePanel(null);
    setIdx(i);
    setSelected(answers[i]?.selected ?? null);
  }

  useQuestionNav({
    // Oxirgi savolda gesture testni yakunlamaydi
    next: () => { if (idx + 1 < questions.length) next(); },
    prev: () => { if (idx > 0) goTo(idx - 1); },
    enabled: !done && questions.length > 0,
  });

  // Keyingi 2 savol rasmini oldindan yuklaymiz
  useEffect(() => {
    preloadImages([questions[idx + 1]?.image_url, questions[idx + 2]?.image_url]);
  }, [idx, questions]);

  function saveResult() {
    const total = questions.length;
    const correctCount = Object.values(answers).filter(a => a.isCorrect).length;
    const pct = Math.round((correctCount / total) * 100);
    localStorage.setItem(`topic_result_${userId}_${id}`, JSON.stringify({ correct: correctCount, total, percent: pct, date: Date.now() }));
  }

  function restart() { setIdx(0); setAnswers({}); setSelected(null); setDone(false); setNotePanel(null); }

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
    if (!confirm(t.note_del_confirm)) return;
    const token = localStorage.getItem('token');
    await fetch(`/api/notes/${questionId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setNotes(prev => { const n = { ...prev }; delete n[questionId]; return n; });
    setNotePanel(null);
  }

  async function toggleSave(questionId) {
    const isSaved = savedIds.has(questionId);
    // Optimistic update
    setSavedIds(prev => {
      const next = new Set(prev);
      isSaved ? next.delete(questionId) : next.add(questionId);
      return next;
    });
    try {
      await apiFetch('/saved', { method: 'POST', body: JSON.stringify({ questionId }) });
    } catch {
      // Rollback on error
      setSavedIds(prev => {
        const next = new Set(prev);
        isSaved ? next.add(questionId) : next.delete(questionId);
        return next;
      });
    }
  }

  if (guard === 'loading') return null;
  if (guard === 'denied') return (<><Navbar /><PremiumGate /></>);

  if (loading) return <><Navbar /><Loading label={t.loading} /></>;

  const total = questions.length;
  const pct = Math.round((idx / total) * 100);
  const correctCount = Object.values(answers).filter(a => a.isCorrect).length;

  if (done) {
    const score = Math.round((correctCount / total) * 100);
    const pass = score >= 80;
    return (
      <>
        <Navbar />
        <div style={{maxWidth:720,margin:'0 auto',padding:'1.5rem 1rem'}}>
          <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:10,padding:'2.5rem 1.5rem',textAlign:'center'}}>
            <h2 style={{fontSize:'1.3rem',marginBottom:'0.5rem',color:'var(--text)'}}>{pass ? t.congrats : t.study_more}</h2>
            <p style={{color:'var(--text-muted)',marginBottom:'1rem'}}>{topic?.name[lang] || topic?.name.uz}</p>
            <div style={{fontSize:'2.5rem',fontWeight:700,color:pass?'#16A34A':'#DC2626',margin:'1rem 0'}}>{score}%</div>
            <div style={{display:'flex',gap:'1rem',justifyContent:'center',marginBottom:'2rem',flexWrap:'wrap'}}>
              <span style={{padding:'0.5rem 1rem',borderRadius:8,background:'#DCFCE7',color:'#166534',fontSize:'0.875rem'}}>{t.correct_l}: {correctCount}</span>
              <span style={{padding:'0.5rem 1rem',borderRadius:8,background:'#FEE2E2',color:'#991B1B',fontSize:'0.875rem'}}>{t.wrong_l}: {total - correctCount}</span>
              <span style={{padding:'0.5rem 1rem',borderRadius:8,background:'#DBEAFE',color:'#1E40AF',fontSize:'0.875rem'}}>{t.total_l}: {total}</span>
            </div>
            <div style={{display:'flex',gap:'0.75rem',justifyContent:'center'}}>
              <button onClick={restart} className="btn btn-primary">{t.restart}</button>
              <Link href="/mavzular" className="btn btn-outline">{t.back_topics}</Link>
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
  const isSaved = savedIds.has(q.id);

  return (
    <>
      <Navbar />

      {/* Lightbox */}
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

      <div style={{maxWidth:720,margin:'0 auto',padding:'1.5rem 1rem'}}>

        {/* Header */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.25rem'}}>
          <Link href="/mavzular" style={{fontSize:'0.875rem',color:'var(--text-muted)',textDecoration:'none'}}>&larr; {topic?.name[lang] || topic?.name.uz}</Link>
          <span style={{fontSize:'0.875rem',color:'var(--text-muted)'}}>
            <strong style={{color:'var(--text)'}}>{idx+1}</strong> / {total}
          </span>
        </div>

        {/* Progress bar */}
        <div className="progress-bar-wrap" style={{marginBottom:'1.25rem'}}>
          <div style={{height:'100%',borderRadius:99,background:'var(--primary)',width:`${pct}%`,transition:'width 0.3s'}} />
        </div>

        {/* Question card */}
        <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:10,overflow:'hidden'}}>
          {q.image_url && (
            <QuestionImage src={q.image_url} maxHeight={260} onClick={() => setLightbox(q.image_url)} />
          )}

          <div style={{padding:'1.25rem'}}>

            {/* Question text + 💡 button */}
            <div style={{display:'flex',alignItems:'flex-start',gap:'0.75rem',marginBottom:'1.1rem'}}>
              <p style={{fontSize:'0.975rem',fontWeight:500,lineHeight:1.5,color:'var(--text)',flex:1,margin:0}}>{q.text[lang] || q.text.uz}</p>

              {/* Save button */}
              <button
                onClick={() => toggleSave(q.id)}
                title={isSaved ? "Saqlanganlardan o'chirish" : "Saqlash"}
                style={{
                  flexShrink: 0,
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '1.25rem', lineHeight: 1, padding: '0.2rem 0.1rem',
                  color: isSaved ? '#F59E0B' : 'var(--text-muted)',
                  transition: 'color 0.15s, transform 0.1s',
                }}
              >🔖</button>

              {/* Show button: admin always, user only if note exists */}
              {(isAdmin || hasNote) && (
                <button
                  onClick={() => openNotePanel(q.id)}
                  title={hasNote ? t.note_edit : t.note_add}
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
                  <span>{t.note_l}</span>
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
                    {isAdmin ? (hasNote ? t.note_edit : t.note_add) : t.note_l}
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
                        placeholder={t.note_ph}
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
                          {noteSaving ? t.note_saving : t.note_save}
                        </button>
                        {hasNote && (
                          <button
                            onClick={() => deleteNote(q.id)}
                            style={{padding:'0.4rem 1rem',background:'#FEF2F2',color:'#DC2626',border:'1px solid #FCA5A5',borderRadius:6,fontSize:'0.85rem',fontWeight:600,cursor:'pointer'}}
                          >
                            {t.note_del}
                          </button>
                        )}
                        <button
                          onClick={() => setNotePanel(null)}
                          style={{padding:'0.4rem 0.875rem',background:'var(--surface)',color:'var(--text-muted)',border:'1px solid var(--border)',borderRadius:6,fontSize:'0.85rem',cursor:'pointer'}}
                        >
                          {t.cancel}
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
                    <span>{v.text[lang] || v.text.uz}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {selected !== null && (
            <div style={{padding:'1rem 1.25rem',borderTop:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',background:'var(--surface)',gap:'1rem'}}>
              <span style={{fontSize:'0.875rem',fontWeight:500,color:selected===correctIdx?'#16A34A':'#DC2626'}}>
                {selected === correctIdx ? t.correct : t.wrong}
              </span>
              <button onClick={next} className="btn btn-primary">
                {idx + 1 < total ? t.next_q : t.finish}
              </button>
            </div>
          )}
        </div>

        {/* Question navigation grid */}
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
