import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { plenLog } from '@/lib/plen-logs'
import { interpretarMensagem, formatarRespostaRegistro } from '@/lib/plen-registro'
import { getPlenLLMResponse } from '@/lib/plen-llm-fallback'
import { extrairUsuarioNaMensagem } from '@/lib/plen-whatsapp-chat'

export const dynamic = 'force-dynamic'

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

    const { msgForRegistro, targetUserName: nomeUsuarioPedido } = extrairUsuarioNaMensagem(message)
    const interpretado = interpretarMensagem(msgForRegistro)
    plenLog(requestId, 'interpret', interpretado ? 'Mensagem interpretada' : 'Mensagem não interpretada como registro', interpretado ? { tipo: interpretado.tipo, valor: interpretado.valor, nome: interpretado.nome, categoria: interpretado.categoria, nomeUsuarioPedido: nomeUsuarioPedido ?? undefined } : undefined, 'info')

    if (interpretado) {
      const { tipo, valor, nome, data_registro, categoria } = interpretado
      const valorFinal = Math.round(valor * 100) / 100

      let registroUserId: string | null = null
      let nomeUsuarioResposta: string = ''

      const { data: profile } = await supabase.from('profiles').select('nome, email').eq('id', user.id).single()
      const profileNome = (profile?.nome ?? profile?.email?.split('@')[0] ?? '').trim().toLowerCase()

      const { data: usuarios, error: errUsuarios } = await supabase
        .from('users')
        .select('id, nome')
        .eq('account_owner_id', user.id)
        .order('nome', { ascending: true })

      if (nomeUsuarioPedido && (!usuarios?.length || errUsuarios)) {
        return jsonResponse({
          response: 'Você pediu para registrar em um usuário, mas ainda não há pessoas cadastradas. Vá em Configurações → Usuários/Pessoas, crie as pessoas e use o nome cadastrado. Ex.: "Gastei 20 usuario juliaa".',
        })
      }
      if (!errUsuarios && usuarios?.length) {
        if (nomeUsuarioPedido) {
          const nomeBusca = nomeUsuarioPedido.trim().toLowerCase()
          const encontrado = usuarios.find((u) => (u.nome ?? '').trim().toLowerCase() === nomeBusca)
          if (encontrado) {
            registroUserId = encontrado.id
            nomeUsuarioResposta = (encontrado.nome ?? '').trim()
            plenLog(requestId, 'users', 'Pessoa indicada na mensagem', { userId: registroUserId, nome: nomeUsuarioResposta }, 'info')
          } else {
            return jsonResponse({
              response: `Usuário "${nomeUsuarioPedido}" não encontrado. Use o nome exatamente como em Configurações → Usuários/Pessoas. Ex.: "Gastei 20 usuario juliaa" (se o nome cadastrado for "juliaa").`,
            })
          }
        }
      }

      if (!registroUserId && !errUsuarios && usuarios?.length) {
        const profileNomeLower = (profile?.nome ?? profile?.email?.split('@')[0] ?? '').trim().toLowerCase()
        const dono = usuarios.find((u) => (u.nome ?? '').trim().toLowerCase() === profileNomeLower)
        if (dono) {
          registroUserId = dono.id
          nomeUsuarioResposta = (dono.nome ?? '').trim()
          plenLog(requestId, 'users', 'Pessoa encontrada (dono da conta)', { userId: registroUserId, nome: nomeUsuarioResposta }, 'info')
        } else {
          // Dono da conta não tem pessoa com seu nome → criar uma para que o registro seja sempre do titular
          plenLog(requestId, 'users', 'Criando pessoa para dono da conta', undefined, 'info')
          const nomeCriar = profile?.nome?.trim() || profile?.email?.split('@')[0] || 'Dono da conta'
          const { data: novoUsuario, error: errCriar } = await supabase
            .from('users')
            .insert({ nome: nomeCriar, account_owner_id: user.id })
            .select('id, nome')
            .single()
          if (!errCriar && novoUsuario?.id) {
            registroUserId = novoUsuario.id
            nomeUsuarioResposta = (novoUsuario.nome ?? nomeCriar).trim()
            plenLog(requestId, 'users', 'Pessoa do dono criada', { userId: registroUserId, nome: nomeUsuarioResposta }, 'info')
          } else {
            registroUserId = usuarios[0].id
            nomeUsuarioResposta = (usuarios[0].nome ?? '').trim()
            plenLog(requestId, 'users', 'Fallback primeira pessoa da lista', { userId: registroUserId, nome: nomeUsuarioResposta }, 'warn')
          }
        }
      }

      if (!registroUserId) {
        plenLog(requestId, 'users', 'Nenhuma pessoa; tentando criar', undefined, 'info')
        const nomeCriar = profile?.nome?.trim() || profile?.email?.split('@')[0] || 'Meus registros'
        const { data: novoUsuario, error: errCriar } = await supabase
          .from('users')
          .insert({ nome: nomeCriar, account_owner_id: user.id })
          .select('id, nome')
          .single()
        if (!errCriar && novoUsuario?.id) {
          registroUserId = novoUsuario.id
          nomeUsuarioResposta = (novoUsuario.nome ?? nomeCriar).trim()
          plenLog(requestId, 'users', 'Pessoa criada', { userId: registroUserId, nome: nomeUsuarioResposta }, 'info')
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
          data_registro,
          categoria: categoria || null,
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
      const responseText = formatarRespostaRegistro({
        nome,
        tipo,
        valor: valorFinal,
        dataRegistro: data_registro,
        categoria,
        nomeUsuario: nomeUsuarioResposta,
      })
      return jsonResponse({
        response: responseText,
        actionData: {
          action: 'created',
          message: responseText,
          id: inserted?.id,
        },
      })
    }

    // Respostas simples para consultas comuns (sem criar registro)
    const t = message.toLowerCase()
    const msgNaoEntendi = `Oops! não entendi 🥹
Estou aqui para tornar o controle das suas finanças mais simples e organizado. Você pode falar comigo de forma natural, como se estivesse conversando com um amigo!

💼 O que eu posso fazer por você:

📝 REGISTRAR:
• Gastos: "paguei 50 reais no mercado"
• Entradas: "recebi 1000 reais"
• Dívidas: "tenho uma dívida de 200 reais"
• Salários: "meu salário é 3000 reais"

📊 CONSULTAR:
• "quais são minhas dívidas?"
• "quanto gastei na semana?"
• "quanto gastei no mês?"
• "quanto tenho de saldo?"
• "quanto recebi este mês?"

📈 RELATÓRIOS:
• "me mostre o relatório"
• "quero ver meu relatório financeiro"
• "mostre meu resumo do mês"
• "como estão minhas finanças?"

💡 Como eu entendo você:

Você pode falar de forma natural! Por exemplo:
• "gastei 30 reais de ônibus hoje"
• "paguei 150 reais de conta de luz"
• "recebi 500 reais do cliente"
• "tenho uma dívida de 2000 no cartão"

Eu entendo diferentes formas de falar e vou organizar tudo para você! 🎯`

    if (t.includes('oi') || t.includes('olá') || t.includes('ola')) {
      return jsonResponse({ response: msgNaoEntendi })
    }
    if (t.includes('ajuda') || t.includes('como usar')) {
      return jsonResponse({
        response: 'Para registrar:\n• Gasto: "Gastei 50 no mercado", "Paguei 30 de Uber"\n• Ganho: "Ganhei 20", "Recebi 1000 do cliente"\n• Dívida: "Tenho uma dívida de 200 no cartão"\n• Salário: "Meu salário é 3000"\nVocê pode incluir data: "gastei 40 ontem" ou "dia 15".',
      })
    }

    // Fallback com LLM: resposta natural e amigável, só sobre Plenipay
    const llmReply = await getPlenLLMResponse({
      userMessage: message,
      context: 'O usuário enviou uma mensagem que não foi reconhecida como comando de registro ou consulta. Responda de forma amigável e, se fizer sentido, sugira frases que funcionam (ex.: "Ganhei 40 reais", "Recebi 100", "Me mostre o relatório").',
    })
    if (llmReply) {
      return jsonResponse({ response: llmReply })
    }

    return jsonResponse({ response: msgNaoEntendi })
  } catch (err: any) {
    const msg = err?.message ?? String(err)
    plenLog(requestId, 'catch', 'Exceção não tratada', { error: msg, stack: err?.stack?.slice(0, 300) }, 'error')
    console.error(`[PLEN chat] ${requestId} Erro:`, err)
    return jsonResponse({
      response: `[PLEN] Erro no servidor: ${msg}. Verifique se está logado e se existe uma pessoa em Configurações → Usuários.`,
    })
  }
}
