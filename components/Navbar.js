'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useLang, T } from '@/lib/lang';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [dark, setDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const pathname = usePathname();
  const router = useRouter();
  const { lang, setLang } = useLang();
  const t = T[lang];

  const NAV_LINKS = [
    { href: '/',         label: t.home_l  },
    { href: '/mavzular', label: t.topics  },
    { href: '/biletlar', label: t.tickets },
    { href: '/imtihon',  label: t.exam    },
    { href: '/modules',  label: t.videos  },
  ];

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (u) setUser(JSON.parse(u));
    setDark(document.documentElement.getAttribute('data-theme') === 'dark');
    const saved = parseInt(localStorage.getItem('font-size')) || 16;
    setFontSize(saved);
    document.documentElement.style.fontSize = saved + 'px';
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  // Session check every 30s
  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    const check = async () => {
      try {
        const res = await fetch('/api/auth/ping', { headers: { Authorization: `Bearer ${token}` } });
        if (res.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push('/login?reason=kicked');
          return;
        }
        const data = await res.json().catch(() => null);
        if (data?.user) {
          const merged = { ...JSON.parse(localStorage.getItem('user') || '{}'), ...data.user };
          if (data.user.premiumCongrats) {
            merged.premiumCongrats = false; // faqat 1 marta ko'rsatiladi
            fetch('/api/premium/ack', { method: 'POST', headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
            window.dispatchEvent(new Event('premium-congrats'));
          }
          localStorage.setItem('user', JSON.stringify(merged));
          setUser(merged);
        }
      } catch {}
    };
    check();
    const id = setInterval(check, 30_000);
    return () => clearInterval(id);
  }, [user]);

  function changeFont(delta) {
    const next = Math.min(20, Math.max(14, fontSize + delta));
    setFontSize(next);
    document.documentElement.style.fontSize = next + 'px';
    localStorage.setItem('font-size', next);
  }

  function toggleTheme() {
    const next = !dark;
    document.documentElement.setAttribute('data-theme', next ? 'dark' : '');
    localStorage.setItem('theme', next ? 'dark' : 'light');
    setDark(next);
  }

  async function logout() {
    const token = localStorage.getItem('token');
    if (token) {
      await fetch('/api/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setMenuOpen(false);
    router.push('/login');
  }

  function isActive(href) {
    if (href === '/') return pathname === '/';
    if (href === '/modules') return pathname.startsWith('/modules') || pathname.startsWith('/lesson');
    return pathname.startsWith(href);
  }

  const close = () => setMenuOpen(false);

  return (
    <nav>
      <Link className="nav-logo" href="/" onClick={close} style={{display:'inline-flex',alignItems:'center',gap:'0.5rem'}}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-icon.svg" alt="" width={28} height={28} style={{display:'block'}} />
        avtoqoida.uz
      </Link>

      {/* Nav links — row on desktop, dropdown on mobile */}
      <div className={`nav-links${menuOpen ? ' nav-open' : ''}`}>
        {user ? (
          <>
            {NAV_LINKS.map(l => (
              <Link key={l.href} href={l.href} className={isActive(l.href) ? 'active' : ''} onClick={close}>
                {l.label}
              </Link>
            ))}
            {user.role === 'admin' && (
              <Link href="/admin" className={pathname === '/admin' ? 'active' : ''} onClick={close}>{t.admin}</Link>
            )}
            <span style={{fontSize:'0.85rem',color:'var(--text-muted)',whiteSpace:'nowrap'}}>{user.name}</span>
            <button className="btn-nav" onClick={logout}>{t.logout}</button>
          </>
        ) : (
          <Link href="/login" onClick={close}>{t.login}</Link>
        )}
      </div>

      {/* Theme toggle + font size + lang toggle + hamburger — always on the right */}
      <div className="nav-right">
        <button onClick={toggleTheme} className="theme-toggle" title={dark ? 'Kunduzgi rejim' : 'Tungi rejim'}>
          {dark ? '☀' : '☾'}
        </button>
        <button onClick={() => changeFont(-1)} className="theme-toggle" title="Shriftni kichiklashtirish"
          disabled={fontSize <= 14}
          style={{fontWeight:700, fontSize:'0.85rem', opacity: fontSize <= 14 ? 0.4 : 1}}>
          A−
        </button>
        <button onClick={() => changeFont(+1)} className="theme-toggle" title="Shriftni kattallashtirish"
          disabled={fontSize >= 20}
          style={{fontWeight:700, fontSize:'0.95rem', opacity: fontSize >= 20 ? 0.4 : 1}}>
          A+
        </button>
        <button onClick={() => setLang(lang === 'uz' ? 'uz_cryl' : 'uz')}
          className="theme-toggle"
          title={lang === 'uz' ? "Кирилга ўтиш" : "Lotinga o'tish"}
          style={{fontWeight:700, fontSize:'0.8rem', letterSpacing:'0.03em'}}>
          {lang === 'uz' ? 'КР' : 'UZ'}
        </button>
        <button
          className="hamburger"
          onClick={() => setMenuOpen(v => !v)}
          aria-label="Menyu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>
    </nav>
  );
}
