'use client'

import { useState, useEffect } from 'react'
import {
  Wallet,
  Loader2,
  Check,
  X,
  User,
  Copy,
  AlertCircle,
} from 'lucide-react'

type WithdrawalItem = {
  id: string
  user_id: string
  user_name: string
  user_email: string
  amount: number
  pix_key_type: string
  pix_key_value: string
  name: string
  status: string
  created_at: string
  processed_at: string | null
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString('pt-BR', {
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

export default function AfiliadosSaquesPage() {
  const [list, setList] = useState<WithdrawalItem[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  const fetchList = async () => {
    const res = await fetch('/api/admin/affiliate-withdrawals')
    if (!res.ok) return
    const json = await res.json()
    setList(json.list || [])
  }

  useEffect(() => {
    fetchList().finally(() => setLoading(false))
  }, [])

  const markAs = async (id: string, status: 'paid' | 'cancelled') => {
    setUpdating(id)
    try {
      const res = await fetch(`/api/admin/affiliate-withdrawals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) await fetchList()
    } finally {
      setUpdating(null)
    }
  }

  const copyPix = (value: string) => {
    navigator.clipboard.writeText(value)
  }

  const pending = list.filter((r) => r.status === 'pending')
  const done = list.filter((r) => r.status !== 'pending')

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-white" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <Wallet className="w-8 h-8 text-white" />
        <div>
          <h1 className="text-2xl font-bold text-white">Saques de Afiliados</h1>
          <p className="text-white/70 text-sm">Solicitações de saque do programa de indicação. Processe os pagamentos manualmente e marque como pago.</p>
        </div>
      </div>

      {pending.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-400" />
            Pendentes ({pending.length})
          </h2>
          <div className="space-y-4">
            {pending.map((r) => (
              <div
                key={r.id}
                className="bg-white/10 rounded-xl border border-white/20 p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="font-semibold text-white">{r.user_name}</p>
                    <p className="text-sm text-white/70">{r.user_email}</p>
                  </div>
                  <p className="text-xl font-bold text-green-400">{formatMoney(r.amount)}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-white/60">Chave PIX ({r.pix_key_type}):</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-mono">{r.pix_key_value}</span>
                      <button
                        type="button"
                        onClick={() => copyPix(r.pix_key_value)}
                        className="p-1 rounded hover:bg-white/10"
                        title="Copiar"
                      >
                        <Copy className="w-4 h-4 text-white/70" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <span className="text-white/60">Nome titular:</span>
                    <p className="text-white">{r.name}</p>
                  </div>
                </div>
                <p className="text-xs text-white/50 mt-2">Solicitado em: {formatDate(r.created_at)}</p>
                <div className="flex gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => markAs(r.id, 'paid')}
                    disabled={updating === r.id}
                    className="inline-flex items-center gap-2 rounded-lg bg-green-600 hover:bg-green-500 text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
                  >
                    {updating === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Marcar como pago
                  </button>
                  <button
                    type="button"
                    onClick={() => markAs(r.id, 'cancelled')}
                    disabled={updating === r.id}
                    className="inline-flex items-center gap-2 rounded-lg bg-red-900/50 hover:bg-red-900/70 text-red-300 px-4 py-2 text-sm font-medium disabled:opacity-50"
                  >
                    {updating === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                    Cancelar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <User className="w-5 h-5 text-white/70" />
          Histórico ({done.length})
        </h2>
        {done.length === 0 && pending.length === 0 ? (
          <p className="text-white/60">Nenhuma solicitação de saque ainda.</p>
        ) : done.length === 0 ? (
          <p className="text-white/60">Nenhum saque processado ainda.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/10 text-left">
                  <th className="px-4 py-3 font-medium text-white">Afiliado</th>
                  <th className="px-4 py-3 font-medium text-white">Valor</th>
                  <th className="px-4 py-3 font-medium text-white">Chave PIX</th>
                  <th className="px-4 py-3 font-medium text-white">Status</th>
                  <th className="px-4 py-3 font-medium text-white">Data</th>
                </tr>
              </thead>
              <tbody>
                {done.map((r) => (
                  <tr key={r.id} className="border-t border-white/10">
                    <td className="px-4 py-3">
                      <p className="text-white">{r.user_name}</p>
                      <p className="text-white/60 text-xs">{r.user_email}</p>
                    </td>
                    <td className="px-4 py-3 text-white">{formatMoney(r.amount)}</td>
                    <td className="px-4 py-3 text-white/80 font-mono">{r.pix_key_value}</td>
                    <td className="px-4 py-3">
                      <span className={r.status === 'paid' ? 'text-green-400' : 'text-red-400'}>
                        {r.status === 'paid' ? 'Pago' : 'Cancelado'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/60">{formatDate(r.processed_at || r.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
