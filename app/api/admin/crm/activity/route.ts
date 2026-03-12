import { NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-middleware'
import { createAdminClient } from '@/lib/supabase/server'

export type ActivityPeriod = 'hoje' | 'ontem' | '7dias' | 'todos'

export async function GET(request: Request) {
  try {
    const admin = await verifyAdminToken()
    if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const supabase = createAdminClient()
    if (!supabase) return NextResponse.json({ error: 'Serviço indisponível' }, { status: 503 })

    const { searchParams } = new URL(request.url)
    const period = (searchParams.get('period') as ActivityPeriod) || 'todos'
    const search = searchParams.get('search') || ''

    let fromDate: string | null = null
    let toDate: string | null = null
    const now = new Date()
    if (period === 'hoje') {
      fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    } else if (period === 'ontem') {
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
      fromDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()).toISOString()
      const endYesterday = new Date(yesterday)
      endYesterday.setDate(endYesterday.getDate() + 1)
      toDate = endYesterday.toISOString()
    } else if (period === '7dias') {
      const d = new Date(now)
      d.setDate(d.getDate() - 7)
      fromDate = d.toISOString()
    }

    // 1) Logs de interação
    const { data: logs, error: logsError } = await supabase
      .from('crm_interaction_logs')
      .select('id, contact_id, evento, detalhes, timestamp')
      .order('timestamp', { ascending: false })
      .limit(200)

    if (logsError) {
      console.error('[crm/activity] logs:', logsError)
    }

    const logContactIds = [...new Set((logs || []).map((l: any) => l.contact_id))]
    const allContactIds = new Set(logContactIds)

    // 2) Contatos recentes (leads novos) para incluir no Inbox mesmo sem log
    const { data: recentContacts } = await supabase
      .from('crm_contacts')
      .select('id, nome, telefone, email, status, data_primeiro_contato')
      .order('data_primeiro_contato', { ascending: false })
      .limit(150)

    const contactIdsToFetch = new Set(allContactIds)
    ;(recentContacts || []).forEach((c: any) => contactIdsToFetch.add(c.id))

    const { data: contactsList } = await supabase
      .from('crm_contacts')
      .select('id, nome, telefone, email, status, data_primeiro_contato')
      .in('id', Array.from(contactIdsToFetch))

    const contactMap = new Map((contactsList || []).map((c: any) => [c.id, c]))

    const hasNovoLeadLog = new Set(
      (logs || []).filter((l: any) => l.evento === 'novo_lead' || l.evento === 'contato_criado').map((l: any) => l.contact_id)
    )

    const fromLogs = (logs || []).map((log: any) => {
      const contact = contactMap.get(log.contact_id)
      const evento = log.evento as string
      let acao = evento
      if (evento === 'mensagem_recebida') acao = 'enviou uma mensagem'
      else if (evento === 'novo_lead' || evento === 'contato_criado') acao = 'entrou em contato (novo lead)'
      else if (evento === 'cadastro_iniciado') acao = 'iniciou cadastro'
      else if (evento === 'email_confirmado') acao = 'confirmou e-mail'
      else if (evento === 'cadastro_completo') acao = 'completou cadastro'
      else if (evento === 'cliente_pago') acao = 'virou cliente pago'
      return {
        id: log.id,
        contact_id: log.contact_id,
        contact_nome: contact?.nome || contact?.telefone || 'Contato',
        contact_telefone: contact?.telefone,
        contact_status: contact?.status || 'novo_lead',
        acao,
        evento: log.evento,
        detalhes: log.detalhes,
        timestamp: log.timestamp,
      }
    })

    const fromContacts = (recentContacts || [])
      .filter((c: any) => !hasNovoLeadLog.has(c.id))
      .map((c: any) => ({
        id: `contact-${c.id}`,
        contact_id: c.id,
        contact_nome: c.nome || c.telefone || 'Contato',
        contact_telefone: c.telefone,
        contact_status: c.status || 'novo_lead',
        acao: 'entrou em contato (novo lead)',
        evento: 'novo_lead',
        detalhes: null,
        timestamp: c.data_primeiro_contato || c.id,
      }))

    const activities = [...fromLogs, ...fromContacts].sort(
      (a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )

    let filtered = activities
    if (fromDate) {
      filtered = filtered.filter((a: any) => new Date(a.timestamp) >= new Date(fromDate!))
    }
    if (toDate) {
      filtered = filtered.filter((a: any) => new Date(a.timestamp) < new Date(toDate!))
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      filtered = filtered.filter(
        (a: any) =>
          (a.contact_nome || '').toLowerCase().includes(q) ||
          (a.contact_telefone || '').includes(q)
      )
    }

    return NextResponse.json({ activities: filtered })
  } catch (e: any) {
    console.error('[crm/activity]', e)
    return NextResponse.json({ error: e?.message ?? 'Erro' }, { status: 500 })
  }
}
