'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Check, ArrowLeft, Loader2, Smartphone, Receipt, CreditCard } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { createNotification } from '@/components/NotificationBell'
import Sidebar from '@/components/Sidebar'
import { MenuButton } from '@/components/MobileMenu'
import Logo from '@/components/Logo'

export const dynamic = 'force-dynamic'

function CheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const plano = searchParams?.get('plano') as 'basico' | 'premium' | 'anual' | null

  const [loading, setLoading] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)

  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    metodoPagamento: 'PIX' as 'PIX' | 'BOLETO' | 'CREDIT_CARD',
  })

  useEffect(() => {
    if (!plano || !['basico', 'premium', 'anual'].includes(plano)) {
      createNotification('Plano inválido', 'warning')
      router.push('/upgrade')
      return
    }

    carregarPerfil()
  }, [plano, router])

  const carregarPerfil = async () => {
    setLoadingProfile(true)
    try {
      const supabase = createClient()
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        createNotification('Erro: usuário não autenticado', 'warning')
        router.push('/login')
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Erro ao buscar perfil:', profileError)
        createNotification('Erro ao carregar perfil', 'warning')
        setLoadingProfile(false)
        return
      }

      setUserProfile(profile)
      setFormData({
        nome: profile.nome || '',
        cpf: profile.cpf || '',
        metodoPagamento: 'PIX',
      })
    } catch (error: any) {
      console.error('Erro ao carregar perfil:', error)
      createNotification('Erro ao carregar dados', 'warning')
    } finally {
      setLoadingProfile(false)
    }
  }

  const formatarCPF = (value: string) => {
    const cpf = value.replace(/\D/g, '')
    if (cpf.length <= 11) {
      return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    }
    return value
  }

  const validarCPF = (cpf: string): boolean => {
    const cpfLimpo = cpf.replace(/\D/g, '')
    
    // Verificar se tem 11 dígitos
    if (cpfLimpo.length !== 11) return false
    
    // Verificar se todos os dígitos são iguais (ex: 111.111.111-11, 999.999.999-99)
    if (/^(\d)\1{10}$/.test(cpfLimpo)) return false
    
    // Validar dígitos verificadores
    let soma = 0
    let resto
    
    for (let i = 1; i <= 9; i++) {
      soma += parseInt(cpfLimpo.substring(i - 1, i)) * (11 - i)
    }
    resto = (soma * 10) % 11
    if (resto === 10 || resto === 11) resto = 0
    if (resto !== parseInt(cpfLimpo.substring(9, 10))) return false
    
    soma = 0
    for (let i = 1; i <= 10; i++) {
      soma += parseInt(cpfLimpo.substring(i - 1, i)) * (12 - i)
    }
    resto = (soma * 10) % 11
    if (resto === 10 || resto === 11) resto = 0
    if (resto !== parseInt(cpfLimpo.substring(10, 11))) return false
    
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nome.trim()) {
      createNotification('Nome é obrigatório', 'warning')
      return
    }

    const cpfLimpo = formData.cpf.replace(/\D/g, '')
    if (cpfLimpo.length !== 11) {
      createNotification('CPF inválido. Digite um CPF com 11 dígitos.', 'warning')
      return
    }
    
    // Validar CPF
    if (!validarCPF(formData.cpf)) {
      createNotification('CPF inválido. Verifique os dígitos informados.', 'warning')
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        createNotification('Erro: usuário não autenticado', 'warning')
        return
      }

      // Atualizar perfil com nome e CPF
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          nome: formData.nome,
          cpf: cpfLimpo,
        })
        .eq('id', user.id)

      if (updateError) {
        console.error('Erro ao atualizar perfil:', updateError)
        createNotification('Erro ao salvar dados: ' + updateError.message, 'warning')
        setLoading(false)
        return
      }

      // Processar pagamento
      console.log('💳 Processando pagamento...', {
        plano,
        metodoPagamento: formData.metodoPagamento,
      })

      console.log('💳 Enviando requisição de checkout...', {
        plano,
        metodoPagamento: formData.metodoPagamento,
      })

      let response: Response
      let data: any

      try {
        response = await fetch('/api/pagamento/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            plano: plano,
            metodoPagamento: formData.metodoPagamento,
          }),
        })

        console.log('📡 Resposta recebida:', {
          status: response.status,
          ok: response.ok,
          statusText: response.statusText,
        })

        // Tentar parsear JSON
        try {
          data = await response.json()
        } catch (parseError) {
          const textResponse = await response.text()
          console.error('❌ Erro ao parsear JSON:', parseError, 'Resposta:', textResponse)
          throw new Error('Resposta inválida do servidor. Tente novamente.')
        }

        console.log('📦 Dados recebidos:', {
          success: data.success,
          hasSubscriptionId: !!data.subscriptionId,
          hasPixQrCode: !!data.pixQrCode,
          hasPixCopyPaste: !!data.pixCopyPaste,
          metodoPagamento: data.metodoPagamento,
          error: data.error,
        })

        if (!response.ok) {
          console.error('❌ Erro na resposta:', data)
          throw new Error(data.error || 'Erro ao processar pagamento')
        }
      } catch (fetchError: any) {
        console.error('❌ Erro na requisição fetch:', fetchError)
        throw new Error(fetchError.message || 'Erro ao conectar com o servidor. Verifique sua conexão.')
      }

      // Se for PIX, SEMPRE redirecionar para página de pagamento (mesmo sem QR code, a página busca depois)
      if (data.metodoPagamento === 'PIX' || formData.metodoPagamento === 'PIX') {
        console.log('💳 Redirecionando para PIX:', {
          subscriptionId: data.subscriptionId,
          hasQrCode: !!data.pixQrCode,
          hasCopyPaste: !!data.pixCopyPaste,
        })
        
        if (!data.subscriptionId) {
          throw new Error('Subscription ID não retornado. Tente novamente.')
        }
        
        const params = new URLSearchParams({
          subscriptionId: data.subscriptionId,
          plano: data.plano || plano || '',
        })
        if (data.pixQrCode) params.set('pixQrCode', data.pixQrCode)
        if (data.pixCopyPaste) params.set('pixCopyPaste', data.pixCopyPaste)
        
        console.log('🌐 Redirecionando para:', `/pagamento/pix?${params.toString()}`)
        window.location.href = `/pagamento/pix?${params.toString()}`
        return // Não continuar após redirecionamento
      } else if (data.paymentUrl) {
        window.location.href = data.paymentUrl
      } else {
        createNotification('Checkout criado com sucesso!', 'success')
        router.push('/home')
      }
    } catch (error: any) {
      console.error('Erro no checkout:', error)
      createNotification('Erro ao processar pagamento: ' + error.message, 'warning')
    } finally {
      setLoading(false)
    }
  }

  const valores = {
    basico: 29.90,
    premium: 49.90,
    anual: 197.00,
  }

  const planosNomes = {
    basico: 'Básico',
    premium: 'Premium',
    anual: 'Anual',
  }

  if (loadingProfile) {
    return (
<div className="min-h-screen bg-white dark:bg-[#1A1A1A]">
      <Sidebar />
      <main className="lg:ml-64 min-h-screen flex items-center justify-center">
          <Loader2 className="animate-spin text-[#1e4976] dark:text-brand-aqua" size={48} />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#1A1A1A]">
      <Sidebar />
      <main className="lg:ml-64 min-h-screen p-4 lg:p-6 dark:bg-[#1A1A1A]">
        {/* Header Mobile */}
        <div className="lg:hidden pt-4 pb-4 px-3 sm:px-4 bg-white dark:bg-[#1A1A1A] border-b border-gray-200 dark:border-white/10 mb-4">
          <div className="flex justify-center mb-4">
            <div className="w-40 sm:w-52">
              <Logo />
            </div>
          </div>
          <div className="flex items-center gap-3 px-3">
            <MenuButton />
            <h1 className="text-xl sm:text-2xl font-display font-bold text-[#0D1B2A] dark:text-white leading-none">
              Finalizar Assinatura
            </h1>
          </div>
        </div>

        <div className="max-w-xl mx-auto">
          <button
            onClick={() => router.push('/upgrade')}
            className="flex items-center gap-2 text-gray-600 hover:text-[#1e4976] mb-4 transition-colors"
          >
            <ArrowLeft size={18} />
            <span className="text-sm">Voltar</span>
          </button>

          <div className="bg-white rounded-xl p-5 sm:p-6 shadow-lg border border-gray-200">
            <h1 className="text-2xl font-display font-bold text-[#0D1B2A] mb-1">
              Finalizar Assinatura
            </h1>
            <p className="text-gray-600 text-sm mb-6">
              Plano {planosNomes[plano!]} - R$ {valores[plano!].toFixed(2).replace('.', ',')}{plano === 'anual' ? '/ano' : '/mês'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#1e4976] focus:ring-2 focus:ring-[#1e4976]/20 transition-smooth text-sm"
                  placeholder="Seu nome completo"
                />
              </div>

              {/* CPF */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  CPF *
                </label>
                <input
                  type="text"
                  required
                  value={formData.cpf}
                  onChange={(e) => {
                    const formatted = formatarCPF(e.target.value)
                    setFormData({ ...formData, cpf: formatted })
                  }}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#1e4976] focus:ring-2 focus:ring-[#1e4976]/20 transition-smooth text-sm"
                />
              </div>

              {/* Método de Pagamento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Método de Pagamento *
                </label>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, metodoPagamento: 'PIX' })}
                    className={`w-full p-3 rounded-lg border-2 transition-all flex items-center gap-3 ${
                      formData.metodoPagamento === 'PIX'
                        ? 'border-[#1e4976] bg-[#1e4976]/10'
                        : 'border-gray-200 hover:border-[#1e4976]/50 bg-white'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${formData.metodoPagamento === 'PIX' ? 'bg-[#1e4976]' : 'bg-gray-100'}`}>
                      <Smartphone size={20} className="text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-gray-900 text-sm">PIX</p>
                      <p className="text-xs text-gray-500">Aprovação imediata</p>
                    </div>
                    {formData.metodoPagamento === 'PIX' && (
                      <Check size={18} className="text-[#1e4976]" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, metodoPagamento: 'BOLETO' })}
                    className={`w-full p-3 rounded-lg border-2 transition-all flex items-center gap-3 ${
                      formData.metodoPagamento === 'BOLETO'
                        ? 'border-[#1e4976] bg-[#1e4976]/10'
                        : 'border-gray-200 hover:border-[#1e4976]/50 bg-white'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${formData.metodoPagamento === 'BOLETO' ? 'bg-[#1e4976]' : 'bg-gray-100'}`}>
                      <Receipt size={20} className="text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-gray-900 text-sm">Boleto</p>
                      <p className="text-xs text-gray-500">Vencimento em 3 dias úteis</p>
                    </div>
                    {formData.metodoPagamento === 'BOLETO' && (
                      <Check size={18} className="text-[#1e4976]" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, metodoPagamento: 'CREDIT_CARD' })}
                    className={`w-full p-3 rounded-lg border-2 transition-all flex items-center gap-3 ${
                      formData.metodoPagamento === 'CREDIT_CARD'
                        ? 'border-[#1e4976] bg-[#1e4976]/10'
                        : 'border-gray-200 hover:border-[#1e4976]/50 bg-white'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${formData.metodoPagamento === 'CREDIT_CARD' ? 'bg-[#1e4976]' : 'bg-gray-100'}`}>
                      <CreditCard size={20} className="text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-gray-900 text-sm">Cartão de Crédito</p>
                      <p className="text-xs text-gray-500">Aprovação imediata</p>
                    </div>
                    {formData.metodoPagamento === 'CREDIT_CARD' && (
                      <Check size={18} className="text-[#1e4976]" />
                    )}
                  </button>
                </div>
              </div>

              {/* Botão de Pagar */}
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-3 bg-gradient-to-r from-[#2c5aa0] via-[#1e4976] to-[#163a5f] hover:from-[#1e4976] hover:via-[#163a5f] hover:to-[#0f2847] text-white rounded-lg font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm shadow-md hover:shadow-lg"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Processando...</span>
                  </>
                ) : (
                  <>
                    <span>Pagar Agora</span>
                    <ArrowLeft size={18} className="rotate-180" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="animate-spin text-[#1e4976]" size={48} />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}
