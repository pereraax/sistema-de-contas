'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signUp } from '@/lib/auth'
import { createNotification } from '@/components/NotificationBell'
import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import ModalConfirmarEmail from '@/components/ModalConfirmarEmail'
import ModalLoginConcluido from '@/components/ModalLoginConcluido'
import { createClient } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

function CadastroContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const plano = (searchParams?.get('plano') as 'teste' | 'basico' | 'premium') || 'teste'
  
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showModalConfirmacao, setShowModalConfirmacao] = useState(false)
  const [showModalLoginConcluido, setShowModalLoginConcluido] = useState(false)
  const [emailCadastrado, setEmailCadastrado] = useState('')
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    whatsapp: '',
  })

  // Debug: monitorar mudanças no estado do modal
  useEffect(() => {
    console.log('🔔 showModalConfirmacao mudou para:', showModalConfirmacao)
    console.log('📧 emailCadastrado:', emailCadastrado)
    console.log('📧 formData.email:', formData.email)
    console.log('✅ Condição para mostrar modal:', showModalConfirmacao && (emailCadastrado || formData.email))
  }, [showModalConfirmacao, emailCadastrado, formData.email])
  
  // Forçar renderização do modal se necessário
  useEffect(() => {
    if (showModalConfirmacao && !emailCadastrado && formData.email) {
      console.log('🔧 Corrigindo: definindo emailCadastrado para garantir que modal apareça')
      setEmailCadastrado(formData.email)
    }
  }, [showModalConfirmacao, emailCadastrado, formData.email])

  const formatarTelefone = (value: string) => {
    const telefone = value.replace(/\D/g, '')
    if (telefone.length <= 11) {
      return telefone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    }
    return value
  }

  // Função para validar senha
  const validarSenha = (senha: string): string[] => {
    const errors: string[] = []
    
    if (senha.length < 8) {
      errors.push('pelo menos 8 caracteres')
    }
    if (!/[A-Z]/.test(senha)) {
      errors.push('uma letra maiúscula')
    }
    if (!/[a-z]/.test(senha)) {
      errors.push('uma letra minúscula')
    }
    if (!/[0-9]/.test(senha)) {
      errors.push('um número')
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(senha)) {
      errors.push('um caractere especial (!@#$%...)')
    }
    
    return errors
  }

  // Verificar requisitos da senha em tempo real
  const requisitosSenha = {
    minimo: formData.senha.length >= 8,
    maiuscula: /[A-Z]/.test(formData.senha),
    minuscula: /[a-z]/.test(formData.senha),
    numero: /[0-9]/.test(formData.senha),
    especial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.senha),
  }
  
  const senhaValida = Object.values(requisitosSenha).every(Boolean)
  
  // Verificar se as senhas coincidem (em tempo real)
  const temSenha = formData.senha.length > 0
  const temConfirmacao = formData.confirmarSenha.length > 0
  const senhasNaoCoincidem = temSenha && temConfirmacao && formData.senha !== formData.confirmarSenha
  const senhasCoincidem = temSenha && temConfirmacao && formData.senha === formData.confirmarSenha

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    console.log('🚀 ========== FORMULÁRIO SUBMETIDO ==========')
    console.log('📋 Dados do formulário:', formData)
    console.log('📦 Plano selecionado:', plano)
    setLoading(true)

    // Validações
    if (!formData.nome.trim()) {
      console.log('Validação falhou: nome vazio')
      createNotification('Informe seu nome', 'warning')
      setLoading(false)
      return
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      console.log('Validação falhou: email inválido')
      createNotification('Informe um email válido', 'warning')
      setLoading(false)
      return
    }

    // Validação de senha mais robusta
    const senhaErrors = validarSenha(formData.senha)
    if (senhaErrors.length > 0) {
      console.log('Validação falhou:', senhaErrors.join(', '))
      createNotification('A senha não atende aos requisitos. Verifique as regras abaixo.', 'warning')
      setLoading(false)
      return
    }

    if (formData.senha !== formData.confirmarSenha) {
      console.log('Validação falhou: senhas não coincidem')
      createNotification('As senhas não coincidem', 'warning')
      setLoading(false)
      return
    }

    const whatsappLimpo = formData.whatsapp.replace(/\D/g, '')

    if (!whatsappLimpo || whatsappLimpo.length < 10) {
      console.log('Validação falhou: whatsapp inválido', whatsappLimpo)
      createNotification('Informe um WhatsApp válido (com DDD)', 'warning')
      setLoading(false)
      return
    }

    console.log('✅ Todas as validações passaram, criando conta...')

    try {
      console.log('📞 Chamando signUp com:', {
        email: formData.email,
        nome: formData.nome,
        whatsapp: whatsappLimpo,
        plano: plano
      })
      
      const result = await signUp(
        formData.email,
        formData.senha,
        formData.nome,
        '', // telefone removido - passar string vazia
        whatsappLimpo,
        plano
      )

      console.log('📥 Resultado do signUp recebido:', result)
      console.log('📥 Tipo do resultado:', typeof result)
      console.log('📥 Result.error:', result?.error)
      console.log('📥 Result.data:', result?.data)
      console.log('📥 Result.emailConfirmado:', result?.emailConfirmado)

      // Verificar se há erro
      if (result?.error) {
        console.error('❌ Erro ao criar conta:', result.error)
        
        // Mensagens de erro mais específicas
        let mensagemErro = result.error
        if (result.error.includes('already registered') || result.error.includes('já está cadastrado')) {
          mensagemErro = 'Este email já está cadastrado. Deseja fazer login?'
        } else if (result.error.includes('rate limit') || result.error.includes('rate_limit') || result.error.includes('email rate limit exceeded')) {
          mensagemErro = 'Limite de envio de emails atingido. Por favor, aguarde 10-15 minutos antes de tentar novamente. O limite é temporário e será resetado automaticamente.'
        } else if (result.error.includes('email')) {
          mensagemErro = 'Erro ao enviar email. Tente novamente em alguns instantes.'
        }
        
        createNotification(mensagemErro, 'warning')
        setLoading(false)
        return
      }

      // Verificar se a conta foi criada com sucesso
      if (result?.data || result?.emailConfirmado !== undefined) {
        console.log('✅ Conta criada com sucesso!')
        console.log('📧 Email cadastrado:', formData.email)
        console.log('📧 Email confirmado?', result?.emailConfirmado)
        
        // Email foi enviado automaticamente pelo Supabase
        // Mostrar modal pedindo para verificar email
        console.log('📧 Email de confirmação foi enviado automaticamente')
        console.log('🔒 Usuário precisa verificar email antes de fazer login')
        
        setLoading(false)
        
        // Garantir que email está definido ANTES de mostrar modal
        console.log('📧 Definindo emailCadastrado:', formData.email)
        setEmailCadastrado(formData.email)
        
        // Aguardar um pouco para garantir que o estado foi atualizado
        setTimeout(() => {
          console.log('🔔 Mostrando modal de confirmação de email...')
          console.log('📧 Email cadastrado definido:', formData.email)
          setShowModalConfirmacao(true)
          console.log('✅ Modal deve estar visível agora')
        }, 100)
        
        createNotification('Conta criada! Verifique seu email para confirmar.', 'success')
      } else {
        console.error('❌ Resultado inesperado do signUp:', result)
        createNotification('Erro ao criar conta. Tente novamente.', 'warning')
        setLoading(false)
      }
    } catch (error: any) {
      console.error('❌ Erro inesperado no try/catch:', error)
      console.error('❌ Stack trace:', error?.stack)
      createNotification('Erro inesperado: ' + (error.message || 'Erro desconhecido'), 'warning')
      setLoading(false)
    }
  }

  const planosNomes = {
    teste: 'Teste Grátis',
    basico: 'Plano Básico',
    premium: 'Plano Premium',
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#00C2FF] via-[#0099CC] to-[#007A99] relative overflow-hidden animate-gradient flex">
      {/* Fundo dinâmico com animação */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-gradient-to-br from-white/20 via-white/5 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }}></div>
        <div className="absolute top-1/2 -right-1/2 w-[200%] h-[200%] bg-gradient-to-br from-white/15 via-white/5 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s', animationDuration: '5s' }}></div>
        <div className="absolute -bottom-1/2 left-1/2 w-[200%] h-[200%] bg-gradient-to-br from-white/10 via-white/5 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '3s', animationDuration: '6s' }}></div>
      </div>

      {/* Lado Esquerdo - Popup do Formulário */}
      <div className="relative z-10 w-full md:w-1/2 flex items-center justify-center p-4 md:p-6 overflow-y-auto">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-white/20 backdrop-blur-sm animate-scale-up">
          <div className="p-5 sm:p-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-[#00C2FF] transition-colors mb-4"
            >
              <ArrowLeft size={18} />
              <span className="text-xs">Voltar para início</span>
            </Link>

            <div className="mb-4 text-center">
              <div className="flex justify-center mb-3">
                <Image 
                  src="/logo azul.png" 
                  alt="PLENIPAY" 
                  width={140}
                  height={32}
                  className="h-8 w-auto object-contain"
                  priority
                />
              </div>
              <h1 className="text-2xl md:text-3xl font-display font-bold text-[#0D1B2A] mb-1">
                Criar Conta
              </h1>
              <p className="text-sm text-gray-600">
                Plano selecionado: <span className="text-[#00C2FF] font-semibold">{planosNomes[plano]}</span>
              </p>
            </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Nome Completo *
              </label>
              <input
                type="text"
                required
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#00C2FF] focus:ring-1 focus:ring-[#00C2FF]/20 transition-all"
                placeholder="Seu nome completo"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#00C2FF] focus:ring-1 focus:ring-[#00C2FF]/20 transition-all"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Senha *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.senha}
                  onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                  className={`w-full px-3 py-2 bg-white border rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none transition-all pr-10 ${
                    formData.senha && !senhaValida
                      ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500/20'
                      : formData.senha && senhaValida
                      ? 'border-green-500 focus:border-green-500 focus:ring-1 focus:ring-green-500/20'
                      : 'border-gray-300 focus:border-[#00C2FF] focus:ring-1 focus:ring-[#00C2FF]/20'
                  }`}
                  placeholder="Digite sua senha"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-[#00C2FF] transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              
              {/* Lista de requisitos da senha - Compacta em grid */}
              <div className="mt-1.5 p-2 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs font-semibold text-gray-700 mb-1.5">Requisitos da senha:</p>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                  <li className={`flex items-center gap-1.5 text-xs list-none ${requisitosSenha.minimo ? 'text-green-600' : 'text-gray-500'}`}>
                    <span className="text-xs">{requisitosSenha.minimo ? '✓' : '○'}</span>
                    <span>8+ caracteres</span>
                  </li>
                  <li className={`flex items-center gap-1.5 text-xs list-none ${requisitosSenha.maiuscula ? 'text-green-600' : 'text-gray-500'}`}>
                    <span className="text-xs">{requisitosSenha.maiuscula ? '✓' : '○'}</span>
                    <span>Maiúscula (A-Z)</span>
                  </li>
                  <li className={`flex items-center gap-1.5 text-xs list-none ${requisitosSenha.minuscula ? 'text-green-600' : 'text-gray-500'}`}>
                    <span className="text-xs">{requisitosSenha.minuscula ? '✓' : '○'}</span>
                    <span>Minúscula (a-z)</span>
                  </li>
                  <li className={`flex items-center gap-1.5 text-xs list-none ${requisitosSenha.numero ? 'text-green-600' : 'text-gray-500'}`}>
                    <span className="text-xs">{requisitosSenha.numero ? '✓' : '○'}</span>
                    <span>Número (0-9)</span>
                  </li>
                  <li className={`flex items-center gap-1.5 text-xs list-none col-span-2 ${requisitosSenha.especial ? 'text-green-600' : 'text-gray-500'}`}>
                    <span className="text-xs">{requisitosSenha.especial ? '✓' : '○'}</span>
                    <span>Caractere especial (!@#$%...)</span>
                  </li>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Confirmar Senha *
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.confirmarSenha}
                onChange={(e) => setFormData({ ...formData, confirmarSenha: e.target.value })}
                className={`w-full px-3 py-2 bg-white border rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none transition-all ${
                  senhasNaoCoincidem
                    ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500/20'
                    : senhasCoincidem
                    ? 'border-green-500 focus:border-green-500 focus:ring-1 focus:ring-green-500/20'
                    : 'border-gray-300 focus:border-[#00C2FF] focus:ring-1 focus:ring-[#00C2FF]/20'
                }`}
                placeholder="Confirme sua senha"
              />
              {senhasNaoCoincidem && (
                <div className="mt-1.5 p-2 bg-red-50 border border-red-500 rounded-lg">
                  <p className="text-xs text-red-700 flex items-start gap-2 font-medium">
                    <span className="text-sm flex-shrink-0">⚠️</span>
                    <span className="flex-1">
                      <strong>As senhas não coincidem!</strong>
                    </span>
                  </p>
                </div>
              )}
              {senhasCoincidem && (
                <div className="mt-1.5 p-2 bg-green-50 border border-green-500 rounded-lg">
                  <p className="text-xs text-green-700 flex items-center gap-1.5 font-semibold">
                    <span className="text-sm">✓</span>
                    <span>Senhas coincidem</span>
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                WhatsApp *
              </label>
              <input
                type="text"
                required
                value={formatarTelefone(formData.whatsapp)}
                onChange={(e) => {
                  const valorLimpo = e.target.value.replace(/\D/g, '')
                  setFormData({ ...formData, whatsapp: valorLimpo })
                }}
                maxLength={15}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#00C2FF] focus:ring-1 focus:ring-[#00C2FF]/20 transition-all"
                placeholder="(00) 00000-0000"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              onClick={(e) => {
                console.log('Botão clicado!')
                // Não prevenir default aqui, deixar o form onSubmit fazer isso
              }}
              className="w-full px-4 py-2.5 bg-gradient-to-r from-[#00C2FF] via-[#00B8F5] to-[#0099CC] hover:from-[#00B8F5] hover:via-[#00C2FF] hover:to-[#00A8E6] text-white rounded-lg text-sm font-semibold transition-all duration-300 shadow-md hover:shadow-2xl hover:shadow-[#00C2FF]/50 transform hover:scale-105 active:scale-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mt-2"
            >
              {loading ? 'Criando conta...' : 'Criar Conta'}
            </button>

            <p className="text-center text-xs text-gray-500 leading-tight">
              Ao criar uma conta, você concorda com nossos{' '}
              <Link href="/termos" className="text-[#00C2FF] hover:underline">Termos</Link>
              {' '}e{' '}
              <Link href="/privacidade" className="text-[#00C2FF] hover:underline">Política</Link>
            </p>

            <p className="text-center text-xs text-gray-600">
              Já tem uma conta?{' '}
              <Link href="/login" className="text-[#00C2FF] hover:underline font-medium">
                Fazer login
              </Link>
            </p>
          </form>
          </div>
        </div>
      </div>

      {/* Lado Direito - Imagem */}
      <div className="hidden md:flex md:w-1/2 relative overflow-hidden">
        <Image
          src="/banner cadastro.png"
          alt="Banner PLENIPAY"
          fill
          className="object-cover"
          priority
          unoptimized
        />
      </div>

      {/* Modal de Confirmação de Email - REMOVIDO: não aparece mais após cadastro */}
      {/* O modal só aparece quando o usuário clica "Verificar agora" no perfil */}
      {/* Modal de Confirmação de Email - Aparece após criar conta */}
      {showModalConfirmacao && (emailCadastrado || formData.email) && (
        <ModalConfirmarEmail
          email={emailCadastrado || formData.email}
          obrigatorio={false}
          emailJaEnviado={true}
          onConfirmado={() => {
            console.log('✅ Email confirmado via callback - redirecionando para home...')
            setShowModalConfirmacao(false)
            // Redirecionar para home quando email for confirmado (após clicar no link)
            router.push('/home?emailConfirmed=true')
          }}
          onClose={() => {
            // Permitir fechar o modal - usuário pode verificar depois
            console.log('⚠️ Modal fechado - usuário pode verificar email depois')
            setShowModalConfirmacao(false)
            // Redirecionar para login informando que precisa verificar email
            createNotification('Conta criada! Verifique seu email para confirmar antes de fazer login.', 'info')
            setTimeout(() => {
              router.push('/login?mensagem=Verifique seu email para confirmar a conta antes de fazer login.')
            }, 1000)
          }}
        />
      )}

      {/* Popup de Login Concluído */}
      <ModalLoginConcluido
        isOpen={showModalLoginConcluido}
        onClose={() => {
          setShowModalLoginConcluido(false)
          // Redirecionar para home após fechar o popup
          window.location.href = '/home'
        }}
      />
      
    </div>
  )
}

export default function CadastroPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-[#00C2FF]" size={48} />
      </div>
    }>
      <CadastroContent />
    </Suspense>
  )
}

