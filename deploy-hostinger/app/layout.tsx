import type { Metadata } from 'next'
import './critical.css'
import './animations.css'
import './globals.css'
import ThemeProvider from '@/components/ThemeProvider'
import { MenuProvider } from '@/components/MobileMenu'
import BottomNavigation from '@/components/BottomNavigation'
import dynamicImport from 'next/dynamic'
import FacebookPixelScript from '@/components/FacebookPixelScript'
import StructuredData from '@/components/StructuredData'

// Lazy load componentes pesados para melhorar performance inicial
// Prioridade: carregar apenas o essencial no primeiro carregamento
const MobileMenu = dynamicImport(() => import('@/components/MobileMenu'), {
  ssr: false,
  loading: () => null,
})

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

// GoogleIndexPing não é crítico - carregar após interação
const GoogleIndexPing = dynamicImport(() => import('@/components/GoogleIndexPing'), {
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
        {/* Tema e estado da sidebar antes da primeira pintura para evitar piscar */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('theme');var d=!(t&&t!=='dark')&&window.matchMedia('(prefers-color-scheme: dark)').matches;if(t==='dark'||(!t&&d))document.documentElement.classList.add('dark');else document.documentElement.classList.remove('dark');var s=localStorage.getItem('sidebar-collapsed');document.documentElement.setAttribute('data-sidebar',s==='true'?'collapsed':'expanded');})();`,
          }}
        />
        {/* Preconnect para APIs externas - CRÍTICO para performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://connect.facebook.net" />
        <link rel="dns-prefetch" href="https://www.google.com" />
        {/* Preconnect para Supabase (crítico para autenticação) */}
        {process.env.NEXT_PUBLIC_SUPABASE_URL && (
          <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} crossOrigin="anonymous" />
        )}
        {/* Preload de recursos críticos - apenas o essencial */}
        <link rel="preload" href="/app_icon.png" as="image" type="image/png" />
        {/* Favicon adicional para melhor compatibilidade */}
        <link rel="icon" type="image/png" sizes="32x32" href="/app_icon.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/app_icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/app_icon.png" />
        {/* Facebook Pixel - Injetado server-side para detecção imediata */}
        <FacebookPixelScript />
        {/* Dados estruturados para SEO */}
        <StructuredData />
      </head>
      <body
        suppressHydrationWarning
        className="loaded"
        style={{
          margin: 0,
          backgroundColor: '#ffffff',
          color: '#0D1B2A',
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          minHeight: '100vh',
        }}
      >
        <ThemeProvider>
          <MenuProvider>
            {/* Componentes não críticos - carregar após interação */}
            <VisitorTrackingWrapper />
            <GoogleIndexPing />
            {/* Conteúdo principal - prioridade máxima */}
            {children}
            {/* Componentes de UI - carregar após conteúdo */}
            <MobileMenu />
            <BottomNavigation />
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

