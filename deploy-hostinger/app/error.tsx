'use client'

/**
 * Boundary de erro: usa apenas estilos inline para não depender de CSS.
 * Evita "Missing required error components" quando o layout raiz falha.
 */
export default function Error({
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
            marginBottom: 16,
          }}
        >
          Algo deu errado!
        </h2>
        <p
          style={{
            color: '#64748b',
            marginBottom: 24,
            fontSize: 14,
          }}
        >
          {error?.message || 'Ocorreu um erro inesperado'}
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
