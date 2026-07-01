'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { apiFetch } from '@/lib/api';
import { useLang, T } from '@/lib/lang';

export default function BattlePage() {
  const router = useRouter();
  const [phase, setPhase] = useState('menu'); // menu | friend-setup | friend-link | random-waiting | random-timeout
  const [roomId, setRoomId] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(2);
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

  async function createFriend() {
    try {
      const d = await apiFetch('/battle/create', { method: 'POST', body: JSON.stringify({ mode: 'friend', maxPlayers }) });
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
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>⚔️ {lang === 'uz' ? 'Ko\'p kishilik Raqobat' : 'Кўп кишилик Рақобат'}</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>{lang === 'uz' ? '2 dan 8 tagacha o\'yinchi bir vaqtda raqobat qiladi' : '2 дан 8 тагача ўйинчи бир вақтда рақобат қилади'}</p>
        </div>

        {phase === 'menu' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
            <button onClick={() => setPhase('friend-setup')} style={modeBtn('#3B82F6', '#1D4ED8')}>
              <span style={{ fontSize: '2.5rem' }}>🤝</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>{t.friend_mode}</span>
              <span style={{ fontSize: '0.8rem', opacity: 0.85 }}>{lang === 'uz' ? '2–8 kishi, xona yarating' : '2–8 киши, хона яратинг'}</span>
            </button>
            <button onClick={startRandom} style={modeBtn('#8B5CF6', '#6D28D9')}>
              <span style={{ fontSize: '2.5rem' }}>🎲</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>{t.random_mode}</span>
              <span style={{ fontSize: '0.8rem', opacity: 0.85 }}>{t.random_desc}</span>
            </button>
          </div>
        )}

        {phase === 'friend-setup' && (
          <div style={card}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '2.5rem' }}>👥</div>
              <h2 style={{ color: 'var(--text)', margin: '0.5rem 0 0.25rem' }}>{t.player_count}</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{lang === 'uz' ? 'Nechta kishi bir vaqtda o\'ynashini tanlang' : 'Нечта киши бир вақтда ўйнашини танланг'}</p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              {[2, 3, 4, 5, 6, 7, 8].map(n => (
                <button key={n} onClick={() => setMaxPlayers(n)}
                  style={{
                    width: 52, height: 52, borderRadius: 10, fontWeight: 700, fontSize: '1.1rem', cursor: 'pointer',
                    background: maxPlayers === n ? 'var(--primary)' : 'var(--bg)',
                    color: maxPlayers === n ? 'white' : 'var(--text)',
                    border: `2px solid ${maxPlayers === n ? 'var(--primary)' : 'var(--border)'}`,
                    transition: 'all 0.15s',
                  }}>
                  {n}
                </button>
              ))}
            </div>

            <button onClick={createFriend} style={{ width: '100%', padding: '0.85rem', background: '#3B82F6', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '1rem', marginBottom: '0.5rem' }}>
              {t.create_room} ({maxPlayers} {lang === 'uz' ? 'kishi' : 'киши'})
            </button>
            <button onClick={() => setPhase('menu')} style={{ width: '100%', padding: '0.6rem', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontSize: '0.875rem' }}>
              {t.cancel}
            </button>
          </div>
        )}

        {phase === 'friend-link' && (
          <div style={card}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '3rem' }}>🔗</div>
              <h2 style={{ color: 'var(--text)', margin: '0.5rem 0 0.25rem' }}>{t.share_title}</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                {lang === 'uz' ? `${maxPlayers} kishilik xona tayyor` : `${maxPlayers} кишилик хона тайёр`}
              </p>
            </div>
            <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '0.75rem', textAlign: 'center' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 0.25rem' }}>{t.room_code_l}</p>
              <p style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '0.15em', color: 'var(--text)', margin: 0 }}>{roomId}</p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <input readOnly value={`${typeof window !== 'undefined' ? window.location.origin : ''}/battle/${roomId}`}
                style={{ flex: 1, padding: '0.6rem 0.75rem', border: '1.5px solid var(--border)', borderRadius: 8, background: 'var(--bg)', color: 'var(--text)', fontSize: '0.875rem', outline: 'none' }} />
              <button onClick={copyLink}
                style={{ padding: '0.6rem 1rem', background: copied ? '#16A34A' : '#3B82F6', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '0.875rem' }}>
                {copied ? t.copied_l : t.copy_l}
              </button>
            </div>
            <button onClick={() => router.push(`/battle/${roomId}`)}
              style={{ width: '100%', padding: '0.75rem', background: '#3B82F6', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '1rem' }}>
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
