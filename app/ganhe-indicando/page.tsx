'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { MenuButton } from '@/components/MobileMenu'
import NotificationBell from '@/components/NotificationBell'
import UserProfileMenu from '@/components/UserProfileMenu'
import Logo from '@/components/Logo'
import {
  Copy,
  Users,
  Wallet,
  Link2,
  Check,
  Loader2,
  ArrowRight,
  FileText,
  Banknote,
  AlertCircle,
  Target,
  UserCheck,
  Sparkles,
} from 'lucide-react'
import { createNotification } from '@/components/NotificationBell'
import bannerAfiliados from '@/assets/banner.png'

export const dynamic = 'force-dynamic'

const MIN_WITHDRAWAL = 30
const VALUE_PER_REFERRAL = 3

type AffiliateData = {
  code: string
  link: string
  referrals: {
    referredUserId: string
    referredName: string
    referredEmail: string
    createdAt: string
    emailVerified: boolean
    usedPlen: boolean
    plano: string | null
  }[]
  totalEarned: number
  totalWithdrawn: number
  availableBalance: number
  canWithdraw: boolean
  mission: {
    totalReferrals: number
    basicSubscribers: number
    verifiedAndUsedPlen: number
    mission1Done: boolean
    mission2Done: boolean
    mission3Done: boolean
    allMissionsDone: boolean
  }
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export default function GanheIndicandoPage() {
  const router = useRouter()
  const [data, setData] = useState<AffiliateData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [withdrawLoading, setWithdrawLoading] = useState(false)
  const [withdrawForm, setWithdrawForm] = useState({
    amount: MIN_WITHDRAWAL,
    pix_key_type: 'cpf' as 'cpf' | 'phone' | 'email',
    pix_key_value: '',
    name: '',
  })

  useEffect(() => {
    let cancelled = false
    async function fetchData() {
      const res = await fetch('/api/affiliates/me')
      if (res.status === 401 && !cancelled) {
        router.push('/login?next=/ganhe-indicando')
        return
      }
      if (!res.ok && !cancelled) {
        setData(null)
        setLoading(false)
        return
      }
      const json = await res.json()
      if (!cancelled) {
        setData(json)
      }
      setLoading(false)
    }
    fetchData()
    return () => { cancelled = true }
  }, [router])

  const copyLink = () => {
    if (!data?.link) return
    navigator.clipboard.writeText(data.link)
    setCopied(true)
    createNotification('Link copiado!', 'success')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!data?.canWithdraw || withdrawForm.amount < MIN_WITHDRAWAL) return
    if (!withdrawForm.pix_key_value.trim() || !withdrawForm.name.trim()) {
      createNotification('Preencha a chave PIX e seu nome.', 'warning')
      return
    }
    setWithdrawLoading(true)
    try {
      const res = await fetch('/api/affiliates/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: withdrawForm.amount,
          pix_key_type: withdrawForm.pix_key_type,
          pix_key_value: withdrawForm.pix_key_value.trim(),
          name: withdrawForm.name.trim(),
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        createNotification(json.error || 'Erro ao solicitar saque', 'error')
        setWithdrawLoading(false)
        return
      }
      createNotification('Solicitação de saque enviada! Em breve processaremos.', 'success')
      setWithdrawForm({ ...withdrawForm, pix_key_value: '', name: '', amount: MIN_WITHDRAWAL })
      const refetch = await fetch('/api/affiliates/me')
      if (refetch.ok) setData(await refetch.json())
    } finally {
      setWithdrawLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-clean dark:bg-[#1A1A1A] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-brand-aqua" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-brand-clean dark:bg-[#1A1A1A] flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Erro ao carregar. Faça login e tente novamente.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-clean dark:bg-[#1A1A1A] overflow-hidden">
      <Sidebar />
      <main className="lg:ml-64 p-3 sm:p-4 lg:p-8 dark:bg-[#1A1A1A] pt-3 lg:pt-4 overflow-y-auto h-screen pb-32 sm:pb-40">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between gap-2 sm:gap-4 py-1 lg:py-0 mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="flex-shrink-0 w-9 h-9 flex items-center justify-center overflow-hidden rounded-lg lg:hidden">
                <Logo />
              </div>
              <MenuButton />
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-display font-bold text-brand-midnight dark:text-brand-clean leading-none truncate min-w-0">
                Ganhe indicando
              </h1>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <NotificationBell />
              <UserProfileMenu />
            </div>
          </div>

          {/* Banner Programa de Afiliados */}
          <div className="rounded-2xl overflow-hidden shadow-lg mb-6">
            <Image
              src={bannerAfiliados}
              alt="Programa de Afiliados PleniPay - Indique amigos e ganhe R$ 3,00 por cada cadastro"
              className="w-full h-auto object-cover"
              priority
            />
          </div>

          {/* Link + Copy */}
          <div className="bg-white dark:bg-[#252525] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm p-4 sm:p-5 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Link2 className="w-5 h-5 text-brand-aqua" />
              <span className="font-semibold text-brand-midnight dark:text-white">Seu link de indicação</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                readOnly
                value={data.link}
                className="flex-1 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 py-2.5 text-sm text-gray-800 dark:text-white"
              />
              <button
                type="button"
                onClick={copyLink}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-aqua text-white px-4 py-2.5 font-medium hover:opacity-90 transition"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copiado!' : 'Copiar link'}
              </button>
            </div>
          </div>

          {/* Cards: indicados, ganho total, já sacado, saldo */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <div className="bg-white dark:bg-[#252525] rounded-xl border border-gray-200 dark:border-white/10 p-4">
              <Users className="w-6 h-6 text-brand-aqua mb-2" />
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Indicações</p>
              <p className="text-xl font-bold text-brand-midnight dark:text-white">{data.referrals.length}</p>
            </div>
            <div className="bg-white dark:bg-[#252525] rounded-xl border border-gray-200 dark:border-white/10 p-4">
              <Banknote className="w-6 h-6 text-green-500 mb-2" />
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total ganho</p>
              <p className="text-xl font-bold text-brand-midnight dark:text-white">{formatMoney(data.totalEarned)}</p>
            </div>
            <div className="bg-white dark:bg-[#252525] rounded-xl border border-gray-200 dark:border-white/10 p-4">
              <ArrowRight className="w-6 h-6 text-gray-400 mb-2" />
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Já sacado</p>
              <p className="text-xl font-bold text-brand-midnight dark:text-white">{formatMoney(data.totalWithdrawn)}</p>
            </div>
            <div className="bg-white dark:bg-[#252525] rounded-xl border border-brand-aqua/30 dark:border-brand-aqua/30 p-4">
              <Wallet className="w-6 h-6 text-brand-aqua mb-2" />
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Saldo disponível</p>
              <p className="text-xl font-bold text-brand-aqua">{formatMoney(data.availableBalance)}</p>
            </div>
          </div>

          {/* Missão para seus ganhos — layout clean, ícones em destaque, efeito água */}
          {data.mission != null && (
            <div className="relative mb-6 overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/20 via-white dark:via-[#0c1929] to-cyan-900/10 dark:to-[#051018] p-5 sm:p-6 shadow-xl shadow-cyan-500/10 ring-1 ring-cyan-400/20">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(6,182,212,0.12),transparent_60%)] pointer-events-none" />
              <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              <div className="relative flex flex-col gap-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/25 text-cyan-300 shadow-[0_0_24px_rgba(6,182,212,0.4)] ring-2 ring-cyan-400/30">
                    <Target className="h-6 w-6" strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-brand-midnight dark:text-white flex items-center gap-2 text-lg">
                      Missão para seus ganhos
                      <Sparkles className="h-5 w-5 text-cyan-400 animate-pulse drop-shadow-[0_0_6px_rgba(6,182,212,0.6)]" />
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Conclua as etapas para desbloquear seu potencial</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Card 1: 10 pessoas */}
                  {(() => {
                    const done = data.mission.mission1Done
                    const current = Math.min(data.mission.totalReferrals, 10)
                    const total = 10
                    const percent = total ? Math.round((current / total) * 100) : 0
                    return (
                      <div
                        className={`relative min-h-[140px] overflow-hidden rounded-xl border-2 transition-all duration-300 ${
                          done
                            ? 'border-emerald-500/60 bg-emerald-500/10 shadow-[0_0_28px_rgba(34,197,94,0.25)]'
                            : 'border-cyan-500/40 bg-white/80 dark:bg-white/5 shadow-[0_0_20px_rgba(6,182,212,0.15)]'
                        }`}
                      >
                        {/* Efeito água enchendo */}
                        <div
                          className="absolute bottom-0 left-0 right-0 rounded-t-xl transition-all duration-700 ease-out"
                          style={{
                            height: `${percent}%`,
                            background: done
                              ? 'linear-gradient(to top, rgba(34,197,94,0.35), rgba(34,197,94,0.15))'
                              : 'linear-gradient(to top, rgba(6,182,212,0.4), rgba(6,182,212,0.12))',
                          }}
                        />
                        <div className="relative z-10 flex flex-col h-full min-h-[140px] p-4">
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl mb-3 ${
                            done ? 'bg-emerald-500 text-white shadow-lg' : 'bg-cyan-500 text-cyan-950 shadow-[0_0_16px_rgba(6,182,212,0.5)]'
                          }`}>
                            {done ? <Check className="h-5 w-5" strokeWidth={2.5} /> : <Users className="h-5 w-5" strokeWidth={2} />}
                          </div>
                          <p className={`font-semibold text-sm uppercase tracking-wide ${done ? 'text-emerald-600 dark:text-emerald-400' : 'text-brand-midnight dark:text-white'}`}>
                            10 pessoas
                          </p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 uppercase tracking-wider">
                            indicados
                          </p>
                          <p className="mt-auto pt-2 text-xl font-bold tabular-nums text-brand-midnight dark:text-white">
                            {current}/{total}
                          </p>
                        </div>
                      </div>
                    )
                  })()}
                  {/* Card 2: 1 assinante básico */}
                  {(() => {
                    const done = data.mission.mission2Done
                    const current = data.mission.basicSubscribers
                    const total = 1
                    const percent = total ? Math.min(100, current * 100) : 0
                    return (
                      <div
                        className={`relative min-h-[140px] overflow-hidden rounded-xl border-2 transition-all duration-300 ${
                          done
                            ? 'border-emerald-500/60 bg-emerald-500/10 shadow-[0_0_28px_rgba(34,197,94,0.25)]'
                            : 'border-cyan-500/40 bg-white/80 dark:bg-white/5 shadow-[0_0_20px_rgba(6,182,212,0.15)]'
                        }`}
                      >
                        <div
                          className="absolute bottom-0 left-0 right-0 rounded-t-xl transition-all duration-700 ease-out"
                          style={{
                            height: `${percent}%`,
                            background: done
                              ? 'linear-gradient(to top, rgba(34,197,94,0.35), rgba(34,197,94,0.15))'
                              : 'linear-gradient(to top, rgba(6,182,212,0.4), rgba(6,182,212,0.12))',
                          }}
                        />
                        <div className="relative z-10 flex flex-col h-full min-h-[140px] p-4">
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl mb-3 ${
                            done ? 'bg-emerald-500 text-white shadow-lg' : 'bg-cyan-500 text-cyan-950 shadow-[0_0_16px_rgba(6,182,212,0.5)]'
                          }`}>
                            {done ? <Check className="h-5 w-5" strokeWidth={2.5} /> : <UserCheck className="h-5 w-5" strokeWidth={2} />}
                          </div>
                          <p className={`font-semibold text-sm uppercase tracking-wide ${done ? 'text-emerald-600 dark:text-emerald-400' : 'text-brand-midnight dark:text-white'}`}>
                            1 assinante básico
                          </p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 uppercase tracking-wider">
                            com plano básico
                          </p>
                          <p className="mt-auto pt-2 text-xl font-bold tabular-nums text-brand-midnight dark:text-white">
                            {current}/{total}
                          </p>
                        </div>
                      </div>
                    )
                  })()}
                  {/* Card 3: 10 verificaram e usaram Plen */}
                  {(() => {
                    const done = data.mission.mission3Done
                    const current = Math.min(data.mission.verifiedAndUsedPlen, 10)
                    const total = 10
                    const percent = total ? Math.round((current / total) * 100) : 0
                    return (
                      <div
                        className={`relative min-h-[140px] overflow-hidden rounded-xl border-2 transition-all duration-300 ${
                          done
                            ? 'border-emerald-500/60 bg-emerald-500/10 shadow-[0_0_28px_rgba(34,197,94,0.25)]'
                            : 'border-cyan-500/40 bg-white/80 dark:bg-white/5 shadow-[0_0_20px_rgba(6,182,212,0.15)]'
                        }`}
                      >
                        <div
                          className="absolute bottom-0 left-0 right-0 rounded-t-xl transition-all duration-700 ease-out"
                          style={{
                            height: `${percent}%`,
                            background: done
                              ? 'linear-gradient(to top, rgba(34,197,94,0.35), rgba(34,197,94,0.15))'
                              : 'linear-gradient(to top, rgba(6,182,212,0.4), rgba(6,182,212,0.12))',
                          }}
                        />
                        <div className="relative z-10 flex flex-col h-full min-h-[140px] p-4">
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl mb-3 ${
                            done ? 'bg-emerald-500 text-white shadow-lg' : 'bg-cyan-500 text-cyan-950 shadow-[0_0_16px_rgba(6,182,212,0.5)]'
                          }`}>
                            {done ? <Check className="h-5 w-5" strokeWidth={2.5} /> : <Sparkles className="h-5 w-5" strokeWidth={2} />}
                          </div>
                          <p className={`font-semibold text-sm uppercase tracking-wide leading-tight ${done ? 'text-emerald-600 dark:text-emerald-400' : 'text-brand-midnight dark:text-white'}`}>
                            10 verificaram e usaram Plen
                          </p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 uppercase tracking-wider">
                            conta + assistente
                          </p>
                          <p className="mt-auto pt-2 text-xl font-bold tabular-nums text-brand-midnight dark:text-white">
                            {current}/{total}
                          </p>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* Lista de indicados */}
          <div className="bg-white dark:bg-[#252525] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden mb-6">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-white/10 flex items-center gap-2">
              <Users className="w-5 h-5 text-brand-aqua" />
              <span className="font-semibold text-brand-midnight dark:text-white">Pessoas que se cadastraram pelo seu link</span>
            </div>
            <div className="overflow-x-auto">
              {data.referrals.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  Nenhuma indicação ainda. Compartilhe seu link para começar a ganhar!
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-white/5 text-left text-gray-500 dark:text-gray-400">
                      <th className="px-4 py-3 font-medium">Nome</th>
                      <th className="px-4 py-3 font-medium hidden sm:table-cell">Email</th>
                      <th className="px-4 py-3 font-medium">Data e hora</th>
                      <th className="px-4 py-3 font-medium text-center whitespace-nowrap">Verificou conta</th>
                      <th className="px-4 py-3 font-medium text-center whitespace-nowrap">Usou Plen</th>
                      <th className="px-4 py-3 font-medium text-right">Ganho</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.referrals.map((r) => (
                      <tr key={r.referredUserId} className="border-t border-gray-100 dark:border-white/5">
                        <td className="px-4 py-3 text-brand-midnight dark:text-white">{r.referredName}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300 hidden sm:table-cell">{r.referredEmail}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{formatDate(r.createdAt)}</td>
                        <td className="px-4 py-3 text-center">
                          {r.emailVerified ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-medium text-green-600 dark:text-green-400">Sim</span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-gray-200 dark:bg-white/10 px-2 py-0.5 text-xs text-gray-500 dark:text-gray-400">Não</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {r.usedPlen ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-medium text-green-600 dark:text-green-400">Sim</span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-gray-200 dark:bg-white/10 px-2 py-0.5 text-xs text-gray-500 dark:text-gray-400">Não</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-green-600 dark:text-green-400">+ R$ 3,00</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Solicitar saque */}
          <div className="bg-white dark:bg-[#252525] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm p-4 sm:p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Wallet className="w-5 h-5 text-brand-aqua" />
              <span className="font-semibold text-brand-midnight dark:text-white">Solicitar saque</span>
            </div>
            {!data.canWithdraw ? (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800 dark:text-amber-200">Saque disponível a partir de R$ 30,00</p>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    Seu saldo atual é {formatMoney(data.availableBalance)}. Indique mais {Math.ceil((MIN_WITHDRAWAL - data.availableBalance) / VALUE_PER_REFERRAL)} pessoa(s) para liberar o saque.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleWithdraw} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor (R$)</label>
                  <input
                    type="number"
                    min={MIN_WITHDRAWAL}
                    max={data.availableBalance}
                    step="1"
                    value={withdrawForm.amount}
                    onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: Number(e.target.value) || MIN_WITHDRAWAL })}
                    className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 py-2.5 text-brand-midnight dark:text-white"
                  />
                  <p className="text-xs text-gray-500 mt-1">Máximo: {formatMoney(data.availableBalance)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de chave PIX</label>
                  <select
                    value={withdrawForm.pix_key_type}
                    onChange={(e) => setWithdrawForm({ ...withdrawForm, pix_key_type: e.target.value as 'cpf' | 'phone' | 'email' })}
                    className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 py-2.5 text-brand-midnight dark:text-white"
                  >
                    <option value="cpf">CPF</option>
                    <option value="phone">Telefone</option>
                    <option value="email">E-mail</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Chave PIX</label>
                  <input
                    type="text"
                    value={withdrawForm.pix_key_value}
                    onChange={(e) => setWithdrawForm({ ...withdrawForm, pix_key_value: e.target.value })}
                    placeholder={withdrawForm.pix_key_type === 'email' ? 'seu@email.com' : withdrawForm.pix_key_type === 'cpf' ? '000.000.000-00' : '(11) 99999-9999'}
                    className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 py-2.5 text-brand-midnight dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome completo (titular da chave)</label>
                  <input
                    type="text"
                    value={withdrawForm.name}
                    onChange={(e) => setWithdrawForm({ ...withdrawForm, name: e.target.value })}
                    placeholder="Nome como no banco"
                    className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 py-2.5 text-brand-midnight dark:text-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={withdrawLoading || !withdrawForm.pix_key_value.trim() || !withdrawForm.name.trim()}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-brand-aqua text-white px-6 py-2.5 font-medium hover:opacity-90 disabled:opacity-50 transition"
                >
                  {withdrawLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Solicitar saque
                </button>
              </form>
            )}
          </div>

          {/* Regras de participação - padding extra embaixo para o botão Plen não cobrir */}
          <div className="bg-white dark:bg-[#252525] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm p-4 sm:p-6 mb-20 sm:mb-24">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-brand-aqua" />
              <span className="font-semibold text-brand-midnight dark:text-white">Regras de participação</span>
            </div>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li>• Você recebe <strong>R$ 3,00</strong> por cada pessoa que se cadastrar na PleniPay através do seu link único.</li>
              <li>• O saque está disponível a partir de <strong>R$ 30,00</strong> (equivalente a 10 indicações).</li>
              <li>• <strong>Missão para seus ganhos:</strong> (1) Indicar <strong>10 pessoas</strong>; (2) Ter pelo menos <strong>1 assinante básico</strong> entre seus indicados; (3) Ter <strong>10 indicados</strong> que já verificaram a conta e utilizaram a assistente Plen.</li>
              <li>• Ao solicitar o saque, informe a chave PIX (CPF, telefone ou e-mail) e o nome do titular. O pagamento é processado manualmente pela nossa equipe.</li>
              <li>• Indicações válidas são apenas de novos cadastros que utilizarem seu link de indicação.</li>
              <li>• A PleniPay reserva-se o direito de cancelar indicações em caso de fraude ou abuso do programa.</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}
