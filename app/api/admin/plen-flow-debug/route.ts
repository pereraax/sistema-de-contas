/**
 * GET: diagnóstico do fluxo (painel). Mostra se a service role está ativa e o que está no banco.
 * Ajuda a entender por que as mensagens do painel não aparecem na Plen.
 */

import { NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-middleware'
import { createAdminClient } from '@/lib/supabase/server'
import { getPlenFlowMessages } from '@/lib/plen/flow-messages'

const PLATFORM_CONFIG_KEY = 'plen_flow_messages'

export async function GET() {
  try {
    const admin = await verifyAdminToken()
    if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const hasAdminClient = !!createAdminClient()
    const supabase = createAdminClient()
    let rawExists = false
    let valueType = 'none'
    let parsedKeys: string[] = []
    let testExpenseOkPreview: string | null = null
    let pedirNomePreview: string | null = null
    let dbError: string | null = null

    if (supabase) {
      const { data, error } = await supabase
        .from('platform_config')
        .select('value')
        .eq('key', PLATFORM_CONFIG_KEY)
        .maybeSingle()
      if (error) {
        dbError = error.message
      } else if (data?.value != null) {
        rawExists = true
        valueType = typeof data.value
        try {
          const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value
          if (parsed && typeof parsed === 'object') {
            parsedKeys = Object.keys(parsed)
            if (typeof parsed.test_expense_ok === 'string') {
              testExpenseOkPreview = parsed.test_expense_ok.trim().slice(0, 120)
            }
            if (typeof parsed.pedir_nome === 'string') {
              pedirNomePreview = parsed.pedir_nome.trim().slice(0, 80)
            }
          }
        } catch {
          testExpenseOkPreview = '(erro ao fazer parse)'
        }
      }
    }

    const flow = await getPlenFlowMessages()
    const flowTestOk = typeof flow.test_expense_ok === 'string' ? flow.test_expense_ok.trim().slice(0, 120) : null
    const flowPedirNome = typeof flow.pedir_nome === 'string' ? flow.pedir_nome.trim().slice(0, 80) : null

    return NextResponse.json({
      ok: true,
      diagnostico: {
        service_role_ativa: hasAdminClient,
        mensagem: !hasAdminClient
          ? 'SUPABASE_SERVICE_ROLE_KEY não está definida ou está vazia no .env.local. A Plen usa o fluxo padrão.'
          : dbError
            ? `Erro ao ler o banco: ${dbError}`
            : !rawExists
              ? 'Nenhum fluxo salvo no banco (key plen_flow_messages). Salve no painel em "Salvar mensagens".'
              : 'Fluxo encontrado no banco. Se no WhatsApp ainda sai a mensagem antiga: (1) Reinicie o servidor. (2) Confira se o webhook da Z-API/Evolution aponta para ESTE servidor (se testar no celular, precisa ser a URL de produção com SUPABASE_SERVICE_ROLE_KEY definida lá). (3) No terminal, ao enviar uma mensagem, veja o log [plen-handler] Resposta que será enfileirada.',
        no_banco: {
          existe_registro: rawExists,
          tipo_do_value: valueType,
          chaves_do_json: parsedKeys,
          test_expense_ok_preview: testExpenseOkPreview,
          pedir_nome_preview: pedirNomePreview,
        },
        o_que_getPlenFlowMessages_retorna: {
          test_expense_ok_preview: flowTestOk,
          pedir_nome_preview: flowPedirNome,
        },
      },
    })
  } catch (e) {
    console.error('[plen-flow-debug]', e)
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
