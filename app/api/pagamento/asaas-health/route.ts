import { NextResponse } from 'next/server'
import { getAsaasApiKey, getResolvedAsaasApiUrl } from '@/lib/asaas'

export const dynamic = 'force-dynamic'

/**
 * Diagnóstico rápido: chave + URL (sem expor a chave).
 * Usa a mesma leitura de chave que lib/asaas (.env + fallback .env.local).
 * GET /api/pagamento/asaas-health
 */
export async function GET() {
  const rawKey = getAsaasApiKey().trim()
  const configuredUrl = (process.env.ASAAS_API_URL || '').trim()

  const keyLooksSandbox = /_hmlg_/i.test(rawKey)
  const keyLooksProduction = /_prod_/i.test(rawKey)

  const resolvedUrl = getResolvedAsaasApiUrl()

  const hmlgComUrlProd =
    keyLooksSandbox &&
    /api\.asaas\.com/i.test(configuredUrl) &&
    !/api-sandbox/i.test(configuredUrl)

  const body = {
    ok: Boolean(rawKey),
    hasApiKey: Boolean(rawKey),
    keyHint: rawKey
      ? keyLooksSandbox
        ? 'sandbox (hmlg) — não gera PIX real no banco'
        : keyLooksProduction
          ? 'production (prod) — adequado para PIX real'
          : 'desconhecido — confira no painel Asaas'
      : 'AUSENTE — defina ASAAS_API_KEY',
    configuredUrl: configuredUrl || '(não definido — padrão: API produção)',
    resolvedApiBaseUrl: resolvedUrl,
    pixRealNoBanco:
      keyLooksProduction &&
      /api\.asaas\.com/i.test(resolvedUrl) &&
      !/api-sandbox/i.test(resolvedUrl),
    runtimeNote: hmlgComUrlProd
      ? 'Chave hmlg com URL de produção: troque ASAAS_API_KEY por uma chave $aact_prod_ (painel Asaas produção) ou use sandbox explícito: ASAAS_USE_SANDBOX=true e api-sandbox.'
      : null,
    doc: 'docs/ASAAS-PRODUCAO-PIX.md',
  }

  return NextResponse.json(body, { status: rawKey ? 200 : 503 })
}
