'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { apiFetch } from '@/lib/api';
import PremiumGate from '@/components/PremiumGate';
import { useGuard } from '@/lib/usePremiumGuard';
import { isPremiumUser } from '@/lib/access';

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

export default function ModulesPage() {
  const guard = useGuard(isPremiumUser);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showModForm, setShowModForm] = useState(false);
  const [modForm, setModForm] = useState({ title: '', description: '', order: 0 });
  const [expanded, setExpanded] = useState(null);
  const [lessons, setLessons] = useState({});
  const [showLesForm, setShowLesForm] = useState(null);
  const [lesForm, setLesForm] = useState({ title: '', description: '', youtubeUrl: '', order: 0 });
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const raw = localStorage.getItem('user');
    if (!raw) { router.push('/login'); return; }
    const parsed = JSON.parse(raw);
    setUser(parsed);
    loadModules(parsed.role === 'admin');
  }, []);

  async function loadModules(isAdmin) {
    const data = await apiFetch(isAdmin ? '/modules/admin/all' : '/modules');
    setModules(data);
    setLoading(false);
  }

  async function toggleExpand(modId) {
    if (expanded === modId) { setExpanded(null); return; }
    setExpanded(modId);
    if (!lessons[modId]) {
      const ls = await apiFetch(`/lessons/module/${modId}`);
      setLessons(prev => ({ ...prev, [modId]: ls }));
    }
  }

  async function saveModule() {
    if (!modForm.title.trim()) return alert('Modul nomi shart');
    setSaving(true);
    await apiFetch('/modules', { method: 'POST', body: JSON.stringify(modForm) });
    setShowModForm(false);
    setModForm({ title: '', description: '', order: 0 });
    await loadModules(true);
    setSaving(false);
  }

  async function togglePublish(mod, e) {
    e.stopPropagation();
    await apiFetch(`/modules/${mod._id}`, { method: 'PUT', body: JSON.stringify({ isPublished: !mod.isPublished }) });
    loadModules(true);
  }

  async function deleteMod(id, e) {
    e.stopPropagation();
    if (!confirm("Modul va barcha darslar o'chiriladi. Davom etasizmi?")) return;
    await apiFetch(`/modules/${id}`, { method: 'DELETE' });
    if (expanded === id) setExpanded(null);
    setLessons(prev => { const n = {...prev}; delete n[id]; return n; });
    loadModules(true);
  }

  async function saveLesson(moduleId) {
    const { title, description, youtubeUrl, order } = lesForm;
    if (!title.trim()) return alert('Dars nomi shart');
    if (!youtubeUrl.trim()) return alert('YouTube havolasi shart');
    if (!description.trim()) return alert('Izoh shart');
    const youtubeId = extractYoutubeId(youtubeUrl);
    setSaving(true);
    await apiFetch('/lessons', { method: 'POST', body: JSON.stringify({ moduleId, title, description, youtubeId, order }) });
    setShowLesForm(null);
    setLesForm({ title: '', description: '', youtubeUrl: '', order: 0 });
    const ls = await apiFetch(`/lessons/module/${moduleId}`);
    setLessons(prev => ({ ...prev, [moduleId]: ls }));
    setSaving(false);
  }

  async function deleteLesson(lessonId, moduleId) {
    if (!confirm("Darsni o'chirasizmi?")) return;
    await apiFetch(`/lessons/${lessonId}`, { method: 'DELETE' });
    const ls = await apiFetch(`/lessons/module/${moduleId}`);
    setLessons(prev => ({ ...prev, [moduleId]: ls }));
  }

  if (guard === 'loading') return null;
  if (guard === 'denied') return (<><Navbar /><PremiumGate /></>);

  if (loading) return <><Navbar /><div className="container"><p style={{color:'var(--text-muted)'}}>Yuklanmoqda...</p></div></>;

  const isAdmin = user?.role === 'admin';

  return (
    <>
      <Navbar />
      <div className="container">
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'1rem',marginBottom:'1.5rem'}}>
          <div>
            <h1 style={{fontSize:'1.5rem',marginBottom:'0.25rem'}}>Video darsliklar</h1>
            <p style={{color:'var(--text-muted)',fontSize:'0.9rem'}}>
              {isAdmin ? 'Modullarni boshqaring va darslar qo\'shing' : 'Modulni tanlang va o\'rganishni boshlang'}
            </p>
          </div>
          {isAdmin && (
            <button onClick={() => setShowModForm(v => !v)} className="btn btn-primary">
              {showModForm ? 'Bekor' : '+ Modul qo\'sh'}
            </button>
          )}
        </div>

        {isAdmin && showModForm && (
          <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:10,padding:'1.25rem',marginBottom:'1.5rem'}}>
            <h3 style={{fontSize:'1rem',marginBottom:'1rem'}}>Yangi modul</h3>
            <div className="form-group">
              <label>Nomi *</label>
              <input value={modForm.title} onChange={e=>setModForm({...modForm,title:e.target.value})} placeholder="Modul nomi" />
            </div>
            <div className="form-group">
              <label>Tavsif</label>
              <textarea value={modForm.description} onChange={e=>setModForm({...modForm,description:e.target.value})} placeholder="Modul haqida qisqacha" />
            </div>
            <div className="form-group">
              <label>Tartib raqami</label>
              <input type="number" value={modForm.order} onChange={e=>setModForm({...modForm,order:+e.target.value})} />
            </div>
            <div style={{display:'flex',gap:'0.5rem'}}>
              <button onClick={saveModule} className="btn btn-primary" disabled={saving}>{saving ? 'Saqlanmoqda...' : 'Saqlash'}</button>
              <button onClick={()=>setShowModForm(false)} className="btn btn-outline">Bekor</button>
            </div>
          </div>
        )}

        {!modules.length
          ? <p style={{color:'var(--text-muted)'}}>Hozircha modul yo'q</p>
          : <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
              {modules.map(mod => (
                <div key={mod._id} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:10,overflow:'hidden'}}>

                  {/* Module header */}
                  <div
                    onClick={() => isAdmin ? toggleExpand(mod._id) : router.push(`/lesson/${mod._id}`)}
                    style={{padding:'1.25rem',cursor:'pointer',display:'flex',alignItems:'center',gap:'1rem'}}
                  >
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:'0.5rem',marginBottom:'0.25rem',flexWrap:'wrap'}}>
                        <h3 style={{fontSize:'1rem',margin:0}}>{mod.title}</h3>
                        {isAdmin && <span className={`badge ${mod.isPublished?'badge-pub':'badge-draft'}`}>{mod.isPublished?'Nashr':'Draft'}</span>}
                      </div>
                      <p style={{fontSize:'0.875rem',color:'var(--text-muted)',margin:0}}>{mod.description || "Tavsif yo'q"}</p>
                      {!isAdmin && (
                        <div style={{marginTop:'0.75rem'}}>
                          <div className="progress-bar-wrap"><div className="progress-bar" style={{width:`${mod.percent||0}%`}} /></div>
                          <div className="progress-label">{mod.percent||0}% yakunlangan · {mod.completedLessons||0}/{mod.totalLessons||0} dars</div>
                        </div>
                      )}
                    </div>
                    {!isAdmin && (
                      <button
                        onClick={e => { e.stopPropagation(); router.push(`/lesson/${mod._id}`); }}
                        style={{flexShrink:0,padding:'0.6rem 1.25rem',background:'var(--primary)',color:'white',border:'none',borderRadius:8,fontSize:'0.9rem',fontWeight:600,cursor:'pointer',whiteSpace:'nowrap'}}>
                        {mod.percent >= 100 ? 'Qayta ko\'rish' : mod.percent > 0 ? 'Davom etish' : 'Boshlash'}
                      </button>
                    )}
                    {isAdmin ? (
                      <div style={{display:'flex',gap:'0.5rem',flexShrink:0,alignItems:'center'}}>
                        <button onClick={e=>togglePublish(mod,e)} className="btn btn-outline" style={{padding:'0.3rem 0.65rem',fontSize:'0.8rem'}}>
                          {mod.isPublished ? 'Yashirish' : 'Nashr'}
                        </button>
                        <button onClick={e=>deleteMod(mod._id,e)} className="btn btn-danger" style={{padding:'0.3rem 0.65rem',fontSize:'0.8rem'}}>
                          O'chirish
                        </button>
                        <span style={{color:'var(--text-muted)',fontSize:'0.8rem'}}>{expanded===mod._id?'▲':'▼'}</span>
                      </div>
                    ) : null}
                  </div>

                  {/* Admin: expanded lesson list */}
                  {isAdmin && expanded === mod._id && (
                    <div style={{borderTop:'1px solid var(--border)',padding:'1rem 1.25rem',background:'var(--bg)'}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.75rem'}}>
                        <span style={{fontSize:'0.875rem',fontWeight:600,color:'var(--text)'}}>
                          Darslar ({(lessons[mod._id]||[]).length})
                        </span>
                        <button
                          onClick={()=>{ setShowLesForm(showLesForm===mod._id?null:mod._id); setLesForm({title:'',description:'',youtubeUrl:'',order:0}); }}
                          className="btn btn-primary"
                          style={{padding:'0.3rem 0.75rem',fontSize:'0.8rem'}}
                        >
                          + Dars qo'sh
                        </button>
                      </div>

                      {(lessons[mod._id]||[]).length === 0 && (
                        <p style={{fontSize:'0.875rem',color:'var(--text-muted)',marginBottom:'0.75rem'}}>Hali dars qo'shilmagan</p>
                      )}

                      {(lessons[mod._id]||[]).map((l, i) => (
                        <div key={l._id} style={{padding:'0.7rem 0.875rem',border:'1px solid var(--border)',borderRadius:8,marginBottom:6,display:'flex',justifyContent:'space-between',alignItems:'center',background:'var(--surface)'}}>
                          <div style={{minWidth:0}}>
                            <p style={{fontSize:'0.9rem',fontWeight:500,marginBottom:'0.15rem'}}>{i+1}. {l.title}</p>
                            <p style={{fontSize:'0.8rem',color:'var(--text-muted)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:400}}>{l.description}</p>
                          </div>
                          <button onClick={()=>deleteLesson(l._id,mod._id)} className="btn btn-danger" style={{padding:'0.3rem 0.6rem',fontSize:'0.8rem',flexShrink:0,marginLeft:'0.75rem'}}>
                            O'chirish
                          </button>
                        </div>
                      ))}

                      {showLesForm === mod._id && (
                        <div style={{marginTop:'0.75rem',padding:'1.25rem',background:'var(--surface)',borderRadius:8,border:'1px solid var(--border)'}}>
                          <h4 style={{fontSize:'0.9rem',marginBottom:'0.875rem'}}>Yangi dars</h4>
                          <div className="form-group">
                            <label>Dars nomi *</label>
                            <input value={lesForm.title} onChange={e=>setLesForm({...lesForm,title:e.target.value})} placeholder="Masalan: 1-dars: Yo'l harakati" />
                          </div>
                          <div className="form-group">
                            <label>YouTube havolasi * <span style={{fontSize:'0.8rem',color:'var(--text-muted)',fontWeight:400}}>— youtube.com/watch?v=... yoki youtu.be/...</span></label>
                            <input value={lesForm.youtubeUrl} onChange={e=>setLesForm({...lesForm,youtubeUrl:e.target.value})} placeholder="https://youtu.be/dQw4w9WgXcQ" />
                          </div>
                          <div className="form-group">
                            <label>Izoh *</label>
                            <textarea value={lesForm.description} onChange={e=>setLesForm({...lesForm,description:e.target.value})} placeholder="Bu dars haqida qisqacha ma'lumot..." />
                          </div>
                          <div className="form-group">
                            <label>Tartib raqami</label>
                            <input type="number" value={lesForm.order} onChange={e=>setLesForm({...lesForm,order:+e.target.value})} />
                          </div>
                          <div style={{display:'flex',gap:'0.5rem'}}>
                            <button onClick={()=>saveLesson(mod._id)} className="btn btn-primary" disabled={saving}>{saving?'Saqlanmoqda...':'Saqlash'}</button>
                            <button onClick={()=>setShowLesForm(null)} className="btn btn-outline">Bekor</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
        }
      </div>
    </>
  );
}
