'use client';

// Butun sayt bo'ylab bir xil, zamonaviy yuklanish ko'rsatkichi.
// Navbar bilan birga to'liq ekranli markazlashgan spinner ko'rsatadi.
export default function Loading({ label, full = true }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        minHeight: full ? '60vh' : 'auto',
        padding: '2rem 1rem',
      }}
    >
      <span className="app-spinner" />
      {label && (
        <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 500 }}>
          {label}
        </span>
      )}
      <style>{`
        .app-spinner {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 4px solid var(--border);
          border-top-color: var(--primary);
          animation: app-spin 0.7s linear infinite;
        }
        @keyframes app-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
