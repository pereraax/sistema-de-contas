'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createNotification } from '@/components/NotificationBell'
import { Eye, EyeOff, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import ModalEmailConfirmadoSucesso from '@/components/ModalEmailConfirmadoSucesso'
import ModalLoginConcluido from '@/components/ModalLoginConcluido'

export const dynamic = 'force-dynamic'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showModalLoginConcluido, setShowModalLoginConcluido] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    senha: '',
  })

  // Detectar modo escuro/claro
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark')
      setIsDarkMode(isDark)
    }
    
    checkDarkMode()
    
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })
    
    return () => observer.disconnect()
  }, [])

  // Carregar estado do "Lembrar-me" do localStorage
  useEffect(() => {
    const savedRememberMe = localStorage.getItem('rememberMe') === 'true'
    setRememberMe(savedRememberMe)
    
    if (savedRememberMe) {
      const savedEmail = localStorage.getItem('savedEmail')
      if (savedEmail) {
        setFormData(prev => ({ ...prev, email: savedEmail }))
      }
    }
  }, [])

  // Salvar estado do "Lembrar-me" no localStorage
  useEffect(() => {
    if (rememberMe) {
      localStorage.setItem('rememberMe', 'true')
    } else {
      localStorage.removeItem('rememberMe')
      localStorage.removeItem('savedEmail')
    }
  }, [rememberMe])

  // Mostrar mensagem da URL se existir (vindo do cadastro)
  useEffect(() => {
    const mensagem = searchParams?.get('mensagem')
    if (mensagem) {
      createNotification(mensagem, 'info')
      // Remover parâmetro da URL para não mostrar novamente
      router.replace('/login')
    }
  }, [searchParams, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage(null) // Limpar erro anterior

    if (!formData.email.trim() || !formData.email.includes('@')) {
      const msg = 'Informe um email válido'
      setErrorMessage(msg)
      createNotification(msg, 'warning')
      setLoading(false)
      return
    }

    if (!formData.senha.trim()) {
      const msg = 'Informe sua senha'
      setErrorMessage(msg)
      createNotification(msg, 'warning')
      setLoading(false)
      return
    }

    try {
      console.log('🔄 Iniciando login diretamente no cliente...')
      
      // IMPORTANTE: Fazer login diretamente no cliente para garantir que os cookies sejam salvos
      const supabase = createClient()
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.senha,
      })

      if (error) {
        console.error('❌ Erro no login:', error)
        console.error('❌ Código do erro:', error.status)
        console.error('❌ Mensagem do erro:', error.message)
        console.error('❌ Objeto completo do erro:', JSON.stringify(error, null, 2))
        
        let mensagemErro = 'Email ou senha incorretos'
        
        // Verificar diferentes tipos de erro do Supabase
        const errorMessage = (error.message || '').toLowerCase()
        const errorStatus = error.status || 0
        
        // Verificar também o código de erro do Supabase
        const errorCode = (error as any).code || ''
        
        console.log('🔍 Verificando erro - Message:', errorMessage, 'Status:', errorStatus, 'Code:', errorCode)
        
        // IMPORTANTE: Se email não estiver confirmado, BLOQUEAR login
        if (errorMessage.includes('email not confirmed') || 
            errorMessage.includes('email_not_confirmed') ||
            errorCode === 'email_not_confirmed') {
          // Email não foi confirmado - BLOQUEAR login
          console.log('🔒 Email não confirmado - Login bloqueado')
          mensagemErro = 'Por favor, confirme seu email antes de fazer login. Verifique sua caixa de entrada (incluindo spam).'
          setErrorMessage(mensagemErro)
          createNotification(mensagemErro, 'warning')
          setLoading(false)
          return
        } else if (errorMessage.includes('invalid login credentials') || 
            errorMessage.includes('invalid_credentials') ||
            errorMessage.includes('invalid email or password') ||
            errorMessage.includes('wrong password') ||
            errorCode === 'invalid_credentials') {
          mensagemErro = 'Email ou senha incorretos. Verifique suas credenciais e tente novamente.'
          
          setErrorMessage(mensagemErro)
          createNotification(mensagemErro, 'warning')
          setLoading(false)
          return
        } else if (errorMessage.includes('too many requests') || 
                   errorMessage.includes('rate_limit')) {
          mensagemErro = 'Muitas tentativas de login. Aguarde alguns minutos e tente novamente.'
          
          setErrorMessage(mensagemErro)
          createNotification(mensagemErro, 'warning')
          setLoading(false)
          return
        } else if (errorMessage.includes('user not found') ||
                   errorMessage.includes('no user found')) {
          mensagemErro = 'Email ou senha incorretos. Verifique suas credenciais e tente novamente.'
          
          setErrorMessage(mensagemErro)
          createNotification(mensagemErro, 'warning')
          setLoading(false)
          return
        } else {
          // Para outros erros 400, verificar se é email não confirmado
          if (errorStatus === 400) {
            // Pode ser email não confirmado ou outro erro
            mensagemErro = 'Erro ao fazer login. Verifique se seu email foi confirmado ou suas credenciais estão corretas.'
          } else {
            // Para outros erros, usar mensagem genérica mas clara
            mensagemErro = 'Email ou senha incorretos. Verifique suas credenciais e tente novamente.'
          }
          
          console.log('📢 Exibindo notificação:', mensagemErro)
          
          setErrorMessage(mensagemErro)
          createNotification(mensagemErro, 'warning')
          setLoading(false)
          return
        }
      }

      if (!data.user) {
        console.error('❌ Usuário não retornado')
        createNotification('Erro ao fazer login. Tente novamente.', 'warning')
        setLoading(false)
        return
      }

      // Verificar se email foi confirmado
      console.log('📧 Email confirmado?', !!data.user.email_confirmed_at)
      
      // Se veio do callback de confirmação, garantir que o estado está atualizado
      const emailConfirmed = searchParams?.get('emailConfirmed')
      if (emailConfirmed === 'true') {
        console.log('✅ Login após confirmação de email - estado deve estar atualizado')
      }

      console.log('✅ Login bem-sucedido!')
      console.log('👤 User ID:', data.user.id)
      console.log('🔐 Session:', data.session ? 'existe' : 'não existe')
      
      // Salvar email se "Lembrar-me" estiver marcado
      if (rememberMe) {
        localStorage.setItem('savedEmail', formData.email)
      } else {
        localStorage.removeItem('savedEmail')
      }
      
      if (!data.session) {
        console.error('❌ Nenhuma sessão retornada!')
        createNotification('Erro: Sessão não foi criada. Tente novamente.', 'warning')
        setLoading(false)
        return
      }
      
      // IMPORTANTE: Forçar refresh da página para garantir que o middleware reconheça a sessão
      // O Supabase SSR salva os cookies automaticamente, mas pode levar um momento
      console.log('⏳ Aguardando 1s para garantir que cookies foram salvos...')
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Verificar cookies
      const cookies = document.cookie
      console.log('🍪 Cookies salvos:', cookies.length > 0 ? 'sim' : 'não')
      console.log('🍪 Lista:', cookies.split(';').map(c => c.trim().split('=')[0]).filter(Boolean).join(', ') || 'nenhum')
      
      // Verificar se a sessão foi salva
      const { data: { user: verifiedUser }, error: verifyError } = await supabase.auth.getUser()
      
      if (verifyError) {
        console.error('❌ Erro ao verificar sessão:', verifyError)
      }
      
      if (!verifiedUser) {
        console.error('❌ Sessão não foi salva - tentando salvar manualmente...')
        
        // Tentar salvar manualmente
        try {
          const { error: setError } = await supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          })
          
          if (setError) {
            console.error('❌ Erro ao salvar manualmente:', setError)
            createNotification('Erro ao salvar sessão. Tente novamente.', 'warning')
            setLoading(false)
            return
          }
          
          console.log('✅ Sessão salva manualmente')
          
          // Verificar novamente
          const { data: { user: reVerified } } = await supabase.auth.getUser()
          if (!reVerified) {
            console.error('❌ Ainda não funcionou após salvar manualmente')
            createNotification('Erro: Não foi possível salvar a sessão. Tente novamente.', 'warning')
            setLoading(false)
            return
          }
          
          console.log('✅ Sessão verificada após salvar manualmente!')
        } catch (e: any) {
          console.error('❌ Erro ao salvar manualmente:', e)
          createNotification('Erro inesperado. Tente novamente.', 'warning')
          setLoading(false)
          return
        }
      } else {
        console.log('✅ Sessão verificada! Usuário:', verifiedUser.id)
      }

      // Mostrar popup de login concluído
      console.log('✅ Login bem-sucedido - mostrando popup...')
      setShowModalLoginConcluido(true)
      
    } catch (error: any) {
      console.error('❌ Erro inesperado:', error)
      const errorMsg = error?.message || 'Erro desconhecido'
      const mensagemErro = errorMsg.toLowerCase().includes('invalid') || 
                          errorMsg.toLowerCase().includes('credentials') ||
                          errorMsg.toLowerCase().includes('password') ||
                          errorMsg.toLowerCase().includes('email')
        ? 'Email ou senha incorretos. Verifique suas credenciais e tente novamente.'
        : 'Erro inesperado: ' + errorMsg
      
      setErrorMessage(mensagemErro)
      try {
        createNotification(mensagemErro, 'warning')
      } catch (notifError) {
        console.error('Erro ao criar notificação:', notifError)
      }
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-neutral-50">
      {/* Lado esquerdo - Janela de login */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-4 md:p-6 lg:p-8 order-2 md:order-1">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#1e4976] transition-colors mb-5"
          >
            <ArrowLeft size={18} />
            Voltar
          </Link>

          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-[#0D1B2A] mb-1">
              Entrar
            </h1>
            <p className="text-sm text-gray-500">
              Acesse sua conta para continuar
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-xs text-red-600 font-medium">{errorMessage}</p>
              </div>
            )}
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                  className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#1e4976] focus:ring-2 focus:ring-[#1e4976]/10 transition-all pr-10"
                  placeholder="Sua senha"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-[#1e4976] transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer group">
                <div className="relative">
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="sr-only"
                    id="remember-me"
                  />
                  <div className={`w-4 h-4 border-2 rounded transition-all duration-200 flex items-center justify-center ${
                    rememberMe 
                      ? 'bg-[#1e4976] border-[#1e4976] shadow-sm' 
                      : 'border-gray-300 group-hover:border-[#1e4976]'
                  }`}>
                    {rememberMe && (
                      <svg 
                        className="w-3 h-3 text-white" 
                        fill="none" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth="3" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path d="M5 13l4 4L19 7"></path>
                      </svg>
                    )}
                  </div>
                </div>
                <span className="select-none group-hover:text-[#1e4976] transition-colors">Lembrar-me</span>
              </label>
              <Link href="#" className="text-xs text-[#1e4976] hover:text-[#163a5f] font-medium">
                Esqueceu a senha?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 bg-gradient-to-r from-[#2c5aa0] via-[#1e4976] to-[#163a5f] hover:from-[#1e4976] hover:via-[#163a5f] hover:to-[#0f2847] text-white rounded-xl text-sm font-semibold transition-all duration-300 shadow-md disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin" size={18} />
                  Entrando...
                </span>
              ) : (
                'Entrar'
              )}
            </button>

            <p className="text-center text-xs text-gray-500 leading-tight">
              Não tem uma conta?{' '}
              <Link 
                href="/cadastro?plano=teste"
                className="text-[#1e4976] hover:text-[#163a5f] font-medium"
                onClick={(e) => {
                  e.preventDefault()
                  router.push('/cadastro?plano=teste')
                }}
              >
                Criar conta
              </Link>
            </p>
          </form>
        </div>
      </div>

      {/* Lado direito - Imagem */}
      <div className="w-full md:w-1/2 min-h-[40vh] md:min-h-screen relative order-1 md:order-2 bg-[#0D1B2A]">
        <Image
          src="/banner cadastro.png"
          alt="PLENIPAY"
          fill
          className="object-cover"
          priority
          unoptimized
        />
      </div>
      
      {/* Popup de sucesso quando email foi confirmado via link */}
      <ModalEmailConfirmadoSucesso />
      
      {/* Popup de sucesso quando login for concluído */}
      <ModalLoginConcluido
        isOpen={showModalLoginConcluido}
        onClose={() => {
          setShowModalLoginConcluido(false)
          window.location.href = '/home'
        }}
        titulo="Autenticado com Sucesso!"
        mensagem="Login realizado com sucesso! Você será redirecionado em instantes..."
      />
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-[#1e4976]" size={48} />
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
