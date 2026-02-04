/**
 * Loading na raiz: primeiro paint para evitar tela branca.
 * Estilos inline para não depender de CSS.
 */
export default function RootLoading() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          border: '3px solid #e2e8f0',
          borderTopColor: '#1e4976',
          borderRadius: '50%',
          animation: 'root-loading-spin 0.8s linear infinite',
        }}
      />
      <style
        dangerouslySetInnerHTML={{
          __html: `@keyframes root-loading-spin { to { transform: rotate(360deg); } }`,
        }}
      />
    </div>
  )
}
