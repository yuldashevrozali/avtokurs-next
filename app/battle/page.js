'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { apiFetch } from '@/lib/api';
import { useLang, T } from '@/lib/lang';

export default function BattlePage() {
  const router = useRouter();
  const [phase, setPhase] = useState('menu'); // menu | friend-link | random-waiting | random-timeout
  const [roomId, setRoomId] = useState('');
  const [countdown, setCountdown] = useState(30);
  const [leaderboard, setLeaderboard] = useState([]);
  const [copied, setCopied] = useState(false);
  const pollRef = useRef(null);
  const timerRef = useRef(null);
  const { lang } = useLang();
  const t = T[lang];

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (!u) { router.push('/login'); return; }
    fetch('/api/battle/leaderboard').then(r => r.json()).then(setLeaderboard).catch(() => {});
  }, []);

  useEffect(() => () => {
    clearInterval(pollRef.current);
    clearInterval(timerRef.current);
  }, []);

  async function startFriend() {
    try {
      const d = await apiFetch('/battle/create', { method: 'POST', body: JSON.stringify({ mode: 'friend' }) });
      setRoomId(d.roomId);
      setPhase('friend-link');
    } catch (e) {
      alert(e.message);
    }
  }

  async function startRandom() {
    setPhase('random-waiting');
    setCountdown(30);
    try {
      const d = await apiFetch('/battle/random', { method: 'POST' });
      if (d.matched) {
        router.push(`/battle/${d.roomId}`);
        return;
      }
      // Created room — poll until p2 joins or 30s timeout
      setRoomId(d.roomId);
      let secs = 30;
      timerRef.current = setInterval(() => {
        secs -= 1;
        setCountdown(secs);
        if (secs <= 0) {
          clearInterval(timerRef.current);
          clearInterval(pollRef.current);
          setPhase('random-timeout');
        }
      }, 1000);
      pollRef.current = setInterval(async () => {
        try {
          const room = await apiFetch(`/battle/${d.roomId}`);
          if (room.status === 'playing') {
            clearInterval(pollRef.current);
            clearInterval(timerRef.current);
            router.push(`/battle/${d.roomId}`);
          }
        } catch {}
      }, 2000);
    } catch (e) {
      setPhase('menu');
      alert(e.message);
    }
  }

  function copyLink() {
    const url = `${window.location.origin}/battle/${roomId}`;
    navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  const medal = ['🥇', '🥈', '🥉'];

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '1.5rem 1rem' }}>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>{t.battle_title}</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>{t.battle_sub}</p>
        </div>

        {phase === 'menu' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
            <button onClick={startFriend} style={modeBtn('#3B82F6', '#1D4ED8')}>
              <span style={{ fontSize: '2.5rem' }}>🤝</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>{t.friend_mode}</span>
              <span style={{ fontSize: '0.8rem', opacity: 0.85 }}>{t.friend_desc}</span>
            </button>
            <button onClick={startRandom} style={modeBtn('#8B5CF6', '#6D28D9')}>
              <span style={{ fontSize: '2.5rem' }}>🎲</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>{t.random_mode}</span>
              <span style={{ fontSize: '0.8rem', opacity: 0.85 }}>{t.random_desc}</span>
            </button>
          </div>
        )}

        {phase === 'friend-link' && (
          <div style={card}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '3rem' }}>🔗</div>
              <h2 style={{ color: 'var(--text)', margin: '0.5rem 0' }}>{t.share_title}</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{t.share_sub}</p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <input
                readOnly
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/battle/${roomId}`}
                style={{ flex: 1, padding: '0.6rem 0.75rem', border: '1.5px solid var(--border)', borderRadius: 8, background: 'var(--bg)', color: 'var(--text)', fontSize: '0.875rem', outline: 'none' }}
              />
              <button onClick={copyLink} style={{ padding: '0.6rem 1rem', background: copied ? '#16A34A' : '#3B82F6', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '0.875rem' }}>
                {copied ? t.copied_l : t.copy_l}
              </button>
            </div>
            <button onClick={() => router.push(`/battle/${roomId}`)} style={{ width: '100%', padding: '0.75rem', background: '#3B82F6', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '1rem' }}>
              {t.go_game}
            </button>
            <button onClick={() => setPhase('menu')} style={{ width: '100%', marginTop: '0.5rem', padding: '0.6rem', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontSize: '0.875rem' }}>
              {t.cancel}
            </button>
          </div>
        )}

        {phase === 'random-waiting' && (
          <div style={{ ...card, textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⏳</div>
            <h2 style={{ color: 'var(--text)', margin: '0 0 0.5rem' }}>{t.searching}</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{t.searching_sub}</p>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: countdown > 10 ? '#3B82F6' : '#EF4444', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', fontWeight: 700, margin: '0 auto 1.5rem' }}>
              {countdown}
            </div>
            <button onClick={() => { clearInterval(pollRef.current); clearInterval(timerRef.current); setPhase('menu'); }}
              style={{ padding: '0.6rem 1.5rem', background: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontSize: '0.875rem' }}>
              {t.cancel}
            </button>
          </div>
        )}

        {phase === 'random-timeout' && (
          <div style={{ ...card, textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>😕</div>
            <h2 style={{ color: 'var(--text)', margin: '0 0 0.5rem' }}>{t.not_found}</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{t.not_found_s}</p>
            <button onClick={() => setPhase('menu')} style={{ padding: '0.75rem 2rem', background: '#8B5CF6', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '1rem' }}>
              {t.retry_l}
            </button>
          </div>
        )}

        {/* Leaderboard */}
        <div style={{ ...card, marginTop: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem', color: 'var(--text)', fontSize: '1rem', fontWeight: 700 }}>🏆 {t.top_players}</h3>
          {leaderboard.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '1rem 0' }}>{t.no_games}</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {leaderboard.map((u, i) => (
                <div key={u._id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.75rem', background: i < 3 ? 'var(--bg)' : 'transparent', borderRadius: 8 }}>
                  <span style={{ fontSize: i < 3 ? '1.25rem' : '0.875rem', fontWeight: 600, minWidth: 28, textAlign: 'center', color: i < 3 ? 'inherit' : 'var(--text-muted)' }}>
                    {i < 3 ? medal[i] : `${i + 1}.`}
                  </span>
                  <span style={{ flex: 1, color: 'var(--text)', fontWeight: i < 3 ? 600 : 400, fontSize: '0.9rem' }}>{u.name}</span>
                  <span style={{ fontWeight: 700, color: u.battlePoints >= 0 ? '#16A34A' : '#DC2626', fontSize: '0.9rem' }}>
                    {u.battlePoints > 0 ? '+' : ''}{u.battlePoints} {t.pts_l}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </>
  );
}

const card = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  padding: '1.5rem',
};

function modeBtn(from, to) {
  return {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
    padding: '2rem 1rem',
    background: `linear-gradient(135deg, ${from}, ${to})`,
    color: 'white',
    border: 'none',
    borderRadius: 12,
    cursor: 'pointer',
    transition: 'transform 0.15s, box-shadow 0.15s',
  };
}
