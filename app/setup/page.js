'use client';
import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function SetupPage() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState(null);

  async function setup(e) {
    e.preventDefault();
    const res = await fetch('/api/auth/setup-admin', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ email }) });
    const data = await res.json();
    setMsg({ ok: res.ok, text: data.message });
  }

  return (
    <>
      <Navbar />
      <div style={{minHeight:'calc(100vh - 60px)',display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem'}}>
        <div style={{background:'white',border:'1px solid #E2E8F0',borderRadius:10,padding:'2rem',width:'100%',maxWidth:420}}>
          <h2 style={{marginBottom:'0.5rem'}}>Admin sozlash</h2>
          <p style={{color:'#64748B',fontSize:'0.875rem',marginBottom:'1.5rem'}}>Faqat bir marta ishlaydi. Avval ro'yxatdan o'tgan emailingizni kiriting.</p>
          {msg && <div style={{padding:'0.75rem',borderRadius:6,marginBottom:'1rem',background:msg.ok?'#F0FDF4':'#FEF2F2',color:msg.ok?'#16A34A':'#DC2626',fontSize:'0.875rem'}}>{msg.text}</div>}
          <form onSubmit={setup}>
            <div className="form-group"><label>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Emailingiz" required /></div>
            <button type="submit" className="btn btn-primary" style={{width:'100%',padding:'0.7rem'}}>Admin qilish</button>
          </form>
          {msg?.ok && <Link href="/login" className="btn btn-outline" style={{width:'100%',marginTop:'0.75rem',textAlign:'center',display:'block',padding:'0.7rem'}}>Login ga o'tish</Link>}
        </div>
      </div>
    </>
  );
}
