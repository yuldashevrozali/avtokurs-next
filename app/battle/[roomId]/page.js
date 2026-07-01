'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { apiFetch } from '@/lib/api';
import { useLang, T } from '@/lib/lang';

const LABELS = ['F1', 'F2', 'F3', 'F4', 'F5'];
const MEDALS = ['🥇','🥈','🥉','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟','1️⃣1️⃣','1️⃣2️⃣','1️⃣3️⃣','1️⃣4️⃣','1️⃣5️⃣','1️⃣6️⃣'];
const BATTLE_TIME = 30 * 60;

export default function BattleRoomPage() {
  const { roomId } = useParams();
  const router = useRouter();
  const { lang } = useLang();
  const t = T[lang];

  // phases: loading | joining | waiting | playing | waiting-others | done
  const [phase, setPhase] = useState('loading');
  const [room, setRoom] = useState(null);
  const [myId, setMyId] = useState('');
  const [errMsg, setErrMsg] = useState('');

  const [questions, setQuestions] = useState([]);
  const [totalQ, setTotalQ] = useState(20);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [myAnswered, setMyAnswered] = useState(0);
  const [myCorrect, setMyCorrect] = useState(0);
  const [players, setPlayers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(BATTLE_TIME);

  const [copied, setCopied] = useState(false);
  const pollRef = useRef(null);
  const autoRef = useRef(null);
  const timerRef = useRef(null);
  const phaseRef = useRef(phase);
  const startedAtRef = useRef(null);
  phaseRef.current = phase;

  useEffect(() => {
    const raw = localStorage.getItem('user');
    if (!raw) { router.push('/login'); return; }
    setMyId(JSON.parse(raw).id);
  }, []);

  function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = String(s % 60).padStart(2, '0');
    return `${m}:${sec}`;
  }

  // Start countdown from startedAt
  function startTimer(startedAt) {
    clearInterval(timerRef.current);
    startedAtRef.current = startedAt;
    const update = () => {
      const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
      const left = Math.max(BATTLE_TIME - elapsed, 0);
      setTimeLeft(left);
      if (left <= 0) {
        clearInterval(timerRef.current);
        handleTimeUp();
      }
    };
    update();
    timerRef.current = setInterval(update, 1000);
  }

  async function handleTimeUp() {
    if (phaseRef.current === 'done') return;
    try {
      await apiFetch(`/battle/${roomId}/finish`, { method: 'POST' });
    } catch {}
    const data = await apiFetch(`/battle/${roomId}`).catch(() => null);
    if (data) setPlayers(data.players || []);
    setPhase('done');
    clearInterval(pollRef.current);
  }

  const fetchRoom = useCallback(async () => {
    try {
      const data = await apiFetch(`/battle/${roomId}`);
      setRoom(data);
      setPlayers(data.players || []);

      if (data.status === 'finished') {
        clearInterval(pollRef.current);
        clearInterval(timerRef.current);
        setPhase('done');
        return;
      }
      if (data.status === 'playing') {
        if (phaseRef.current !== 'playing' && phaseRef.current !== 'waiting-others') {
          const qs = data.questions || [];
          setQuestions(qs);
          setTotalQ(qs.length || 20);
          setPhase('playing');
          if (data.startedAt) startTimer(data.startedAt);
        }
        clearInterval(pollRef.current);
        return;
      }
      // waiting
      if (!data.amIn) setPhase('joining');
      else setPhase('waiting');
    } catch {
      setErrMsg(t.room_404);
    }
  }, [roomId, t]);

  useEffect(() => {
    if (!myId) return;
    fetchRoom();
  }, [myId]);

  // Poll while waiting for game to start
  useEffect(() => {
    if (phase !== 'waiting') { clearInterval(pollRef.current); return; }
    pollRef.current = setInterval(fetchRoom, 2500);
    return () => clearInterval(pollRef.current);
  }, [phase, fetchRoom]);

  // Poll live scores while playing or waiting for others to finish
  useEffect(() => {
    if (phase !== 'playing' && phase !== 'waiting-others') return;
    const iv = setInterval(async () => {
      try {
        const data = await apiFetch(`/battle/${roomId}`);
        setPlayers(data.players || []);
        if (data.status === 'finished') {
          clearInterval(iv);
          clearInterval(timerRef.current);
          setPhase('done');
        }
      } catch {}
    }, 3000);
    return () => clearInterval(iv);
  }, [phase, roomId]);

  useEffect(() => () => {
    clearInterval(pollRef.current);
    clearInterval(timerRef.current);
    clearTimeout(autoRef.current);
  }, []);

  async function joinRoom() {
    setPhase('loading');
    try {
      await apiFetch(`/battle/${roomId}/join`, { method: 'POST' });
      fetchRoom();
    } catch (e) {
      setErrMsg(e.message || t.room_full);
    }
  }

  async function startGame() {
    try {
      await apiFetch(`/battle/${roomId}/start`, { method: 'POST' });
      fetchRoom();
    } catch (e) {
      alert(e.message);
    }
  }

  async function answer(selectedIdx) {
    if (selected !== null) return;
    setSelected(selectedIdx);
    try {
      const res = await apiFetch(`/battle/${roomId}/answer`, {
        method: 'POST',
        body: JSON.stringify({ questionIdx: idx, selectedIndex: selectedIdx }),
      });
      const newAnswered = res.answeredCount;
      const newCorrect = res.correctCount;
      const tq = res.totalQuestions || totalQ;
      setMyAnswered(newAnswered);
      setMyCorrect(newCorrect);
      setPlayers(prev => prev.map(p => p.userId === myId
        ? { ...p, answeredCount: newAnswered, correctCount: newCorrect, done: newAnswered >= tq }
        : p
      ));

      clearTimeout(autoRef.current);

      if (newAnswered >= tq) {
        // I'm done — switch to waiting-others, keep polling
        autoRef.current = setTimeout(async () => {
          const data = await apiFetch(`/battle/${roomId}`).catch(() => null);
          if (data) {
            setPlayers(data.players || []);
            if (data.status === 'finished') {
              clearInterval(timerRef.current);
              setPhase('done');
            } else {
              setPhase('waiting-others');
            }
          } else {
            setPhase('waiting-others');
          }
        }, 800);
      } else {
        autoRef.current = setTimeout(() => {
          setIdx(i => i + 1);
          setSelected(null);
        }, 800);
      }
    } catch {
      setSelected(null);
    }
  }

  function copyLink() {
    const url = `${window.location.origin}/battle/${roomId}`;
    navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  const timerDanger = timeLeft <= 60;
  const timerWarn = timeLeft <= 300;

  // Sorted leaderboard helper
  function sortedPlayers(arr) {
    return [...arr].sort((a, b) => {
      if (b.correctCount !== a.correctCount) return b.correctCount - a.correctCount;
      return (b.answeredCount - a.answeredCount);
    });
  }

  // ── LOADING ──
  if (phase === 'loading') return (
    <><Navbar /><div className="container" style={{ paddingTop: '4rem', textAlign: 'center' }}><p style={{ color: 'var(--text-muted)' }}>{t.loading}</p></div></>
  );

  // ── ERROR ──
  if (errMsg) return (
    <>
      <Navbar />
      <div style={{ maxWidth: 480, margin: '4rem auto', padding: '1rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>😕</div>
        <p style={{ color: 'var(--text)', marginBottom: '1.5rem' }}>{errMsg}</p>
        <Link href="/battle" className="btn btn-primary">{t.back_battle}</Link>
      </div>
    </>
  );

  // ── JOIN ──
  if (phase === 'joining') return (
    <>
      <Navbar />
      <div style={{ maxWidth: 480, margin: '3rem auto', padding: '1rem' }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '2rem 1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎮</div>
          <h2 style={{ color: 'var(--text)', marginBottom: '0.5rem' }}>
            {room?.mode === 'random' ? t.random_mode : t.friend_mode}
          </h2>
          {room?.questionSourceName && (
            <p style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, margin: '0 0 0.5rem' }}>
              {room.questionSource === 'topic' ? '📖' : '🎫'} {room.questionSourceName?.[lang] || room.questionSourceName?.uz}
            </p>
          )}
          <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
            {players.length} / {room?.maxPlayers || 2} {t.players_l}
          </p>
          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 0.25rem' }}>{t.room_code_l}</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '0.15em', color: 'var(--text)', margin: 0 }}>{roomId}</p>
          </div>
          <button onClick={joinRoom} style={{ width: '100%', padding: '0.85rem', background: '#3B82F6', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '1rem' }}>
            {t.joining}
          </button>
        </div>
      </div>
    </>
  );

  // ── WAITING ROOM ──
  if (phase === 'waiting') {
    const isRandom = room?.mode === 'random';
    const isCreator = room?.createdBy === myId;
    const canStart = players.length >= 2;
    // For random 2-player: auto-starts when 2nd joins, don't show start button
    // For random 3-16: creator can start when ≥2 joined
    const showStartBtn = isCreator && canStart && (!isRandom || room?.maxPlayers > 2);
    const showAutoMsg = isRandom && room?.maxPlayers === 2 && players.length < 2;

    return (
      <>
        <Navbar />
        <div style={{ maxWidth: 520, margin: '2rem auto', padding: '1rem' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>

            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)' }}>
                  {isRandom ? (lang === 'uz' ? '🎲 Random xona' : '🎲 Рандом хона') : t.waiting_room}
                </h2>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {players.length} / {room?.maxPlayers || 2} {t.players_l}
                </p>
                {room?.questionSource && room.questionSource !== 'random' && (
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>
                    {room.questionSource === 'topic' ? '📖' : '🎫'} {room.questionSourceName?.[lang] || room.questionSourceName?.uz}
                  </p>
                )}
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t.room_code_l}</p>
                <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, letterSpacing: '0.1em', color: 'var(--text)' }}>{roomId}</p>
              </div>
            </div>

            {/* Player slots */}
            <div style={{ padding: '1rem 1.5rem' }}>
              {Array.from({ length: Math.min(room?.maxPlayers || 2, 8) }).map((_, i) => {
                const player = players[i];
                const isMe = player?.userId === myId;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0.875rem', borderRadius: 8, marginBottom: '0.5rem', background: player ? (isMe ? 'rgba(59,130,246,0.08)' : 'var(--bg)') : 'var(--bg)', border: `1.5px solid ${player ? (isMe ? '#3B82F6' : 'var(--border)') : 'var(--border)'}`, opacity: player ? 1 : 0.5 }}>
                    {player ? (
                      <>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: isMe ? '#3B82F6' : '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0 }}>
                          {player.name?.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontWeight: 600, color: 'var(--text)', fontSize: '0.9rem' }}>
                            {player.name} {isMe ? (lang === 'uz' ? '(Siz)' : '(Сиз)') : ''}
                          </p>
                          <p style={{ margin: 0, fontSize: '0.75rem', color: '#16A34A' }}>✓ {lang === 'uz' ? 'Tayyor' : 'Тайёр'}</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '1rem', flexShrink: 0 }}>
                          {isRandom ? '🔍' : '⏳'}
                        </div>
                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                          {isRandom ? (lang === 'uz' ? 'Qidirilmoqda...' : 'Қидирилмоқда...') : t.slot_empty}
                        </p>
                      </>
                    )}
                  </div>
                );
              })}
              {(room?.maxPlayers || 2) > 8 && players.length < (room?.maxPlayers || 2) && (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '0.5rem 0' }}>
                  + {(room?.maxPlayers || 2) - Math.min(players.length, 8)} {lang === 'uz' ? "ta bo'sh o'rin" : "та бўш ўрин"}
                </p>
              )}
            </div>

            {/* Share link — only for friend mode */}
            {!isRandom && (
              <div style={{ padding: '0 1.5rem 0.875rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input readOnly value={`${typeof window !== 'undefined' ? window.location.origin : ''}/battle/${roomId}`}
                    style={{ flex: 1, padding: '0.55rem 0.75rem', border: '1.5px solid var(--border)', borderRadius: 8, background: 'var(--bg)', color: 'var(--text)', fontSize: '0.8rem', outline: 'none' }} />
                  <button onClick={copyLink}
                    style={{ padding: '0.55rem 0.875rem', background: copied ? '#16A34A' : 'var(--primary)', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                    {copied ? t.copied_l : t.copy_l}
                  </button>
                </div>
              </div>
            )}

            <div style={{ padding: '0 1.5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {showAutoMsg && (
                <div style={{ padding: '0.85rem', background: 'var(--bg)', borderRadius: 8, textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  ⏳ {lang === 'uz' ? "Raqib qo'shilishi kutilmoqda..." : 'Рақиб қўшилиши кутилмоқда...'}
                </div>
              )}
              {showStartBtn && (
                <button onClick={startGame}
                  style={{ padding: '0.85rem', background: '#16A34A', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '1rem' }}>
                  {t.start_game} ({players.length} {lang === 'uz' ? 'kishi' : 'киши'})
                </button>
              )}
              {!showStartBtn && !showAutoMsg && !isCreator && (
                <div style={{ padding: '0.85rem', background: 'var(--bg)', borderRadius: 8, textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  {isRandom
                    ? (lang === 'uz' ? "⏳ O'yinchilar to'lishi kutilmoqda..." : '⏳ Ўйинчилар тўлиши кутилмоқда...')
                    : (lang === 'uz' ? "⏳ Xona egasi o'yinni boshlashini kuting" : '⏳ Хона эгаси ўйинни бошлашини кутинг')}
                </div>
              )}
              {!showStartBtn && !showAutoMsg && isCreator && !canStart && (
                <div style={{ padding: '0.85rem', background: 'var(--bg)', borderRadius: 8, textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  ⏳ {t.need_more}
                </div>
              )}
              <Link href="/battle" style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', padding: '0.5rem', textDecoration: 'none' }}>
                ← {t.back_battle}
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── PLAYING ──
  if (phase === 'playing') {
    const q = questions[idx];
    if (!q) return null;
    const correctIdx = q.variants.findIndex(v => v.is_correct);
    const ranked = sortedPlayers(players);

    return (
      <>
        <Navbar />
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '0.75rem 1rem' }}>

          {/* Top bar: live scores + timer */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.875rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '0.6rem 0.875rem' }}>
              <p style={{ margin: '0 0 0.4rem', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.live_score}</p>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {ranked.map((p, i) => {
                  const isMe = p.userId === myId;
                  return (
                    <div key={p.userId} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.25rem 0.55rem', borderRadius: 20, background: isMe ? '#EFF6FF' : 'var(--bg)', border: `1.5px solid ${isMe ? '#3B82F6' : 'var(--border)'}`, fontSize: '0.8rem' }}>
                      <span>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}</span>
                      <span style={{ fontWeight: isMe ? 700 : 500, color: isMe ? '#1D4ED8' : 'var(--text)' }}>{p.name.split(' ')[0]}</span>
                      <span style={{ color: '#16A34A', fontWeight: 700 }}>{p.correctCount}</span>
                      <span style={{ color: 'var(--text-muted)' }}>/{p.answeredCount}</span>
                      {p.done && <span style={{ color: '#16A34A', fontSize: '0.7rem' }}>✓</span>}
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Timer */}
            <div style={{ background: timerDanger ? '#FEF2F2' : 'var(--surface)', border: `1.5px solid ${timerDanger ? '#DC2626' : timerWarn ? '#F59E0B' : 'var(--border)'}`, borderRadius: 10, padding: '0.6rem 0.875rem', textAlign: 'center', minWidth: 80, flexShrink: 0 }}>
              <p style={{ margin: '0 0 0.1rem', fontSize: '0.65rem', color: timerDanger ? '#DC2626' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                {timerDanger ? '⚠️' : '⏱'}
              </p>
              <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: timerDanger ? '#DC2626' : timerWarn ? '#D97706' : 'var(--text)' }}>
                {formatTime(timeLeft)}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              <strong style={{ color: 'var(--text)' }}>{idx + 1}</strong> / {totalQ}
            </span>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#16A34A' }}>
              {myCorrect} {lang === 'uz' ? "to'g'ri" : 'тўғри'}
            </span>
          </div>
          <div className="progress-bar-wrap" style={{ marginBottom: '0.875rem' }}>
            <div style={{ height: '100%', borderRadius: 99, background: 'var(--primary)', width: `${Math.round((idx / totalQ) * 100)}%`, transition: 'width 0.3s' }} />
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            {q.image_url && <img src={q.image_url} alt="" style={{ width: '100%', maxHeight: 260, objectFit: 'contain', background: 'var(--bg)', display: 'block' }} onError={e => e.target.style.display = 'none'} />}
            <div style={{ padding: '1.25rem' }}>
              <p style={{ fontSize: '0.975rem', fontWeight: 500, lineHeight: 1.55, color: 'var(--text)', margin: '0 0 1rem' }}>
                {q.text[lang] || q.text.uz}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {q.variants.map((v, i) => {
                  let bg = 'var(--surface)', border = '1.5px solid var(--border)', color = 'var(--text)';
                  if (selected !== null) {
                    if (i === correctIdx) { bg = '#F0FDF4'; border = '1.5px solid #16A34A'; color = '#166534'; }
                    if (i === selected && selected !== correctIdx) { bg = '#FEF2F2'; border = '1.5px solid #DC2626'; color = '#991B1B'; }
                  }
                  return (
                    <button key={i} onClick={() => answer(i)} disabled={selected !== null}
                      style={{ padding: '0.8rem 1rem', border, borderRadius: 8, background: bg, color, textAlign: 'left', fontSize: '0.9rem', cursor: selected === null ? 'pointer' : 'default', display: 'flex', gap: '0.75rem', alignItems: 'flex-start', lineHeight: 1.4 }}>
                      <span style={{ minWidth: 22, height: 22, borderRadius: '50%', border: '1.5px solid var(--border)', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0, color: 'var(--text-muted)' }}>
                        {LABELS[i]}
                      </span>
                      <span>{v.text[lang] || v.text.uz}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            {selected !== null && (
              <div style={{ padding: '0.875rem 1.25rem', borderTop: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600, color: selected === correctIdx ? '#16A34A' : '#DC2626', fontSize: '0.875rem' }}>
                  {selected === correctIdx ? t.correct : t.wrong}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {myAnswered < 20 ? (lang === 'uz' ? 'Keyingi savol...' : 'Кейинги савол...') : ''}
                </span>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  // ── WAITING FOR OTHERS ──
  if (phase === 'waiting-others') {
    const ranked = sortedPlayers(players);
    const myPos = ranked.findIndex(p => p.userId === myId) + 1;
    const othersLeft = players.filter(p => !p.done && p.userId !== myId).length;

    return (
      <>
        <Navbar />
        <div style={{ maxWidth: 520, margin: '2rem auto', padding: '1rem' }}>

          {/* My result card */}
          <div style={{ background: 'linear-gradient(135deg, #F0FDF4, #DCFCE7)', border: '1.5px solid #86EFAC', borderRadius: 12, padding: '1.5rem', textAlign: 'center', marginBottom: '1rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{MEDALS[myPos - 1] || '🏅'}</div>
            <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.2rem', fontWeight: 700, color: '#166534' }}>
              {lang === 'uz' ? "Siz tugatdingiz!" : 'Сиз тугатдингиз!'}
            </h2>
            <p style={{ margin: 0, color: '#166534', fontSize: '0.9rem' }}>
              {myCorrect} / 20 {lang === 'uz' ? "to'g'ri" : 'тўғри'} &nbsp;·&nbsp; {lang === 'uz' ? 'Hozircha' : 'Ҳозирча'} {myPos}-{lang === 'uz' ? "o'rin" : 'ўрин'}
            </p>
          </div>

          {/* Waiting indicator */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '1.25rem 1.5rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <p style={{ margin: 0, fontWeight: 600, color: 'var(--text)', fontSize: '0.9rem' }}>
                ⏳ {othersLeft} {lang === 'uz' ? "ta o'yinchi hali o'ynayabdi" : "та ўйинчи ҳали ўйнаяпти"}
              </p>
              {/* Live timer */}
              <div style={{ background: timerDanger ? '#FEF2F2' : 'var(--bg)', border: `1.5px solid ${timerDanger ? '#DC2626' : 'var(--border)'}`, borderRadius: 8, padding: '0.3rem 0.6rem', fontWeight: 700, fontSize: '0.9rem', color: timerDanger ? '#DC2626' : 'var(--text)' }}>
                {timerDanger ? '⚠️' : '⏱'} {formatTime(timeLeft)}
              </div>
            </div>

            {/* Live leaderboard */}
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.live_score}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {ranked.map((p, i) => {
                const isMe = p.userId === myId;
                return (
                  <div key={p.userId} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.75rem', borderRadius: 8, background: isMe ? '#EFF6FF' : 'var(--bg)', border: `1.5px solid ${isMe ? '#3B82F6' : 'var(--border)'}` }}>
                    <span style={{ fontSize: '1.1rem', minWidth: 24, textAlign: 'center' }}>{MEDALS[i]}</span>
                    <span style={{ flex: 1, fontWeight: isMe ? 700 : 500, color: 'var(--text)', fontSize: '0.875rem' }}>
                      {p.name} {isMe ? (lang === 'uz' ? '(Siz)' : '(Сиз)') : ''}
                    </span>
                    <span style={{ fontWeight: 700, color: '#16A34A', fontSize: '0.875rem' }}>{p.correctCount}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>/ {p.answeredCount}</span>
                    {p.done
                      ? <span style={{ fontSize: '0.75rem', color: '#16A34A', fontWeight: 600 }}>✓</span>
                      : <span style={{ fontSize: '0.75rem', color: '#F59E0B' }}>⏳</span>
                    }
                  </div>
                );
              })}
            </div>
          </div>

          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            {lang === 'uz'
              ? "Boshqa o'yinchilar tugatgach yoki vaqt tugagach natijalar ko'rinadi"
              : "Бошқа ўйинчилар тугатгач ёки вақт тугагач натижалар кўринади"}
          </p>
        </div>
      </>
    );
  }

  // ── DONE ──
  if (phase === 'done') {
    const sorted = [...players].sort((a, b) => {
      if (b.correctCount !== a.correctCount) return b.correctCount - a.correctCount;
      return (a.rank || 99) - (b.rank || 99);
    });
    const myRank = sorted.findIndex(p => p.userId === myId) + 1;
    const iWon = myRank === 1;
    const myPts = myRank === 1 ? '+8' : myRank === 2 ? '+2' : myRank === 3 ? '+1' : '−3';

    return (
      <>
        <Navbar />
        <div style={{ maxWidth: 520, margin: '2rem auto', padding: '1rem' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>

            <div style={{ padding: '1.75rem 1.5rem 1.25rem', textAlign: 'center', background: iWon ? 'linear-gradient(135deg,#F0FDF4,#DCFCE7)' : 'var(--surface)' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>{MEDALS[myRank - 1] || '🏅'}</div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text)', margin: '0 0 0.25rem' }}>
                {iWon
                  ? (lang === 'uz' ? "Tabriklaymiz! Siz g'olib!" : 'Табриклаймиз! Сиз ғолиб!')
                  : `${myRank}-${lang === 'uz' ? "o'rin" : 'ўрин'}`}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
                {myCorrect || sorted.find(p => p.userId === myId)?.correctCount || 0} / 20 {lang === 'uz' ? "to'g'ri" : 'тўғри'} &nbsp;·&nbsp; {myPts} {t.pts_l}
              </p>
            </div>

            <div style={{ padding: '1rem 1.5rem' }}>
              <p style={{ margin: '0 0 0.75rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                {t.final_result}
              </p>
              {sorted.map((p, i) => {
                const isMe = p.userId === myId;
                const pts = i === 0 ? '+8' : i === 1 ? '+2' : i === 2 ? '+1' : '−3';
                return (
                  <div key={p.userId} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0.875rem', borderRadius: 8, marginBottom: '0.5rem', background: isMe ? '#EFF6FF' : i === 0 ? '#FFFBEB' : 'var(--bg)', border: `1.5px solid ${isMe ? '#3B82F6' : i === 0 ? '#FCD34D' : 'var(--border)'}` }}>
                    <span style={{ fontSize: '1.25rem', minWidth: 28, textAlign: 'center' }}>{MEDALS[i]}</span>
                    <span style={{ flex: 1, fontWeight: isMe ? 700 : 500, color: 'var(--text)', fontSize: '0.9rem' }}>
                      {p.name} {isMe ? (lang === 'uz' ? '(Siz)' : '(Сиз)') : ''}
                    </span>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: 0, fontWeight: 700, color: 'var(--text)', fontSize: '0.9rem' }}>{p.correctCount} / 20</p>
                      <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 600, color: i < 3 ? '#059669' : '#DC2626' }}>{pts} {t.pts_l}</p>
                    </div>
                    {!p.done && <span style={{ fontSize: '0.75rem', color: '#F59E0B' }}>⏳</span>}
                  </div>
                );
              })}
            </div>

            <div style={{ padding: '0 1.5rem 1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Link href="/battle" className="btn btn-primary" style={{ flex: 1, textAlign: 'center' }}>{t.back_battle}</Link>
              <Link href="/" className="btn btn-outline" style={{ flex: 1, textAlign: 'center' }}>{t.home_l}</Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return null;
}
