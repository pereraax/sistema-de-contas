'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Mail, CheckCircle, AlertCircle, Send } from 'lucide-react'
import { createNotification } from './NotificationBell'
// Não importar reenviarCodigoEmail - vamos chamar a API diretamente

interface ModalConfirmarEmailProps {
  email: string
  onConfirmado: () => void
  onClose?: () => void
  obrigatorio?: boolean // Se true, não permite fechar sem confirmar
  emailJaEnviado?: boolean // Se true, email já foi enviado (ex: após cadastro) - não tenta reenviar
}

export default function ModalConfirmarEmail({ email, onConfirmado, onClose, obrigatorio = true, emailJaEnviado = false }: ModalConfirmarEmailProps) {
  const [reenviando, setReenviando] = useState(false)
  const [erro, setErro] = useState('')
  const [linkEnviado, setLinkEnviado] = useState(false)
  const [tempoRestante, setTempoRestante] = useState(0) // Tempo em segundos
  const linkEnviadoAutomaticamente = useRef<boolean>(false)

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

  const enviarLinkAutomaticamente = async () => {
    // Evitar múltiplos envios
    if (linkEnviadoAutomaticamente.current) {
      console.log('⚠️ Link já foi enviado automaticamente, ignorando...')
      return
    }
    
    if (!email) {
      console.error('❌ Email não fornecido para envio automático!')
      setErro('Email não fornecido. Por favor, feche e abra o modal novamente.')
      return
    }
    
    if (reenviando) {
      console.log('⚠️ Já está enviando link, aguardando...')
      return
    }
    
    linkEnviadoAutomaticamente.current = true
    console.log('📧 [AUTO] Enviando link de confirmação automaticamente para:', email)
    setReenviando(true)
    setErro('')

    try {
      console.log('🔄 [AUTO] Chamando API para enviar link de confirmação...')
      
      // Chamar API route diretamente do cliente
      const response = await fetch('/api/auth/enviar-link-confirmacao', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })
      
      const result = await response.json()
      console.log('📬 [AUTO] Resultado do envio:', result)

      if (!response.ok) {
        console.error('❌ [AUTO] Resposta HTTP não OK:', response.status)
        const errorData = result.error || 'Erro ao enviar link de confirmação'
        setErro(errorData)
        createNotification(`Erro: ${errorData}`, 'warning')
      } else if (result.success || result.linkGenerated) {
        console.log('✅ [AUTO] Link enviado com sucesso!')
        setLinkEnviado(true)
        createNotification('Link de confirmação enviado! Verifique seu email (incluindo spam).', 'success')
        setTempoRestante(60) // Cooldown de 60 segundos
      } else if (result.error) {
        console.error('❌ [AUTO] Erro ao enviar:', result.error)
        setErro(result.error)
        createNotification(`Erro: ${result.error}`, 'warning')
      } else {
        console.error('❌ [AUTO] Resposta inesperada:', result)
        setErro('Não foi possível enviar o link. Tente novamente ou entre em contato com o suporte.')
      }
    } catch (error: any) {
      console.error('❌ [AUTO] Erro inesperado ao enviar link automaticamente:', error)
      setErro('Erro ao enviar link. Por favor, use o botão "Reenviar link".')
      setTempoRestante(60)
    } finally {
      setReenviando(false)
    }
  }

  // Efeito para quando o componente é montado (modal abre)
  useEffect(() => {
    console.log('🚀 [MODAL] ========== MODAL MONTADO ==========')
    console.log('📧 [MODAL] Email recebido:', email)
    console.log('🔑 [MODAL] Key do componente atualizado')
    
    // Resetar flag quando o modal abrir
    linkEnviadoAutomaticamente.current = false
    setReenviando(false)
    setTempoRestante(0)
    setErro('')
    setLinkEnviado(false)
    
    // Se email já foi enviado (ex: após cadastro), apenas mostrar mensagem
    if (emailJaEnviado) {
      console.log('✅ [MODAL] Email já foi enviado - apenas mostrando instruções')
      setLinkEnviado(true)
      return
    }
    
    // Enviar link automaticamente quando o modal abrir (caso contrário)
    if (!email) {
      console.error('❌ [MODAL] Email não fornecido ao modal!')
      setErro('Email não fornecido. Por favor, feche e abra o modal novamente.')
      return
    }
    
    console.log('🚀 [MODAL] Iniciando envio automático de link para:', email)
    
    // Delay maior para garantir que tudo está pronto
    const timer = setTimeout(() => {
      console.log('⏰ [MODAL] Timer disparado (1 segundo), chamando enviarLinkAutomaticamente...')
      enviarLinkAutomaticamente()
    }, 1000)
    
    return () => {
      clearTimeout(timer)
      console.log('🧹 [MODAL] Cleanup: Timers limpos (modal pode estar sendo desmontado)')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email])

  // Temporizador para cooldown de reenvio
  useEffect(() => {
    if (tempoRestante > 0) {
      const timer = setTimeout(() => {
        setTempoRestante(tempoRestante - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [tempoRestante])

  const handleReenviar = async () => {
    if (tempoRestante > 0) return // Não permitir reenvio durante cooldown
    
    setReenviando(true)
    setErro('')

    try {
      // Chamar API route diretamente do cliente
      const response = await fetch('/api/auth/enviar-link-confirmacao', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })
      
      const result = await response.json()

      if (result.error) {
        // Extrair tempo de cooldown da mensagem de erro
        const cooldownMatch = result.error.match(/(?:after|após|em|wait|aguarde|após)\s*(\d+)\s*(?:segundo|segundos|second|seconds|s)/i) || 
                             result.error.match(/(\d+)\s*(?:segundo|segundos|second|seconds)/i)
        
        let segundosCooldown = 60
        if (cooldownMatch) {
          segundosCooldown = parseInt(cooldownMatch[1])
        }
        
        setTempoRestante(segundosCooldown)
        
        // Traduzir mensagem de erro para português se necessário
        let mensagemErro = result.error
        if (result.error.includes('rate limit') || result.error.includes('too many')) {
          mensagemErro = `Muitas tentativas. Aguarde ${formatarTempo(segundosCooldown)} antes de tentar novamente.`
        } else if (result.error.includes('after') || result.error.includes('seconds')) {
          mensagemErro = `Por segurança, você só pode solicitar um novo link após ${formatarTempo(segundosCooldown)}.`
        }
        setErro(mensagemErro)
      } else {
        createNotification('Link de confirmação reenviado! Verifique seu email.', 'success')
        setLinkEnviado(true)
        setTempoRestante(60)
      }
    } catch (error: any) {
      setErro('Erro ao reenviar link. Tente novamente.')
      console.error('Erro ao reenviar link:', error)
      setTempoRestante(60)
    } finally {
      setReenviando(false)
    }
  }

  // REMOVIDO: Verificação automática que estava fechando o modal prematuramente
  // O usuário será redirecionado quando clicar no link do email

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => {
        // Se obrigatório, não permitir fechar clicando fora
        if (obrigatorio && e.target === e.currentTarget) {
          e.preventDefault()
          e.stopPropagation()
        }
      }}
    >
      <div 
        className="bg-gradient-to-br from-brand-royal to-brand-midnight rounded-xl max-w-md w-full shadow-2xl animate-slide-up overflow-hidden border border-brand-aqua/40"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header compacto */}
        <div className="px-4 py-3 border-b border-brand-aqua/20 bg-brand-midnight/30">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-brand-aqua/25 rounded-lg flex items-center justify-center flex-shrink-0">
              <Mail size={18} className="text-brand-aqua" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-display font-bold text-brand-clean leading-tight">
                Confirmar Email
              </h2>
              <p className="text-[11px] text-brand-clean/50 leading-tight mt-0.5">
                Verifique sua caixa de entrada
              </p>
            </div>
            {onClose && !obrigatorio && (
              <button
                onClick={onClose}
                className="p-1 hover:bg-brand-aqua/10 rounded transition-smooth flex-shrink-0"
              >
                <X size={16} className="text-brand-clean/50" />
              </button>
            )}
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-5 space-y-4 bg-brand-royal/50">
          {/* Email e aviso */}
          <div className="space-y-3 text-center">
            <div className="w-16 h-16 bg-brand-aqua/20 rounded-full flex items-center justify-center mx-auto">
              <Mail size={32} className="text-brand-aqua" />
            </div>
            
            {linkEnviado ? (
              <>
                <h3 className="text-lg font-semibold text-brand-clean">
                  {emailJaEnviado ? 'Email Enviado!' : 'Link Enviado!'}
                </h3>
                <p className="text-sm text-brand-clean/70">
                  {emailJaEnviado 
                    ? 'Enviamos automaticamente um link de confirmação para:'
                    : 'Enviamos um link de confirmação para:'}
                </p>
                <p className="text-brand-aqua font-semibold text-sm break-all px-2">{email}</p>
                <div className="bg-brand-aqua/10 rounded-lg px-4 py-3 border border-brand-aqua/20 space-y-2">
                  <p className="text-sm text-brand-clean font-medium">
                    ✉️ Verifique sua caixa de entrada
                  </p>
                  <p className="text-xs text-brand-clean/70 leading-relaxed">
                    {emailJaEnviado 
                      ? 'Verifique seu email e clique no link de confirmação que enviamos. Após clicar no link, você será redirecionado automaticamente e poderá fazer login.'
                      : 'Clique no link que enviamos para confirmar seu email. Após clicar, você será redirecionado automaticamente e seu email estará confirmado.'}
                  </p>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-brand-clean/70">
                  Enviando link de confirmação para:
                </p>
                <p className="text-brand-aqua font-semibold text-sm break-all px-2">{email}</p>
                {obrigatorio && (
                  <div className="flex items-center justify-center gap-1.5">
                    <AlertCircle size={14} className="text-orange-400" />
                    <p className="text-xs text-orange-400 font-medium">
                      Confirme para acessar todas as funcionalidades
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Mensagem de erro */}
          {erro && (
            <div className="flex items-start gap-2 text-red-300 bg-red-900/30 rounded-lg px-3 py-2.5 border border-red-800/40">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span className="text-xs leading-relaxed">{erro}</span>
            </div>
          )}

          {/* Botões de ação */}
          <div className="space-y-2">
            {!linkEnviado && (
              <button
                onClick={handleReenviar}
                disabled={reenviando || tempoRestante > 0}
                className="w-full px-4 py-3 bg-brand-aqua text-brand-midnight rounded-lg font-semibold hover:bg-brand-aqua/90 shadow-lg hover:shadow-xl transition-smooth disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
              >
                {reenviando ? (
                  <>
                    <div className="w-4 h-4 border-2 border-brand-midnight border-t-transparent rounded-full animate-spin" />
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

            {/* Botão Verificar Depois - apenas se não for obrigatório */}
            {!obrigatorio && onClose && (
              <button
                onClick={onClose}
                className="w-full px-4 py-2.5 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-brand-clean rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-white/20 transition-smooth text-sm"
              >
                Verificar Depois
              </button>
            )}
          </div>

          {/* Reenviar link */}
          {linkEnviado && (
            <div className="pt-2 border-t border-brand-aqua/20 space-y-2">
              <button
                onClick={handleReenviar}
                disabled={reenviando || tempoRestante > 0}
                className="w-full text-xs text-brand-aqua hover:text-brand-aqua/80 font-medium transition-smooth disabled:opacity-50 disabled:cursor-not-allowed underline"
              >
                {reenviando ? 'Reenviando...' : tempoRestante > 0 ? `Aguarde ${formatarTempo(tempoRestante)}` : 'Não recebeu? Reenviar link'}
              </button>
              {tempoRestante > 0 && (
                <p className="text-[10px] text-brand-clean/50 text-center">
                  Você pode solicitar um novo link em {formatarTempo(tempoRestante)}
                </p>
              )}
            </div>
          )}

          {/* Dica */}
          <div className="bg-brand-aqua/10 rounded-lg px-3 py-2.5 border border-brand-aqua/20">
            <p className="text-xs text-brand-clean/60 text-center leading-relaxed">
              💡 Verifique também a pasta de spam. O link expira em 24 horas.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
