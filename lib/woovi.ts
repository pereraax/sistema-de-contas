const WOOVI_API_BASE = 'https://api.openpix.com.br/api/openpix/v1'

function getWooviAppId(): string {
  const appId = process.env.WOOVI_APP_ID?.trim()
  if (!appId) {
    throw new Error('WOOVI_APP_ID não está configurada no ambiente.')
  }
  return appId
}

export type WooviCharge = {
  status?: string
  identifier?: string
  correlationID?: string
  value?: number
  brCode?: string
  qrCodeImage?: string
  paymentLinkUrl?: string
  customer?: { name?: string; email?: string; phone?: string; taxID?: string }
  paidAt?: string
}

export async function wooviCreateCharge(params: {
  correlationID: string
  valueInCents: number
  comment: string
  customer: { name: string; email: string; phone?: string; taxID?: string }
}): Promise<WooviCharge> {
  const appId = getWooviAppId()
  const res = await fetch(`${WOOVI_API_BASE}/charge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: appId,
    },
    body: JSON.stringify({
      correlationID: params.correlationID,
      value: String(params.valueInCents),
      comment: params.comment,
      customer: {
        name: params.customer.name,
        email: params.customer.email,
        ...(params.customer.phone ? { phone: params.customer.phone } : {}),
        ...(params.customer.taxID ? { taxID: params.customer.taxID } : {}),
      },
    }),
  })
  const text = await res.text()
  let json: any = {}
  try {
    json = JSON.parse(text)
  } catch {
    // ignore
  }
  if (!res.ok) {
    throw new Error(json?.error?.message || json?.message || `Erro Woovi createCharge (${res.status})`)
  }
  return json?.charge || json
}

export async function wooviGetCharge(identifier: string): Promise<WooviCharge> {
  const appId = getWooviAppId()
  const res = await fetch(`${WOOVI_API_BASE}/charge/${encodeURIComponent(identifier)}`, {
    headers: { Authorization: appId },
  })
  const text = await res.text()
  let json: any = {}
  try {
    json = JSON.parse(text)
  } catch {
    // ignore
  }
  if (!res.ok) {
    throw new Error(json?.error?.message || json?.message || `Erro Woovi getCharge (${res.status})`)
  }
  return json?.charge || json
}

