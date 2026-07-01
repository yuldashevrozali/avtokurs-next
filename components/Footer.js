import Link from 'next/link';

export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border)',
      background: 'var(--surface)',
      padding: '1.25rem 1rem',
      marginTop: '3rem',
      textAlign: 'center',
    }}>
      <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '0.5rem 1.5rem' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          © {new Date().getFullYear()} Avtotest
        </span>
        <Link href="/privacy-policy"
          style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'none' }}
          prefetch={false}>
          Maxfiylik siyosati
        </Link>
        <a href="mailto:yuldashevrozalibek1@gmail.com"
          style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
          Bog'lanish
        </a>
      </div>
    </footer>
  );
}
