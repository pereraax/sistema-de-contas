import type { Metadata } from 'next'
import './animations.css'
import './globals.css'
import ThemeProvider from '@/components/ThemeProvider'
import ChatWidget from '@/components/ChatWidget'
import PlenAssistant from '@/components/PlenAssistant'
import { MenuProvider } from '@/components/MobileMenu'
import MobileMenu from '@/components/MobileMenu'
import VisitorTrackingWrapper from '@/components/VisitorTrackingWrapper'

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
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <MenuProvider>
            <VisitorTrackingWrapper />
            {children}
            <MobileMenu />
            <ChatWidget />
            <PlenAssistant />
          </MenuProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

