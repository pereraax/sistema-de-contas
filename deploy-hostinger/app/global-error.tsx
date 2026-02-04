'use client'

/**
 * Captura erros na raiz da aplicação (layout, etc.)
 * Mostra fallback amigável em vez de 500
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ maxWidth: 420, padding: 24, textAlign: 'center' }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0D1B2A', marginBottom: 16 }}>Algo deu errado</h1>
          <p style={{ color: '#64748b', marginBottom: 24 }}>Ocorreu um erro inesperado. Tente novamente.</p>
          <button
            onClick={() => reset()}
            style={{
              padding: '12px 24px',
              background: '#0D1B2A',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  )
}
