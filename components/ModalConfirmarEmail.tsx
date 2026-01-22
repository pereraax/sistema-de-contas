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
}

export default function ModalConfirmarEmail({ 
  email, 
  onConfirmado, 
  onClose, 
  obrigatorio = true, 
  emailJaEnviado = false, 
  erroInicial 
}: ModalConfirmarEmailProps) {
  const [reenviando, setReenviando] = useState(false)
  const [erro, setErro] = useState('')
  const [linkEnviado, setLinkEnviado] = useState(false)
  const [tempoRestante, setTempoRestante] = useState(0)
  const linkEnviadoAutomaticamente = useRef<boolean>(false)
  
  // Estado para tempo de cooldown do cadastro (rate limiting)
  const [tempoCooldownCadastro, setTempoCooldownCadastro] = useState(0)

  // Se email já foi enviado, mostrar mensagem imediatamente
  useEffect(() => {
    if (emailJaEnviado && !linkEnviado) {
      console.log('✅ Email já foi enviado - mostrando mensagem imediatamente')
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
    setTempoRestante(0)
    setErro('')
    
    // Se email já foi enviado (ex: após cadastro), apenas mostrar mensagem
    if (emailJaEnviado) {
      console.log('✅ [MODAL] Email já foi enviado - mostrando mensagem')
      setLinkEnviado(true)
      return
    }
    
    // Se email não foi enviado ainda, aguardar - será enviado pelo signUp
    console.log('⏳ [MODAL] Aguardando envio do email pelo signUp...')
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
    if (tempoRestante > 0) return
    
    setReenviando(true)
    setErro('')

    try {
      const response = await fetch('/api/auth/enviar-link-confirmacao', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })
      
      const result = await response.json()

      if (result.error) {
        const errorMessage = result.error || ''
        const detail = result.detail || ''
        const cooldownMatch = errorMessage.match(/(?:after|após|em|wait|aguarde|após)\s*(\d+)\s*(?:segundo|segundos|second|seconds|s)/i) || 
                             errorMessage.match(/(\d+)\s*(?:segundo|segundos|second|seconds)/i)
        
        let segundosCooldown = 60
        if (cooldownMatch) {
          segundosCooldown = parseInt(cooldownMatch[1])
        }
        
        if (errorMessage.includes('For security purposes') || (errorMessage.includes('rate limit') && errorMessage.includes('create'))) {
          setTempoCooldownCadastro(segundosCooldown)
          console.log(`⏱️ Cooldown de cadastro detectado: ${segundosCooldown} segundos`)
        }
        
        setTempoRestante(segundosCooldown)
        
        let mensagemErro = errorMessage
        if (errorMessage.includes('rate limit') || errorMessage.includes('too many')) {
          mensagemErro = `Muitas tentativas. Aguarde ${formatarTempo(segundosCooldown)} antes de tentar novamente.`
        } else if (errorMessage.includes('after') || errorMessage.includes('seconds')) {
          mensagemErro = `Por segurança, você só pode solicitar um novo link após ${formatarTempo(segundosCooldown)}.`
        } else if (detail) {
          mensagemErro = `${errorMessage} ${detail}`
        }
        setErro(mensagemErro)
      } else {
        createNotification('Link de confirmação reenviado! Verifique seu email.', 'success')
        setLinkEnviado(true)
        setTempoRestante(60)
      }
    } catch (error: any) {
      setErro('Erro ao reenviar. Tente novamente.')
      console.error('Erro ao reenviar:', error)
      setTempoRestante(60)
    } finally {
      setReenviando(false)
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

            {/* Reenviar link */}
            {linkEnviado && (
              <div className="pt-3 border-t border-gray-100 space-y-2">
                <button
                  onClick={handleReenviar}
                  disabled={reenviando || tempoRestante > 0}
                  className="w-full text-sm text-[#00C2FF] hover:text-[#0099CC] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {reenviando ? 'Reenviando...' : tempoRestante > 0 ? `Aguarde ${formatarTempo(tempoRestante)}` : 'Não recebeu? Reenviar link'}
                </button>
                {tempoRestante > 0 && (
                  <p className="text-xs text-gray-500 text-center">
                    Você pode solicitar um novo link em {formatarTempo(tempoRestante)}
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

          {/* Mensagem de cooldown para cadastro (rate limiting) */}
          {tempoCooldownCadastro > 0 && (
            <div className="bg-amber-50 rounded-xl px-4 py-3 border border-amber-200 shadow-sm">
              <div className="flex items-center justify-center gap-2 mb-1.5">
                <AlertCircle size={16} className="text-amber-600 flex-shrink-0" />
                <p className="text-sm font-semibold text-amber-800 text-center">
                  Limite de tentativas atingido
                </p>
              </div>
              <p className="text-xs text-amber-700 text-center leading-relaxed">
                Por segurança, você só pode tentar criar uma nova conta após{' '}
                <span className="font-bold text-amber-900">{formatarTempo(tempoCooldownCadastro)}</span>.
              </p>
              <p className="text-xs text-amber-600 text-center mt-2 leading-relaxed">
                Aguarde o tempo acima antes de tentar criar uma nova conta novamente.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
