'use client';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useEffect, useState } from 'react';

const FEATURES = [
  {
    href: '/mavzular',
    icon: '📚',
    title: 'Mavzular bo\'yicha test',
    desc: 'Har bir mavzuni alohida o\'rganing. 30+ mavzu va 1220 ta savol.',
    color: '#2563EB',
    bg: '#EFF6FF',
  },
  {
    href: '/biletlar',
    icon: '🎫',
    title: 'Biletlar',
    desc: 'Rasmiy imtihon biletlari — 61 ta bilet, har birida 20 ta savol.',
    color: '#16A34A',
    bg: '#F0FDF4',
  },
  {
    href: '/imtihon',
    icon: '⏱',
    title: 'Imtihon rejimi',
    desc: 'Tasodifiy 50 yoki 100 ta savol. Vaqt chegarasi bilan o\'zingizni sinang.',
    color: '#D97706',
    bg: '#FFFBEB',
  },
  {
    href: '/modules',
    icon: '🎬',
    title: 'Video darslar',
    desc: 'Haydovchilik qoidalarini video orqali o\'rganing. Modullar bo\'yicha.',
    color: '#7C3AED',
    bg: '#F5F3FF',
  },
  {
    href: '/oyin',
    icon: '🕹',
    title: "Haydash o'yini",
    desc: "Damas, Gentra yoki Nexia — mashina tanlang va svetafordan o'ting!",
    color: '#0891B2',
    bg: '#ECFEFF',
  },
];

const STATS = [
  { label: 'Savollar', value: '1220+' },
  { label: 'Biletlar', value: '61' },
  { label: 'Mavzular', value: '30+' },
  { label: 'Video darslar', value: '∞' },
];

export default function Home() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const raw = localStorage.getItem('user');
    if (raw) setUser(JSON.parse(raw));
  }, []);

  return (
    <>
      <Navbar />

      {/* Hero */}
      <div style={{background:'var(--surface)',borderBottom:'1px solid var(--border)',padding:'4rem 1rem 3rem'}}>
        <div style={{maxWidth:700,margin:'0 auto',textAlign:'center'}}>
          <div style={{display:'inline-block',background:'#EFF6FF',color:'#2563EB',borderRadius:99,padding:'0.3rem 1rem',fontSize:'0.85rem',fontWeight:600,marginBottom:'1.25rem'}}>
            Haydovchilik guvohnomasi
          </div>
          <h1 style={{fontSize:'clamp(1.75rem,5vw,2.5rem)',fontWeight:800,lineHeight:1.2,marginBottom:'1rem',color:'var(--text)'}}>
            Avtotest imtihoniga<br/>ishonch bilan tayyorlaning
          </h1>
          <p style={{color:'var(--text-muted)',fontSize:'1.05rem',lineHeight:1.6,marginBottom:'2rem',maxWidth:520,margin:'0 auto 2rem'}}>
            Biletlar, mavzular bo'yicha testlar, video darslar va imtihon rejimi — hammasi bir joyda.
          </p>
          <div style={{display:'flex',gap:'0.875rem',justifyContent:'center',flexWrap:'wrap'}}>
            {user ? (
              <>
                <Link href="/biletlar" className="btn btn-primary" style={{padding:'0.75rem 1.75rem',fontSize:'1rem'}}>Biletlarni boshlash</Link>
                <Link href="/imtihon" className="btn btn-outline" style={{padding:'0.75rem 1.75rem',fontSize:'1rem'}}>Imtihon rejimi</Link>
              </>
            ) : (
              <>
                <Link href="/login" className="btn btn-primary" style={{padding:'0.75rem 1.75rem',fontSize:'1rem'}}>Bepul boshlash</Link>
                <Link href="/mavzular" className="btn btn-outline" style={{padding:'0.75rem 1.75rem',fontSize:'1rem'}}>Mavzularni ko'rish</Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{background:'var(--bg)',borderBottom:'1px solid var(--border)',padding:'1.25rem 1rem'}}>
        <div style={{maxWidth:800,margin:'0 auto',display:'flex',justifyContent:'center',gap:'2.5rem',flexWrap:'wrap'}}>
          {STATS.map(s => (
            <div key={s.label} style={{textAlign:'center'}}>
              <div style={{fontSize:'1.5rem',fontWeight:800,color:'var(--primary)'}}>{s.value}</div>
              <div style={{fontSize:'0.8rem',color:'var(--text-muted)'}}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features grid */}
      <div className="container" style={{maxWidth:960}}>
        <h2 style={{fontSize:'1.25rem',fontWeight:700,textAlign:'center',marginBottom:'0.4rem',color:'var(--text)'}}>
          Barcha o'quv bo'limlari
        </h2>
        <p style={{textAlign:'center',color:'var(--text-muted)',marginBottom:'2rem',fontSize:'0.95rem'}}>
          O'zingizga qulay usulni tanlang
        </p>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))',gap:'1.25rem'}}>
          {FEATURES.map(f => (
            <Link key={f.href} href={user ? f.href : '/login'}
              style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,padding:'1.5rem',textDecoration:'none',display:'block',transition:'all 0.15s'}}
              onMouseEnter={e=>{e.currentTarget.style.boxShadow='0 6px 20px rgba(0,0,0,0.1)';e.currentTarget.style.transform='translateY(-2px)';}}
              onMouseLeave={e=>{e.currentTarget.style.boxShadow='none';e.currentTarget.style.transform='none';}}>
              <div style={{width:44,height:44,borderRadius:10,background:f.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.4rem',marginBottom:'1rem'}}>
                {f.icon}
              </div>
              <h3 style={{fontSize:'1rem',fontWeight:700,color:'var(--text)',marginBottom:'0.4rem'}}>{f.title}</h3>
              <p style={{fontSize:'0.875rem',color:'var(--text-muted)',lineHeight:1.5,margin:0}}>{f.desc}</p>
              <div style={{marginTop:'1rem',fontSize:'0.85rem',fontWeight:600,color:f.color}}>
                Boshlash &#8594;
              </div>
            </Link>
          ))}
        </div>

        {/* User CTA if not logged in */}
        {!user && (
          <div style={{marginTop:'3rem',background:'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',borderRadius:16,padding:'2.5rem 2rem',textAlign:'center',color:'white'}}>
            <h2 style={{fontSize:'1.3rem',fontWeight:700,marginBottom:'0.5rem'}}>Hoziroq boshlang</h2>
            <p style={{opacity:0.85,marginBottom:'1.5rem',fontSize:'0.95rem'}}>Bepul ro'yxatdan o'ting va barcha materiallarga kiring</p>
            <Link href="/login" style={{display:'inline-block',background:'white',color:'#2563EB',padding:'0.7rem 2rem',borderRadius:8,fontWeight:700,textDecoration:'none',fontSize:'0.95rem'}}>
              Ro'yxatdan o'tish
            </Link>
          </div>
        )}

        {/* Logged in quick links */}
        {user && (
          <div style={{marginTop:'2.5rem',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,padding:'1.5rem'}}>
            <p style={{fontSize:'0.9rem',color:'var(--text-muted)',marginBottom:'1rem'}}>Salom, <strong style={{color:'var(--text)'}}>{user.name}</strong> — qayerdan davom etasiz?</p>
            <div style={{display:'flex',gap:'0.75rem',flexWrap:'wrap'}}>
              {FEATURES.map(f => (
                <Link key={f.href} href={f.href}
                  style={{padding:'0.5rem 1rem',background:'var(--bg)',border:'1px solid var(--border)',borderRadius:8,textDecoration:'none',fontSize:'0.875rem',color:'var(--text)',fontWeight:500}}>
                  {f.title}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{height:'3rem'}} />
    </>
  );
}
