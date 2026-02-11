'use client'

import { useState, useEffect } from 'react'
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
  Gift,
  ArrowRight,
  FileText,
  Banknote,
  AlertCircle,
} from 'lucide-react'
import { createNotification } from '@/components/NotificationBell'

export const dynamic = 'force-dynamic'

const MIN_WITHDRAWAL = 30
const VALUE_PER_REFERRAL = 3

type AffiliateData = {
  code: string
  link: string
  referrals: { referredUserId: string; referredName: string; referredEmail: string; createdAt: string }[]
  totalEarned: number
  totalWithdrawn: number
  availableBalance: number
  canWithdraw: boolean
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

          {/* Hero */}
          <div className="rounded-2xl bg-gradient-to-br from-brand-aqua/15 to-brand-midnight/10 dark:from-brand-aqua/20 dark:to-brand-midnight/20 border border-brand-aqua/20 p-6 sm:p-8 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Gift className="w-8 h-8 text-brand-aqua" />
              <h2 className="text-lg font-semibold text-brand-midnight dark:text-white">Programa de Afiliados PleniPay</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
              Indique amigos e ganhe <strong>R$ 3,00</strong> por cada cadastro realizado pelo seu link. Quanto mais indicar, mais você ganha!
            </p>
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
                      <th className="px-4 py-3 font-medium text-right">Ganho</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.referrals.map((r) => (
                      <tr key={r.referredUserId} className="border-t border-gray-100 dark:border-white/5">
                        <td className="px-4 py-3 text-brand-midnight dark:text-white">{r.referredName}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300 hidden sm:table-cell">{r.referredEmail}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{formatDate(r.createdAt)}</td>
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
