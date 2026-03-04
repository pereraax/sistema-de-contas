'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { criarUsuario } from '@/lib/actions'
import { User, Loader2, X } from 'lucide-react'

/**
 * Popup exibido automaticamente quando o usuário cria conta e ainda não tem
 * nenhum "usuário" (pessoa) na tabela users — ou seja, é o primeiro acesso.
 * Pede nome/usuário para criar o primeiro e único dono da conta.
 */
export default function WelcomeOwnerPopup() {
  const [open, setOpen] = useState(false)
  const [checking, setChecking] = useState(true)
  const [nome, setNome] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const check = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (cancelled || !user) {
        setChecking(false)
        return
      }
      const { data: users, error: err } = await supabase
        .from('users')
        .select('id')
        .eq('account_owner_id', user.id)
      if (cancelled) return
      if (err) {
        setChecking(false)
        return
      }
      if (users && users.length === 0) {
        setOpen(true)
      }
      setChecking(false)
    }
    check()
    return () => { cancelled = true }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = nome.trim()
    if (!trimmed) {
      setError('Digite seu nome ou como quer ser chamado.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const formData = new FormData()
      formData.set('nome', trimmed)
      const result = await criarUsuario(formData)
      if (result?.error) {
        setError(result.error)
        setLoading(false)
        return
      }
      setOpen(false)
      window.dispatchEvent(new CustomEvent('plenipay:owner-created'))
    } catch {
      setError('Algo deu errado. Tente de novo.')
    } finally {
      setLoading(false)
    }
  }

  if (checking || !open) return null

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-fade-in overflow-y-auto"
      onClick={() => {}}
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
    >
      <div
        className="relative bg-white dark:bg-[#0f1419] rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-white/10 dark:border-white/10 animate-slide-up my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-brand-midnight/70 dark:text-brand-clean/70"
          aria-label="Fechar"
        >
          <X size={22} strokeWidth={2} />
        </button>

        {/* Logo + título centralizados */}
        <div className="pt-10 pb-6 px-6 text-center">
          <div className="flex justify-center mb-5">
            <Image
              src="/logo-header.png"
              alt="PleniPay"
              width={120}
              height={44}
              className="h-11 w-auto object-contain opacity-95 dark:opacity-90"
              priority
            />
          </div>
          <h2 id="welcome-title" className="text-xl font-semibold tracking-tight text-brand-midnight dark:text-white">
            Bem-vindo ao PleniPay
          </h2>
          <p className="text-sm text-brand-midnight/70 dark:text-white/60 mt-2">
            Como quer ser chamado na sua conta?
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 pb-8 space-y-5">
          <div className="text-center">
            <label htmlFor="welcome-owner-nome" className="block text-sm font-medium text-brand-midnight dark:text-brand-clean/90 mb-3">
              Seu nome ou usuário
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-midnight/40 dark:text-brand-clean/40" strokeWidth={2} />
              <input
                id="welcome-owner-nome"
                type="text"
                value={nome}
                onChange={(e) => { setNome(e.target.value); setError(null) }}
                placeholder="Ex: Maria, João ou @maria"
                autoFocus
                autoComplete="name"
                maxLength={80}
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-200 dark:border-white/15 bg-gray-50/50 dark:bg-white/5 text-brand-midnight dark:text-brand-clean placeholder:text-gray-400 dark:placeholder:text-brand-clean/40 focus:border-brand-aqua focus:ring-2 focus:ring-brand-aqua/25 outline-none transition-all"
                disabled={loading}
              />
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-500 dark:text-red-400 text-center" role="alert">
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-2xl bg-brand-aqua hover:bg-brand-aqua/90 dark:bg-brand-aqua dark:hover:bg-brand-aqua/90 text-white font-semibold transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-brand-aqua/20"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Salvando…
              </>
            ) : (
              'Continuar'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
