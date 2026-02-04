import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { TipoRegistro } from '@/lib/types'
import { plenLog } from '@/lib/plen-logs'

/** Cria cliente Supabase na rota (sem cache React) para garantir cookies da requisição. */
async function createSupabaseForRoute() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase não configurado')
  }
  const cookieStore = await cookies()
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Route Handler: setAll pode falhar, ignorar
        }
      },
    },
  })
}

/**
 * Extrai valor numérico de uma string (aceita "30", "30,50", "30.50", "30 reais").
 */
function extrairValor(texto: string): number | null {
  const match = texto.match(/(\d+)(?:[.,](\d+))?/)
  if (!match) return null
  const inteiro = match[1]
  const decimal = match[2] || '00'
  const valor = parseFloat(`${inteiro}.${decimal}`)
  return isNaN(valor) ? null : valor
}

/**
 * Interpreta mensagem em linguagem natural e retorna tipo, valor e nome (descrição).
 */
function interpretarMensagem(texto: string): { tipo: TipoRegistro; valor: number; nome: string } | null {
  const t = texto.trim().toLowerCase()
  const valorMatch = t.match(/(\d+)(?:[.,](\d+))?\s*(?:reais?|r\$|r\b)?/i)
  const valorNum = valorMatch ? extrairValor(valorMatch[0]) : null
  if (valorNum == null || valorNum <= 0) return null

  // Despesa: gastei, gasteu, paguei (ex.: "gastei 30 reais", "gastei 30 r", "gasteu 400 roupa", "paguei 50 no mercado")
  const despesaMatch = t.match(/(?:gastei|gasteu|paguei)\s+[\d.,]+\s*(?:reais?|r\$|r\b)?\s*(?:de|em|com|para)?\s*(.*)/i)
  if (despesaMatch) {
    const nome = (despesaMatch[1] || '').trim() || 'Gasto'
    return { tipo: 'saida', valor: valorNum, nome: nome.substring(0, 200) }
  }
  if (/\b(?:gastei|gasteu|paguei)\s+[\d.,]+/i.test(t)) {
    return { tipo: 'saida', valor: valorNum, nome: 'Gasto' }
  }

  // Entrada: recebi, entrada de
  const entradaMatch = t.match(/(?:recebi|entrada\s+de?)\s+[\d.,]+\s*(?:reais?|r\$|r\b)?\s*(?:de|do|da)?\s*(.*)/i)
  if (entradaMatch) {
    const nome = (entradaMatch[1] || '').trim() || 'Entrada'
    return { tipo: 'entrada', valor: valorNum, nome: nome.substring(0, 200) }
  }
  if (/\brecebi\s+[\d.,]+/i.test(t)) {
    return { tipo: 'entrada', valor: valorNum, nome: 'Entrada' }
  }

  return null
}

/** GET: verificar se a rota está no ar (útil para diagnóstico). */
export async function GET() {
  return NextResponse.json({ ok: true, route: 'plen/chat' })
}

function jsonResponse(body: { response?: string; error?: string; actionData?: any; pendingAction?: any }) {
  const res = NextResponse.json(body, { status: 200 })
  res.headers.set('X-Plen-Chat', 'ok')
  return res
}

export async function POST(request: NextRequest) {
  const requestId = `plen-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  console.log(`[PLEN chat] ${requestId} POST /api/plen/chat recebida`)
  plenLog(requestId, 'start', 'POST /api/plen/chat recebida', undefined, 'info')

  try {
    let supabase
    try {
      supabase = await createSupabaseForRoute()
      plenLog(requestId, 'supabase', 'Cliente Supabase criado', undefined, 'info')
    } catch (supabaseErr: any) {
      plenLog(requestId, 'supabase', 'Erro ao criar Supabase', { error: supabaseErr?.message }, 'error')
      console.error('[PLEN chat] Erro ao criar cliente Supabase:', supabaseErr)
      return jsonResponse({
        response: 'Configuração do servidor incompleta. Tente novamente em instantes.',
      })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    plenLog(requestId, 'auth', authError ? 'Erro ao obter usuário' : (user ? 'Usuário autenticado' : 'Sem usuário'), { hasUser: !!user, authError: authError?.message }, authError || !user ? 'warn' : 'info')

    if (authError || !user) {
      const authMsg = authError?.message === 'Auth session missing!'
        ? 'Sessão não encontrada. Faça login no mesmo navegador (menu ou /login) e tente de novo. Se já estiver logado, abra o PLEN numa aba do mesmo site.'
        : 'Faça login para usar o assistente PLEN. Abra o menu e entre na sua conta.'
      return jsonResponse({
        response: authMsg,
      })
    }

    let body: { message?: string } = {}
    try {
      body = await request.json()
    } catch {
      plenLog(requestId, 'body', 'JSON inválido', undefined, 'warn')
      return jsonResponse({
        response: 'Requisição inválida. Envie uma mensagem de texto.',
      })
    }
    const message: string = (body.message || '').trim()
    plenLog(requestId, 'message', 'Mensagem recebida', { message: message.slice(0, 100) }, 'info')
    if (!message) {
      return jsonResponse({
        response: 'Envie uma mensagem. Ex.: "Gastei 50 reais no mercado" ou "Recebi 200".',
      })
    }

    const interpretado = interpretarMensagem(message)
    plenLog(requestId, 'interpret', interpretado ? 'Mensagem interpretada' : 'Mensagem não interpretada como registro', interpretado ? { tipo: interpretado.tipo, valor: interpretado.valor, nome: interpretado.nome } : undefined, 'info')

    if (interpretado) {
      const { tipo, valor, nome } = interpretado
      const valorFinal = Math.round(valor * 100) / 100

      // user_id do registro: preferir pessoa da tabela "users"; senão criar uma padrão ou usar o dono da conta
      let registroUserId: string | null = null

      const { data: usuarios, error: errUsuarios } = await supabase
        .from('users')
        .select('id')
        .eq('account_owner_id', user.id)
        .order('nome', { ascending: true })
        .limit(1)

      if (!errUsuarios && usuarios?.[0]?.id) {
        registroUserId = usuarios[0].id
        plenLog(requestId, 'users', 'Pessoa encontrada', { userId: registroUserId }, 'info')
      }

      if (!registroUserId) {
        plenLog(requestId, 'users', 'Nenhuma pessoa; tentando criar "Meus registros"', undefined, 'info')
        // Criar pessoa padrão "Meus registros" para o dono da conta
        const { data: novoUsuario, error: errCriar } = await supabase
          .from('users')
          .insert({ nome: 'Meus registros', account_owner_id: user.id })
          .select('id')
          .single()
        if (!errCriar && novoUsuario?.id) {
          registroUserId = novoUsuario.id
          plenLog(requestId, 'users', 'Pessoa "Meus registros" criada', { userId: registroUserId }, 'info')
        }
      }

      if (!registroUserId) {
        plenLog(requestId, 'users', 'Sem pessoa para associar', undefined, 'error')
        return jsonResponse({
          response: 'Não encontrei uma pessoa para associar ao registro. Crie em Configurações → Usuários (pelo menos uma pessoa) e tente de novo.',
        })
      }

      const { data: inserted, error } = await supabase
        .from('registros')
        .insert({
          user_id: registroUserId,
          nome,
          tipo,
          valor: valorFinal,
          data_registro: new Date().toISOString(),
          parcelas_totais: 1,
          parcelas_pagas: 0,
          etiquetas: [],
        })
        .select('id')
        .single()

      if (error) {
        plenLog(requestId, 'insert', 'Erro ao inserir registro', { error: error.message, code: error.code }, 'error')
        console.error('[PLEN chat] Erro ao inserir registro:', error)
        return jsonResponse({
          response: `Não consegui salvar o registro. (${error.message}) Crie uma pessoa em Configurações → Usuários e tente de novo.`,
        })
      }

      plenLog(requestId, 'insert', 'Registro criado', { id: inserted?.id, nome, tipo, valor: valorFinal }, 'info')
      const tipoLabel = tipo === 'saida' ? 'Despesa' : 'Entrada'
      const valorFormatado = valorFinal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      return jsonResponse({
        response: `✅ Registrado: ${tipoLabel} de ${valorFormatado} – ${nome}.`,
        actionData: {
          action: 'created',
          message: `${tipoLabel} de ${valorFormatado} registrada.`,
          id: inserted?.id,
        },
      })
    }

    // Respostas simples para consultas comuns (sem criar registro)
    const t = message.toLowerCase()
    if (t.includes('oi') || t.includes('olá') || t.includes('ola')) {
      return jsonResponse({
        response: 'Oi! 👋 Pode me dizer um gasto ou entrada em texto, por exemplo:\n• "Gastei 30 reais de ônibus"\n• "Recebi 500 do cliente"',
      })
    }
    if (t.includes('ajuda') || t.includes('como usar')) {
      return jsonResponse({
        response: 'Para registrar, escreva por exemplo:\n• "Gastei 50 reais no mercado"\n• "Gasteu 400 roupa"\n• "Recebi 1000 reais"\n• "Paguei 30 de Uber"',
      })
    }

    return jsonResponse({
      response: 'Não entendi. Tente algo como: "Gastei 30 reais de ônibus" ou "Recebi 500 reais".',
    })
  } catch (err: any) {
    const msg = err?.message ?? String(err)
    plenLog(requestId, 'catch', 'Exceção não tratada', { error: msg, stack: err?.stack?.slice(0, 300) }, 'error')
    console.error(`[PLEN chat] ${requestId} Erro:`, err)
    return jsonResponse({
      response: `[PLEN] Erro no servidor: ${msg}. Verifique se está logado e se existe uma pessoa em Configurações → Usuários.`,
    })
  }
}
