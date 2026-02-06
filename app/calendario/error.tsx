'use client'

/**
 * Boundary de erro da rota /calendario.
 * Evita tela branca e 500; mostra mensagem e botão para tentar de novo.
 */
export default function CalendarioError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        style={{
          maxWidth: 420,
          width: '100%',
          background: 'var(--bg-brand-clean, #fff)',
          borderRadius: 12,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          padding: 24,
          border: '1px solid #e2e8f0',
        }}
      >
        <h2
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: 'var(--text-brand-midnight, #0D1B2A)',
            marginBottom: 12,
          }}
        >
          Erro ao carregar o calendário
        </h2>
        <p
          style={{
            color: '#64748b',
            marginBottom: 20,
            fontSize: 14,
          }}
        >
          {error?.message || 'Não foi possível carregar os dados. Tente novamente.'}
        </p>
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
      </div>
    </div>
  )
}
