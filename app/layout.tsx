import type { Metadata } from 'next'
import './animations.css'
import './globals.css'
import ThemeProvider from '@/components/ThemeProvider'
import { MenuProvider } from '@/components/MobileMenu'
import MobileMenu from '@/components/MobileMenu'
import dynamicImport from 'next/dynamic'
import FacebookPixelScript from '@/components/FacebookPixelScript'
import StructuredData from '@/components/StructuredData'

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
  title: {
    default: 'PleniPay - Sistema de Controle Financeiro Pessoal | plenipay.com',
    template: '%s | PleniPay',
  },
  description: 'PleniPay é o sistema completo de controle financeiro pessoal. Gerencie receitas, despesas, dívidas e metas financeiras de forma simples e eficiente. PleniPay - A melhor plataforma de gestão financeira do Brasil. Acesse plenipay.com e comece grátis hoje mesmo.',
  keywords: ['controle financeiro', 'gestão financeira', 'organização financeira', 'controle de gastos', 'finanças pessoais', 'dívidas', 'receitas', 'despesas', 'plenipay'],
  authors: [{ name: 'PleniPay' }],
  creator: 'PleniPay',
  publisher: 'PleniPay',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://plenipay.com'),
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: [
      { url: '/app_icon.png', type: 'image/png', sizes: 'any' },
      { url: '/app_icon.png', type: 'image/png', sizes: '192x192' },
      { url: '/app_icon.png', type: 'image/png', sizes: '64x64' },
      { url: '/app_icon.png', type: 'image/png', sizes: '32x32' },
      { url: '/app_icon.png', type: 'image/png', sizes: '16x16' },
    ],
    apple: [
      { url: '/app_icon.png', type: 'image/png', sizes: '180x180' },
    ],
    shortcut: '/app_icon.png',
  },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://plenipay.com',
    siteName: 'PLENIPAY',
    title: 'PLENIPAY - Sistema de Controle Financeiro Pessoal',
    description: 'Controle suas finanças pessoais de forma simples e eficiente. Gerencie receitas, despesas, dívidas e metas financeiras com a PleniPay.',
    images: [
      {
        url: '/app_icon.png',
        width: 1200,
        height: 630,
        alt: 'PLENIPAY - Sistema de Controle Financeiro',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PLENIPAY - Sistema de Controle Financeiro Pessoal',
    description: 'Controle suas finanças pessoais de forma simples e eficiente. Gerencie receitas, despesas, dívidas e metas financeiras.',
    images: ['/app_icon.png'],
    creator: '@plenipay',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Adicione aqui quando tiver verificação do Google Search Console
    // google: 'seu-codigo-de-verificacao',
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
        <link rel="preconnect" href="https://connect.facebook.net" />
        {/* Preload de recursos críticos */}
        <link rel="preload" href="/app_icon.png" as="image" />
        {/* Favicon adicional para melhor compatibilidade */}
        <link rel="icon" type="image/png" sizes="32x32" href="/app_icon.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/app_icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/app_icon.png" />
        {/* Facebook Pixel - Injetado server-side para detecção imediata */}
        <FacebookPixelScript />
        {/* Dados estruturados para SEO */}
        <StructuredData />
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

