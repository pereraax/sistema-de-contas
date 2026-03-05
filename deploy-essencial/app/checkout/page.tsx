'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Check, ArrowLeft, Loader2, Smartphone, Receipt, CreditCard, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { createNotification } from '@/components/NotificationBell'
import Sidebar from '@/components/Sidebar'
import MobileMenu from '@/components/MobileMenu'

export default function CheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const plano = searchParams.get('plano') as 'basico' | 'premium' | null

  const [loading, setLoading] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)

  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    metodoPagamento: 'PIX' as 'PIX' | 'BOLETO' | 'CREDIT_CARD',
  })

  useEffect(() => {
    if (!plano || !['basico', 'premium'].includes(plano)) {
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

      const response = await fetch('/api/pagamento/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plano: plano,
          metodoPagamento: formData.metodoPagamento,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao processar pagamento')
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
    basico: 9.90,
    premium: 49.90,
  }

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-midnight via-brand-royal to-brand-midnight">
        <MobileMenu />
        <Sidebar />
        <main className="lg:ml-64 min-h-screen flex items-center justify-center">
          <Loader2 className="animate-spin text-brand-aqua" size={48} />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-midnight via-brand-royal to-brand-midnight">
      <MobileMenu />
      <Sidebar />
      <main className="lg:ml-64 min-h-screen p-4 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => router.push('/upgrade')}
            className="flex items-center gap-2 text-brand-clean/70 hover:text-white mb-6 transition-smooth"
          >
            <ArrowLeft size={20} />
            <span>Voltar</span>
          </button>

          <div className="bg-brand-royal/80 backdrop-blur-sm rounded-3xl p-8 border-2 border-brand-aqua/30 shadow-2xl">
            <h1 className="text-3xl font-display font-bold text-white mb-2">
              Finalizar Assinatura
            </h1>
            <p className="text-brand-clean/70 mb-8">
              Plano {plano === 'basico' ? 'Básico' : 'Premium'} - R$ {valores[plano!].toFixed(2).replace('.', ',')}/mês
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-4 py-3 bg-brand-midnight border border-brand-aqua/30 rounded-xl text-white placeholder-brand-clean/40 focus:outline-none focus:border-brand-aqua transition-smooth"
                  placeholder="Seu nome completo"
                />
              </div>

              {/* CPF */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
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
                  className="w-full px-4 py-3 bg-brand-midnight border border-brand-aqua/30 rounded-xl text-white placeholder-brand-clean/40 focus:outline-none focus:border-brand-aqua transition-smooth"
                />
              </div>

              {/* Método de Pagamento */}
              <div>
                <label className="block text-sm font-medium text-white mb-4">
                  Método de Pagamento *
                </label>
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, metodoPagamento: 'PIX' })}
                    className={`w-full p-4 rounded-xl border-2 transition-smooth flex items-center gap-3 ${
                      formData.metodoPagamento === 'PIX'
                        ? 'border-brand-aqua bg-brand-aqua/20'
                        : 'border-brand-aqua/30 hover:border-brand-aqua/50'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${formData.metodoPagamento === 'PIX' ? 'bg-brand-aqua' : 'bg-brand-midnight'}`}>
                      <Smartphone size={24} className="text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-white">PIX</p>
                      <p className="text-xs text-brand-clean/70">Aprovação imediata</p>
                    </div>
                    {formData.metodoPagamento === 'PIX' && (
                      <Check size={20} className="text-brand-aqua" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, metodoPagamento: 'BOLETO' })}
                    className={`w-full p-4 rounded-xl border-2 transition-smooth flex items-center gap-3 ${
                      formData.metodoPagamento === 'BOLETO'
                        ? 'border-brand-aqua bg-brand-aqua/20'
                        : 'border-brand-aqua/30 hover:border-brand-aqua/50'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${formData.metodoPagamento === 'BOLETO' ? 'bg-brand-aqua' : 'bg-brand-midnight'}`}>
                      <Receipt size={24} className="text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-white">Boleto</p>
                      <p className="text-xs text-brand-clean/70">Vencimento em 3 dias úteis</p>
                    </div>
                    {formData.metodoPagamento === 'BOLETO' && (
                      <Check size={20} className="text-brand-aqua" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, metodoPagamento: 'CREDIT_CARD' })}
                    className={`w-full p-4 rounded-xl border-2 transition-smooth flex items-center gap-3 ${
                      formData.metodoPagamento === 'CREDIT_CARD'
                        ? 'border-brand-aqua bg-brand-aqua/20'
                        : 'border-brand-aqua/30 hover:border-brand-aqua/50'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${formData.metodoPagamento === 'CREDIT_CARD' ? 'bg-brand-aqua' : 'bg-brand-midnight'}`}>
                      <CreditCard size={24} className="text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-white">Cartão de Crédito</p>
                      <p className="text-xs text-brand-clean/70">Aprovação imediata</p>
                    </div>
                    {formData.metodoPagamento === 'CREDIT_CARD' && (
                      <Check size={20} className="text-brand-aqua" />
                    )}
                  </button>
                </div>
              </div>

              {/* Botão de Pagar */}
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-4 bg-brand-aqua text-white rounded-xl font-semibold hover:bg-brand-aqua/90 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>Processando...</span>
                  </>
                ) : (
                  <>
                    <span>Pagar Agora</span>
                    <ArrowLeft size={20} className="rotate-180" />
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

