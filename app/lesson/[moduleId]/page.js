'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { apiFetch } from '@/lib/api';

export default function LessonPage() {
  const { moduleId } = useParams();
  const router = useRouter();
  const [lessons, setLessons] = useState([]);
  const [current, setCurrent] = useState(null);
  const [progressMap, setProgressMap] = useState({});
  const [modulePercent, setModulePercent] = useState(0);
  const [quizState, setQuizState] = useState(null);
  const [videoEnded, setVideoEnded] = useState({});
  const [countdown, setCountdown] = useState(null);
  const [nextLesson, setNextLesson] = useState(null);
  const [lockedMsg, setLockedMsg] = useState(false);
  const [moduleFinished, setModuleFinished] = useState(false);
  const playerRef = useRef(null);
  const currentRef = useRef(null);
  const lessonsRef = useRef([]);
  const progressMapRef = useRef({});
  const videoEndedRef = useRef({});

  useEffect(() => {
    if (!localStorage.getItem('user')) { router.push('/login'); return; }
    loadAll();
  }, [moduleId]);

  async function loadAll() {
    const [ls, ps] = await Promise.all([
      apiFetch(`/lessons/module/${moduleId}`),
      apiFetch(`/progress/module/${moduleId}`)
    ]);
    const pm = {};
    ps.forEach(p => { pm[p.lessonId] = p; });
    setProgressMap(pm);
    progressMapRef.current = pm;
    setLessons(ls);
    lessonsRef.current = ls;
    calcPercent(ls, pm);
    if (ls.length) openLesson(ls[0], pm, ls, {});
  }

  function calcPercent(ls, pm) {
    if (!ls.length) return;
    const done = ls.filter(l => isLessonDone(l, pm, {})).length;
    setModulePercent(Math.round((done / ls.length) * 100));
    if (done === ls.length && ls.length > 0) setModuleFinished(true);
  }

  function isLessonDone(lesson, pm, ve) {
    const prog = pm[lesson._id];
    if (prog?.quizPassed) return true;
    if (!lesson.quiz && (prog?.videoWatched || ve[lesson._id])) return true;
    return false;
  }

  function isLocked(idx, ls, pm, ve) {
    if (idx === 0) return false;
    return !isLessonDone(ls[idx - 1], pm, ve);
  }

  function openLesson(lesson, pm = progressMapRef.current, ls = lessonsRef.current, ve = videoEndedRef.current) {
    const idx = ls.findIndex(l => l._id === lesson._id);
    if (isLocked(idx, ls, pm, ve)) {
      setLockedMsg(true);
      setTimeout(() => setLockedMsg(false), 3500);
      return;
    }
    setCurrent(lesson);
    currentRef.current = lesson;
    setQuizState(null);
    setCountdown(null);
    setNextLesson(null);
    setLockedMsg(false);
    const prog = pm[lesson._id];
    if (prog?.quizPassed) setQuizState({ done: true });
  }

  useEffect(() => {
    if (!current) return;
    if (window.YT?.Player) { initPlayer(); return; }
    if (!document.getElementById('yt-script')) {
      const tag = document.createElement('script');
      tag.id = 'yt-script';
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }
    window.onYouTubeIframeAPIReady = initPlayer;
  }, [current]);

  function initPlayer() {
    if (playerRef.current) { playerRef.current.destroy(); }
    playerRef.current = new window.YT.Player('yt-player', {
      events: {
        onStateChange: (e) => {
          if (e.data === window.YT.PlayerState.ENDED) {
            const lesson = currentRef.current;
            if (lesson) onVideoEnd(lesson);
          }
        }
      }
    });
  }

  async function onVideoEnd(lesson) {
    if (videoEndedRef.current[lesson._id]) return;
    const newVe = { ...videoEndedRef.current, [lesson._id]: true };
    videoEndedRef.current = newVe;
    setVideoEnded(newVe);
    try { await apiFetch('/progress/video-watched', { method: 'POST', body: JSON.stringify({ lessonId: lesson._id }) }); } catch {}
    const newPm = { ...progressMapRef.current, [lesson._id]: { ...progressMapRef.current[lesson._id], videoWatched: true } };
    progressMapRef.current = newPm;
    setProgressMap(newPm);
    const ls = lessonsRef.current;
    calcPercent(ls, newPm);

    if (lesson.quiz && !newPm[lesson._id]?.quizPassed) {
      setQuizState({ showing: true });
    } else {
      const isLast = ls[ls.length - 1]?._id === lesson._id;
      if (isLast) {
        setModuleFinished(true);
      } else {
        startAutoAdvance(lesson, ls);
      }
    }
  }

  function startAutoAdvance(lesson, ls = lessonsRef.current) {
    const idx = ls.findIndex(l => l._id === lesson._id);
    if (idx >= 0 && idx < ls.length - 1) {
      setNextLesson(ls[idx + 1]);
      setCountdown(5);
    }
  }

  useEffect(() => {
    if (countdown === null || countdown === undefined) return;
    if (countdown === 0) {
      const next = nextLesson;
      setCountdown(null);
      setNextLesson(null);
      if (next) openLesson(next);
      return;
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  async function submitQuiz(answerIdx) {
    const res = await apiFetch('/progress/quiz', { method: 'POST', body: JSON.stringify({ lessonId: current._id, answerIndex: answerIdx }) });
    setQuizState({ result: res });
    if (res.correct) {
      const newPm = { ...progressMapRef.current, [current._id]: { ...progressMapRef.current[current._id], quizPassed: true } };
      progressMapRef.current = newPm;
      setProgressMap(newPm);
      const ls = await apiFetch(`/lessons/module/${moduleId}`);
      setLessons(ls);
      lessonsRef.current = ls;
      calcPercent(ls, newPm);
      const isLast = ls[ls.length - 1]?._id === current._id;
      if (isLast) {
        setTimeout(() => setModuleFinished(true), 1200);
      } else {
        setTimeout(() => startAutoAdvance(current, ls), 1200);
      }
    }
  }

  function goNext() {
    const ls = lessonsRef.current;
    const idx = ls.findIndex(l => l._id === current?._id);
    if (idx >= 0 && idx < ls.length - 1) openLesson(ls[idx + 1]);
  }

  const currentIdx = lessons.findIndex(l => l._id === current?._id);
  const isLastLesson = currentIdx === lessons.length - 1;
  const currentDone = current ? isLessonDone(current, progressMap, videoEnded) : false;
  const cardStyle = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '1.25rem', marginTop: '1.25rem' };

  return (
    <>
      <Navbar />
      <div className="container">

        {/* Module progress */}
        <div style={{marginBottom:'1.25rem'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.4rem'}}>
            <Link href="/modules" style={{fontSize:'0.85rem',color:'var(--text-muted)',textDecoration:'none'}}>&#8592; Modullar</Link>
            <span style={{fontSize:'0.85rem',color:'var(--text-muted)'}}>{modulePercent}% yakunlangan</span>
          </div>
          <div className="progress-bar-wrap"><div className="progress-bar" style={{width:`${modulePercent}%`}} /></div>
          <div className="progress-label">{lessons.filter(l=>isLessonDone(l,progressMap,videoEnded)).length}/{lessons.length} dars</div>
        </div>

        {/* Locked warning */}
        {lockedMsg && (
          <div style={{background:'#FEF9C3',border:'1px solid #FDE047',borderRadius:8,padding:'0.875rem 1.25rem',marginBottom:'1rem',fontSize:'0.9rem',color:'#713F12',fontWeight:500}}>
            Avvalgi darsni yakunlab, keyin keyingisiga o'ting.
          </div>
        )}

        <div className="lesson-layout">

          {/* Sidebar */}
          <div className="lesson-sidebar">
            <h3 style={{fontSize:'0.8rem',fontWeight:700,marginBottom:'0.6rem',color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.06em'}}>
              Darslar ({lessons.length})
            </h3>
            <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:10,overflow:'hidden'}}>
              {lessons.map((l, i) => {
                const done = isLessonDone(l, progressMap, videoEnded);
                const locked = isLocked(i, lessons, progressMap, videoEnded);
                const isActive = current?._id === l._id;
                return (
                  <div key={l._id} onClick={() => openLesson(l)}
                    style={{padding:'0.75rem 1rem',borderBottom:'1px solid var(--border)',cursor: locked ? 'not-allowed' : 'pointer',
                      display:'flex',gap:'0.75rem',alignItems:'center',fontSize:'0.875rem',
                      background: isActive ? '#EFF6FF' : 'var(--surface)',
                      opacity: locked ? 0.55 : 1}}>
                    <div style={{width:22,height:22,borderRadius:'50%',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,
                      border:`2px solid ${done?'#16A34A':locked?'var(--border)':isActive?'#2563EB':'var(--border)'}`,
                      background: done ? '#16A34A' : 'transparent',
                      color: done ? 'white' : isActive ? '#2563EB' : 'var(--text-muted)'}}>
                      {done ? '✓' : locked ? '🔒' : i+1}
                    </div>
                    <span style={{lineHeight:1.3,color: isActive ? '#2563EB' : 'var(--text)',flex:1}}>{l.title}</span>
                    {locked && <span style={{fontSize:'0.75rem',color:'var(--text-muted)',flexShrink:0}}>Qulflangan</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Main content */}
          <div className="lesson-main">
            {current ? (
              <>
                {/* Video */}
                <div style={{position:'relative',paddingBottom:'56.25%',height:0,borderRadius:10,overflow:'hidden',background:'#000'}}>
                  <iframe id="yt-player"
                    src={`https://www.youtube.com/embed/${current.youtubeId}?enablejsapi=1&rel=0&modestbranding=1`}
                    style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',border:'none'}}
                    allowFullScreen allow="autoplay" />
                </div>

                {/* Title + description */}
                <div style={{marginTop:'1rem',display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:'1rem',flexWrap:'wrap'}}>
                  <div>
                    <h2 style={{fontSize:'1.15rem',marginBottom:'0.3rem',color:'var(--text)'}}>{current.title}</h2>
                    <p style={{color:'var(--text-muted)',fontSize:'0.9rem'}}>{current.description}</p>
                  </div>
                  {/* "Keyingisi" button shown after lesson is done and not last */}
                  {currentDone && !isLastLesson && !countdown && (
                    <button onClick={goNext} className="btn btn-primary" style={{flexShrink:0,display:'flex',alignItems:'center',gap:'0.4rem'}}>
                      Keyingisi &#8594;
                    </button>
                  )}
                </div>

                {/* Auto-advance countdown */}
                {countdown !== null && nextLesson && (
                  <div style={{...cardStyle, background:'#EFF6FF', border:'1px solid #BFDBFE'}}>
                    <p style={{fontSize:'0.9rem',color:'#1D4ED8',marginBottom:'0.75rem'}}>
                      Keyingi darsga o'tilmoqda: <strong>{nextLesson.title}</strong>
                    </p>
                    <div style={{display:'flex',alignItems:'center',gap:'1rem'}}>
                      <div style={{width:38,height:38,borderRadius:'50%',border:'3px solid #2563EB',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:'1rem',color:'#2563EB',flexShrink:0}}>
                        {countdown}
                      </div>
                      <div style={{flex:1}}>
                        <div style={{height:4,background:'#BFDBFE',borderRadius:99,overflow:'hidden'}}>
                          <div style={{height:'100%',background:'#2563EB',borderRadius:99,width:`${((5-countdown)/5)*100}%`,transition:'width 1s linear'}} />
                        </div>
                      </div>
                      <button onClick={()=>{setCountdown(null);setNextLesson(null);openLesson(nextLesson);}} className="btn btn-primary" style={{padding:'0.4rem 0.875rem',fontSize:'0.85rem',flexShrink:0}}>
                        Hozir o'tish
                      </button>
                      <button onClick={()=>{setCountdown(null);setNextLesson(null);}} className="btn btn-outline" style={{padding:'0.4rem 0.875rem',fontSize:'0.85rem',flexShrink:0}}>
                        Bekor
                      </button>
                    </div>
                  </div>
                )}

                {/* Module finished banner */}
                {moduleFinished && isLastLesson && (
                  <div style={{...cardStyle, background:'#F0FDF4', border:'2px solid #86EFAC', textAlign:'center', padding:'2rem 1.5rem'}}>
                    <div style={{fontSize:'2.5rem',marginBottom:'0.75rem'}}>🎉</div>
                    <h3 style={{fontSize:'1.2rem',color:'#15803D',marginBottom:'0.5rem'}}>Tabriklaymiz! Modul yakunlandi!</h3>
                    <p style={{color:'#16A34A',fontSize:'0.95rem',marginBottom:'1.25rem'}}>Siz ushbu modulning barcha darslarini muvaffaqiyatli tugatingiz.</p>
                    <div style={{display:'flex',gap:'0.75rem',justifyContent:'center',flexWrap:'wrap'}}>
                      <Link href="/modules" className="btn btn-primary">Boshqa modullarga o'tish</Link>
                      <button onClick={()=>openLesson(lessons[0])} className="btn btn-outline">Boshidan ko'rish</button>
                    </div>
                  </div>
                )}

                {/* Already done (not last) */}
                {quizState?.done && !moduleFinished && !countdown && (
                  <div style={cardStyle}>
                    <div style={{background:'#F0FDF4',color:'#16A34A',padding:'0.75rem 1rem',borderRadius:8,fontSize:'0.9rem',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'0.5rem'}}>
                      <span>Bu darsni allaqachon yakunlagansiz!</span>
                      {!isLastLesson && (
                        <button onClick={goNext} className="btn btn-primary" style={{padding:'0.4rem 0.875rem',fontSize:'0.85rem'}}>
                          Keyingisi &#8594;
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Quiz */}
                {quizState?.showing && current.quiz && (
                  <div style={cardStyle}>
                    <h4 style={{marginBottom:'1rem',color:'var(--text)'}}>Dars bo'yicha savol</h4>
                    <p style={{fontSize:'0.95rem',marginBottom:'1rem',color:'var(--text)'}}>{current.quiz.question}</p>
                    <div style={{display:'flex',flexDirection:'column',gap:'0.6rem'}}>
                      {current.quiz.options.map((opt, i) => (
                        <button key={i} onClick={() => submitQuiz(i)}
                          style={{padding:'0.75rem 1rem',border:'1.5px solid var(--border)',borderRadius:8,background:'var(--surface)',color:'var(--text)',textAlign:'left',fontSize:'0.9rem',cursor:'pointer'}}>
                          {String.fromCharCode(65+i)}. {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quiz result */}
                {quizState?.result && (
                  <div style={cardStyle}>
                    <div style={{padding:'0.75rem 1rem',borderRadius:8,fontSize:'0.9rem',
                      background:quizState.result.correct?'#F0FDF4':'#FEF2F2',
                      color:quizState.result.correct?'#16A34A':'#DC2626'}}>
                      {quizState.result.correct ? "To'g'ri! Dars yakunlandi." : "Noto'g'ri. Qayta urinib ko'ring."}
                    </div>
                  </div>
                )}

                {/* Waiting for video to end */}
                {!quizState && current.quiz && !videoEnded[current._id] && (
                  <div style={cardStyle}>
                    <p style={{color:'var(--text-muted)',fontSize:'0.9rem'}}>Savol video tugagandan so'ng ochiladi</p>
                  </div>
                )}
              </>
            ) : <p style={{color:'var(--text-muted)'}}>Darsni tanlang</p>}
          </div>
        </div>
      </div>
      <style>{`
        @media(max-width:768px){
          .container > div:nth-child(3) { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
}
