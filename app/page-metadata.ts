import type { Metadata } from 'next'

/**
 * Metadados específicos para a página inicial (landing page)
 * Isso garante que o Google encontre informações completas sobre o site
 */
export const metadata: Metadata = {
  title: 'PLENIPAY - Controle Financeiro Pessoal | Sistema de Gestão Financeira',
  description: 'Controle suas finanças pessoais de forma simples e eficiente. Gerencie receitas, despesas, dívidas e metas financeiras com a PleniPay. Comece grátis hoje mesmo!',
  keywords: [
    'controle financeiro',
    'gestão financeira pessoal',
    'organização financeira',
    'controle de gastos',
    'finanças pessoais',
    'gerenciador financeiro',
    'app controle financeiro',
    'sistema financeiro',
    'dívidas',
    'receitas',
    'despesas',
    'metas financeiras',
    'plenipay',
    'plenipay.com',
  ],
  openGraph: {
    title: 'PLENIPAY - Controle Financeiro Pessoal',
    description: 'Controle suas finanças pessoais de forma simples e eficiente. Gerencie receitas, despesas, dívidas e metas financeiras com a PleniPay.',
    url: 'https://plenipay.com',
    siteName: 'PLENIPAY',
    images: [
      {
        url: '/app_icon.png',
        width: 1200,
        height: 630,
        alt: 'PLENIPAY - Sistema de Controle Financeiro',
      },
    ],
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PLENIPAY - Controle Financeiro Pessoal',
    description: 'Controle suas finanças pessoais de forma simples e eficiente.',
    images: ['/app_icon.png'],
  },
  alternates: {
    canonical: 'https://plenipay.com',
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
}

