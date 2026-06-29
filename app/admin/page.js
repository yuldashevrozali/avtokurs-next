'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { apiFetch } from '@/lib/api';

function parseUA(ua) {
  if (!ua) return "Noma'lum";
  let browser = 'Brauzer';
  if (ua.includes('Edg/') || ua.includes('Edge/')) browser = 'Edge';
  else if (ua.includes('Chrome/') && !ua.includes('Chromium/')) browser = 'Chrome';
  else if (ua.includes('Firefox/')) browser = 'Firefox';
  else if (ua.includes('Safari/') && !ua.includes('Chrome/')) browser = 'Safari';
  let os = 'OS';
  if (ua.includes('Windows NT')) os = 'Windows';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Mac OS X')) os = 'Mac';
  else if (ua.includes('Linux')) os = 'Linux';
  return `${browser} · ${os}`;
}

function timeAgo(date) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return 'Hozir';
  if (diff < 3600) return `${Math.floor(diff / 60)} daqiqa oldin`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} soat oldin`;
  return `${Math.floor(diff / 86400)} kun oldin`;
}

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState('modules');
  const [modules, setModules] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [selectedMod, setSelectedMod] = useState(null);
  const [showModForm, setShowModForm] = useState(false);
  const [showLesForm, setShowLesForm] = useState(false);
  const [modForm, setModForm] = useState({ title: '', description: '', order: 0 });
  const [lesForm, setLesForm] = useState({ title: '', description: '', youtubeUrl: '', order: 0, quizQ: '', opts: ['','','',''], correctIdx: 0 });

  function extractYoutubeId(input) {
    const patterns = [
      /youtu\.be\/([A-Za-z0-9_-]{11})/,
      /youtube\.com\/watch\?.*v=([A-Za-z0-9_-]{11})/,
      /youtube\.com\/embed\/([A-Za-z0-9_-]{11})/,
    ];
    for (const p of patterns) {
      const m = input.match(p);
      if (m) return m[1];
    }
    return input.trim();
  }

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (!u) { router.push('/login'); return; }
    const user = JSON.parse(u);
    if (user.role !== 'admin') { router.push('/'); return; }
    loadModules();
    apiFetch('/users').then(data => setPendingUsers(data.filter(u => u.status === 'pending'))).catch(() => {});
  }, []);

  async function loadModules() {
    const data = await apiFetch('/modules/admin/all');
    setModules(data);
  }

  async function loadUsers() {
    const data = await apiFetch('/users');
    setUsers(data);
  }

  async function selectModule(mod) {
    setSelectedMod(mod);
    setShowLesForm(false);
    const ls = await apiFetch(`/lessons/module/${mod._id}`);
    setLessons(ls);
  }

  async function saveModule() {
    await apiFetch('/modules', { method: 'POST', body: JSON.stringify(modForm) });
    setShowModForm(false); setModForm({ title: '', description: '', order: 0 });
    loadModules();
  }

  async function togglePublish(mod) {
    await apiFetch(`/modules/${mod._id}`, { method: 'PUT', body: JSON.stringify({ isPublished: !mod.isPublished }) });
    loadModules();
    if (selectedMod?._id === mod._id) setSelectedMod({ ...mod, isPublished: !mod.isPublished });
  }

  async function deleteModule(id) {
    if (!confirm("Modul va barcha darslar o'chiriladi. Davom etasizmi?")) return;
    await apiFetch(`/modules/${id}`, { method: 'DELETE' });
    setSelectedMod(null); setLessons([]); loadModules();
  }

  async function saveLesson() {
    const { title, youtubeUrl, description, order, quizQ, opts, correctIdx } = lesForm;
    if (!title) return alert('Dars nomi shart');
    if (!youtubeUrl) return alert('YouTube havolasi shart');
    if (!description) return alert('Izoh shart');
    const youtubeId = extractYoutubeId(youtubeUrl);
    const validOpts = opts.filter(Boolean);
    const quiz = quizQ && validOpts.length >= 2 ? { question: quizQ, options: validOpts, correctIndex: correctIdx } : undefined;
    await apiFetch('/lessons', { method: 'POST', body: JSON.stringify({ moduleId: selectedMod._id, title, description, youtubeId, order, quiz }) });
    setShowLesForm(false); setLesForm({ title:'',description:'',youtubeUrl:'',order:0,quizQ:'',opts:['','','',''],correctIdx:0 });
    selectModule(selectedMod);
  }

  async function deleteLesson(id) {
    if (!confirm("Darsni o'chirasizmi?")) return;
    await apiFetch(`/lessons/${id}`, { method: 'DELETE' });
    selectModule(selectedMod);
  }

  async function loadPending() {
    const data = await apiFetch('/users');
    setPendingUsers(data.filter(u => u.status === 'pending'));
  }

  async function approveUser(id) {
    await apiFetch(`/users/${id}/approve`, { method: 'POST' });
    loadPending();
  }

  async function rejectUser(id) {
    if (!confirm("Foydalanuvchini rad etib o'chirasizmi?")) return;
    await apiFetch(`/users/${id}`, { method: 'DELETE' });
    loadPending();
  }

  async function changeRole(userId, role) {
    await apiFetch(`/users/${userId}/role`, { method: 'PUT', body: JSON.stringify({ role }) });
    loadUsers();
  }

  async function deleteUser(id) {
    if (!confirm("Foydalanuvchini o'chirasizmi?")) return;
    await apiFetch(`/users/${id}`, { method: 'DELETE' });
    loadUsers();
  }

  const tabStyle = (t) => ({ padding:'0.5rem 1.25rem', border:'none', borderBottom:`2px solid ${tab===t?'#2563EB':'transparent'}`, background:'none', cursor:'pointer', fontWeight:tab===t?600:400, color:tab===t?'#2563EB':'#64748B', fontSize:'0.9rem' });

  return (
    <>
      <Navbar />
      <div className="container">
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.5rem'}}>
          <h1 style={{fontSize:'1.4rem'}}>Admin panel</h1>
        </div>

        <div style={{display:'flex',gap:0,borderBottom:'1px solid #E2E8F0',marginBottom:'1.5rem',flexWrap:'wrap'}}>
          <button style={tabStyle('modules')} onClick={() => setTab('modules')}>Modullar</button>
          <button style={tabStyle('users')} onClick={() => { setTab('users'); loadUsers(); }}>Foydalanuvchilar</button>
          <button style={tabStyle('pending')} onClick={() => { setTab('pending'); loadPending(); }}>
            Tasdiq kutmoqda
            {pendingUsers.length > 0 && (
              <span style={{marginLeft:'0.4rem',background:'#DC2626',color:'white',borderRadius:99,padding:'0.1rem 0.45rem',fontSize:'0.72rem',fontWeight:700}}>{pendingUsers.length}</span>
            )}
          </button>
        </div>

        {tab === 'modules' && (
          <div className="admin-layout">
            <div>
              <div style={{background:'white',border:'1px solid #E2E8F0',borderRadius:10,padding:'1rem',overflowX:'auto'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.75rem'}}>
                  <h3 style={{fontSize:'0.8rem',textTransform:'uppercase',color:'#64748B',letterSpacing:'0.05em'}}>Modullar</h3>
                  <button onClick={() => { setShowModForm(true); setSelectedMod(null); }} style={{fontSize:'0.8rem',background:'#2563EB',color:'white',border:'none',borderRadius:4,padding:'0.3rem 0.6rem',cursor:'pointer'}}>+ Qo'sh</button>
                </div>
                {modules.map(mod => (
                  <div key={mod._id} onClick={() => selectModule(mod)}
                    style={{padding:'0.6rem 0.75rem',borderRadius:6,cursor:'pointer',fontSize:'0.9rem',marginBottom:4,display:'flex',justifyContent:'space-between',alignItems:'center',background:selectedMod?._id===mod._id?'#EFF6FF':'transparent'}}>
                    <span style={{color:selectedMod?._id===mod._id?'#2563EB':'#1E293B'}}>{mod.title}</span>
                    <span className={`badge ${mod.isPublished?'badge-pub':'badge-draft'}`}>{mod.isPublished?'Nashr':'Draft'}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{background:'white',border:'1px solid #E2E8F0',borderRadius:10,padding:'1.5rem'}}>
              {showModForm && (
                <div>
                  <h2 style={{fontSize:'1.1rem',marginBottom:'1rem'}}>Yangi modul</h2>
                  <div className="form-group"><label>Nomi</label><input value={modForm.title} onChange={e=>setModForm({...modForm,title:e.target.value})} placeholder="Modul nomi" /></div>
                  <div className="form-group"><label>Tavsif</label><textarea value={modForm.description} onChange={e=>setModForm({...modForm,description:e.target.value})} /></div>
                  <div className="form-group"><label>Tartib</label><input type="number" value={modForm.order} onChange={e=>setModForm({...modForm,order:+e.target.value})} /></div>
                  <div style={{display:'flex',gap:'0.5rem'}}>
                    <button onClick={saveModule} className="btn btn-primary">Saqlash</button>
                    <button onClick={()=>setShowModForm(false)} className="btn btn-outline">Bekor</button>
                  </div>
                </div>
              )}

              {selectedMod && !showModForm && (
                <>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem'}}>
                    <div>
                      <h2 style={{fontSize:'1.1rem'}}>{selectedMod.title}</h2>
                      <p style={{fontSize:'0.875rem',color:'#64748B'}}>{selectedMod.description}</p>
                    </div>
                    <div style={{display:'flex',gap:8}}>
                      <button onClick={()=>togglePublish(selectedMod)} className="btn btn-outline">{selectedMod.isPublished?'Yashirish':'Nashr'}</button>
                      <button onClick={()=>deleteModule(selectedMod._id)} className="btn btn-danger">O'chirish</button>
                    </div>
                  </div>
                  <hr style={{borderColor:'#E2E8F0',marginBottom:'1rem'}} />
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.75rem'}}>
                    <h3 style={{fontSize:'0.95rem'}}>Darslar ({lessons.length})</h3>
                    <button onClick={()=>setShowLesForm(true)} className="btn btn-primary">+ Dars qo'sh</button>
                  </div>
                  {lessons.map(l => (
                    <div key={l._id} style={{padding:'0.75rem',border:'1px solid #E2E8F0',borderRadius:8,marginBottom:8,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <div>
                        <p style={{fontSize:'0.9rem',fontWeight:500}}>{l.title}</p>
                        <p style={{fontSize:'0.8rem',color:'#64748B'}}>YouTube: {l.youtubeId} · Quiz: {l.quiz?'Bor':"Yo'q"}</p>
                      </div>
                      <button onClick={()=>deleteLesson(l._id)} className="btn btn-danger" style={{padding:'0.4rem 0.75rem',fontSize:'0.8rem'}}>O'chirish</button>
                    </div>
                  ))}

                  {showLesForm && (
                    <div style={{marginTop:'1rem',padding:'1rem',background:'#F8FAFC',borderRadius:8,border:'1px solid #E2E8F0'}}>
                      <h3 style={{fontSize:'0.95rem',marginBottom:'1rem'}}>Yangi dars</h3>
                      <div className="form-group"><label>Nomi</label><input value={lesForm.title} onChange={e=>setLesForm({...lesForm,title:e.target.value})} /></div>
                      <div className="form-group"><label>Izoh</label><textarea value={lesForm.description} onChange={e=>setLesForm({...lesForm,description:e.target.value})} /></div>
                      <div className="form-group"><label>YouTube havolasi *</label><input value={lesForm.youtubeUrl} onChange={e=>setLesForm({...lesForm,youtubeUrl:e.target.value})} placeholder="https://youtu.be/... yoki https://youtube.com/watch?v=..." /></div>
                      <div className="form-group"><label>Tartib</label><input type="number" value={lesForm.order} onChange={e=>setLesForm({...lesForm,order:+e.target.value})} /></div>
                      <p style={{fontSize:'0.875rem',fontWeight:500,marginBottom:'0.75rem',marginTop:'0.5rem'}}>Quiz (ixtiyoriy)</p>
                      <div className="form-group"><label>Savol</label><input value={lesForm.quizQ} onChange={e=>setLesForm({...lesForm,quizQ:e.target.value})} /></div>
                      {['F1','F2','F3','F4'].map((l,i)=>(
                        <div key={i} className="form-group"><label>Variant {l}</label><input value={lesForm.opts[i]} onChange={e=>{const o=[...lesForm.opts];o[i]=e.target.value;setLesForm({...lesForm,opts:o})}} /></div>
                      ))}
                      <div className="form-group"><label>To'g'ri javob</label>
                        <select value={lesForm.correctIdx} onChange={e=>setLesForm({...lesForm,correctIdx:+e.target.value})}>
                          {['F1','F2','F3','F4'].map((l,i)=><option key={i} value={i}>Variant {l}</option>)}
                        </select>
                      </div>
                      <div style={{display:'flex',gap:'0.5rem'}}>
                        <button onClick={saveLesson} className="btn btn-primary">Saqlash</button>
                        <button onClick={()=>setShowLesForm(false)} className="btn btn-outline">Bekor</button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {!selectedMod && !showModForm && <p style={{color:'#64748B'}}>Chap mendan modul tanlang</p>}
            </div>
          </div>
        )}

        {tab === 'pending' && (
          <div>
            {pendingUsers.length === 0 ? (
              <div style={{background:'white',border:'1px solid #E2E8F0',borderRadius:10,padding:'3rem',textAlign:'center'}}>
                <div style={{fontSize:'2.5rem',marginBottom:'1rem'}}>✅</div>
                <p style={{color:'#64748B'}}>Tasdiq kutayotgan foydalanuvchi yo'q</p>
              </div>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
                {pendingUsers.map(u => (
                  <div key={u._id} style={{background:'white',border:'1.5px solid #FEF3C7',borderRadius:10,padding:'1rem 1.25rem',display:'flex',alignItems:'center',gap:'1rem',flexWrap:'wrap'}}>
                    <div style={{flex:1,minWidth:180}}>
                      <div style={{fontWeight:600,color:'#1E293B',fontSize:'0.95rem'}}>{u.name}</div>
                      <div style={{fontSize:'0.82rem',color:'#64748B',marginTop:2}}>{u.email}</div>
                      <div style={{fontSize:'0.75rem',color:'#94A3B8',marginTop:2}}>
                        Ro'yxatdan: {new Date(u.createdAt).toLocaleString('uz-UZ')}
                      </div>
                    </div>
                    <span style={{padding:'0.25rem 0.75rem',background:'#FEF9C3',color:'#713F12',borderRadius:99,fontSize:'0.78rem',fontWeight:600,whiteSpace:'nowrap'}}>
                      ⏳ Tasdiq kutmoqda
                    </span>
                    <div style={{display:'flex',gap:'0.5rem'}}>
                      <button onClick={() => approveUser(u._id)}
                        style={{padding:'0.45rem 1rem',background:'#16A34A',color:'white',border:'none',borderRadius:6,fontWeight:600,cursor:'pointer',fontSize:'0.85rem'}}>
                        ✓ Tasdiqlash
                      </button>
                      <button onClick={() => rejectUser(u._id)}
                        style={{padding:'0.45rem 0.875rem',background:'#FEF2F2',color:'#DC2626',border:'1px solid #FCA5A5',borderRadius:6,fontWeight:600,cursor:'pointer',fontSize:'0.85rem'}}>
                        Rad etish
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'users' && (
          <div className="table-scroll" style={{background:'white',border:'1px solid #E2E8F0',borderRadius:10}}>
            <table style={{width:'100%',borderCollapse:'collapse',minWidth:700}}>
              <thead>
                <tr style={{background:'#F8FAFC',borderBottom:'1px solid #E2E8F0'}}>
                  {['Ism','Email','Rol','Tasdiqlangan','Holat','Qurilma','Amal'].map(h=>(
                    <th key={h} style={{padding:'0.75rem 1rem',textAlign:'left',fontSize:'0.8rem',color:'#64748B',fontWeight:600,whiteSpace:'nowrap'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const d = u.activeDevice;
                  const online = d?.lastSeenAt && (Date.now() - new Date(d.lastSeenAt).getTime()) < 90_000;
                  const lastSeen = d?.lastSeenAt ? timeAgo(d.lastSeenAt) : null;
                  const device = d?.userAgent ? parseUA(d.userAgent) : null;
                  return (
                    <tr key={u._id} style={{borderBottom:'1px solid #E2E8F0'}}>
                      <td style={{padding:'0.75rem 1rem',fontSize:'0.9rem',fontWeight:500}}>{u.name}</td>
                      <td style={{padding:'0.75rem 1rem',fontSize:'0.85rem',color:'#64748B'}}>{u.email}</td>
                      <td style={{padding:'0.75rem 1rem'}}>
                        <select value={u.role} onChange={e=>changeRole(u._id,e.target.value)}
                          style={{padding:'0.3rem 0.5rem',border:'1px solid #E2E8F0',borderRadius:4,fontSize:'0.85rem',background:u.role==='admin'?'#DBEAFE':'#F1F5F9'}}>
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td style={{padding:'0.75rem 1rem'}}>
                        {u.status === 'pending' ? (
                          <span style={{fontSize:'0.78rem',background:'#FEF9C3',color:'#713F12',padding:'0.2rem 0.6rem',borderRadius:99,fontWeight:600,whiteSpace:'nowrap'}}>⏳ Kutmoqda</span>
                        ) : (
                          <span style={{fontSize:'0.78rem',background:'#DCFCE7',color:'#166534',padding:'0.2rem 0.6rem',borderRadius:99,fontWeight:600}}>✓ Faol</span>
                        )}
                      </td>
                      <td style={{padding:'0.75rem 1rem'}}>
                        {d ? (
                          <div style={{display:'flex',alignItems:'center',gap:6}}>
                            <span style={{width:8,height:8,borderRadius:'50%',background:online?'#22C55E':'#94A3B8',flexShrink:0}} />
                            <span style={{fontSize:'0.8rem',color:'#64748B',whiteSpace:'nowrap'}}>
                              {online ? 'Online' : (lastSeen || '—')}
                            </span>
                          </div>
                        ) : (
                          <span style={{fontSize:'0.8rem',color:'#94A3B8'}}>Kirilmagan</span>
                        )}
                      </td>
                      <td style={{padding:'0.75rem 1rem'}}>
                        {d ? (
                          <div>
                            <div style={{fontSize:'0.82rem',color:'#1E293B',whiteSpace:'nowrap'}}>{device}</div>
                            <div style={{fontSize:'0.75rem',color:'#94A3B8',marginTop:2}}>{d.ip}</div>
                            {d.loginAt && <div style={{fontSize:'0.72rem',color:'#CBD5E1',marginTop:1}}>Kirdi: {new Date(d.loginAt).toLocaleString('uz-UZ')}</div>}
                          </div>
                        ) : <span style={{fontSize:'0.8rem',color:'#94A3B8'}}>—</span>}
                      </td>
                      <td style={{padding:'0.75rem 1rem'}}>
                        <button onClick={()=>deleteUser(u._id)} className="btn btn-danger" style={{padding:'0.35rem 0.75rem',fontSize:'0.8rem'}}>O'chirish</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!users.length && <p style={{padding:'1rem',color:'#64748B',textAlign:'center'}}>Foydalanuvchilar yo'q</p>}
          </div>
        )}
      </div>
      <style>{`
        @media(max-width:768px){
          table{font-size:0.8rem}
          table td,table th{padding:0.5rem 0.6rem!important}
          .admin-layout{grid-template-columns:1fr!important}
        }
        @media(max-width:480px){
          table td:nth-child(3),table th:nth-child(3){display:none}
        }
      `}</style>
    </>
  );
}
