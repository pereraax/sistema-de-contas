/**
 * Componente Server-Side para adicionar dados estruturados (JSON-LD) para SEO
 * Isso ajuda o Google a entender melhor o conteúdo do site
 */
export default async function StructuredData() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://plenipay.com'

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'PLENIPAY',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'BRL',
    },
    description: 'Sistema completo de controle financeiro pessoal. Gerencie receitas, despesas, dívidas e metas financeiras de forma simples e eficiente.',
    url: baseUrl,
    logo: `${baseUrl}/app_icon.png`,
    screenshot: `${baseUrl}/app_icon.png`,
    author: {
      '@type': 'Organization',
      name: 'PleniPay',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '150',
    },
    featureList: [
      'Controle de receitas e despesas',
      'Gestão de dívidas',
      'Metas financeiras',
      'Relatórios e gráficos',
      'Assistente virtual via WhatsApp',
      'Lembretes automáticos',
    ],
  }

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'PLENIPAY',
    url: baseUrl,
    description: 'Sistema completo de controle financeiro pessoal',
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
    </>
  )
}

