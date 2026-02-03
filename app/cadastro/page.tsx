'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signUp } from '@/lib/auth'
import { createNotification } from '@/components/NotificationBell'
import { ArrowLeft, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'
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
  const [signUpResult, setSignUpResult] = useState<any>(null) // Armazenar resultado do signUp
  const [erroRateLimit, setErroRateLimit] = useState<string | null>(null) // Armazenar erro de rate limiting
  const [mostrarAvisoCampos, setMostrarAvisoCampos] = useState(false) // Controlar exibição do aviso de campos incompletos
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    whatsapp: '',
  })

  // Estrutura de verificação de email removida temporariamente

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
    // Prevenir comportamento padrão IMEDIATAMENTE para evitar interferência do iOS
    e.preventDefault()
    e.stopPropagation()
    
    // Bloquear qualquer outra ação do navegador
    if (e.nativeEvent) {
      e.nativeEvent.stopImmediatePropagation()
    }
    
    console.log('🚀 ========== FORMULÁRIO SUBMETIDO ==========')
    console.log('📋 Dados do formulário:', formData)
    console.log('📦 Plano selecionado:', plano)
    
    // Verificar se já está carregando (evitar duplo submit)
    if (loading) {
      console.log('⚠️ Já está processando, ignorando submit duplicado')
      return
    }
    
    // Marcar como carregando IMEDIATAMENTE para bloquear cliques adicionais
    setLoading(true)
    
    // Usar requestAnimationFrame para garantir que o estado foi atualizado
    // e processar o submit no próximo frame, evitando interferência do iOS
    requestAnimationFrame(() => {
      processarCadastro()
    })
  }
  
  const processarCadastro = async () => {

    // Validações
    if (!formData.nome.trim()) {
      console.log('Validação falhou: nome vazio')
      setMostrarAvisoCampos(true)
      createNotification('Informe seu nome', 'warning')
      setLoading(false)
      return
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      console.log('Validação falhou: email inválido')
      setMostrarAvisoCampos(true)
      createNotification('Informe um email válido', 'warning')
      setLoading(false)
      return
    }

    // Validação de senha mais robusta
    const senhaErrors = validarSenha(formData.senha)
    if (senhaErrors.length > 0) {
      console.log('Validação falhou:', senhaErrors.join(', '))
      setMostrarAvisoCampos(true)
      createNotification('A senha não atende aos requisitos. Verifique as regras abaixo.', 'warning')
      setLoading(false)
      return
    }

    if (formData.senha !== formData.confirmarSenha) {
      console.log('Validação falhou: senhas não coincidem')
      setMostrarAvisoCampos(true)
      createNotification('As senhas não coincidem', 'warning')
      setLoading(false)
      return
    }

    const whatsappLimpo = formData.whatsapp.replace(/\D/g, '')

    if (!whatsappLimpo || whatsappLimpo.length < 10) {
      console.log('Validação falhou: whatsapp inválido', whatsappLimpo)
      setMostrarAvisoCampos(true)
      createNotification('Informe um WhatsApp válido (com DDD)', 'warning')
      setLoading(false)
      return
    }
    
    // Se passou todas as validações, ocultar aviso
    setMostrarAvisoCampos(false)

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

      console.log('📥 Resultado do signUp recebido:', JSON.stringify(result, null, 2))
      
      // Armazenar resultado para usar no modal
      setSignUpResult(result)

      // Verificar se há erro crítico (usuário não foi criado)
      if (result?.error && !result?.userCreated) {
        console.error('❌ Erro ao criar conta:', result.error)
        createNotification(result.error, 'error')
        setLoading(false)
        return
      }

      // Se usuário foi criado (mesmo com erro de envio de email), continuar
      if (result?.userCreated) {
        console.log('✅ Conta criada com sucesso!')
        
        // Rastrear evento de cadastro no Facebook Pixel
        try {
          const { trackRegistration } = await import('@/lib/facebook-pixel-events')
          trackRegistration()
        } catch (error) {
          console.warn('⚠️ [Facebook Pixel] Erro ao rastrear cadastro:', error)
        }
        
        // Verificar status do email
        if (result.emailConfirmado || result.data?.session) {
          // Email já confirmado - login automático
          console.log('✅ Email confirmado - redirecionando')
          createNotification('Conta criada com sucesso! Redirecionando...', 'success')
          setTimeout(() => {
            router.push('/home')
          }, 1000)
        } else {
          // Email não confirmado - mostrar modal para confirmar
          console.log('📧 Email não confirmado - mostrando modal')
          setEmailCadastrado(formData.email)
          setShowModalConfirmacao(true)
          
          // Mensagem diferente se email não foi enviado
          if (result.emailEnviado === false) {
            createNotification('Conta criada! Houve um problema ao enviar o email. Use o botão "Reenviar link" abaixo.', 'warning')
          } else {
            createNotification('Conta criada! Verifique seu email para confirmar.', 'success')
          }
        }
        
        setLoading(false)
      } else {
        createNotification('Erro ao criar conta. Tente novamente.', 'error')
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
    <div className="min-h-screen bg-neutral-50">
      {/* Header - Igual à página principal */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 max-w-6xl">
          <Link href="/" className="flex items-center flex-shrink-0">
            <Image 
              src="/logo-header.png" 
              alt="PLENIPAY" 
              width={120}
              height={40}
              className="h-9 md:h-10 w-auto object-contain"
              priority
            />
          </Link>
        </div>
      </header>

      {/* Conteúdo - Centralizado, clean */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-md py-8 sm:py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#1e4976] transition-colors mb-5"
          >
            <ArrowLeft size={18} />
            Voltar
          </Link>

          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-[#0D1B2A] mb-1">
              Criar Conta
            </h1>
            <p className="text-sm text-gray-500">
              Plano: <Link href="/planos" className="text-[#1e4976] hover:text-[#163a5f] font-medium">{planosNomes[plano]}</Link>
            </p>
          </div>

          <form 
            onSubmit={(e) => {
              console.log('📝 Form onSubmit disparado')
              handleSubmit(e).catch((error) => {
                console.error('❌ Erro não capturado no handleSubmit:', error)
                createNotification('Erro ao processar formulário. Tente novamente.', 'warning')
                setLoading(false)
              })
            }} 
            className="space-y-3"
            noValidate
            autoComplete="off"
            data-form-type="other"
          >
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Nome Completo *
              </label>
              <input
                type="text"
                required
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#1e4976] focus:ring-2 focus:ring-[#1e4976]/10 transition-all"
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
                autoComplete="email"
                data-form-type="other"
                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#1e4976] focus:ring-2 focus:ring-[#1e4976]/10 transition-all"
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
                  autoComplete="new-password"
                  data-form-type="other"
                  className={`w-full px-3 py-2.5 bg-white border rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none transition-all pr-10 ${
                    formData.senha && !senhaValida
                      ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/10'
                      : formData.senha && senhaValida
                      ? 'border-green-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/10'
                      : 'border-gray-200 focus:border-[#1e4976] focus:ring-2 focus:ring-[#1e4976]/10'
                  }`}
                  placeholder="Digite sua senha"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-[#1e4976] transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              
              {/* Lista de requisitos da senha - Compacta em grid */}
              <div className="mt-1.5 p-3 bg-neutral-50 rounded-xl border border-gray-100">
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
                autoComplete="new-password"
                data-form-type="other"
                className={`w-full px-3 py-2.5 bg-white border rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none transition-all ${
                  senhasNaoCoincidem
                    ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/10'
                    : senhasCoincidem
                    ? 'border-green-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/10'
                    : 'border-gray-200 focus:border-[#1e4976] focus:ring-2 focus:ring-[#1e4976]/10'
                }`}
                placeholder="Confirme sua senha"
              />
              {senhasNaoCoincidem && (
                <div className="mt-1.5 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-xs text-red-700 flex items-start gap-2 font-medium">
                    <span className="text-sm flex-shrink-0">⚠️</span>
                    <span className="flex-1">
                      <strong>As senhas não coincidem!</strong>
                    </span>
                  </p>
                </div>
              )}
              {senhasCoincidem && (
                <div className="mt-1.5 p-3 bg-green-50 border border-green-200 rounded-xl">
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
                  // Ocultar aviso quando começar a preencher
                  if (valorLimpo.length > 0) {
                    setMostrarAvisoCampos(false)
                  }
                }}
                maxLength={15}
                className={`w-full px-3 py-2.5 bg-white border rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                  mostrarAvisoCampos && (!formData.whatsapp || formData.whatsapp.replace(/\D/g, '').length < 10)
                    ? 'border-amber-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10'
                    : 'border-gray-200 focus:border-[#1e4976] focus:ring-2 focus:ring-[#1e4976]/10'
                }`}
                placeholder="(00) 00000-0000"
              />
            </div>

            {/* Mensagem de aviso na parte inferior */}
            {mostrarAvisoCampos && (
              <div className="bg-amber-50 rounded-xl px-4 py-3 border border-amber-100">
                <div className="flex items-start gap-2.5">
                  <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-amber-800 mb-1">
                      Complete todos os campos obrigatórios
                    </p>
                    <p className="text-xs text-amber-700 leading-relaxed">
                      Por favor, preencha todos os campos marcados com * antes de continuar. Verifique especialmente o campo de WhatsApp.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              onClick={(e) => {
                // Forçar submit imediatamente sem esperar pelo gerenciador de senhas do iOS
                // Prevenir qualquer comportamento padrão que possa interferir
                e.preventDefault()
                e.stopPropagation()
                
                // Bloquear propagação imediata
                if (e.nativeEvent) {
                  e.nativeEvent.stopImmediatePropagation()
                }
                
                // Se não está carregando, processar imediatamente
                if (!loading) {
                  // Chamar handleSubmit diretamente, que já previne default e processa
                  handleSubmit(e as any).catch((error) => {
                    console.error('❌ Erro não capturado no handleSubmit:', error)
                    createNotification('Erro ao processar formulário. Tente novamente.', 'warning')
                    setLoading(false)
                  })
                }
              }}
              className="w-full px-4 py-3 bg-gradient-to-r from-[#2c5aa0] via-[#1e4976] to-[#163a5f] hover:from-[#1e4976] hover:via-[#163a5f] hover:to-[#0f2847] text-white rounded-xl text-sm font-semibold transition-all duration-300 shadow-md disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin" size={18} />
                  Criando conta...
                </span>
              ) : (
                'Criar Conta'
              )}
            </button>

            <p className="text-center text-xs text-gray-500 leading-tight">
              Ao criar uma conta, você concorda com nossos{' '}
              <Link href="/termos" className="text-[#1e4976] hover:text-[#163a5f] font-medium">Termos</Link>
              {' '}e{' '}
              <Link href="/privacidade" className="text-[#1e4976] hover:text-[#163a5f] font-medium">Política</Link>
            </p>

            <p className="text-center text-xs text-gray-600">
              Já tem uma conta?{' '}
              <Link href="/login" className="text-[#1e4976] hover:text-[#163a5f] font-medium">
                Fazer login
              </Link>
            </p>
          </form>
        </div>
      </div>

      {/* PARTE 3 & 4: Modal de Confirmação de Email */}
      {showModalConfirmacao && emailCadastrado && (
        <ModalConfirmarEmail
          email={emailCadastrado}
          obrigatorio={false}
          emailJaEnviado={signUpResult?.emailEnviado || false}
          onEmailEnviado={() => {
            // Atualizar signUpResult quando email for reenviado com sucesso
            console.log('✅ [Cadastro] Email reenviado - atualizando signUpResult')
            setSignUpResult((prev: any) => ({
              ...prev,
              emailEnviado: true
            }))
          }}
          onConfirmado={async () => {
            console.log('✅ Email confirmado via callback - fazendo login automático...')
            setShowModalConfirmacao(false)
            
            // Verificar se já está logado (o callback cria sessão automaticamente)
            const supabase = createClient()
            const { data: { session } } = await supabase.auth.getSession()
            
            if (session) {
              createNotification('Email confirmado! Redirecionando...', 'success')
              router.push('/home?emailConfirmed=true')
            } else {
              createNotification('Email confirmado! Faça login para continuar.', 'info')
              setTimeout(() => {
                router.push('/login?mensagem=Email confirmado! Faça login para continuar.')
              }, 1000)
            }
          }}
          onClose={() => {
            setShowModalConfirmacao(false)
            createNotification('Verifique seu email e confirme sua conta antes de fazer login.', 'info')
            setTimeout(() => {
              router.push('/login?mensagem=Verifique seu email para confirmar a conta.')
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
        <Loader2 className="animate-spin text-[#1e4976]" size={48} />
      </div>
    }>
      <CadastroContent />
    </Suspense>
  )
}

