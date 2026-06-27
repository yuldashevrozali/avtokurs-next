'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { apiFetch } from '@/lib/api';

const LABELS = ['A', 'B', 'C', 'D', 'E'];

export default function BattleRoomPage() {
  const { roomId } = useParams();
  const router = useRouter();

  const [phase, setPhase] = useState('loading'); // loading|waiting|joining|playing|finished
  const [room, setRoom] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState(null); // selected variant index
  const [lastResult, setLastResult] = useState(null); // { isCorrect }
  const [myStats, setMyStats] = useState({ answeredCount: 0, correctCount: 0 });
  const [oppStats, setOppStats] = useState({ name: '...', answeredCount: 0, correctCount: 0, done: false });
  const [elapsed, setElapsed] = useState(0);
  const [copied, setCopied] = useState(false);
  const [myId, setMyId] = useState('');
  const [myName, setMyName] = useState('');

  const pollRef = useRef(null);
  const timerRef = useRef(null);
  const startedAtRef = useRef(null);
  const gameActiveRef = useRef(false);

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (!u) { router.push('/login'); return; }
    const parsed = JSON.parse(u);
    setMyId(parsed.id);
    setMyName(parsed.name || '');
    initRoom();
    return () => {
      clearInterval(pollRef.current);
      clearInterval(timerRef.current);
    };
  }, []);

  async function initRoom() {
    try {
      const data = await apiFetch(`/battle/${roomId}`);
      setRoom(data);

      if (data.status === 'finished') {
        handleFinished(data);
        return;
      }

      if (data.status === 'playing') {
        startGame(data);
        return;
      }

      // Waiting room
      if (!data.amIn) {
        // Try to join as p2
        setPhase('joining');
        try {
          await apiFetch(`/battle/${roomId}/join`, { method: 'POST' });
          const fresh = await apiFetch(`/battle/${roomId}`);
          startGame(fresh);
        } catch {
          setPhase('error');
        }
        return;
      }

      // I'm p1, waiting for p2
      setPhase('waiting');
      pollRef.current = setInterval(async () => {
        try {
          const d = await apiFetch(`/battle/${roomId}`);
          if (d.status === 'playing') {
            clearInterval(pollRef.current);
            startGame(d);
          } else if (d.status === 'finished') {
            clearInterval(pollRef.current);
            handleFinished(d);
          }
        } catch {}
      }, 2000);
    } catch {
      setPhase('error');
    }
  }

  function startGame(data) {
    gameActiveRef.current = true;
    setRoom(data);
    setQuestions(data.questions || []);
    setMyStats(data.me || { answeredCount: 0, correctCount: 0 });
    setOppStats(data.opponent || { name: '...', answeredCount: 0, correctCount: 0, done: false });
    startedAtRef.current = new Date(data.startedAt).getTime();
    setPhase('playing');

    // Timer
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000));
    }, 1000);

    // Poll opponent progress every 2s
    pollRef.current = setInterval(async () => {
      if (!gameActiveRef.current) return;
      try {
        const d = await apiFetch(`/battle/${roomId}`);
        setOppStats(d.opponent || {});
        if (d.status === 'finished') {
          clearInterval(pollRef.current);
          clearInterval(timerRef.current);
          gameActiveRef.current = false;
          setRoom(d);
          setPhase('finished');
        }
      } catch {}
    }, 2000);
  }

  function handleFinished(data) {
    clearInterval(pollRef.current);
    clearInterval(timerRef.current);
    gameActiveRef.current = false;
    setRoom(data);
    setPhase('finished');
  }

  async function selectAnswer(idx) {
    if (selected !== null || lastResult !== null) return;
    setSelected(idx);

    try {
      const res = await apiFetch(`/battle/${roomId}/answer`, {
        method: 'POST',
        body: JSON.stringify({ questionIdx: qIdx, selectedIndex: idx }),
      });
      setLastResult({ isCorrect: res.isCorrect });
      setMyStats({ answeredCount: res.answeredCount, correctCount: res.correctCount });

      if (res.answeredCount >= 20) {
        // I'm done — wait for opponent via polling
        clearInterval(timerRef.current);
        return;
      }

      // Auto-advance after 1.2s
      setTimeout(() => {
        setQIdx(i => i + 1);
        setSelected(null);
        setLastResult(null);
      }, 1200);
    } catch (e) {
      setSelected(null);
    }
  }

  function fmtTime(s) {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  }

  function fmtFinishTime(room, isP1) {
    if (!room?.startedAt) return '-';
    const player = isP1 ? room.p1 : room.p2;
    if (!player?.finishedAt) return '-';
    const ms = new Date(player.finishedAt) - new Date(room.startedAt);
    return fmtTime(Math.floor(ms / 1000));
  }

  function copyLink() {
    navigator.clipboard.writeText(`${window.location.origin}/battle/${roomId}`)
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  const q = questions[qIdx];
  const correctIdx = q?.variants.findIndex(v => v.is_correct) ?? -1;

  // ── LOADING ──
  if (phase === 'loading' || phase === 'joining') {
    return (
      <>
        <Navbar />
        <div style={{ maxWidth: 600, margin: '4rem auto', padding: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
          <p style={{ color: 'var(--text-muted)' }}>{phase === 'joining' ? 'O\'yinga qo\'shilmoqda...' : 'Yuklanmoqda...'}</p>
        </div>
      </>
    );
  }

  // ── ERROR ──
  if (phase === 'error') {
    return (
      <>
        <Navbar />
        <div style={{ maxWidth: 600, margin: '4rem auto', padding: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
          <h2 style={{ color: 'var(--text)' }}>Xona topilmadi</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Bu xona to'la yoki mavjud emas</p>
          <Link href="/battle" className="btn btn-primary">Raqobatga qaytish</Link>
        </div>
      </>
    );
  }

  // ── WAITING (friend mode, I'm p1) ──
  if (phase === 'waiting') {
    const link = typeof window !== 'undefined' ? `${window.location.origin}/battle/${roomId}` : '';
    return (
      <>
        <Navbar />
        <div style={{ maxWidth: 520, margin: '3rem auto', padding: '1rem' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🔗</div>
            <h2 style={{ color: 'var(--text)', margin: '0 0 0.5rem' }}>Do'stingizni kutmoqda...</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Havolani do'stingizga yuboring. U kirgach o'yin boshlanadi.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <input readOnly value={link}
                style={{ flex: 1, padding: '0.6rem 0.75rem', border: '1.5px solid var(--border)', borderRadius: 8, background: 'var(--bg)', color: 'var(--text)', fontSize: '0.85rem', outline: 'none', minWidth: 0 }} />
              <button onClick={copyLink}
                style={{ padding: '0.6rem 1rem', background: copied ? '#16A34A' : '#3B82F6', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                {copied ? '✓' : 'Nusxa'}
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)', fontSize: '0.875rem', justifyContent: 'center' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#22C55E', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
              Raqib kutilmoqda...
            </div>
            <Link href="/battle" style={{ display: 'block', marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.875rem', textDecoration: 'none' }}>
              ← Raqobatga qaytish
            </Link>
          </div>
        </div>
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
      </>
    );
  }

  // ── FINISHED ──
  if (phase === 'finished' && room) {
    const iWon = room.winnerId === myId;
    const r = room;
    const myIsP1 = r.isP1;
    const myData = myIsP1 ? r.p1 : r.p2;
    const oppData = myIsP1 ? r.p2 : r.p1;
    const myTime = fmtFinishTime(r, myIsP1);
    const oppTime = fmtFinishTime(r, !myIsP1);

    return (
      <>
        <Navbar />
        <div style={{ maxWidth: 520, margin: '2rem auto', padding: '1rem' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', textAlign: 'center' }}>
            <div style={{ padding: '2rem', background: iWon ? 'linear-gradient(135deg,#16A34A,#15803D)' : 'linear-gradient(135deg,#DC2626,#B91C1C)', color: 'white' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '0.75rem' }}>{iWon ? '🏆' : '😔'}</div>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>
                {iWon ? 'Siz yutdingiz!' : 'Siz yutqazdingiz'}
              </h2>
              <p style={{ margin: '0.5rem 0 0', opacity: 0.9, fontSize: '0.9rem' }}>
                {iWon ? '+5 ochko qo\'shildi' : '−5 ochko ayirildi'}
              </p>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                {[
                  { label: myData?.name || 'Siz', data: myData, time: myTime, isMe: true },
                  { label: oppData?.name || 'Raqib', data: oppData, time: oppTime, isMe: false },
                ].map(({ label, data: pd, time, isMe }) => (
                  <div key={label} style={{ padding: '1rem', background: 'var(--bg)', borderRadius: 10, border: `2px solid ${isMe ? '#3B82F6' : 'var(--border)'}` }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{isMe ? '👤 Siz' : '👤 Raqib'}</div>
                    <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.95rem', marginBottom: '0.5rem' }}>{label}</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#16A34A' }}>{pd?.correctCount ?? 0}/20</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>⏱ {time}</div>
                  </div>
                ))}
              </div>

              {myData?.correctCount === oppData?.correctCount && (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  * Teng natija — tezroq tugallagan yutdi
                </p>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/battle" className="btn btn-primary">Qayta o'ynash</Link>
                <Link href="/" style={{ padding: '0.6rem 1.25rem', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', textDecoration: 'none', fontSize: '0.9rem' }}>
                  Bosh sahifa
                </Link>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── PLAYING ──
  if (!q) return <><Navbar /><div className="container"><p style={{ color: 'var(--text-muted)' }}>Yuklanmoqda...</p></div></>;

  const myDone = myStats.answeredCount >= 20;

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '1rem' }}>

        {/* Players header */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '0.875rem 1rem' }}>
          {/* Me */}
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>👤 Siz</div>
            <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.9rem', marginBottom: '0.4rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{myName || 'Siz'}</div>
            <ProgressBar done={myStats.answeredCount} correct={myStats.correctCount} />
          </div>

          {/* Timer */}
          <div style={{ textAlign: 'center', minWidth: 64 }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{fmtTime(elapsed)}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>VS</div>
          </div>

          {/* Opponent */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>👤 Raqib</div>
            <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.9rem', marginBottom: '0.4rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{oppStats.name || '...'}</div>
            <ProgressBar done={oppStats.answeredCount} correct={oppStats.correctCount} reverse />
          </div>
        </div>

        {/* Waiting for opponent after finishing */}
        {myDone && (
          <div style={{ background: '#FEF9C3', border: '1.5px solid #FDE047', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1rem', textAlign: 'center', color: '#713F12', fontSize: '0.875rem', fontWeight: 500 }}>
            ⏳ Raqib tugashini kutmoqda... ({oppStats.answeredCount}/20 javoblangan)
          </div>
        )}

        {/* Question */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
          {/* Q number */}
          <div style={{ padding: '0.6rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Savol <strong style={{ color: 'var(--text)' }}>{qIdx + 1}</strong> / {questions.length}
            </span>
            {/* mini progress dots */}
            <div style={{ display: 'flex', gap: 3 }}>
              {questions.map((_, i) => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: i < myStats.answeredCount ? '#16A34A' : i === qIdx ? '#3B82F6' : 'var(--border)' }} />
              ))}
            </div>
          </div>

          {q.image_url && (
            <img src={q.image_url} alt="" style={{ width: '100%', maxHeight: 220, objectFit: 'contain', background: 'var(--bg)', display: 'block' }} onError={e => e.target.style.display = 'none'} />
          )}

          <div style={{ padding: '1.25rem' }}>
            <p style={{ fontSize: '1rem', fontWeight: 500, lineHeight: 1.55, color: 'var(--text)', margin: '0 0 1.1rem' }}>{q.text.uz}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
              {q.variants.map((v, i) => {
                let bg = 'var(--surface)';
                let border = '1.5px solid var(--border)';
                let color = 'var(--text)';
                if (selected !== null) {
                  if (i === correctIdx) { bg = '#F0FDF4'; border = '1.5px solid #16A34A'; color = '#166534'; }
                  if (i === selected && selected !== correctIdx) { bg = '#FEF2F2'; border = '1.5px solid #DC2626'; color = '#991B1B'; }
                }
                return (
                  <button key={i} onClick={() => selectAnswer(i)}
                    disabled={selected !== null || myDone}
                    style={{ padding: '0.8rem 1rem', border, borderRadius: 8, background: bg, color, textAlign: 'left', fontSize: '0.9rem', cursor: selected === null && !myDone ? 'pointer' : 'default', display: 'flex', gap: '0.75rem', alignItems: 'flex-start', lineHeight: 1.4 }}>
                    <span style={{ minWidth: 22, height: 22, borderRadius: '50%', border: '1.5px solid var(--border)', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 600, flexShrink: 0, color: 'var(--text-muted)' }}>
                      {LABELS[i]}
                    </span>
                    {v.text.uz}
                  </button>
                );
              })}
            </div>

            {lastResult !== null && (
              <div style={{ marginTop: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.875rem', borderRadius: 8, background: lastResult.isCorrect ? '#F0FDF4' : '#FEF2F2', border: `1px solid ${lastResult.isCorrect ? '#86EFAC' : '#FCA5A5'}` }}>
                <span style={{ fontSize: '1.2rem' }}>{lastResult.isCorrect ? '✅' : '❌'}</span>
                <span style={{ fontWeight: 600, color: lastResult.isCorrect ? '#166534' : '#991B1B', fontSize: '0.9rem' }}>
                  {lastResult.isCorrect ? "To'g'ri javob!" : "Noto'g'ri"}
                </span>
                <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {myStats.correctCount}/{myStats.answeredCount} ✓
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function ProgressBar({ done, correct, reverse }) {
  const pct = Math.round((done / 20) * 100);
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: reverse ? 'flex-end' : 'flex-start', gap: '0.5rem', marginBottom: '0.3rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
        <span>{done}/20</span>
        <span style={{ color: '#16A34A', fontWeight: 600 }}>{correct}✓</span>
      </div>
      <div style={{ height: 6, background: 'var(--border)', borderRadius: 99, overflow: 'hidden', direction: reverse ? 'rtl' : 'ltr' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#3B82F6,#8B5CF6)', borderRadius: 99, transition: 'width 0.3s' }} />
      </div>
    </div>
  );
}
