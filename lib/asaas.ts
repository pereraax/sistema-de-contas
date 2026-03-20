// lib/asaas.ts
// Utilitários para integração com Asaas

import {
  normalizePixCopyPaste,
  normalizePixEncodedImage,
  isLikelyValidBrPixPayload,
} from '@/lib/pagamento/pix-helpers'

// IMPORTANTE: Em produção (Railway), as variáveis vêm de process.env (não de .env.local)
// Ler apenas de process.env para evitar erros durante o build
//
// No .env, valores que começam com $ PRECISAM de aspas (senão o loader interpreta como variável):
//   ASAAS_API_KEY="$aact_hmlg_..."
export function getAsaasApiKey(): string {
  let apiKey = process.env.ASAAS_API_KEY

  // No ambiente de produção (Railway, etc.), não tentar ler .env.local
  // pois ele não existe lá - as variáveis estão em process.env
  const isProduction = process.env.NODE_ENV === 'production' || process.env.RAILWAY || process.env.RENDER
  if (!apiKey && !isProduction) {
    try {
      const fs = require('fs')
      const path = require('path')
      const envPath = path.join(process.cwd(), '.env.local')
      const envContent = fs.readFileSync(envPath, 'utf8')
      const match = envContent.match(/^ASAAS_API_KEY=(.*)$/m)
      if (match) {
        let v = match[1].trim()
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
          v = v.slice(1, -1)
        }
        apiKey = v
        console.log('✅ [lib/asaas] API Key carregada diretamente do arquivo .env.local')
      }
    } catch (fileError: any) {
      // Ignorar erro em produção - arquivo não existe
      // Em desenvolvimento, apenas logar se não for erro de arquivo não encontrado
      if (!isProduction && fileError.code !== 'ENOENT') {
        console.error('❌ [lib/asaas] Erro ao ler .env.local:', fileError.message)
      }
    }
  }

  // Não lançar erro durante o build - apenas retornar vazio
  // O erro será lançado em runtime quando tentar usar
  return apiKey || ''
}

// Não executar no top-level durante o build
// A função será chamada apenas quando necessário (runtime)
let cachedApiKey: string | null = null

function getAsaasApiKeyLazy(): string {
  if (cachedApiKey === null) {
    cachedApiKey = getAsaasApiKey()
    if (!cachedApiKey) {
      throw new Error('ASAAS_API_KEY não está configurada. Configure a variável de ambiente ASAAS_API_KEY no Railway.')
    }
  }
  return cachedApiKey
}

/** Sandbox e produção oficiais (docs Asaas). */
const DEFAULT_ASAAS_SANDBOX = 'https://api-sandbox.asaas.com/v3'
const DEFAULT_ASAAS_PRODUCTION = 'https://api.asaas.com/v3'

/**
 * Padrão: **produção** (PIX real no banco). Sandbox só se `ASAAS_API_URL` apontar para api-sandbox
 * ou `ASAAS_USE_SANDBOX=true` (homologação explícita).
 *
 * Chaves: `$aact_prod_*` = produção | `$aact_hmlg_*` = homologação (não paga PIX “de verdade” no app do banco).
 */
function computeResolvedAsaasApiUrl(): string {
  const configured = (process.env.ASAAS_API_URL || '').trim()
  const forceSandbox = process.env.ASAAS_USE_SANDBOX === 'true' || process.env.ASAAS_USE_SANDBOX === '1'
  const fallback = forceSandbox
    ? DEFAULT_ASAAS_SANDBOX
    : configured || DEFAULT_ASAAS_PRODUCTION

  const apiKey = getAsaasApiKey()
  const isSandboxKey = /_hmlg_/i.test(apiKey)
  const isProdKey = /_prod_/i.test(apiKey)

  const urlIsProduction =
    /api\.asaas\.com/i.test(configured) && !/api-sandbox/i.test(configured)
  const urlIsSandbox = /api-sandbox\.asaas\.com/i.test(configured)

  // Só corrige mistura óbvia: chave prod com URL sandbox → produção
  if (isProdKey && (urlIsSandbox || forceSandbox)) {
    console.warn('[lib/asaas] Chave produção com URL/indicador sandbox — usando API de produção:', DEFAULT_ASAAS_PRODUCTION)
    return DEFAULT_ASAAS_PRODUCTION
  }

  // hmlg + URL produção: NÃO forçamos sandbox (você pediu PIX real). A API pode retornar 401 até trocar a chave.
  if (isSandboxKey && urlIsProduction) {
    console.error(
      '[lib/asaas] Chave de homologação (hmlg) com URL de produção — troque por $aact_prod_ no painel Asaas (produção) para PIX real, ou defina ASAAS_USE_SANDBOX=true e ASAAS_API_URL=https://api-sandbox.asaas.com/v3 só para testes.'
    )
  }

  return fallback
}

let asaasResolvedBaseUrl: string | null = null

export function getResolvedAsaasApiUrl(): string {
  if (asaasResolvedBaseUrl === null) {
    asaasResolvedBaseUrl = computeResolvedAsaasApiUrl()
  }
  return asaasResolvedBaseUrl
}

function looksLikeSandboxKey(apiKey: string): boolean {
  return /_hmlg_/i.test(apiKey)
}

function looksLikeProductionKey(apiKey: string): boolean {
  return /_prod_/i.test(apiKey)
}

/**
 * Se a chave é de homologação (hmlg), mas a URL resolvida está apontando para
 * produção (`api.asaas.com`), isso normalmente NÃO gera PIX "real" no app do banco.
 *
 * A gente não "força sandbox" automaticamente porque você pediu PIX real.
 * Em vez disso, falha com mensagem clara para corrigir o ambiente.
 */
export function isAsaasSandboxKeyWithProductionUrl(): boolean {
  const apiKey = getAsaasApiKey().trim()
  const resolvedUrl = getResolvedAsaasApiUrl()
  const urlIsProduction = /api\.asaas\.com/i.test(resolvedUrl) && !/api-sandbox/i.test(resolvedUrl)
  return looksLikeSandboxKey(apiKey) && urlIsProduction
}

export function assertAsaasPixRealEnvironmentConfigured(): void {
  if (isAsaasSandboxKeyWithProductionUrl()) {
    const resolvedUrl = getResolvedAsaasApiUrl()
    const apiKey = getAsaasApiKey().trim()
    const keyType = looksLikeSandboxKey(apiKey)
      ? 'homologação (hmlg)'
      : looksLikeProductionKey(apiKey)
        ? 'produção (prod)'
        : 'desconhecida'

    throw new Error(
      `[lib/asaas] PIX real está configurado de forma inconsistente: chave ${keyType} com URL de produção (${resolvedUrl}). ` +
        `Troque ASAAS_API_KEY por uma chave $aact_prod_... (Asaas PRODUÇÃO) ou, se for apenas teste, ` +
        `defina ASAAS_USE_SANDBOX=true + ASAAS_API_URL=https://api-sandbox.asaas.com/v3 e use a chave $aact_hmlg_... .`
    )
  }
}

export interface AsaasCustomer {
  name: string
  email: string
  cpfCnpj?: string
  phone?: string
  externalReference?: string
}

export interface AsaasSubscription {
  customer: string // ID do customer
  billingType: 'PIX' | 'BOLETO' | 'CREDIT_CARD' | 'DEBIT_CARD'
  value: number
  nextDueDate: string // YYYY-MM-DD
  cycle: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY'
  description: string
  externalReference?: string
}

export interface AsaasResponse {
  id: string
  customer: string
  value: number
  nextDueDate: string
  cycle: string
  description: string
  invoiceUrl?: string
  [key: string]: any
}

/**
 * Criar um customer no Asaas
 */
export async function criarCustomerAsaas(customer: AsaasCustomer): Promise<AsaasResponse> {
  const apiKey = getAsaasApiKeyLazy()
  
  console.log('📝 [lib/asaas] Criando customer no Asaas:', {
    name: customer.name,
    email: customer.email,
    hasCpf: !!customer.cpfCnpj,
    cpfLength: customer.cpfCnpj?.length || 0,
    apiUrl: getResolvedAsaasApiUrl(),
    apiKeyLength: apiKey.length,
    apiKeyPrefix: apiKey.substring(0, 20) + '...',
  })
  
  const response = await fetch(`${getResolvedAsaasApiUrl()}/customers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'access_token': apiKey,
    },
    body: JSON.stringify(customer),
  })
  
  console.log('📡 [lib/asaas] Resposta do Asaas:', {
    status: response.status,
    ok: response.ok,
    statusText: response.statusText,
    headers: Object.fromEntries(response.headers.entries()),
  })

  if (!response.ok) {
    // Tentar ler a resposta como texto primeiro
    const errorText = await response.text()
    let error: any = {}
    
    try {
      error = JSON.parse(errorText)
    } catch (parseError) {
      // Se não conseguir parsear, usar o texto como erro
      console.error('❌ Erro ao parsear resposta do Asaas:', errorText)
      throw new Error(`Erro ao criar customer: ${response.status} ${response.statusText}. Resposta: ${errorText.substring(0, 200)}`)
    }
    
    throw new Error(error.errors?.[0]?.description || error.message || `Erro ao criar customer: ${response.status} ${response.statusText}`)
  }

  // Verificar se a resposta tem conteúdo antes de tentar parsear
  const responseText = await response.text()
  
  if (!responseText || responseText.trim() === '') {
    console.error('❌ Resposta vazia do Asaas ao criar customer')
    throw new Error('Resposta vazia do Asaas ao criar customer')
  }
  
  try {
    return JSON.parse(responseText)
  } catch (parseError: any) {
    console.error('❌ Erro ao parsear resposta JSON do Asaas:', parseError)
    console.error('❌ Resposta recebida:', responseText.substring(0, 500))
    throw new Error(`Erro ao processar resposta do Asaas: ${parseError.message}`)
  }
}

/**
 * Criar uma assinatura no Asaas
 */
export async function criarAssinaturaAsaas(subscription: AsaasSubscription): Promise<AsaasResponse> {
  const apiKey = getAsaasApiKeyLazy()
  
  const response = await fetch(`${getResolvedAsaasApiUrl()}/subscriptions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'access_token': apiKey,
    },
    body: JSON.stringify(subscription),
  })

  if (!response.ok) {
    // Tentar ler a resposta como texto primeiro
    const errorText = await response.text()
    let error: any = {}
    
    try {
      error = JSON.parse(errorText)
    } catch (parseError) {
      console.error('❌ Erro ao parsear resposta do Asaas:', errorText)
      throw new Error(`Erro ao criar assinatura: ${response.status} ${response.statusText}. Resposta: ${errorText.substring(0, 200)}`)
    }
    
    throw new Error(error.errors?.[0]?.description || error.message || `Erro ao criar assinatura: ${response.status} ${response.statusText}`)
  }

  // Verificar se a resposta tem conteúdo antes de tentar parsear
  const responseText = await response.text()
  
  if (!responseText || responseText.trim() === '') {
    console.error('❌ Resposta vazia do Asaas ao criar assinatura')
    throw new Error('Resposta vazia do Asaas ao criar assinatura')
  }
  
  try {
    return JSON.parse(responseText)
  } catch (parseError: any) {
    console.error('❌ Erro ao parsear resposta JSON do Asaas:', parseError)
    console.error('❌ Resposta recebida:', responseText.substring(0, 500))
    throw new Error(`Erro ao processar resposta do Asaas: ${parseError.message}`)
  }
}

export interface AsaasCobrancaPix {
  customer: string
  value: number
  dueDate: string // YYYY-MM-DD
  description?: string
  externalReference?: string
}

/**
 * Cobrança PIX avulsa (uma vez). QR costuma ser mais compatível com apps de banco
 * do que a 1ª parcela gerada por assinatura (especialmente em sandbox).
 */
export async function criarCobrancaPixAsaas(body: AsaasCobrancaPix): Promise<AsaasResponse> {
  const apiKey = getAsaasApiKeyLazy()

  const response = await fetch(`${getResolvedAsaasApiUrl()}/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      access_token: apiKey,
    },
    body: JSON.stringify({
      customer: body.customer,
      billingType: 'PIX',
      value: body.value,
      dueDate: body.dueDate,
      description: body.description,
      externalReference: body.externalReference,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    let error: any = {}
    try {
      error = JSON.parse(errorText)
    } catch {
      throw new Error(`Erro ao criar cobrança PIX: ${response.status}. ${errorText.slice(0, 200)}`)
    }
    throw new Error(error.errors?.[0]?.description || error.message || 'Erro ao criar cobrança PIX')
  }

  const responseText = await response.text()
  if (!responseText?.trim()) throw new Error('Resposta vazia ao criar cobrança PIX')
  try {
    return JSON.parse(responseText)
  } catch (e: any) {
    throw new Error(`Resposta inválida ao criar cobrança PIX: ${e?.message}`)
  }
}

/**
 * Buscar uma assinatura no Asaas
 */
export async function buscarAssinaturaAsaas(subscriptionId: string): Promise<AsaasResponse> {
  const apiKey = getAsaasApiKeyLazy()
  
  const response = await fetch(`${getResolvedAsaasApiUrl()}/subscriptions/${subscriptionId}`, {
    headers: {
      'access_token': apiKey,
    },
  })

  if (!response.ok) {
    throw new Error('Erro ao buscar assinatura')
  }

  return response.json()
}

/**
 * Cancelar uma assinatura no Asaas
 */
export async function cancelarAssinaturaAsaas(subscriptionId: string): Promise<AsaasResponse> {
  const apiKey = getAsaasApiKeyLazy()
  
  const response = await fetch(`${getResolvedAsaasApiUrl()}/subscriptions/${subscriptionId}`, {
    method: 'DELETE',
    headers: {
      'access_token': apiKey,
    },
  })

  if (!response.ok) {
    throw new Error('Erro ao cancelar assinatura')
  }

  return response.json()
}

/**
 * Buscar um customer no Asaas
 */
export async function buscarCustomerAsaas(customerId: string): Promise<AsaasResponse> {
  const apiKey = getAsaasApiKeyLazy()
  
  const response = await fetch(`${getResolvedAsaasApiUrl()}/customers/${customerId}`, {
    headers: {
      'access_token': apiKey,
    },
  })

  if (!response.ok) {
    throw new Error('Erro ao buscar customer')
  }

  return response.json()
}

/**
 * Atualizar um customer no Asaas
 */
export async function atualizarCustomerAsaas(customerId: string, customer: Partial<AsaasCustomer>): Promise<AsaasResponse> {
  const apiKey = getAsaasApiKeyLazy()
  
  const response = await fetch(`${getResolvedAsaasApiUrl()}/customers/${customerId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'access_token': apiKey,
    },
    body: JSON.stringify(customer),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.errors?.[0]?.description || error.message || 'Erro ao atualizar customer')
  }

  return response.json()
}

/**
 * Buscar pagamentos de uma assinatura no Asaas
 */
export async function buscarPagamentosAssinatura(subscriptionId: string): Promise<any[]> {
  const apiKey = getAsaasApiKeyLazy()
  
  const response = await fetch(`${getResolvedAsaasApiUrl()}/subscriptions/${subscriptionId}/payments`, {
    cache: 'no-store',
    headers: {
      'access_token': apiKey,
    },
  })

  if (!response.ok) {
    throw new Error('Erro ao buscar pagamentos da assinatura')
  }

  const data = await response.json()
  return data.data || []
}

/**
 * Buscar um pagamento específico no Asaas
 */
export async function buscarPagamentoAsaas(paymentId: string): Promise<AsaasResponse> {
  const apiKey = getAsaasApiKeyLazy()
  
  const response = await fetch(`${getResolvedAsaasApiUrl()}/payments/${paymentId}`, {
    cache: 'no-store',
    headers: {
      'access_token': apiKey,
    },
  })

  if (!response.ok) {
    throw new Error('Erro ao buscar pagamento')
  }

  return response.json()
}

/**
 * Status oficial da cobrança (endpoint dedicado — costuma refletir PIX pago antes/atualizado que o objeto completo).
 * GET /v3/payments/{id}/status
 */
export async function buscarStatusPagamentoAsaas(paymentId: string): Promise<{ status?: string }> {
  const apiKey = getAsaasApiKeyLazy()

  const response = await fetch(`${getResolvedAsaasApiUrl()}/payments/${paymentId}/status`, {
    cache: 'no-store',
    headers: {
      access_token: apiKey,
    },
  })

  if (!response.ok) {
    const t = await response.text().catch(() => '')
    throw new Error(`Erro ao buscar status do pagamento: ${response.status} ${t.slice(0, 120)}`)
  }

  return response.json()
}

function extrairPayloadPixQrResponse(raw: Record<string, unknown>): string | undefined {
  const candidates = [
    raw.payload,
    raw.copyAndPaste,
    raw.copyPaste,
    raw.brCode,
    raw.pixCopyPaste,
    raw.emv,
  ]
  for (const c of candidates) {
    if (typeof c === 'string' && c.length > 0) return c
  }
  return undefined
}

async function buscarPixQrCodeUmaVez(
  paymentId: string
): Promise<{ encodedImage?: string; payload?: string; expirationDate?: string; description?: string }> {
  const apiKey = getAsaasApiKeyLazy()

  const response = await fetch(`${getResolvedAsaasApiUrl()}/payments/${paymentId}/pixQrCode`, {
    headers: {
      access_token: apiKey,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('❌ [lib/asaas] Erro ao buscar PIX QR Code:', response.status, errorText)
    throw new Error('Erro ao buscar QR Code PIX')
  }

  const raw = (await response.json()) as Record<string, unknown>
  const payload = extrairPayloadPixQrResponse(raw)
  const encodedImage =
    typeof raw.encodedImage === 'string'
      ? raw.encodedImage
      : typeof raw.qrCodeBase64 === 'string'
        ? raw.qrCodeBase64
        : undefined

  return {
    ...raw,
    encodedImage,
    payload,
    expirationDate: typeof raw.expirationDate === 'string' ? raw.expirationDate : undefined,
    description: typeof raw.description === 'string' ? raw.description : undefined,
  }
}

/**
 * Buscar QR Code PIX de um pagamento.
 * Reintenta quando o Asaas ainda não preencheu o BR Code completo (banco recusa payload curto/inválido).
 */
export async function buscarPixQrCode(paymentId: string): Promise<{
  encodedImage?: string
  payload?: string
  expirationDate?: string
  description?: string
}> {
  const maxAttempts = 22
  const delayMs = 1500
  let last: {
    encodedImage?: string
    payload?: string
    expirationDate?: string
    description?: string
  } = {}

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const raw = await buscarPixQrCodeUmaVez(paymentId)
    const payload = normalizePixCopyPaste(raw.payload)
    const encodedImage = normalizePixEncodedImage(raw.encodedImage)
    last = {
      ...raw,
      payload,
      encodedImage,
    }

    if (payload && isLikelyValidBrPixPayload(payload)) {
      console.log('✅ [lib/asaas] PIX BR Code válido', {
        attempt,
        payloadLen: payload.length,
        hasImage: !!encodedImage,
      })
      return last
    }

    console.warn('⏳ [lib/asaas] PIX ainda sem BR Code completo, aguardando...', {
      attempt,
      paymentId,
      payloadLen: payload?.length ?? 0,
      prefix: payload?.slice(0, 32),
      crcOk: payload ? /6304[0-9A-Fa-f]{4}$/.test(payload) : false,
    })

    if (attempt < maxAttempts) {
      await new Promise((r) => setTimeout(r, delayMs))
    }
  }

  throw new Error(
    'O Asaas ainda não devolveu o PIX completo (código copia-e-cola inválido ou incompleto). ' +
      'Aguarde 1 minuto e tente de novo. Em produção use chave $aact_prod_ e URL https://api.asaas.com/v3. ' +
      'No painel Asaas verifique se Pix está habilitado para a conta.'
  )
}



