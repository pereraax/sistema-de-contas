/**
 * Rota para corrigir a configuração da API Fácil e garantir que o webhook receba áudio (e imagem).
 * Remove AUDIO_RECEBIDO e IMAGEM_RECEBIDA da lista de tipos bloqueados (tipos_envio).
 * Pode ser chamada uma vez manualmente ou após configurar o webhook.
 */

import { NextResponse } from 'next/server'
import { ensureAudioWebhookEnabled } from '@/lib/whatsapp-apifacil-config'

export async function GET() {
  const result = await ensureAudioWebhookEnabled()
  return NextResponse.json(result)
}

export async function POST() {
  const result = await ensureAudioWebhookEnabled()
  return NextResponse.json(result)
}
