'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Mail, AlertCircle, Send } from 'lucide-react'
import { createNotification } from './NotificationBell'

interface ModalConfirmarEmailProps {
  email: string
  onConfirmado: () => void
  onClose?: () => void
  obrigatorio?: boolean
  emailJaEnviado?: boolean
  erroInicial?: string
  onEmailEnviado?: () => void // Callback quando email for enviado com sucesso
}

export default function ModalConfirmarEmail({ 
  email, 
  onConfirmado, 
  onClose, 
  obrigatorio = true, 
  emailJaEnviado = false, 
  erroInicial,
  onEmailEnviado
}: ModalConfirmarEmailProps) {
  const [reenviando, setReenviando] = useState(false)
  const [erro, setErro] = useState('')
  const [linkEnviado, setLinkEnviado] = useState(false)
  const [tempoRestante, setTempoRestante] = useState(0)
  const linkEnviadoAutomaticamente = useRef<boolean>(false)
  
  // Estado para tempo de cooldown do cadastro (rate limiting)
  const [tempoCooldownCadastro, setTempoCooldownCadastro] = useState(0)

  // Se email já foi enviado, mostrar mensagem imediatamente
  // NÃO aplicar cooldown ao abrir - usuário pode reenviar quando quiser; cooldown só após rate limit da API
  useEffect(() => {
    if (emailJaEnviado && !linkEnviado) {
      console.log('✅ Email já foi enviado na criação - mostrando mensagem inicial')
      setLinkEnviado(true)
    }
  }, [emailJaEnviado, linkEnviado])

  // Detectar cooldown do erro inicial (do cadastro)
  useEffect(() => {
    if (erroInicial) {
      const errorMessage = erroInicial || ''
      if (errorMessage.includes('For security purposes') || errorMessage.includes('rate limit') || errorMessage.includes('after')) {
        const cooldownMatch = errorMessage.match(/(?:after|após|em|wait|aguarde|após)\s*(\d+)\s*(?:segundo|segundos|second|seconds|s)/i) || 
                             errorMessage.match(/(\d+)\s*(?:segundo|segundos|second|seconds)/i)
        
        if (cooldownMatch) {
          const segundosCooldown = parseInt(cooldownMatch[1])
          setTempoCooldownCadastro(segundosCooldown)
          console.log(`⏱️ Cooldown de cadastro detectado: ${segundosCooldown} segundos`)
        }
      }
    }
  }, [erroInicial])

  const formatarTempo = (segundos: number) => {
    if (segundos < 60) {
      return `${segundos} segundo${segundos !== 1 ? 's' : ''}`
    }
    const minutos = Math.floor(segundos / 60)
    const segs = segundos % 60
    if (segs === 0) {
      return `${minutos} minuto${minutos !== 1 ? 's' : ''}`
    }
    return `${minutos} minuto${minutos !== 1 ? 's' : ''} e ${segs} segundo${segs !== 1 ? 's' : ''}`
  }

  // Efeito para quando o componente é montado (modal abre)
  useEffect(() => {
    console.log('🚀 [MODAL] ========== MODAL MONTADO ==========')
    console.log('📧 [MODAL] Email recebido:', email)
    console.log('📋 [MODAL] emailJaEnviado:', emailJaEnviado)
    
    // Resetar flag quando o modal abrir
    linkEnviadoAutomaticamente.current = false
    setReenviando(false)
    // NÃO resetar tempoRestante aqui - manter o cooldown se já estiver ativo
    setErro('')
    
    // Se email já foi enviado (ex: após cadastro), mostrar mensagem inicial
    // Sem cooldown ao abrir - cooldown só após a API retornar rate limit
    if (emailJaEnviado && !linkEnviado) {
      console.log('✅ [MODAL] Email já foi enviado na criação - mostrando mensagem inicial')
      setLinkEnviado(true)
    }
    
    // Se email não foi enviado ainda, aguardar - será enviado pelo signUp
    if (!emailJaEnviado) {
      console.log('⏳ [MODAL] Aguardando envio do email pelo signUp...')
    }
  }, [email, emailJaEnviado])

  // Temporizador para cooldown de reenvio
  useEffect(() => {
    if (tempoRestante > 0) {
      const timer = setTimeout(() => {
        setTempoRestante(tempoRestante - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [tempoRestante])

  // Temporizador para cooldown de cadastro (rate limiting)
  useEffect(() => {
    if (tempoCooldownCadastro > 0) {
      const timer = setTimeout(() => {
        setTempoCooldownCadastro(tempoCooldownCadastro - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [tempoCooldownCadastro])

  const handleReenviar = async () => {
    // Verificar cooldown - único bloqueio para reenvio
    if (tempoRestante > 0) {
      console.log(`⏱️ [MODAL] Reenvio bloqueado - aguarde ${tempoRestante} segundos`)
      return
    }
    
    console.log('📤 [MODAL] Iniciando reenvio de link (email não confirmado, cooldown OK)')
    setReenviando(true)
    setErro('')

    try {
      console.log('📤 [MODAL] Iniciando reenvio de link para:', email)
      
      const response = await fetch('/api/auth/enviar-link-confirmacao', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })
      
      console.log('📬 [MODAL] Resposta recebida:', response.status, response.statusText)
      
      // Verificar se a resposta é OK antes de fazer parse
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ [MODAL] Resposta não OK:', errorText)
        try {
          const errorJson = JSON.parse(errorText)
          throw new Error(errorJson.error || `Erro HTTP ${response.status}`)
        } catch {
          throw new Error(`Erro HTTP ${response.status}: ${errorText}`)
        }
      }
      
      const result = await response.json()
      console.log('📋 [MODAL] Resultado parseado:', result)

      // Verificar se há erro na resposta (ou success: false = falha no envio)
      if (result.error || result.success === false) {
        const errorMessage = result.error || result.message || ''
        const detail = result.detail || ''
        const cooldownMatch = errorMessage.match(/(?:after|após|em|wait|aguarde|após)\s*(\d+)\s*(?:segundo|segundos|second|seconds|s)/i) || 
                             errorMessage.match(/(\d+)\s*(?:segundo|segundos|second|seconds)/i)
        
        let segundosCooldown = 60
        if (cooldownMatch) {
          segundosCooldown = parseInt(cooldownMatch[1])
        }
        
        // Cooldown de cadastro: não exibir no modal (mensagem é para a página de cadastro)
        if (errorMessage.includes('For security purposes') || (errorMessage.includes('rate limit') && errorMessage.includes('create'))) {
          setTempoCooldownCadastro(segundosCooldown)
        }
        
        // Em erro de SMTP/config, não aplicar cooldown para permitir nova tentativa após corrigir
        const isSmtpError = errorMessage.includes('SMTP') || errorMessage.includes('autenticação') || errorMessage.includes('Hostinger')
        setTempoRestante(isSmtpError ? 0 : segundosCooldown)
        
        // Uma única mensagem amigável para rate limit (evitar duas caixas com contadores)
        let mensagemErro = errorMessage
        if (errorMessage.includes('rate limit') || errorMessage.includes('too many') || errorMessage.includes('after') || errorMessage.includes('seconds')) {
          mensagemErro = `Para sua segurança, limitamos o envio de links. Você poderá solicitar um novo link em ${formatarTempo(segundosCooldown)}.`
        } else if (detail) {
          mensagemErro = `${errorMessage} ${detail}`
        }
        setErro(mensagemErro)
        console.error('❌ [MODAL] Erro ao reenviar:', mensagemErro)
      } else if (result.success) {
        // Sucesso - atualizar estado
        console.log('✅ [MODAL] Reenvio bem-sucedido!')
        console.log('✅ [MODAL] Método usado:', result.method || 'desconhecido')
        createNotification('Link de confirmação reenviado! Verifique seu email.', 'success')
        setLinkEnviado(true)
        setTempoRestante(60)
        console.log('✅ [MODAL] Estado atualizado: linkEnviado=true, tempoRestante=60')
        
        // Notificar componente pai que email foi enviado
        if (onEmailEnviado) {
          console.log('📢 [MODAL] Chamando callback onEmailEnviado')
          onEmailEnviado()
        }
      } else {
        // Resposta sem erro mas sem success explícito - tratar como sucesso
        console.warn('⚠️ [MODAL] Resposta sem campo success, mas sem erro - tratando como sucesso')
        createNotification('Link de confirmação reenviado! Verifique seu email.', 'success')
        setLinkEnviado(true)
        setTempoRestante(60)
        
        // Notificar componente pai que email foi enviado
        if (onEmailEnviado) {
          console.log('📢 [MODAL] Chamando callback onEmailEnviado (fallback)')
          onEmailEnviado()
        }
      }
    } catch (error: any) {
      console.error('❌ [MODAL] Erro ao reenviar:', error)
      setErro('Erro ao reenviar. Tente novamente.')
      setTempoRestante(60)
    } finally {
      setReenviando(false)
      console.log('🏁 [MODAL] Reenvio finalizado')
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
      onClick={(e) => {
        if (obrigatorio && e.target === e.currentTarget) {
          e.preventDefault()
          e.stopPropagation()
        }
      }}
    >
      <div 
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-[#00C2FF]/5 to-[#0099CC]/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#00C2FF]/10 rounded-xl flex items-center justify-center">
                <Mail size={20} className="text-[#00C2FF]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Confirmar Email
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Verifique sua caixa de entrada
                </p>
              </div>
            </div>
            {onClose && !obrigatorio && (
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={18} className="text-gray-400" />
              </button>
            )}
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-6 space-y-5">
          {/* Ícone e mensagem principal */}
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-gradient-to-br from-[#00C2FF]/10 to-[#0099CC]/10 rounded-2xl flex items-center justify-center mx-auto">
              <Mail size={36} className="text-[#00C2FF]" />
            </div>
            
            {linkEnviado ? (
              <>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-gray-900">
                    Link Enviado!
                  </h3>
                  <p className="text-sm text-gray-600">
                    {emailJaEnviado 
                      ? 'Enviamos automaticamente um link de confirmação para:'
                      : 'Enviamos um link de confirmação para:'}
                  </p>
                  <p className="text-[#00C2FF] font-semibold text-sm break-all px-2 pt-1">{email}</p>
                </div>
                
                <div className="bg-blue-50 rounded-xl px-5 py-4 border border-blue-100 space-y-2.5">
                  <div className="flex items-center justify-center gap-2">
                    <Mail size={18} className="text-[#00C2FF]" />
                    <p className="text-sm font-semibold text-gray-900">
                      Verifique sua caixa de entrada
                    </p>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Clique no link de confirmação que enviamos para o seu email. Após clicar no link, você será redirecionado automaticamente e poderá fazer login.
                  </p>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-600">
                  Enviando link de confirmação para:
                </p>
                <p className="text-[#00C2FF] font-semibold text-sm break-all px-2">{email}</p>
                {obrigatorio && (
                  <div className="flex items-center justify-center gap-2 bg-amber-50 rounded-lg px-3 py-2 border border-amber-100">
                    <AlertCircle size={14} className="text-amber-600" />
                    <p className="text-xs text-amber-700 font-medium">
                      Confirme para acessar todas as funcionalidades
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Mensagem de erro */}
          {erro && (
            <div className="flex items-start gap-2.5 bg-red-50 rounded-xl px-4 py-3 border border-red-100">
              <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-red-700 leading-relaxed">{erro}</span>
            </div>
          )}

          {/* Botões de ação */}
          <div className="space-y-3">
            {!linkEnviado && (
              <button
                onClick={handleReenviar}
                disabled={reenviando || tempoRestante > 0}
                className="w-full px-4 py-3 bg-gradient-to-r from-[#00C2FF] to-[#0099CC] text-white rounded-xl font-semibold hover:from-[#00B8F5] hover:to-[#0088BB] shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {reenviando ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Enviar Link de Confirmação
                  </>
                )}
              </button>
            )}

            {/* Reenviar link - SEMPRE mostrar quando link foi enviado (mesmo que emailJaEnviado seja true) */}
            {linkEnviado && (
              <div className="pt-3 border-t border-gray-100 space-y-2">
                <button
                  onClick={handleReenviar}
                  disabled={reenviando || tempoRestante > 0}
                  className="w-full text-sm text-[#00C2FF] hover:text-[#0099CC] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {reenviando ? (
                    <>
                      <div className="w-3 h-3 border-2 border-[#00C2FF] border-t-transparent rounded-full animate-spin inline-block mr-2" />
                      Reenviando...
                    </>
                  ) : tempoRestante > 0 ? (
                    `Aguarde ${formatarTempo(tempoRestante)}`
                  ) : (
                    'Não recebeu? Reenviar link'
                  )}
                </button>
                {tempoRestante > 0 && (
                  <p className="text-xs text-gray-500 text-center">
                    Você pode solicitar um novo link em {formatarTempo(tempoRestante)}
                  </p>
                )}
                {tempoRestante === 0 && !reenviando && (
                  <p className="text-xs text-gray-400 text-center">
                    Você pode solicitar um novo link a qualquer momento
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Dica */}
          <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
            <p className="text-xs text-gray-600 text-center leading-relaxed flex items-center justify-center gap-1.5">
              <span>💡</span>
              <span>
                Verifique também a pasta de spam. O link expira em 24 horas.
              </span>
            </p>
          </div>

          {/* No modal não exibimos o aviso "criar nova conta" — só a mensagem de erro (reenvio) acima */}
        </div>
      </div>
    </div>
  )
}
