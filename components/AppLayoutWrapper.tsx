'use client'

import { useAppPlatform } from '@/components/AppPlatformProvider'

/**
 * No modo app (Capacitor), envolve o conteúdo em um container clean (app-shell)
 * com largura máxima, padding e estilos do tema app. No site normal não altera nada.
 */
export default function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  const isApp = useAppPlatform()

  if (isApp) {
    return <div className="app-shell">{children}</div>
  }

  return <>{children}</>
}
