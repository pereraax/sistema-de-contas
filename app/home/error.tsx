'use client'

import Link from 'next/link'

/**
 * Boundary de erro da rota /home.
 * Evita tela branca e 500; mostra mensagem e opções para tentar de novo ou ir ao login.
 */
export default function HomeError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
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
        }}
      >
        <h2
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: '#0D1B2A',
            marginBottom: 12,
          }}
        >
          Erro ao carregar a Home
        </h2>
        <p
          style={{
            color: '#64748b',
            marginBottom: 24,
            fontSize: 14,
          }}
        >
          {error?.message || 'Não foi possível carregar os dados. Verifique sua conexão ou faça login novamente.'}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            type="button"
            onClick={reset}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: '#1e4976',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            Tentar novamente
          </button>
          <Link
            href="/login"
            style={{
              display: 'block',
              textAlign: 'center',
              padding: '12px 16px',
              color: '#1e4976',
              fontWeight: 600,
              fontSize: 14,
              textDecoration: 'none',
              border: '1px solid #1e4976',
              borderRadius: 8,
            }}
          >
            Ir para o login
          </Link>
        </div>
      </div>
    </div>
  )
}
