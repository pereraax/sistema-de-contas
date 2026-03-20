import { NextResponse } from 'next/server'
import { getResolvedAsaasApiUrl } from '@/lib/asaas'

export const dynamic = 'force-dynamic'

/**
 * Diagnóstico rápido: chave + URL (sem expor a chave).
 * GET /api/pagamento/asaas-health
 */
export async function GET() {
  const rawKey = process.env.ASAAS_API_KEY?.trim() || ''
  const configuredUrl = (process.env.ASAAS_API_URL || '').trim()

  const keyLooksSandbox = /_hmlg_/i.test(rawKey)
  const keyLooksProduction = /_prod_/i.test(rawKey)

  const resolvedUrl = getResolvedAsaasApiUrl()

  const urlMismatchFixed =
    keyLooksSandbox &&
    /api\.asaas\.com/i.test(configuredUrl) &&
    !/api-sandbox/i.test(configuredUrl)

  const body = {
    ok: Boolean(rawKey),
    hasApiKey: Boolean(rawKey),
    keyHint: rawKey
      ? keyLooksSandbox
        ? 'sandbox (hmlg)'
        : keyLooksProduction
          ? 'production (prod)'
          : 'desconhecido — confira no painel Asaas'
      : 'AUSENTE — defina ASAAS_API_KEY',
    configuredUrl: configuredUrl || '(não definido — usa padrão sandbox no código)',
    resolvedApiBaseUrl: resolvedUrl,
    runtimeNote: urlMismatchFixed
      ? 'Chave hmlg com URL de produção: o app força api-sandbox no servidor. Ajuste ASAAS_API_URL no .env para evitar confusão.'
      : null,
    doc: 'docs/CHECKOUT-PIX-ASAAS-SIMPLES.md',
  }

  return NextResponse.json(body, { status: rawKey ? 200 : 503 })
}
