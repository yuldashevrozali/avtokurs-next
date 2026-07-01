'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { apiFetch } from '@/lib/api';
import { useLang, T } from '@/lib/lang';

// phases:
// menu
// friend-players → friend-source → friend-topic | friend-ticket → friend-link
// random-players → random-source → random-topic | random-ticket → random-searching

export default function BattlePage() {
  const router = useRouter();
  const [phase, setPhase] = useState('menu');
  const [friendPlayers, setFriendPlayers] = useState(2);
  const [randomPlayers, setRandomPlayers] = useState(2);
  const [friendSource, setFriendSource] = useState({ type: 'random' });
  const [randomSource, setRandomSource] = useState({ type: 'random' });
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

  // ── Friend mode ──
  function goToFriendSource(type) {
    if (type === 'topic') { loadTopics(); setSearch(''); setPhase('friend-topic'); }
    else if (type === 'ticket') { loadTickets(); setSearch(''); setPhase('friend-ticket'); }
    else { const src = { type: 'random' }; setFriendSource(src); createFriendRoom(src); }
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
    } catch (e) { alert(e.message); }
    finally { setLoading(false); }
  }
  function selectFriendTopic(topic) {
    const src = { type: 'topic', id: topic.id, name: topic.name };
    setFriendSource(src); createFriendRoom(src);
  }
  function selectFriendTicket(ticket) {
    const src = { type: 'ticket', id: ticket.id, name: { uz: `Bilet #${ticket.number}`, uz_cryl: `Билет #${ticket.number}` } };
    setFriendSource(src); createFriendRoom(src);
  }

  // ── Random mode ──
  function goToRandomSource(type) {
    if (type === 'topic') { loadTopics(); setSearch(''); setPhase('random-topic'); }
    else if (type === 'ticket') { loadTickets(); setSearch(''); setPhase('random-ticket'); }
    else { startRandom({ type: 'random' }); }
  }
  function selectRandomTopic(topic) {
    const src = { type: 'topic', id: topic.id, name: topic.name };
    setRandomSource(src); startRandom(src);
  }
  function selectRandomTicket(ticket) {
    const src = { type: 'ticket', id: ticket.id, name: { uz: `Bilet #${ticket.number}`, uz_cryl: `Билет #${ticket.number}` } };
    setRandomSource(src); startRandom(src);
  }
  async function startRandom(src) {
    const useSrc = src || randomSource;
    setLoading(true);
    setPhase('random-searching');
    try {
      const d = await apiFetch('/battle/random', {
        method: 'POST',
        body: JSON.stringify({ maxPlayers: randomPlayers, source: useSrc }),
      });
      router.push(`/battle/${d.roomId}`);
    } catch (e) {
      setPhase('random-players');
      alert(e.message);
    } finally { setLoading(false); }
  }

  function copyLink() {
    const url = `${window.location.origin}/battle/${roomId}`;
    navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  const friendBadge = friendSource.type === 'random'
    ? (lang === 'uz' ? '🎲 Random' : '🎲 Рандом')
    : friendSource.name?.[lang] || friendSource.name?.uz || '';

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
            {lang === 'uz' ? '2–16 kishi · mavzu yoki bilet bo\'yicha raqobatlashing' : '2–16 киши · мавзу ёки билет бўйича рақобатлашинг'}
          </p>
        </div>

        {/* ── MENU ── */}
        {phase === 'menu' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
            <button onClick={() => setPhase('friend-players')} style={modeBtn('#3B82F6', '#1D4ED8')}>
              <span style={{ fontSize: '2.5rem' }}>🤝</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>{t.friend_mode}</span>
              <span style={{ fontSize: '0.8rem', opacity: 0.85 }}>
                {lang === 'uz' ? '2–16 kishi · havola orqali' : '2–16 киши · ҳавола орқали'}
              </span>
            </button>
            <button onClick={() => setPhase('random-players')} style={modeBtn('#8B5CF6', '#6D28D9')}>
              <span style={{ fontSize: '2.5rem' }}>🎲</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>{t.random_mode}</span>
              <span style={{ fontSize: '0.8rem', opacity: 0.85 }}>
                {lang === 'uz' ? '2–16 kishi · tasodifiy raqiblar' : '2–16 киши · тасодифий рақиблар'}
              </span>
            </button>
          </div>
        )}

        {/* ═══════════════ RANDOM FLOW ═══════════════ */}

        {/* Random: player count */}
        {phase === 'random-players' && (
          <div style={card}>
            <StepHeader icon="🎲" title={t.player_count}
              sub={lang === 'uz' ? 'Nechta kishilik random xona qidirilsin?' : 'Нечта кишилик рандом хона қидирилсин?'} />
            <PlayerCountPicker value={randomPlayers} onChange={setRandomPlayers} color="#8B5CF6" />
            <button onClick={() => setPhase('random-source')}
              style={{ ...primaryBtn('#8B5CF6'), marginBottom: '0.5rem' }}>
              {lang === 'uz' ? 'Keyingi →' : 'Кейинги →'}
            </button>
            <button onClick={() => setPhase('menu')} style={cancelBtn}>{t.cancel}</button>
          </div>
        )}

        {/* Random: question source */}
        {phase === 'random-source' && (
          <div style={card}>
            <StepHeader icon="📚" title={t.q_source}
              sub={lang === 'uz' ? `${randomPlayers} kishilik xona · Savol turi tanlang` : `${randomPlayers} кишилик хона · Савол тури танланг`} />
            <SourceButtons lang={lang} t={t} onSelect={goToRandomSource} loading={loading} />
            <button onClick={() => setPhase('random-players')} style={cancelBtn}>
              ← {lang === 'uz' ? 'Orqaga' : 'Орқага'}
            </button>
          </div>
        )}

        {/* Random: topic picker */}
        {phase === 'random-topic' && (
          <div style={card}>
            <PickerHeader title={t.pick_topic} onBack={() => setPhase('random-source')} />
            <SearchInput value={search} onChange={setSearch} lang={lang} />
            <TopicList topics={topics} search={search} lang={lang} t={t} onSelect={selectRandomTopic} loading={loading} />
          </div>
        )}

        {/* Random: ticket picker */}
        {phase === 'random-ticket' && (
          <div style={card}>
            <PickerHeader title={t.pick_ticket} onBack={() => setPhase('random-source')} />
            <TicketGrid tickets={tickets} t={t} onSelect={selectRandomTicket} loading={loading} />
          </div>
        )}

        {/* Random: searching */}
        {phase === 'random-searching' && (
          <div style={{ ...card, textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⏳</div>
            <h2 style={{ color: 'var(--text)', margin: '0 0 0.5rem' }}>{t.searching}</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              {randomPlayers} {lang === 'uz' ? 'kishilik xona qidirilmoqda...' : 'кишилик хона қидирилмоқда...'}
            </p>
          </div>
        )}

        {/* ═══════════════ FRIEND FLOW ═══════════════ */}

        {/* Friend: player count */}
        {phase === 'friend-players' && (
          <div style={card}>
            <StepHeader icon="👥" title={t.player_count}
              sub={lang === 'uz' ? "Nechta kishi bir vaqtda o'ynashini tanlang" : 'Нечта киши бир вақтда ўйнашини танланг'} />
            <PlayerCountPicker value={friendPlayers} onChange={setFriendPlayers} color="var(--primary)" />
            <button onClick={() => setPhase('friend-source')}
              style={{ ...primaryBtn('#3B82F6'), marginBottom: '0.5rem' }}>
              {lang === 'uz' ? 'Keyingi →' : 'Кейинги →'}
            </button>
            <button onClick={() => setPhase('menu')} style={cancelBtn}>{t.cancel}</button>
          </div>
        )}

        {/* Friend: question source */}
        {phase === 'friend-source' && (
          <div style={card}>
            <StepHeader icon="📚" title={t.q_source}
              sub={lang === 'uz' ? `${friendPlayers} kishilik xona · Savol turi tanlang` : `${friendPlayers} кишилик хона · Савол тури танланг`} />
            <SourceButtons lang={lang} t={t} onSelect={goToFriendSource} loading={loading} />
            <button onClick={() => setPhase('friend-players')} style={cancelBtn}>
              ← {lang === 'uz' ? 'Orqaga' : 'Орқага'}
            </button>
          </div>
        )}

        {/* Friend: topic picker */}
        {phase === 'friend-topic' && (
          <div style={card}>
            <PickerHeader title={t.pick_topic} onBack={() => setPhase('friend-source')} />
            <SearchInput value={search} onChange={setSearch} lang={lang} />
            <TopicList topics={topics} search={search} lang={lang} t={t} onSelect={selectFriendTopic} loading={loading} />
          </div>
        )}

        {/* Friend: ticket picker */}
        {phase === 'friend-ticket' && (
          <div style={card}>
            <PickerHeader title={t.pick_ticket} onBack={() => setPhase('friend-source')} />
            <TicketGrid tickets={tickets} t={t} onSelect={selectFriendTicket} loading={loading} />
          </div>
        )}

        {/* Friend: link */}
        {phase === 'friend-link' && (
          <div style={card}>
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '3rem' }}>🔗</div>
              <h2 style={{ color: 'var(--text)', margin: '0.5rem 0 0.25rem' }}>{t.share_title}</h2>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'var(--bg)', border: '1.5px solid var(--border)', borderRadius: 20, padding: '0.3rem 0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                <span>{friendSource.type === 'topic' ? '📖' : friendSource.type === 'ticket' ? '🎫' : '🎲'}</span>
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>{friendBadge}</span>
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
              style={{ ...primaryBtn('#3B82F6'), marginBottom: '0.5rem' }}>
              {t.go_game}
            </button>
            <button onClick={() => setPhase('menu')} style={cancelBtn}>{t.cancel}</button>
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

// ── Shared sub-components ──

function StepHeader({ icon, title, sub }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
      <div style={{ fontSize: '2.5rem' }}>{icon}</div>
      <h2 style={{ color: 'var(--text)', margin: '0.5rem 0 0.25rem' }}>{title}</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>{sub}</p>
    </div>
  );
}

function PlayerCountPicker({ value, onChange, color }) {
  return (
    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
      {[2, 3, 4, 5, 6, 7, 8, 16].map(n => (
        <button key={n} onClick={() => onChange(n)}
          style={{ width: n === 16 ? 64 : 52, height: 52, borderRadius: 10, fontWeight: 700, fontSize: n === 16 ? '0.9rem' : '1.1rem', cursor: 'pointer', background: value === n ? color : 'var(--bg)', color: value === n ? 'white' : 'var(--text)', border: `2px solid ${value === n ? color : 'var(--border)'}`, transition: 'all 0.15s' }}>
          {n === 16 ? '16 🏆' : n}
        </button>
      ))}
    </div>
  );
}

function SourceButtons({ lang, t, onSelect, loading }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
      {[
        { type: 'random', icon: '🎲', label: t.src_random, sub: lang === 'uz' ? 'Barcha savollardan tasodifiy 20 ta' : 'Барча саволлардан тасодифий 20 та' },
        { type: 'topic',  icon: '📖', label: t.src_topic,  sub: lang === 'uz' ? '45 ta mavzudan birini tanlang' : '45 та мавзудан бирини танланг' },
        { type: 'ticket', icon: '🎫', label: t.src_ticket, sub: lang === 'uz' ? '61 ta biletdan birini tanlang' : '61 та биletдан бирини танланг' },
      ].map(({ type, icon, label, sub }) => (
        <button key={type} onClick={() => onSelect(type)} disabled={loading} style={srcBtn}>
          <span style={{ fontSize: '2rem' }}>{icon}</span>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <p style={{ margin: 0, fontWeight: 700, color: 'var(--text)', fontSize: '0.95rem' }}>{label}</p>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{sub}</p>
          </div>
          <span style={{ color: 'var(--text-muted)' }}>›</span>
        </button>
      ))}
    </div>
  );
}

function PickerHeader({ title, onBack }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.2rem', padding: 0 }}>←</button>
      <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)' }}>{title}</h2>
    </div>
  );
}

function SearchInput({ value, onChange, lang }) {
  return (
    <input type="text" placeholder={lang === 'uz' ? 'Qidirish...' : 'Қидириш...'}
      value={value} onChange={e => onChange(e.target.value)}
      style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1.5px solid var(--border)', borderRadius: 8, background: 'var(--bg)', color: 'var(--text)', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box', marginBottom: '0.75rem' }} />
  );
}

function TopicList({ topics, search, lang, t, onSelect, loading }) {
  const filtered = topics.filter(tp => (tp.name?.[lang] || tp.name?.uz || '').toLowerCase().includes(search.toLowerCase()));
  return (
    <div style={{ maxHeight: 360, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      {filtered.map(tp => (
        <button key={tp.id} onClick={() => onSelect(tp)} disabled={loading}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0.875rem', borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--bg)', cursor: 'pointer', textAlign: 'left', gap: '0.5rem' }}>
          <span style={{ flex: 1, color: 'var(--text)', fontSize: '0.875rem', fontWeight: 500 }}>{tp.name?.[lang] || tp.name?.uz}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{tp.questionCount} {t.q_count_l}</span>
        </button>
      ))}
      {topics.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>{t.loading}</p>}
    </div>
  );
}

function TicketGrid({ tickets, t, onSelect, loading }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))', gap: '0.4rem', maxHeight: 380, overflowY: 'auto' }}>
      {tickets.map(tk => (
        <button key={tk.id} onClick={() => onSelect(tk)} disabled={loading}
          style={{ padding: '0.75rem 0.5rem', borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--bg)', cursor: 'pointer', textAlign: 'center', color: 'var(--text)', fontWeight: 600, fontSize: '0.9rem' }}>
          #{tk.number}
        </button>
      ))}
      {tickets.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem', gridColumn: '1/-1' }}>{t.loading}</p>}
    </div>
  );
}

// ── Styles ──
const card = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '1.5rem' };
const srcBtn = { display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '1rem 1.1rem', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--bg)', cursor: 'pointer', textAlign: 'left' };
const cancelBtn = { width: '100%', padding: '0.6rem', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontSize: '0.875rem' };
function primaryBtn(bg) { return { width: '100%', padding: '0.85rem', background: bg, color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '1rem' }; }
function modeBtn(from, to) { return { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '2rem 1rem', background: `linear-gradient(135deg, ${from}, ${to})`, color: 'white', border: 'none', borderRadius: 12, cursor: 'pointer' }; }
