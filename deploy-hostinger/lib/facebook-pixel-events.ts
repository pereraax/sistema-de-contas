/**
 * Helper para rastrear eventos customizados do Facebook Pixel
 * 
 * Exemplos de uso:
 * - trackEvent('CompleteRegistration') - quando usuário se cadastra
 * - trackEvent('Lead') - quando usuário preenche formulário
 * - trackEvent('Purchase', { value: 100, currency: 'BRL' }) - quando há compra
 */

declare global {
  interface Window {
    fbq?: any
  }
}

export type FacebookPixelEvent =
  | 'PageView'
  | 'ViewContent'
  | 'Search'
  | 'AddToCart'
  | 'InitiateCheckout'
  | 'AddPaymentInfo'
  | 'Purchase'
  | 'Lead'
  | 'CompleteRegistration'
  | 'Contact'
  | 'CustomizeProduct'
  | 'Donate'
  | 'FindLocation'
  | 'Schedule'
  | 'StartTrial'
  | 'SubmitApplication'
  | 'Subscribe'

export interface FacebookPixelEventParams {
  value?: number
  currency?: string
  content_name?: string
  content_category?: string
  content_ids?: string[]
  contents?: Array<{ id: string; quantity: number }>
  [key: string]: any
}

/**
 * Rastrear um evento do Facebook Pixel
 * 
 * @param eventName - Nome do evento (ex: 'CompleteRegistration', 'Purchase')
 * @param params - Parâmetros opcionais do evento (ex: { value: 100, currency: 'BRL' })
 * 
 * @example
 * // Rastrear cadastro
 * trackFacebookPixelEvent('CompleteRegistration')
 * 
 * @example
 * // Rastrear compra
 * trackFacebookPixelEvent('Purchase', { value: 199.90, currency: 'BRL' })
 */
export function trackFacebookPixelEvent(
  eventName: FacebookPixelEvent,
  params?: FacebookPixelEventParams
): void {
  // Só executa no cliente
  if (typeof window === 'undefined') {
    return
  }

  // Verificar se fbq está disponível
  if (!window.fbq) {
    console.warn(`⚠️ [Facebook Pixel] fbq não está disponível. Evento "${eventName}" não foi rastreado.`)
    return
  }

  try {
    if (params) {
      window.fbq('track', eventName, params)
      console.log(`✅ [Facebook Pixel] Evento rastreado: ${eventName}`, params)
    } else {
      window.fbq('track', eventName)
      console.log(`✅ [Facebook Pixel] Evento rastreado: ${eventName}`)
    }
  } catch (error) {
    console.error(`❌ [Facebook Pixel] Erro ao rastrear evento "${eventName}":`, error)
  }
}

/**
 * Rastrear evento de cadastro completo
 */
export function trackRegistration(): void {
  trackFacebookPixelEvent('CompleteRegistration')
}

/**
 * Rastrear evento de lead (formulário preenchido)
 */
export function trackLead(params?: { content_name?: string }): void {
  trackFacebookPixelEvent('Lead', params)
}

/**
 * Rastrear evento de compra
 */
export function trackPurchase(params: { value: number; currency?: string; content_name?: string }): void {
  trackFacebookPixelEvent('Purchase', {
    value: params.value,
    currency: params.currency || 'BRL',
    content_name: params.content_name,
  })
}

/**
 * Rastrear evento de visualização de conteúdo
 */
export function trackViewContent(params?: { content_name?: string; content_category?: string }): void {
  trackFacebookPixelEvent('ViewContent', params)
}

