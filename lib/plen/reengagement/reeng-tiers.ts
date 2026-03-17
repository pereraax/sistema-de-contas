/**
 * Reengajamento por tier: 5 min, 2 h e 24 h sem resposta.
 * Um nível por contato por ciclo; quando o usuário responde, o ciclo reinicia (markUserReplied zera os tiers).
 */

import { createAdminClient } from '@/lib/supabase/server'

const MS_5MIN = 5 * 60 * 1000
const MS_2H = 2 * 60 * 60 * 1000
const MS_23H = 23 * 60 * 60 * 1000
const MS_24H = 24 * 60 * 60 * 1000
const MS_24H30 = 24.5 * 60 * 60 * 1000

export type ReengTier = '5m' | '2h' | '24h'

export interface ContactReengTier {
  contact_id: string
  nome: string | null
  tier: ReengTier
}

/**
 * Retorna contatos que devem receber mensagem de reengajamento agora.
 * Um contato aparece no máximo uma vez, com o tier de maior inatividade que ainda não foi enviado neste ciclo.
 * Ordem: 24h > 2h > 5min (enviamos só o mais “forte” que se aplica).
 */
export async function getContactsParaReengajarPorTier(limit = 15): Promise<ContactReengTier[]> {
  const supabase = createAdminClient()
  if (!supabase) return []

  const now = Date.now()

  const { data: rows, error } = await supabase
    .from('plen_user_state')
    .select('contact_id, last_user_message_at, reeng_5m_sent_at, reeng_2h_sent_at, reeng_24h_sent_at')
    .not('last_user_message_at', 'is', null)

  if (error || !rows?.length) return []

  const results: ContactReengTier[] = []
  for (const row of rows as Array<{
    contact_id: string
    last_user_message_at: string | null
    reeng_5m_sent_at?: string | null
    reeng_2h_sent_at?: string | null
    reeng_24h_sent_at?: string | null
  }>) {
    const last = row.last_user_message_at ? new Date(row.last_user_message_at).getTime() : 0
    if (last <= 0) continue
    const inatividade = now - last

    const reeng5m = row.reeng_5m_sent_at ? new Date(row.reeng_5m_sent_at).getTime() : 0
    const reeng2h = row.reeng_2h_sent_at ? new Date(row.reeng_2h_sent_at).getTime() : 0
    const reeng24h = row.reeng_24h_sent_at ? new Date(row.reeng_24h_sent_at).getTime() : 0

    const jaEnviou5m = reeng5m >= last
    const jaEnviou2h = reeng2h >= last
    const jaEnviou24h = reeng24h >= last

    let tier: ReengTier | null = null
    if (inatividade >= MS_23H && inatividade < MS_24H30 && !jaEnviou24h) {
      tier = '24h'
    } else if (inatividade >= MS_2H && !jaEnviou2h) {
      tier = '2h'
    } else if (inatividade >= MS_5MIN && !jaEnviou5m) {
      tier = '5m'
    }

    if (tier) results.push({ contact_id: row.contact_id, nome: null, tier })
    if (results.length >= limit) break
  }

  if (results.length === 0) return []

  const contactIds = results.map((r) => r.contact_id)
  const { data: contacts, error: errContacts } = await supabase
    .from('crm_contacts')
    .select('id, nome')
    .in('id', contactIds)

  if (errContacts || !contacts?.length) return results

  const byId = new Map(contacts.map((c: { id: string; nome: string | null }) => [c.id, c.nome]))
  results.forEach((r) => { r.nome = byId.get(r.contact_id) ?? null })
  return results
}

const MSG_5M = (nome: string) => {
  const n = nome.trim().length >= 2 ? nome : 'amigo'
  const opts = [
    `Ei, ${n} 💙 Ainda estou por aqui. Quer registrar algum gasto ou receita? É só mandar, tipo: *gastei 50 café*`,
    `${n}, sumiu no meio do caminho? 😊 Pode continuar — me manda um *recebi 500* ou *gastei 120 mercado* que eu registro.`,
    `Oi! 💬 Se quiser, me manda seus gastos do dia. Exemplo: *gastei 35 almoço*. Estou aqui.`,
    `${n}, estou aqui quando precisar. Que tal registrar aquele gasto? *gastei [valor] [onde]* 💙`,
  ]
  return opts[Math.floor(Math.random() * opts.length)]
}

const MSG_2H = (nome: string) => {
  const n = nome.trim().length >= 2 ? nome : 'amigo'
  const opts = [
    `${n}, que tal anotar aquele gasto antes de esquecer? 💙 Me manda: *gastei [valor] [onde]*`,
    `Ei! 💙 Organizar as contas começa com um registro. Que tal *gastei 80 uber* ou *recebi 1500 salário*?`,
    `${n}, quando puder, manda seus números que eu registro. Ex: *gastei 25 café* — leva 5 segundos.`,
    `${n}, ainda dá tempo de registrar o dia. Me manda *gastei X* ou *recebi X* que eu anoto. 💙`,
  ]
  return opts[Math.floor(Math.random() * opts.length)]
}

const MSG_24H = (nome: string) => {
  const n = nome.trim().length >= 2 ? nome : 'amigo'
  const opts = [
    `${n}, faz um dia que não te vejo por aqui 💙 Suas finanças agradecem quando você registra. Me manda *gastei X* ou *recebi X* quando quiser.`,
    `Oi! Passou um tempinho. A Plen segue aqui para te ajudar a não perder o controle. Digite *menu* para ver opções ou me manda um gasto/receita.`,
    `${n}, um dia sem registrar e a conta desorganiza. 💙 Que tal começar de novo? *gastei 40* ou *recebi 200* — eu faço o resto.`,
  ]
  return opts[Math.floor(Math.random() * opts.length)]
}

export function getMensagemReengajamentoTier(tier: ReengTier, nome: string): string {
  const n = nome?.trim().length >= 2 ? nome.trim() : 'amigo'
  if (tier === '5m') return MSG_5M(n)
  if (tier === '2h') return MSG_2H(n)
  return MSG_24H(n)
}
