import type { Metadata } from 'next'
import './animations.css'
import './globals.css'
import ThemeProvider from '@/components/ThemeProvider'
import { MenuProvider } from '@/components/MobileMenu'
import MobileMenu from '@/components/MobileMenu'
import dynamicImport from 'next/dynamic'

// Lazy load componentes pesados para melhorar performance inicial
const ChatWidget = dynamicImport(() => import('@/components/ChatWidget'), {
  ssr: false,
  loading: () => null,
})

const PlenAssistant = dynamicImport(() => import('@/components/PlenAssistant'), {
  ssr: false,
  loading: () => null,
})

const VisitorTrackingWrapper = dynamicImport(() => import('@/components/VisitorTrackingWrapper'), {
  ssr: false,
  loading: () => null,
})

const NotificationPopup = dynamicImport(() => import('@/components/NotificationPopup'), {
  ssr: false,
  loading: () => null,
})

const FacebookPixelWrapper = dynamicImport(() => import('@/components/FacebookPixelWrapper'), {
  ssr: false,
  loading: () => null,
})

// Forçar renderização dinâmica no layout para evitar prerendering
// Isso ajuda a evitar erros de Context durante o build
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export const metadata: Metadata = {
  title: 'PLENIPAY - Sistema de Contas - Controle Financeiro',
  description: 'Sistema completo de controle financeiro pessoal e de dívidas',
  icons: {
    icon: [
      { url: '/app_icon.png', type: 'image/png', sizes: 'any' },
      { url: '/app_icon.png', type: 'image/png', sizes: '64x64' },
      { url: '/app_icon.png', type: 'image/png', sizes: '32x32' },
      { url: '/app_icon.png', type: 'image/png', sizes: '16x16' },
    ],
    apple: [
      { url: '/app_icon.png', type: 'image/png', sizes: '180x180' },
    ],
    shortcut: '/app_icon.png',
  },
  // Otimizações de performance
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://plenipay.com'),
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'PLENIPAY',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* Preconnect para APIs externas */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        {/* Preload de recursos críticos */}
        <link rel="preload" href="/app_icon.png" as="image" />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <MenuProvider>
            <VisitorTrackingWrapper />
            {children}
            <MobileMenu />
            <ChatWidget />
            <PlenAssistant />
            <NotificationPopup />
            <FacebookPixelWrapper />
          </MenuProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

