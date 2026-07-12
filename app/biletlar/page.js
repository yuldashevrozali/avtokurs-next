'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useLang, T } from '@/lib/lang';
import { COMING_SOON_TICKETS, isComingSoon } from '@/lib/comingSoon';

export default function BiletlarPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const { lang } = useLang();
  const t = T[lang];

  useEffect(() => {
    const raw = localStorage.getItem('user');
    if (raw) setUserId(JSON.parse(raw).id);
    fetch('/api/tickets').then(r => r.json()).then(data => {
      // API'da yo'q bo'lgan "tez orada" biletlarni (masalan 62) ro'yxatga qo'shamiz
      const existing = new Set(data.map(tk => tk.number));
      const extra = COMING_SOON_TICKETS
        .filter(n => !existing.has(n))
        .map(n => ({ id: n, number: n, questionCount: 0 }));
      const all = [...data, ...extra].sort((a, b) => a.number - b.number);
      setTickets(all);
      setLoading(false);
    });
  }, []);

  function getProgress(ticketId) {
    if (!userId) return null;
    const raw = localStorage.getItem(`bilet_result_${userId}_${ticketId}`);
    return raw ? JSON.parse(raw) : null;
  }

  const doneCnt = tickets.filter(tk => {
    const p = getProgress(tk.id);
    return p && p.percent >= 80;
  }).length;

  if (loading) return <><Navbar /><div className="container"><p style={{color:'var(--text-muted)'}}>{t.loading}</p></div></>;

  return (
    <>
      <Navbar />
      <div className="container">
        <div style={{marginBottom:'1.5rem'}}>
          <h1 style={{fontSize:'1.5rem',marginBottom:'0.3rem',color:'var(--text)'}}>{t.tickets_title}</h1>
          <p style={{color:'var(--text-muted)',fontSize:'0.9rem'}}>{t.tickets_sub}</p>
        </div>

        <div style={{display:'flex',gap:'1rem',marginBottom:'1.5rem',flexWrap:'wrap'}}>
          {[[t.tickets_total, tickets.length], [t.tickets_done_pct, doneCnt], [t.q_per_ticket, 20]].map(([label, val]) => (
            <div key={label} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:8,padding:'0.6rem 1rem',fontSize:'0.85rem',color:'var(--text)'}}>
              {label}: <strong style={{color:'var(--primary)'}}>{val}</strong>
            </div>
          ))}
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))',gap:'0.875rem'}}>
          {tickets.map(ticket => {
            const prog = getProgress(ticket.id);
            const pct = prog ? prog.percent : 0;
            const done = pct >= 80;
            const started = !!prog;
            const soon = isComingSoon(ticket.number);

            // "Tez orada" — qulflangan, bosilmaydigan karta
            if (soon) {
              return (
                <div key={ticket.id}
                  style={{background:'var(--surface)',border:'2px dashed var(--border)',borderRadius:10,padding:'1rem',display:'flex',flexDirection:'column',gap:'0.5rem',opacity:0.75,cursor:'not-allowed'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <span style={{fontSize:'0.75rem',color:'var(--text-muted)',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em'}}>{t.ticket_l}</span>
                    <span style={{fontSize:'0.7rem',background:'#FEF3C7',color:'#92400E',borderRadius:99,padding:'2px 8px',fontWeight:600}}>⏳ {t.coming_soon}</span>
                  </div>
                  <div style={{fontSize:'1.5rem',fontWeight:700,color:'var(--text-muted)',display:'flex',alignItems:'center',gap:'0.4rem'}}>
                    {ticket.number} <span style={{fontSize:'1rem'}}>🔒</span>
                  </div>
                  <div style={{fontSize:'0.75rem',color:'var(--text-muted)'}}>{t.coming_soon}</div>
                </div>
              );
            }

            return (
              <Link key={ticket.id} href={`/biletlar/${ticket.id}`}
                style={{background:'var(--surface)',border:`2px solid ${done?'#16A34A':started?'var(--primary)':'var(--border)'}`,borderRadius:10,padding:'1rem',textDecoration:'none',display:'flex',flexDirection:'column',gap:'0.5rem',transition:'box-shadow 0.15s'}}
                onMouseEnter={e=>e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,0.12)'}
                onMouseLeave={e=>e.currentTarget.style.boxShadow='none'}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontSize:'0.75rem',color:'var(--text-muted)',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em'}}>{t.ticket_l}</span>
                  {done && <span style={{fontSize:'0.7rem',background:'#DCFCE7',color:'#166534',borderRadius:99,padding:'1px 6px'}}>✓</span>}
                  {started && !done && <span style={{fontSize:'0.7rem',background:'#DBEAFE',color:'#1E40AF',borderRadius:99,padding:'1px 6px'}}>{pct}%</span>}
                </div>
                <div style={{fontSize:'1.5rem',fontWeight:700,color:done?'#16A34A':started?'var(--primary)':'var(--text)'}}>{ticket.number}</div>
                <div style={{background:'var(--border)',borderRadius:99,height:4,overflow:'hidden'}}>
                  <div style={{height:'100%',borderRadius:99,background:done?'#16A34A':'var(--primary)',width:`${pct}%`,transition:'width 0.3s'}} />
                </div>
                <div style={{fontSize:'0.75rem',color:'var(--text-muted)'}}>
                  {done ? t.done_l : started ? `${prog.correct}/${prog.total} ${t.correct_l.toLowerCase()}` : `20 ${t.q_count}`}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
