'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { apiFetch } from '@/lib/api';
import { useLang, T } from '@/lib/lang';

export default function MavzularPage() {
  const [topics, setTopics] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const router = useRouter();
  const { lang } = useLang();
  const t = T[lang];

  useEffect(() => {
    const raw = localStorage.getItem('user');
    if (!raw) { router.push('/login'); return; }
    const u = JSON.parse(raw);
    setUserId(u.id);
    apiFetch('/topics').then(data => { setTopics(data); setLoading(false); });
  }, []);

  function getProgress(id) {
    const raw = localStorage.getItem(`topic_result_${userId}_${id}`);
    return raw ? JSON.parse(raw) : null;
  }

  const doneCnt = topics.filter(tp => { const p = getProgress(tp.id); return p && p.percent >= 80; }).length;
  const filtered = topics.filter(tp => (tp.name[lang] || tp.name.uz).toLowerCase().includes(search.toLowerCase()));

  if (loading) return <><Navbar /><div className="container"><p style={{color:'var(--text-muted)'}}>{t.loading}</p></div></>;

  return (
    <>
      <Navbar />
      <div className="container">
        <div style={{marginBottom:'1.5rem'}}>
          <h1 style={{fontSize:'1.5rem',marginBottom:'0.3rem',color:'var(--text)'}}>{t.topics_title}</h1>
          <p style={{color:'var(--text-muted)',fontSize:'0.9rem'}}>{t.topics_sub}</p>
        </div>

        <div style={{display:'flex',gap:'1rem',marginBottom:'1.5rem',flexWrap:'wrap'}}>
          {[[t.topics_total, topics.length],[t.topics_done, doneCnt],[t.topics_qs, 1220]].map(([label, val]) => (
            <div key={label} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:8,padding:'0.6rem 1rem',fontSize:'0.85rem',color:'var(--text)'}}>
              {label}: <strong style={{color:'var(--primary)'}}>{val}</strong>
            </div>
          ))}
        </div>

        <div style={{marginBottom:'1.5rem'}}>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder={t.search_ph}
            style={{width:'100%',padding:'0.65rem 1rem',border:'1px solid var(--border)',borderRadius:8,fontSize:'0.9rem',background:'var(--surface)',color:'var(--text)'}}
          />
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))',gap:'1rem'}}>
          {filtered.map(topic => {
            const prog = getProgress(topic.id);
            const pct = prog ? prog.percent : 0;
            const done = pct >= 80;
            return (
              <div key={topic.id} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:10,padding:'1.1rem 1.2rem',display:'flex',flexDirection:'column',gap:'0.75rem'}}>
                <div style={{display:'flex',gap:'0.75rem',alignItems:'flex-start'}}>
                  <div style={{minWidth:32,height:32,borderRadius:8,background:'#EFF6FF',color:'var(--primary)',fontSize:'0.8rem',fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    {topic.id + 1}
                  </div>
                  <div>
                    <div style={{fontSize:'0.9rem',fontWeight:600,lineHeight:1.4,color:'var(--text)'}}>{topic.name[lang] || topic.name.uz}</div>
                    <div style={{fontSize:'0.8rem',color:'var(--text-muted)'}}>{topic.questionCount} {t.q_count}</div>
                  </div>
                </div>
                <div className="progress-bar-wrap">
                  <div style={{height:'100%',borderRadius:99,background:done?'#16A34A':'var(--primary)',width:`${pct}%`,transition:'width 0.4s'}} />
                </div>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <div style={{fontSize:'0.8rem',color:'var(--text-muted)'}}>
                    {prog
                      ? <><strong style={{color:'var(--text)'}}>{prog.correct}</strong>/{prog.total} {t.correct_l.toLowerCase()} · {pct}%</>
                      : t.not_done}
                  </div>
                  <Link href={`/mavzular/${topic.id}`}
                    style={{padding:'0.45rem 1rem',background:done?'#16A34A':'var(--primary)',color:'white',borderRadius:6,fontSize:'0.85rem',fontWeight:500,textDecoration:'none'}}>
                    {done ? t.btn_restart : prog ? t.btn_continue : t.btn_start}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
