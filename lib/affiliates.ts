'use server'

import { createAdminClient } from '@/lib/supabase/server'

const VALUE_PER_REFERRAL = 3
const MIN_WITHDRAWAL = 30

function generateAffiliateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

/** Retorna o código de afiliado do usuário; cria um se não existir. */
export async function getOrCreateAffiliateCode(userId: string): Promise<{ code: string; link: string } | null> {
  const admin = createAdminClient()
  if (!admin) return null

  const { data: profile } = await admin.from('profiles').select('affiliate_code').eq('id', userId).single()
  let code = profile?.affiliate_code

  if (!code) {
    let attempts = 0
    while (attempts < 10) {
      code = generateAffiliateCode()
      const { error } = await admin.from('profiles').update({ affiliate_code: code }).eq('id', userId)
      if (!error) break
      if (error.code === '23505') { attempts++; continue } // unique violation
      return null
    }
  }

  // Link de indicação sempre no domínio de produção (plenipay.com), nunca localhost
  let baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://plenipay.com').replace(/\/$/, '')
  if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
    baseUrl = 'https://plenipay.com'
  }
  const link = `${baseUrl}/cadastro?ref=${code}`
  return { code: code!, link }
}

export type ReferralItem = {
  referredUserId: string
  referredName: string
  referredEmail: string
  createdAt: string
  emailVerified: boolean
  usedPlen: boolean
  plano: string | null
}

export type MissionStats = {
  totalReferrals: number
  basicSubscribers: number
  verifiedAndUsedPlen: number
  mission1Done: boolean
  mission2Done: boolean
  mission3Done: boolean
  allMissionsDone: boolean
}

/** Lista indicações do usuário com dados do indicado, verificação de conta e uso do Plen. */
export async function getMyReferrals(userId: string): Promise<{
  referrals: ReferralItem[]
  totalEarned: number
  totalWithdrawn: number
  availableBalance: number
  canWithdraw: boolean
  mission: MissionStats
}> {
  const admin = createAdminClient()
  const emptyMission: MissionStats = {
    totalReferrals: 0,
    basicSubscribers: 0,
    verifiedAndUsedPlen: 0,
    mission1Done: false,
    mission2Done: false,
    mission3Done: false,
    allMissionsDone: false,
  }
  if (!admin) return { referrals: [], totalEarned: 0, totalWithdrawn: 0, availableBalance: 0, canWithdraw: false, mission: emptyMission }

  const { data: referrals } = await admin
    .from('referrals')
    .select('referred_id, created_at')
    .eq('referrer_id', userId)
    .order('created_at', { ascending: false })

  const refIds = (referrals || []).map((r: any) => r.referred_id)
  const refList: ReferralItem[] = []

  if (refIds.length > 0) {
    const { data: profiles } = await admin.from('profiles').select('id, nome, email, plano').in('id', refIds)
    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]))

    let emailConfirmedMap = new Map<string, boolean>()
    try {
      const { data: authList } = await admin.auth.admin.listUsers({ perPage: 1000 })
      if (authList?.users) {
        authList.users.forEach((u: any) => {
          emailConfirmedMap.set(u.id, !!u.email_confirmed_at)
        })
      }
    } catch (_) {}

    let plenMap = new Map<string, boolean>()
    try {
      const { data: sessions } = await admin.from('whatsapp_sessions').select('user_id, plen_activated').in('user_id', refIds)
      if (sessions) {
        sessions.forEach((s: any) => {
          if (s.plen_activated) plenMap.set(s.user_id, true)
        })
      }
    } catch (_) {}

    for (const r of referrals || []) {
      const p = profileMap.get(r.referred_id)
      const emailVerified = emailConfirmedMap.get(r.referred_id) ?? false
      const usedPlen = plenMap.get(r.referred_id) ?? false
      refList.push({
        referredUserId: r.referred_id,
        referredName: p?.nome || '—',
        referredEmail: p?.email || '—',
        createdAt: r.created_at,
        emailVerified,
        usedPlen,
        plano: p?.plano ?? null,
      })
    }
  }

  const totalEarned = refList.length * VALUE_PER_REFERRAL
  const basicSubscribers = refList.filter((r) => r.plano === 'basico').length
  const verifiedAndUsedPlen = refList.filter((r) => r.emailVerified && r.usedPlen).length

  const mission: MissionStats = {
    totalReferrals: refList.length,
    basicSubscribers,
    verifiedAndUsedPlen,
    mission1Done: refList.length >= 10,
    mission2Done: basicSubscribers >= 1,
    mission3Done: verifiedAndUsedPlen >= 10,
    allMissionsDone: refList.length >= 10 && basicSubscribers >= 1 && verifiedAndUsedPlen >= 10,
  }

  const { data: withdrawals } = await admin
    .from('affiliate_withdrawal_requests')
    .select('amount')
    .eq('user_id', userId)
    .eq('status', 'paid')

  const totalWithdrawn = (withdrawals || []).reduce((s: number, w: any) => s + Number(w.amount), 0)
  const availableBalance = totalEarned - totalWithdrawn
  const canWithdraw = availableBalance >= MIN_WITHDRAWAL

  return {
    referrals: refList,
    totalEarned,
    totalWithdrawn,
    availableBalance,
    canWithdraw,
    mission,
  }
}

/** Cria solicitação de saque (só se saldo disponível >= 30). */
export async function requestWithdrawal(
  userId: string,
  amount: number,
  pixKeyType: 'cpf' | 'phone' | 'email',
  pixKeyValue: string,
  name: string
): Promise<{ success: boolean; error?: string }> {
  if (amount < MIN_WITHDRAWAL) return { success: false, error: `Valor mínimo para saque é R$ ${MIN_WITHDRAWAL}.` }
  const admin = createAdminClient()
  if (!admin) return { success: false, error: 'Serviço indisponível.' }

  const { availableBalance } = await getMyReferrals(userId)
  if (availableBalance < amount) return { success: false, error: 'Saldo disponível insuficiente.' }

  const { error } = await admin.from('affiliate_withdrawal_requests').insert({
    user_id: userId,
    amount,
    pix_key_type: pixKeyType,
    pix_key_value: pixKeyValue.trim(),
    name: name.trim(),
    status: 'pending',
  })

  if (error) return { success: false, error: error.message }
  return { success: true }
}

/** Registra uma indicação (chamado após criar conta). referrerId = quem indicou, referredId = novo usuário. */
export async function registerReferral(referrerId: string, referredId: string): Promise<{ success: boolean; error?: string }> {
  const admin = createAdminClient()
  if (!admin) return { success: false, error: 'Serviço indisponível.' }
  if (referrerId === referredId) return { success: false, error: 'Não pode indicar a si mesmo.' }

  const { error } = await admin.from('referrals').insert({
    referrer_id: referrerId,
    referred_id: referredId,
  })

  if (error) return { success: false, error: error.message }
  return { success: true }
}

/** Busca id do perfil pelo affiliate_code. */
export async function getReferrerIdByCode(affiliateCode: string): Promise<string | null> {
  const admin = createAdminClient()
  if (!admin) return null
  const { data } = await admin.from('profiles').select('id').eq('affiliate_code', affiliateCode.trim()).maybeSingle()
  return data?.id ?? null
}
