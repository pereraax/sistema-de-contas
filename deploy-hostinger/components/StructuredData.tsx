/**
 * Componente Server-Side para adicionar dados estruturados (JSON-LD) para SEO
 * Isso ajuda o Google a entender melhor o conteúdo do site
 * Otimizado: cache do baseUrl para evitar recálculo
 */
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://plenipay.com'

export default function StructuredData() {

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'PleniPay',
    alternateName: ['PLENIPAY', 'Pleni Pay', 'plenipay.com'],
    applicationCategory: 'FinanceApplication',
    applicationSubCategory: 'PersonalFinanceManagement',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'BRL',
      availability: 'https://schema.org/InStock',
    },
    description: 'PleniPay é um sistema completo de controle financeiro pessoal. Gerencie receitas, despesas, dívidas e metas financeiras de forma simples e eficiente. PleniPay - A melhor plataforma de gestão financeira pessoal do Brasil.',
    url: baseUrl,
    logo: `${baseUrl}/app_icon.png`,
    screenshot: `${baseUrl}/app_icon.png`,
    author: {
      '@type': 'Organization',
      name: 'PleniPay',
      url: baseUrl,
      logo: `${baseUrl}/app_icon.png`,
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '150',
      bestRating: '5',
      worstRating: '1',
    },
    featureList: [
      'Controle de receitas e despesas',
      'Gestão de dívidas',
      'Metas financeiras',
      'Relatórios e gráficos',
      'Assistente virtual via WhatsApp',
      'Lembretes automáticos',
    ],
    keywords: 'PleniPay, controle financeiro, gestão financeira, finanças pessoais, plenipay.com',
  }

  const organizationBrandSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'PleniPay',
    alternateName: ['PLENIPAY', 'Pleni Pay'],
    url: baseUrl,
    logo: `${baseUrl}/app_icon.png`,
    description: 'PleniPay - Sistema de controle financeiro pessoal. Gerencie suas finanças de forma simples e eficiente.',
    sameAs: [
      // Adicione aqui links de redes sociais quando tiver
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      availableLanguage: 'Portuguese',
    },
  }

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'PleniPay',
    alternateName: ['PLENIPAY', 'Pleni Pay', 'plenipay.com'],
    url: baseUrl,
    description: 'PleniPay - Sistema completo de controle financeiro pessoal. Gerencie receitas, despesas, dívidas e metas financeiras.',
    inLanguage: 'pt-BR',
    publisher: {
      '@type': 'Organization',
      name: 'PleniPay',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/app_icon.png`,
      },
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationBrandSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
    </>
  )
}

