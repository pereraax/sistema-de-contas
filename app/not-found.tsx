'use client'

export const dynamic = 'force-dynamic'

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        background: '#f8fafc',
        color: '#0D1B2A',
      }}
    >
      <div
        style={{
          maxWidth: 420,
          width: '100%',
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          padding: 24,
          border: '1px solid #e2e8f0',
          textAlign: 'center',
        }}
      >
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>
          Página não encontrada
        </h2>
        <p style={{ color: '#64748b', marginBottom: 24, fontSize: 14 }}>
          A página que você está procurando não existe.
        </p>
        <a
          href="/home"
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            background: '#1e4976',
            color: '#fff',
            borderRadius: 8,
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Voltar para Home
        </a>
      </div>
    </div>
  )
}

















