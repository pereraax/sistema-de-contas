// Layout específico para login - sem sidebar e sem verificação
// Renderizar children diretamente para não interferir nos estilos da página
export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

