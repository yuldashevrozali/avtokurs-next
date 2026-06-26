'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { apiFetch } from '@/lib/api';

export default function BiletlarPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const router = useRouter();

  useEffect(() => {
    const raw = localStorage.getItem('user');
    if (!raw) { router.push('/login'); return; }
    setUserId(JSON.parse(raw).id);
    apiFetch('/tickets').then(data => { setTickets(data); setLoading(false); });
  }, []);

  function getProgress(ticketId) {
    if (!userId) return null;
    const raw = localStorage.getItem(`bilet_result_${userId}_${ticketId}`);
    return raw ? JSON.parse(raw) : null;
  }

  const doneCnt = tickets.filter(t => {
    const p = getProgress(t.id);
    return p && p.percent >= 80;
  }).length;

  if (loading) return <><Navbar /><div className="container"><p style={{color:'var(--text-muted)'}}>Yuklanmoqda...</p></div></>;

  return (
    <>
      <Navbar />
      <div className="container">
        <div style={{marginBottom:'1.5rem'}}>
          <h1 style={{fontSize:'1.5rem',marginBottom:'0.3rem',color:'var(--text)'}}>Biletlar</h1>
          <p style={{color:'var(--text-muted)',fontSize:'0.9rem'}}>Har bir biletda 20 ta savol — rasmiy imtihon shakli</p>
        </div>

        <div style={{display:'flex',gap:'1rem',marginBottom:'1.5rem',flexWrap:'wrap'}}>
          {[['Jami biletlar', tickets.length], ['Yakunlangan (80%+)', doneCnt], ['Savol soni', 20]].map(([label, val]) => (
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
            return (
              <Link key={ticket.id} href={`/biletlar/${ticket.id}`}
                style={{background:'var(--surface)',border:`2px solid ${done?'#16A34A':started?'var(--primary)':'var(--border)'}`,borderRadius:10,padding:'1rem',textDecoration:'none',display:'flex',flexDirection:'column',gap:'0.5rem',transition:'box-shadow 0.15s'}}
                onMouseEnter={e=>e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,0.12)'}
                onMouseLeave={e=>e.currentTarget.style.boxShadow='none'}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontSize:'0.75rem',color:'var(--text-muted)',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em'}}>Bilet</span>
                  {done && <span style={{fontSize:'0.7rem',background:'#DCFCE7',color:'#166534',borderRadius:99,padding:'1px 6px'}}>✓</span>}
                  {started && !done && <span style={{fontSize:'0.7rem',background:'#DBEAFE',color:'#1E40AF',borderRadius:99,padding:'1px 6px'}}>{pct}%</span>}
                </div>
                <div style={{fontSize:'1.5rem',fontWeight:700,color:done?'#16A34A':started?'var(--primary)':'var(--text)'}}>{ticket.number}</div>
                <div style={{background:'var(--border)',borderRadius:99,height:4,overflow:'hidden'}}>
                  <div style={{height:'100%',borderRadius:99,background:done?'#16A34A':'var(--primary)',width:`${pct}%`,transition:'width 0.3s'}} />
                </div>
                <div style={{fontSize:'0.75rem',color:'var(--text-muted)'}}>
                  {done ? "Bajarildi" : started ? `${prog.correct}/${prog.total} to'g'ri` : "20 ta savol"}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
