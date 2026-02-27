'use client'

import Link from 'next/link'

/**
 * Boundary de erro da rota /cadastro: evita página branca e oferece voltar ou tentar de novo.
 */
export default function CadastroError({
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
        background: 'linear-gradient(135deg, #00C2FF 0%, #0099CC 50%, #007A99 100%)',
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
          borderRadius: 16,
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.2)',
          padding: 28,
          border: 'none',
        }}
      >
        <h2
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: '#0D1B2A',
            marginBottom: 12,
          }}
        >
          Erro ao carregar o cadastro
        </h2>
        <p
          style={{
            color: '#64748b',
            marginBottom: 24,
            fontSize: 14,
            lineHeight: 1.5,
          }}
        >
          Algo deu errado. Tente novamente ou volte e acesse pelo botão &quot;Criar conta&quot;.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            type="button"
            onClick={reset}
            style={{
              width: '100%',
              padding: 14,
              background: '#00C2FF',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: 15,
            }}
          >
            Tentar novamente
          </button>
          <Link
            href="/"
            style={{
              display: 'block',
              textAlign: 'center',
              padding: 12,
              color: '#00C2FF',
              fontWeight: 500,
              fontSize: 14,
            }}
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  )
}
