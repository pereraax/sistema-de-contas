/**
 * Sincroniza contato da extensão CRM (nome, foto) com o backend.
 * Autenticação: Authorization: Bearer {EXTENSION_CRM_API_KEY} ou X-API-Key
 */
import { NextResponse } from 'next/server'
import { getOrCreateContactByPhoneWithFlag, updateContact } from '@/lib/crm/contacts'

const EXTENSION_KEY = process.env.EXTENSION_CRM_API_KEY

function getApiKey(request: Request): string | null {
  const auth = request.headers.get('Authorization')
  if (auth?.startsWith('Bearer ')) return auth.slice(7).trim()
  return request.headers.get('X-API-Key')?.trim() ?? null
}

export async function POST(request: Request) {
  if (!EXTENSION_KEY) {
    return NextResponse.json(
      { success: false, error: 'Extensão não configurada (EXTENSION_CRM_API_KEY)' },
      { status: 503 }
    )
  }
  const key = getApiKey(request)
  if (!key || key !== EXTENSION_KEY) {
    return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
  }

  let body: { phone?: string; name?: string; photo?: string }
  try {
    const raw = await request.text()
    if (!raw?.trim()) {
      return NextResponse.json({ success: false, error: 'Envie JSON com phone' }, { status: 400 })
    }
    body = JSON.parse(raw) as { phone?: string; name?: string; photo?: string }
  } catch {
    return NextResponse.json({ success: false, error: 'JSON inválido' }, { status: 400 })
  }

  const phone = typeof body?.phone === 'string' ? body.phone.trim() : ''
  const name = typeof body?.name === 'string' ? body.name.trim() : undefined
  const photo = typeof body?.photo === 'string' ? body.photo.trim() : undefined
  if (!phone) return NextResponse.json({ success: false, error: 'phone é obrigatório' }, { status: 400 })

  try {
    const { contact, created } = await getOrCreateContactByPhoneWithFlag(phone, {
      nome: name,
      avatar_url: photo,
      origem: 'extension',
    })
    if (!contact) {
      return NextResponse.json({ success: false, error: 'Não foi possível criar/atualizar contato' }, { status: 500 })
    }
    if (!created && (name || photo)) {
      const updates: { nome?: string; avatar_url?: string } = {}
      if (name) updates.nome = name
      if (photo !== undefined) updates.avatar_url = photo || null
      if (Object.keys(updates).length) await updateContact(contact.id, updates)
    }
    return NextResponse.json({ success: true, contact_id: contact.id })
  } catch (e: unknown) {
    const err = e as Error
    console.error('[whatsapp/sync-contact-extension] POST:', err)
    return NextResponse.json(
      { success: false, error: err?.message ?? 'Erro interno' },
      { status: 500 }
    )
  }
}
