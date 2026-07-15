'use client';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useEffect, useState } from 'react';
import { useLang, T } from '@/lib/lang';
import { getStreak } from '@/lib/gamification';

const STATS = (t) => [
  { label: t.stat_qs,        value: '1220+' },
  { label: t.stat_tickets_l, value: '61'    },
  { label: t.stat_topics_l,  value: '30+'   },
  { label: t.stat_videos_l,  value: '∞'     },
];

const SIDEBAR_LINKS = (t) => [
  { href: '/mavzular',    icon: '📚', label: t.topics   },
  { href: '/biletlar',    icon: '🎫', label: t.tickets  },
  { href: '/imtihon',     icon: '⏱',  label: t.exam     },
  { href: '/modules',     icon: '🎬', label: t.videos   },
  { href: '/yutuqlar',    icon: '🏆', label: t.ach_l    },
  { href: '/battle',      icon: '⚔️', label: t.battle   },
  { href: '/marafon',     icon: '🏃', label: t.marathon },
  { href: '/saqlangan',   icon: '🔖', label: t.saved    },
  { href: '/xatolar',     icon: '❌', label: t.xato_title },
];

const FEATURES = (t) => [
  { href: '/mavzular', icon: '📚', title: t.feat_topics_t,   desc: t.feat_topics_d,   color: '#2563EB', bg: '#EFF6FF' },
  { href: '/biletlar', icon: '🎫', title: t.feat_tickets_t,  desc: t.feat_tickets_d,  color: '#16A34A', bg: '#F0FDF4' },
  { href: '/imtihon',  icon: '⏱',  title: t.feat_exam_t,     desc: t.feat_exam_d,     color: '#D97706', bg: '#FFFBEB' },
  { href: '/modules',  icon: '🎬', title: t.feat_videos_t,   desc: t.feat_videos_d,   color: '#7C3AED', bg: '#F5F3FF' },
  { href: '/battle',      icon: '⚔️', title: t.feat_battle_t,   desc: t.feat_battle_d,   color: '#E11D48', bg: '#FFF1F2' },
  { href: '/marafon',     icon: '🏃', title: t.feat_marathon_t, desc: t.feat_marathon_d, color: '#EA580C', bg: '#FFF7ED' },
  { href: '/mavzular/42', icon: '🧩', title: t.feat_hard_t,  desc: t.feat_hard_d,  color: '#7C3AED', bg: '#F5F3FF' },
  { href: '/mavzular/43', icon: '🔢', title: t.feat_num_t,   desc: t.feat_num_d,   color: '#0891B2', bg: '#ECFEFF' },
  { href: '/mashq/50',    icon: '📝', title: t.feat_50_t,    desc: t.feat_50_d,    color: '#16A34A', bg: '#F0FDF4' },
  { href: '/mashq/100',   icon: '📚', title: t.feat_100_t,   desc: t.feat_100_d,   color: '#2563EB', bg: '#EFF6FF' },
  { href: '/xatolar',     icon: '❌', title: t.feat_xato_t,  desc: t.feat_xato_d,  color: '#DC2626', bg: '#FFF1F2' },
];

export default function Home() {
  const [user, setUser] = useState(null);
  const [streak, setStreak] = useState({ count: 0, best: 0 });
  const { lang } = useLang();
  const t = T[lang];

  useEffect(() => {
    const raw = localStorage.getItem('user');
    if (raw) {
      const u = JSON.parse(raw);
      setUser(u);
      setStreak(getStreak(u.id));
    }
  }, []);

  const dest = (href) => user ? href : '/login';
  const stats = STATS(t);
  const sidebarLinks = SIDEBAR_LINKS(t);
  const features = FEATURES(t);

  return (
    <>
      <Navbar />

      {/* Hero */}
      <div style={{background:'var(--surface)',borderBottom:'1px solid var(--border)',padding:'3.5rem 1rem 2.5rem'}}>
        <div style={{maxWidth:660,margin:'0 auto',textAlign:'center'}}>
          <div style={{display:'inline-block',background:'#EFF6FF',color:'#2563EB',borderRadius:99,padding:'0.3rem 1rem',fontSize:'0.85rem',fontWeight:600,marginBottom:'1.25rem'}}>
            {t.home_badge}
          </div>
          <h1 style={{fontSize:'clamp(1.6rem,5vw,2.4rem)',fontWeight:800,lineHeight:1.2,marginBottom:'1rem',color:'var(--text)'}}>
            {t.home_title}
          </h1>
          <p style={{color:'var(--text-muted)',fontSize:'1rem',lineHeight:1.6,marginBottom:'2rem',maxWidth:500,margin:'0 auto 2rem'}}>
            {t.home_desc}
          </p>
          <div style={{display:'flex',gap:'0.875rem',justifyContent:'center',flexWrap:'wrap',padding:'0 1rem'}}>
            {user ? (
              <>
                <Link href="/biletlar" className="btn btn-primary" style={{padding:'0.75rem 1.75rem',fontSize:'1rem',flex:'1 1 auto',maxWidth:210,textAlign:'center'}}>{t.home_start_tickets}</Link>
                <Link href="/imtihon"  className="btn btn-outline"  style={{padding:'0.75rem 1.75rem',fontSize:'1rem',flex:'1 1 auto',maxWidth:210,textAlign:'center'}}>{t.home_start_exam}</Link>
              </>
            ) : (
              <>
                <Link href="/login"    className="btn btn-primary" style={{padding:'0.75rem 1.75rem',fontSize:'1rem',flex:'1 1 auto',maxWidth:210,textAlign:'center'}}>{t.home_free_start}</Link>
                <Link href="/mavzular" className="btn btn-outline"  style={{padding:'0.75rem 1.75rem',fontSize:'1rem',flex:'1 1 auto',maxWidth:210,textAlign:'center'}}>{t.home_view_topics}</Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{background:'var(--bg)',borderBottom:'1px solid var(--border)',padding:'1.25rem 1rem'}}>
        <div style={{maxWidth:800,margin:'0 auto',display:'flex',justifyContent:'center',gap:'1.5rem 2.5rem',flexWrap:'wrap'}}>
          {stats.map(s => (
            <div key={s.label} style={{textAlign:'center'}}>
              <div style={{fontSize:'1.5rem',fontWeight:800,color:'var(--primary)'}}>{s.value}</div>
              <div style={{fontSize:'0.8rem',color:'var(--text-muted)'}}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Sidebar + Main layout */}
      <div className="home-layout">

        {/* ── Sidebar ── */}
        <aside className="home-sidebar">
          {/* Kunlik streak */}
          {user && (
            <div style={{background:'linear-gradient(135deg,#F97316 0%,#EF4444 100%)',borderRadius:12,padding:'1rem 1.1rem',marginBottom:'1rem',color:'white'}}>
              <div style={{display:'flex',alignItems:'center',gap:'0.6rem'}}>
                <span style={{fontSize:'1.9rem',lineHeight:1}}>🔥</span>
                <div style={{lineHeight:1.15}}>
                  <div style={{fontSize:'1.75rem',fontWeight:800}}>{streak.count}</div>
                  <div style={{fontSize:'0.78rem',opacity:0.9}}>{t.streak_days} · {t.streak_l}</div>
                </div>
              </div>
              <div style={{fontSize:'0.72rem',opacity:0.85,marginTop:'0.6rem',display:'flex',justifyContent:'space-between'}}>
                <span>{t.streak_best}: {streak.best}</span>
                <span>{streak.count > 0 ? t.streak_today_done : t.streak_hint}</span>
              </div>
            </div>
          )}

          <div className="home-sidebar-nav">
            <div className="home-sidebar-header">{t.home_sections}</div>
            <div className="home-sidebar-links">
              {sidebarLinks.map(l => (
                <Link key={l.href} href={dest(l.href)} className="home-sidebar-link">
                  <span style={{fontSize:'1.1rem',flexShrink:0}}>{l.icon}</span>
                  <span>{l.label}</span>
                  <span className="s-arrow">›</span>
                </Link>
              ))}
            </div>
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="home-main">
          {user && (
            <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,padding:'1rem 1.25rem',marginBottom:'1.5rem',display:'flex',alignItems:'center',gap:'0.75rem'}}>
              <span style={{fontSize:'1.5rem'}}>👋</span>
              <p style={{fontSize:'0.9rem',color:'var(--text-muted)',margin:0}}>
                {t.home_welcome} <strong style={{color:'var(--text)'}}>{user.name}</strong> — {t.home_continue}
              </p>
            </div>
          )}

          {/* Feature cards */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))',gap:'1rem',marginBottom:'1.5rem'}}>
            {features.map(f => (
              <Link key={f.href} href={dest(f.href)}
                style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,padding:'1.25rem',textDecoration:'none',display:'block',transition:'all 0.15s'}}
                onMouseEnter={e=>{e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,0.1)';e.currentTarget.style.transform='translateY(-2px)';}}
                onMouseLeave={e=>{e.currentTarget.style.boxShadow='none';e.currentTarget.style.transform='none';}}>
                <div style={{width:40,height:40,borderRadius:9,background:f.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.3rem',marginBottom:'0.875rem'}}>
                  {f.icon}
                </div>
                <h3 style={{fontSize:'0.925rem',fontWeight:700,color:'var(--text)',marginBottom:'0.35rem'}}>{f.title}</h3>
                <p style={{fontSize:'0.815rem',color:'var(--text-muted)',lineHeight:1.5,margin:0}}>{f.desc}</p>
                <div style={{marginTop:'0.875rem',fontSize:'0.8rem',fontWeight:600,color:f.color}}>{t.home_begin}</div>
              </Link>
            ))}
          </div>

          {/* CTA for guests */}
          {!user && (
            <div style={{background:'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',borderRadius:14,padding:'2rem 1.5rem',textAlign:'center',color:'white'}}>
              <h2 style={{fontSize:'1.2rem',fontWeight:700,marginBottom:'0.4rem'}}>{t.home_cta_t}</h2>
              <p style={{opacity:0.85,marginBottom:'1.25rem',fontSize:'0.9rem'}}>{t.home_cta_s}</p>
              <Link href="/login" style={{display:'inline-block',background:'white',color:'#2563EB',padding:'0.65rem 1.75rem',borderRadius:8,fontWeight:700,textDecoration:'none',fontSize:'0.9rem'}}>
                {t.home_cta_btn}
              </Link>
            </div>
          )}
        </main>
      </div>

      <div style={{height:'2rem'}} />
    </>
  );
}
