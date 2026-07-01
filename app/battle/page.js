'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { apiFetch } from '@/lib/api';
import { useLang, T } from '@/lib/lang';

// phases: menu | friend-players | friend-source | friend-topic | friend-ticket | friend-link
//         | random-players | random-searching

export default function BattlePage() {
  const router = useRouter();
  const [phase, setPhase] = useState('menu');
  const [friendPlayers, setFriendPlayers] = useState(2);
  const [randomPlayers, setRandomPlayers] = useState(2);
  const [source, setSource] = useState({ type: 'random' });
  const [roomId, setRoomId] = useState('');
  const [leaderboard, setLeaderboard] = useState([]);
  const [copied, setCopied] = useState(false);
  const [topics, setTopics] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const { lang } = useLang();
  const t = T[lang];

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (!u) { router.push('/login'); return; }
    fetch('/api/battle/leaderboard').then(r => r.json()).then(setLeaderboard).catch(() => {});
  }, []);

  async function loadTopics() {
    if (topics.length) return;
    const data = await fetch('/api/topics').then(r => r.json()).catch(() => []);
    setTopics(data);
  }

  async function loadTickets() {
    if (tickets.length) return;
    const data = await fetch('/api/tickets').then(r => r.json()).catch(() => []);
    setTickets(data);
  }

  function goToSource(type) {
    if (type === 'topic') { loadTopics(); setSearch(''); setPhase('friend-topic'); }
    else if (type === 'ticket') { loadTickets(); setSearch(''); setPhase('friend-ticket'); }
    else { const src = { type: 'random' }; setSource(src); createFriendRoom(src); }
  }

  async function createFriendRoom(src) {
    setLoading(true);
    try {
      const d = await apiFetch('/battle/create', {
        method: 'POST',
        body: JSON.stringify({ mode: 'friend', maxPlayers: friendPlayers, source: src }),
      });
      setRoomId(d.roomId);
      setPhase('friend-link');
    } catch (e) {
      alert(e.message);
    } finally { setLoading(false); }
  }

  function selectTopic(topic) {
    const src = { type: 'topic', id: topic.id, name: topic.name };
    setSource(src);
    createFriendRoom(src);
  }

  function selectTicket(ticket) {
    const src = { type: 'ticket', id: ticket.id, name: { uz: `Bilet #${ticket.number}`, uz_cryl: `Билет #${ticket.number}` } };
    setSource(src);
    createFriendRoom(src);
  }

  async function startRandom() {
    setLoading(true);
    setPhase('random-searching');
    try {
      const d = await apiFetch('/battle/random', {
        method: 'POST',
        body: JSON.stringify({ maxPlayers: randomPlayers }),
      });
      // Always go to the room — it handles waiting/playing state
      router.push(`/battle/${d.roomId}`);
    } catch (e) {
      setPhase('menu');
      alert(e.message);
    } finally { setLoading(false); }
  }

  function copyLink() {
    const url = `${window.location.origin}/battle/${roomId}`;
    navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  const sourceBadge = source.type === 'random'
    ? (lang === 'uz' ? '🎲 Random' : '🎲 Рандом')
    : source.name?.[lang] || source.name?.uz || '';

  const medal = ['🥇', '🥈', '🥉'];

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '1.5rem 1rem' }}>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
            ⚔️ {lang === 'uz' ? "Ko'p kishilik Raqobat" : 'Кўп кишилик Рақобат'}
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            {lang === 'uz' ? '2–8 kishi · mavzu yoki bilet bo\'yicha raqobatlashing' : '2–8 киши · мавзу ёки билет бўйича рақобатлашинг'}
          </p>
        </div>

        {/* ── MENU ── */}
        {phase === 'menu' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
            <button onClick={() => setPhase('friend-players')} style={modeBtn('#3B82F6', '#1D4ED8')}>
              <span style={{ fontSize: '2.5rem' }}>🤝</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>{t.friend_mode}</span>
              <span style={{ fontSize: '0.8rem', opacity: 0.85 }}>
                {lang === 'uz' ? '2–8 kishi · mavzu tanlang' : '2–8 киши · мавзу танланг'}
              </span>
            </button>
            <button onClick={() => setPhase('random-players')} style={modeBtn('#8B5CF6', '#6D28D9')}>
              <span style={{ fontSize: '2.5rem' }}>🎲</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>{t.random_mode}</span>
              <span style={{ fontSize: '0.8rem', opacity: 0.85 }}>
                {lang === 'uz' ? '2–8 kishi · tasodifiy raqiblar' : '2–8 киши · тасодифий рақиблар'}
              </span>
            </button>
          </div>
        )}

        {/* ── RANDOM: player count ── */}
        {phase === 'random-players' && (
          <div style={card}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '2.5rem' }}>🎲</div>
              <h2 style={{ color: 'var(--text)', margin: '0.5rem 0 0.25rem' }}>{t.player_count}</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                {lang === 'uz' ? 'Nechta kishilik random xona qidirilsin?' : 'Нечта кишилик рандом хона қидирилсин?'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              {[2, 3, 4, 5, 6, 7, 8, 16].map(n => (
                <button key={n} onClick={() => setRandomPlayers(n)}
                  style={{ width: n === 16 ? 64 : 52, height: 52, borderRadius: 10, fontWeight: 700, fontSize: n === 16 ? '0.95rem' : '1.1rem', cursor: 'pointer', background: randomPlayers === n ? '#8B5CF6' : 'var(--bg)', color: randomPlayers === n ? 'white' : 'var(--text)', border: `2px solid ${randomPlayers === n ? '#8B5CF6' : 'var(--border)'}`, transition: 'all 0.15s' }}>
                  {n === 16 ? '16 🏆' : n}
                </button>
              ))}
            </div>
            <button onClick={startRandom} disabled={loading}
              style={{ width: '100%', padding: '0.85rem', background: '#8B5CF6', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: loading ? 'wait' : 'pointer', fontSize: '1rem', marginBottom: '0.5rem', opacity: loading ? 0.7 : 1 }}>
              {loading
                ? (lang === 'uz' ? 'Qidirilmoqda...' : 'Қидирилмоқда...')
                : `${lang === 'uz' ? 'Qidirish' : 'Қидириш'} (${randomPlayers} ${lang === 'uz' ? 'kishi' : 'киши'})`}
            </button>
            <button onClick={() => setPhase('menu')}
              style={{ width: '100%', padding: '0.6rem', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontSize: '0.875rem' }}>
              {t.cancel}
            </button>
          </div>
        )}

        {/* ── RANDOM SEARCHING ── */}
        {phase === 'random-searching' && (
          <div style={{ ...card, textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⏳</div>
            <h2 style={{ color: 'var(--text)', margin: '0 0 0.5rem' }}>{t.searching}</h2>
            <p style={{ color: 'var(--text-muted)' }}>{randomPlayers} {lang === 'uz' ? 'kishilik xona qidirilmoqda...' : 'кишилик хона қидирилмоқда...'}</p>
          </div>
        )}

        {/* ── FRIEND: player count ── */}
        {phase === 'friend-players' && (
          <div style={card}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '2.5rem' }}>👥</div>
              <h2 style={{ color: 'var(--text)', margin: '0.5rem 0 0.25rem' }}>{t.player_count}</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                {lang === 'uz' ? 'Nechta kishi bir vaqtda o\'ynashini tanlang' : 'Нечта киши бир вақтда ўйнашини танланг'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              {[2, 3, 4, 5, 6, 7, 8, 16].map(n => (
                <button key={n} onClick={() => setFriendPlayers(n)}
                  style={{ width: n === 16 ? 64 : 52, height: 52, borderRadius: 10, fontWeight: 700, fontSize: n === 16 ? '0.95rem' : '1.1rem', cursor: 'pointer', background: friendPlayers === n ? 'var(--primary)' : 'var(--bg)', color: friendPlayers === n ? 'white' : 'var(--text)', border: `2px solid ${friendPlayers === n ? 'var(--primary)' : 'var(--border)'}`, transition: 'all 0.15s' }}>
                  {n === 16 ? '16 🏆' : n}
                </button>
              ))}
            </div>
            <button onClick={() => setPhase('friend-source')}
              style={{ width: '100%', padding: '0.85rem', background: '#3B82F6', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '1rem', marginBottom: '0.5rem' }}>
              {lang === 'uz' ? 'Keyingi →' : 'Кейинги →'}
            </button>
            <button onClick={() => setPhase('menu')}
              style={{ width: '100%', padding: '0.6rem', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontSize: '0.875rem' }}>
              {t.cancel}
            </button>
          </div>
        )}

        {/* ── FRIEND: question source ── */}
        {phase === 'friend-source' && (
          <div style={card}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '2.5rem' }}>📚</div>
              <h2 style={{ color: 'var(--text)', margin: '0.5rem 0 0.25rem' }}>{t.q_source}</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                {lang === 'uz' ? `${friendPlayers} kishilik xona · Savollar manbasini tanlang` : `${friendPlayers} кишилик хона · Саволлар манбасини танланг`}
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <button onClick={() => goToSource('random')} disabled={loading} style={srcBtn}>
                <span style={{ fontSize: '2rem' }}>🎲</span>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <p style={{ margin: 0, fontWeight: 700, color: 'var(--text)', fontSize: '0.95rem' }}>{t.src_random}</p>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {lang === 'uz' ? 'Barcha savollardan tasodifiy 20 ta' : 'Барча саволлардан тасодифий 20 та'}
                  </p>
                </div>
                <span style={{ color: 'var(--text-muted)' }}>›</span>
              </button>
              <button onClick={() => goToSource('topic')} style={srcBtn}>
                <span style={{ fontSize: '2rem' }}>📖</span>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <p style={{ margin: 0, fontWeight: 700, color: 'var(--text)', fontSize: '0.95rem' }}>{t.src_topic}</p>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {lang === 'uz' ? '45 ta mavzudan birini tanlang' : '45 та мавзудан бирини танланг'}
                  </p>
                </div>
                <span style={{ color: 'var(--text-muted)' }}>›</span>
              </button>
              <button onClick={() => goToSource('ticket')} style={srcBtn}>
                <span style={{ fontSize: '2rem' }}>🎫</span>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <p style={{ margin: 0, fontWeight: 700, color: 'var(--text)', fontSize: '0.95rem' }}>{t.src_ticket}</p>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {lang === 'uz' ? '61 ta biletdan birini tanlang (20 ta savol)' : '61 та биletдан бирини танланг (20 та савол)'}
                  </p>
                </div>
                <span style={{ color: 'var(--text-muted)' }}>›</span>
              </button>
            </div>
            <button onClick={() => setPhase('friend-players')}
              style={{ width: '100%', padding: '0.6rem', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontSize: '0.875rem' }}>
              ← {lang === 'uz' ? 'Orqaga' : 'Орқага'}
            </button>
          </div>
        )}

        {/* ── FRIEND: topic picker ── */}
        {phase === 'friend-topic' && (
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <button onClick={() => setPhase('friend-source')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.2rem', padding: 0 }}>←</button>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)' }}>{t.pick_topic}</h2>
            </div>
            <input type="text" placeholder={lang === 'uz' ? 'Mavzu qidirish...' : 'Мавзу қидириш...'}
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1.5px solid var(--border)', borderRadius: 8, background: 'var(--bg)', color: 'var(--text)', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box', marginBottom: '0.75rem' }} />
            <div style={{ maxHeight: 360, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {topics
                .filter(tp => (tp.name?.[lang] || tp.name?.uz || '').toLowerCase().includes(search.toLowerCase()))
                .map(tp => (
                  <button key={tp.id} onClick={() => selectTopic(tp)} disabled={loading}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0.875rem', borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--bg)', cursor: 'pointer', textAlign: 'left', gap: '0.5rem' }}>
                    <span style={{ flex: 1, color: 'var(--text)', fontSize: '0.875rem', fontWeight: 500 }}>{tp.name?.[lang] || tp.name?.uz}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{tp.questionCount} {t.q_count_l}</span>
                  </button>
                ))}
              {topics.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>{t.loading}</p>}
            </div>
          </div>
        )}

        {/* ── FRIEND: ticket picker ── */}
        {phase === 'friend-ticket' && (
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <button onClick={() => setPhase('friend-source')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.2rem', padding: 0 }}>←</button>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)' }}>{t.pick_ticket}</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))', gap: '0.4rem', maxHeight: 380, overflowY: 'auto' }}>
              {tickets.map(tk => (
                <button key={tk.id} onClick={() => selectTicket(tk)} disabled={loading}
                  style={{ padding: '0.75rem 0.5rem', borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--bg)', cursor: 'pointer', textAlign: 'center', color: 'var(--text)', fontWeight: 600, fontSize: '0.9rem' }}>
                  #{tk.number}
                </button>
              ))}
              {tickets.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem', gridColumn: '1/-1' }}>{t.loading}</p>}
            </div>
          </div>
        )}

        {/* ── FRIEND: link ── */}
        {phase === 'friend-link' && (
          <div style={card}>
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '3rem' }}>🔗</div>
              <h2 style={{ color: 'var(--text)', margin: '0.5rem 0 0.25rem' }}>{t.share_title}</h2>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'var(--bg)', border: '1.5px solid var(--border)', borderRadius: 20, padding: '0.3rem 0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                <span>{source.type === 'topic' ? '📖' : source.type === 'ticket' ? '🎫' : '🎲'}</span>
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>{sourceBadge}</span>
                <span>· {friendPlayers} {lang === 'uz' ? 'kishi' : 'киши'}</span>
              </div>
            </div>
            <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '0.6rem 1rem', marginBottom: '0.75rem', textAlign: 'center' }}>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '0 0 0.2rem' }}>{t.room_code_l}</p>
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
            <button onClick={() => setPhase('menu')}
              style={{ width: '100%', marginTop: '0.5rem', padding: '0.6rem', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontSize: '0.875rem' }}>
              {t.cancel}
            </button>
          </div>
        )}

        {/* ── LEADERBOARD ── */}
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

const card = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '1.5rem' };

const srcBtn = {
  display: 'flex', alignItems: 'center', gap: '0.875rem',
  padding: '1rem 1.1rem', borderRadius: 10, border: '1.5px solid var(--border)',
  background: 'var(--bg)', cursor: 'pointer', textAlign: 'left',
};

function modeBtn(from, to) {
  return {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
    padding: '2rem 1rem', background: `linear-gradient(135deg, ${from}, ${to})`,
    color: 'white', border: 'none', borderRadius: 12, cursor: 'pointer',
    transition: 'transform 0.15s, box-shadow 0.15s',
  };
}
