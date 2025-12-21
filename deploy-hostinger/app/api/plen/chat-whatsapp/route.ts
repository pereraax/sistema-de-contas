import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { obterDividas, obterRegistros, obterEstatisticas, criarRegistro, obterUsuarios } from '@/lib/actions'
import { obterPlanoUsuario, obterFeaturesUsuario, podeCriarRegistro } from '@/lib/plano'
import { format, startOfWeek, endOfWeek, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'

/**
 * Endpoint alternativo do PLEN para WhatsApp
 * Aceita userId diretamente (sem autenticação via sessão)
 * Usado pelo webhook do WhatsApp
 */

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory, userId, accountOwnerId } = await request.json()
    
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Mensagem inválida' }, { status: 400 })
    }
    
    if (!userId || !accountOwnerId) {
      return NextResponse.json({ error: 'userId e accountOwnerId são obrigatórios' }, { status: 400 })
    }
    
    // Verificar se usuário existe e pertence ao accountOwnerId
    const supabase = await createClient()
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, account_owner_id')
      .eq('id', userId)
      .eq('account_owner_id', accountOwnerId)
      .single()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Usuário não encontrado ou não autorizado' }, { status: 403 })
    }
    
    // Buscar dados do usuário usando accountOwnerId
    // Nota: As funções obterDividas, obterRegistros, etc. usam auth.getUser()
    // Para WhatsApp, precisamos usar uma versão que aceita accountOwnerId diretamente
    // Por enquanto, vamos usar o mesmo código do PLEN mas com validação de userId
    
    // Buscar dados usando Admin Client para bypass de autenticação
    const { createAdminClient } = await import('@/lib/supabase/server')
    const supabaseAdmin = createAdminClient()
    
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Erro ao conectar com o banco de dados' }, { status: 500 })
    }
    
    // Buscar registros do accountOwnerId
    const { data: usuarios } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('account_owner_id', accountOwnerId)
    
    const userIds = usuarios?.map(u => u.id) || []
    
    const { data: registros } = await supabaseAdmin
      .from('registros')
      .select('*')
      .in('user_id', userIds)
    
    const { data: dividas } = await supabaseAdmin
      .from('registros')
      .select('*')
      .in('user_id', userIds)
      .eq('tipo', 'divida')
    
    // Calcular estatísticas
    let totalEntradas = 0
    let totalSaidas = 0
    registros?.forEach((r: any) => {
      if (r.tipo === 'entrada') totalEntradas += Number(r.valor)
      if (r.tipo === 'saida') totalSaidas += Number(r.valor)
    })
    
    const estatisticas = {
      totalEntradas,
      totalSaidas,
      saldo: totalEntradas - totalSaidas,
      totalDividasPendentes: dividas?.reduce((acc: number, d: any) => {
        const valorPago = (Number(d.valor) * d.parcelas_pagas) / d.parcelas_totais
        return acc + (Number(d.valor) - valorPago)
      }, 0) || 0
    }
    
    // Processar mensagem com PLEN (usar mesma lógica do endpoint principal)
    // Por enquanto, retornar uma resposta simples até implementar a lógica completa
    // TODO: Implementar processamento completo de mensagens PLEN aqui
    const resposta = `Olá! Recebi sua mensagem: "${message}". Esta funcionalidade está em desenvolvimento. Por favor, use o endpoint principal /api/plen/chat para processar mensagens do PLEN.`
    
    return NextResponse.json({ response: resposta })
  } catch (error: any) {
    console.error('❌ [PLEN WhatsApp] Erro:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao processar mensagem' },
      { status: 500 }
    )
  }
}






