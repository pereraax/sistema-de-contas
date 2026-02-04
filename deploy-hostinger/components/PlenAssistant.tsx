'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Send, Mic, MicOff, Loader2, Sparkles } from 'lucide-react'
import { createNotification } from './NotificationBell'
import { createClient } from '@/lib/supabase/client'
import { usePathname } from 'next/navigation'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  actionData?: any // Dados de ações executadas (ex: registro criado)
}

export default function PlenAssistant() {
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true) // Estado para verificar se ainda está checando autenticação
  const [isOpen, setIsOpen] = useState(false)
  const synthRef = useRef<SpeechSynthesis | null>(null)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '👋 Olá! Eu sou o PLEN, seu assistente financeiro pessoal! 😊\n\nEstou aqui para tornar o controle das suas finanças mais simples e organizado. Você pode falar comigo de forma natural, como se estivesse conversando com um amigo!\n\n💼 O que eu posso fazer por você:\n\n📝 REGISTRAR:\n• Gastos: "paguei 50 reais no mercado"\n• Entradas: "recebi 1000 reais"\n• Dívidas: "tenho uma dívida de 200 reais"\n• Salários: "meu salário é 3000 reais"\n\n📊 CONSULTAR:\n• "quais são minhas dívidas?"\n• "quanto gastei na semana?"\n• "quanto gastei no mês?"\n• "quanto tenho de saldo?"\n• "quanto recebi este mês?"\n\n📈 RELATÓRIOS:\n• "me mostre o relatório"\n• "quero ver meu relatório financeiro"\n• "mostre meu resumo do mês"\n• "como estão minhas finanças?"\n\n💡 Como eu entendo você:\n\nVocê pode falar de forma natural! Por exemplo:\n• "gastei 30 reais de ônibus hoje"\n• "paguei 150 reais de conta de luz"\n• "recebi 500 reais do cliente"\n• "tenho uma dívida de 2000 no cartão"\n\nEu entendo diferentes formas de falar e vou organizar tudo para você! 🎯\n\nComo posso ajudar você hoje? 🤗',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [pendingConfirmation, setPendingConfirmation] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<any>(null)

  // Verificar autenticação
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsCheckingAuth(true) // Começar verificação
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        setIsAuthenticated(!!user)
        
        // Se não estiver autenticado, limpar estado
        if (!user) {
          setMessages([{
            id: '1',
            role: 'assistant',
            content: '👋 Olá! Eu sou o PLEN, seu assistente financeiro pessoal! 😊\n\nEstou aqui para tornar o controle das suas finanças mais simples e organizado. Você pode falar comigo de forma natural, como se estivesse conversando com um amigo!\n\n💼 O que eu posso fazer por você:\n\n📝 REGISTRAR:\n• Gastos: "paguei 50 reais no mercado"\n• Entradas: "recebi 1000 reais"\n• Dívidas: "tenho uma dívida de 200 reais"\n• Salários: "meu salário é 3000 reais"\n\n📊 CONSULTAR:\n• "quais são minhas dívidas?"\n• "quanto gastei na semana?"\n• "quanto gastei no mês?"\n• "quanto tenho de saldo?"\n• "quanto recebi este mês?"\n\n📈 RELATÓRIOS:\n• "me mostre o relatório"\n• "quero ver meu relatório financeiro"\n• "mostre meu resumo do mês"\n• "como estão minhas finanças?"\n\n💡 Como eu entendo você:\n\nVocê pode falar de forma natural! Por exemplo:\n• "gastei 30 reais de ônibus hoje"\n• "paguei 150 reais de conta de luz"\n• "recebi 500 reais do cliente"\n• "tenho uma dívida de 2000 no cartão"\n\nEu entendo diferentes formas de falar e vou organizar tudo para você! 🎯\n\nComo posso ajudar você hoje? 🤗',
            timestamp: new Date()
          }])
          setInput('')
          setIsOpen(false)
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error)
        setIsAuthenticated(false)
      } finally {
        setIsCheckingAuth(false) // Finalizar verificação
      }
    }

    checkAuth()

    // Monitorar mudanças de autenticação
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setIsAuthenticated(false)
        setIsCheckingAuth(false) // Garantir que não fique travado
        setMessages([{
          id: '1',
          role: 'assistant',
          content: '👋 Olá! Eu sou o PLEN, seu assistente financeiro pessoal! 😊\n\nEstou aqui para tornar o controle das suas finanças mais simples e organizado. Você pode falar comigo de forma natural, como se estivesse conversando com um amigo!\n\n💼 O que eu posso fazer por você:\n\n📝 REGISTRAR:\n• Gastos: "paguei 50 reais no mercado"\n• Entradas: "recebi 1000 reais"\n• Dívidas: "tenho uma dívida de 200 reais"\n• Salários: "meu salário é 3000 reais"\n\n📊 CONSULTAR:\n• "quais são minhas dívidas?"\n• "quanto gastei na semana?"\n• "quanto gastei no mês?"\n• "quanto tenho de saldo?"\n• "quanto recebi este mês?"\n\n📈 RELATÓRIOS:\n• "me mostre o relatório"\n• "quero ver meu relatório financeiro"\n• "mostre meu resumo do mês"\n• "como estão minhas finanças?"\n\n💡 Como eu entendo você:\n\nVocê pode falar de forma natural! Por exemplo:\n• "gastei 30 reais de ônibus hoje"\n• "paguei 150 reais de conta de luz"\n• "recebi 500 reais do cliente"\n• "tenho uma dívida de 2000 no cartão"\n\nEu entendo diferentes formas de falar e vou organizar tudo para você! 🎯\n\nComo posso ajudar você hoje? 🤗',
          timestamp: new Date()
        }])
        setInput('')
        setIsOpen(false)
      } else if (event === 'SIGNED_IN' && session) {
        setIsAuthenticated(true)
        setIsCheckingAuth(false) // Garantir que não fique travado
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Escutar evento customizado para abrir/fechar via bottom nav (toggle)
  useEffect(() => {
    const handleTogglePlen = () => {
      if (isAuthenticated && !isCheckingAuth) {
        setIsOpen(prev => !prev)
        // Foco no input já é tratado pelo useEffect quando isOpen vira true
      }
    }

    window.addEventListener('open-plen-assistant', handleTogglePlen)
    return () => {
      window.removeEventListener('open-plen-assistant', handleTogglePlen)
    }
  }, [isAuthenticated, isCheckingAuth])

  // Scroll para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focar no input quando abrir
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Inicializar síntese de voz
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis
    }
  }, [])

  // Função para PLEN falar (voz moderna e rápida)
  const plenFalar = async (texto: string) => {
    if (!synthRef.current || typeof window === 'undefined') return

    // Cancelar qualquer fala anterior
    synthRef.current.cancel()

    // Tentar usar Google Cloud TTS se disponível (mais moderno)
    const useGoogleTTS = process.env.NEXT_PUBLIC_GOOGLE_TTS_ENABLED === 'true'
    
    if (useGoogleTTS) {
      try {
        const response = await fetch('/api/plen/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: texto })
        })
        
        if (response.ok) {
          const audioBlob = await response.blob()
          const audioUrl = URL.createObjectURL(audioBlob)
          const audio = new Audio(audioUrl)
          audio.play()
          audio.onended = () => URL.revokeObjectURL(audioUrl)
          return
        }
      } catch (error) {
        console.log('Google TTS não disponível, usando Web Speech API')
      }
    }

    // Fallback: Web Speech API com voz masculina forçada
    const utterance = new SpeechSynthesisUtterance(texto)
    utterance.lang = 'pt-BR'
    utterance.rate = 0.95 // Velocidade ligeiramente mais lenta para parecer mais masculina
    utterance.pitch = 0.7 // Tom muito mais grave (masculino) - range: 0 a 2, menor = mais grave
    utterance.volume = 1

    // Função para configurar voz masculina
    const configurarVoz = () => {
      const voices = synthRef.current?.getVoices() || []
      
      // Lista de nomes de vozes masculinas conhecidas
      const nomesMasculinos = [
        'joão', 'ricardo', 'felipe', 'thiago', 'daniel', 'carlos', 'paulo',
        'male', 'masculino', 'man', 'homem', 'brazil', 'brasil'
      ]
      
      // Priorizar vozes masculinas brasileiras (ordem de preferência)
      let vozPreferida = null
      
      // 1. Buscar vozes com nomes masculinos explícitos
      for (const nome of nomesMasculinos) {
        vozPreferida = voices.find(v => 
          v.lang.includes('pt-BR') && 
          v.name.toLowerCase().includes(nome)
        )
        if (vozPreferida) break
      }
      
      // 2. Se não encontrou, buscar vozes Google (geralmente neutras/masculinas)
      if (!vozPreferida) {
        vozPreferida = voices.find(v => 
          v.lang.includes('pt-BR') && 
          (v.name.toLowerCase().includes('google') ||
           v.name.toLowerCase().includes('pt-br-google') ||
           v.name.toLowerCase().includes('neural'))
        )
      }
      
      // 3. Se ainda não encontrou, buscar qualquer voz brasileira
      if (!vozPreferida) {
        vozPreferida = voices.find(v => v.lang.includes('pt-BR'))
      }
      
      // 4. Se não encontrou nenhuma voz brasileira, buscar qualquer voz
      if (!vozPreferida && voices.length > 0) {
        vozPreferida = voices[0]
      }

      if (vozPreferida) {
        utterance.voice = vozPreferida
        console.log('🎤 Voz selecionada:', vozPreferida.name, '| Pitch:', utterance.pitch)
      } else {
        console.log('⚠️ Nenhuma voz encontrada, usando padrão')
      }
      
      // Sempre forçar pitch baixo para voz masculina
      utterance.pitch = 0.7
      
      synthRef.current?.speak(utterance)
    }

    // Se as vozes já estão carregadas, usar diretamente
    const voices = synthRef.current.getVoices()
    if (voices.length > 0) {
      configurarVoz()
    } else {
      // Aguardar carregar vozes
      synthRef.current.onvoiceschanged = configurarVoz
      // Timeout de segurança
      setTimeout(() => {
        if (synthRef.current) {
          configurarVoz()
        }
      }, 500)
    }
  }

  // Inicializar reconhecimento de voz (Web Speech API) - Para o chat
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || 
                                (window as any).SpeechRecognition ||
                                (window as any).mozSpeechRecognition ||
                                (window as any).msSpeechRecognition
      
      if (SpeechRecognition) {
        try {
          recognitionRef.current = new SpeechRecognition()
          recognitionRef.current.continuous = false
          recognitionRef.current.interimResults = false
          recognitionRef.current.lang = 'pt-BR'

          recognitionRef.current.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript
            setInput(transcript)
            setIsListening(false)
            // Processar mensagem após um pequeno delay
            setTimeout(() => {
              handleSend(transcript)
            }, 100)
          }

          recognitionRef.current.onerror = (event: any) => {
            console.error('Erro no reconhecimento de voz:', event.error)
            setIsListening(false)
            if (event.error === 'no-speech') {
              createNotification('Nenhum áudio detectado. Tente novamente.', 'warning')
            } else {
              createNotification('Erro ao reconhecer voz. Tente novamente.', 'warning')
            }
          }

          recognitionRef.current.onend = () => {
            setIsListening(false)
          }
        } catch (error) {
          console.error('Erro ao inicializar reconhecimento de voz:', error)
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true)
      recognitionRef.current.start()
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }

  const handleSend = async (text?: string) => {
    const messageText = text || input.trim()
    if (!messageText || isLoading) return

    // Adicionar mensagem do usuário
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      let response: Response
      try {
        response = await fetch('/api/plen/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            message: messageText,
            conversationHistory: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
          }),
        })
      } catch (fetchErr: any) {
        const networkMsg = fetchErr?.message || String(fetchErr)
        throw new Error(networkMsg === 'Failed to fetch' ? 'Não foi possível conectar ao servidor. Verifique a internet ou tente de novo.' : networkMsg)
      }

      let data: { response?: string; error?: string; actionData?: any; pendingAction?: any } = {}
      try {
        data = await response.json()
      } catch (_) {
        const text = (await response.text().catch(() => '')) || ''
        const is404 = response.status === 404
        const is500 = response.status === 500
        throw new Error(
          is404
            ? 'Rota do assistente não encontrada (404). Faça deploy da aplicação ou rode em desenvolvimento.'
            : is500
              ? `Servidor retornou erro 500. ${text.slice(0, 100)}`
              : text || `Erro HTTP ${response.status}`
        )
      }

      if (data.error) {
        throw new Error(data.error)
      }

      if (!response.ok && !data.response) {
        throw new Error(data.error || `Erro ${response.status}`)
      }

      // Verificar se há confirmação pendente
      if (data.pendingAction) {
        setPendingConfirmation(data.pendingAction)
      } else {
        setPendingConfirmation(null)
      }

      // Adicionar resposta da IA
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        actionData: data.actionData
      }
      setMessages(prev => [...prev, assistantMessage])

      // Se houve ação executada, mostrar notificação
      if (data.actionData?.action === 'created') {
        createNotification(data.actionData.message || 'Ação executada com sucesso!', 'success')
        setPendingConfirmation(null) // Limpar confirmação pendente após registro
      }
    } catch (error: any) {
      const errMsg =
        (error && typeof error === 'object' && error.message) ||
        (typeof error === 'string' && error) ||
        (error && String(error)) ||
        'Erro desconhecido'
      console.error('[PLEN] Erro ao enviar mensagem:', error, '-> exibindo:', errMsg)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Erro: ${errMsg}. Verifique sua conexão e se está logado.`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
      createNotification(errMsg, 'warning')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleConfirm = async (confirm: boolean) => {
    if (!pendingConfirmation) return
    
    setPendingConfirmation(null)
    const messageText = confirm ? 'sim' : 'não'
    await handleSend(messageText)
  }

  // PRIMEIRO: Não renderizar nada enquanto está verificando autenticação
  if (isCheckingAuth) {
    return null
  }

  // SEGUNDO: Só mostrar se o usuário estiver autenticado (verificação mais importante)
  if (!isAuthenticated) {
    return null
  }

  // TERCEIRO: Ocultar em rotas públicas, admin e páginas de erro
  const publicRoutes = ['/', '/login', '/cadastro', '/planos', '/termos', '/privacidade', '/suporte']
  // Se pathname for null ou undefined, não renderizar (pode ser página de erro)
  if (!pathname || pathname?.startsWith('/administracaosecr') || publicRoutes.includes(pathname)) {
    return null
  }

  return (
    <>
      {/* Botão Flutuante PLEN - Escondido em mobile (usa bottom nav) */}
      <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-[60] hidden lg:flex items-center justify-center">
          <button
            onClick={() => setIsOpen(!isOpen)}
            data-plen-button
            aria-label="Abrir PLEN Assistant"
          className={`relative w-16 h-16 rounded-full bg-gradient-to-r from-brand-aqua to-blue-500 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center justify-center hover:scale-110 overflow-hidden ${
            isOpen ? '' : 'animate-plen-glow'
            }`}
            title="PLEN - Assistente Inteligente"
          >
          {/* Efeito de brilho sobreposto - shimmer */}
          {!isOpen && (
            <div 
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)',
                backgroundSize: '200% 100%',
                animation: 'plenShine 3s ease-in-out infinite',
              }}
            ></div>
          )}
          
          {/* Ícone com rotação suave */}
          <div className="relative z-10">
            {isOpen ? (
              <X size={24} strokeWidth={2.5} />
            ) : (
              <Sparkles 
                size={24} 
                strokeWidth={2.5} 
                style={{ 
                  animation: 'plenRotate 8s linear infinite',
                  filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.6))'
                }}
              />
            )}
          </div>
          </button>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div 
          className="fixed bottom-28 z-[60] w-[calc(100vw-2rem)] sm:w-[calc(100%-2rem)] max-w-md h-[600px] max-h-[calc(100vh-8rem)] bg-white dark:bg-brand-midnight rounded-2xl shadow-2xl border-2 border-brand-aqua/30 flex flex-col overflow-hidden"
          style={{ 
            left: '50%', 
            transform: 'translateX(-50%)'
          }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-brand-aqua to-blue-500 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles size={18} className="text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">PLEN</h3>
                <p className="text-white/80 text-xs">Assistente Financeiro</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X size={18} className="text-white" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-brand-royal/30">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                    message.role === 'user'
                      ? 'bg-brand-aqua text-white'
                      : 'bg-white dark:bg-brand-midnight text-brand-midnight dark:text-brand-clean border border-gray-200 dark:border-white/10'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                  {message.actionData && (
                    <div className="mt-3 pt-3 border-t border-white/20 dark:border-white/10">
                      {message.actionData.action === 'upgrade_required' ? (
                        <div className="space-y-2">
                          <p className="text-xs opacity-80 mb-2">
                            {message.actionData.featureName} disponível no plano {message.actionData.requiredPlan}
                          </p>
                          <a
                            href={message.actionData.buttonUrl || '/configuracoes?tab=perfil'}
                            className="inline-block px-4 py-2 bg-brand-aqua text-white rounded-lg hover:bg-brand-aqua/90 transition-smooth font-medium text-sm shadow-sm"
                          >
                            {message.actionData.buttonText || 'Assinar Plano'}
                          </a>
                        </div>
                      ) : (
                        <p className="text-xs opacity-80">
                          ✓ {message.actionData.message || 'Ação executada'}
                        </p>
                      )}
                    </div>
                  )}
                  {/* Botões de confirmação - mostrar apenas na última mensagem do assistente se houver confirmação pendente */}
                  {message.role === 'assistant' && 
                   message.id === messages[messages.length - 1]?.id && 
                   pendingConfirmation && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-white/10 flex gap-2">
                      <button
                        onClick={() => handleConfirm(true)}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ✓ Sim
                      </button>
                      <button
                        onClick={() => handleConfirm(false)}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ✗ Não
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-brand-midnight rounded-2xl px-4 py-2.5 border border-gray-200 dark:border-white/10">
                  <Loader2 size={16} className="animate-spin text-brand-aqua" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-white dark:bg-brand-midnight border-t border-gray-200 dark:border-white/10">
            <div className="flex items-center gap-2">
              <div className="relative flex items-center justify-center w-12 h-12">
                {/* Animação de ondas sonoras quando está escutando */}
                {isListening && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {/* Círculos concêntricos pulsantes - efeito de ondas sonoras tecnológicas */}
                    <div className="absolute w-10 h-10 rounded-full border-2 border-red-500/60 animate-sound-wave" />
                    <div className="absolute w-10 h-10 rounded-full border-2 border-red-500/50 animate-sound-wave-delayed" />
                    <div className="absolute w-10 h-10 rounded-full border-2 border-red-500/40 animate-sound-wave" style={{ animationDelay: '0.8s' }} />
                    {/* Círculo interno pulsante - núcleo */}
                    <div className="absolute w-6 h-6 rounded-full bg-red-500/40 animate-pulse" style={{ animationDuration: '0.6s' }} />
                  </div>
                )}
                
                <button
                  onClick={isListening ? stopListening : startListening}
                  disabled={!recognitionRef.current}
                  className={`relative z-10 p-2.5 rounded-full transition-all duration-300 ${
                    isListening
                      ? 'bg-red-500 text-white shadow-lg shadow-red-500/50 scale-110 ring-2 ring-red-500/30'
                      : 'bg-gray-100 dark:bg-brand-royal text-gray-600 dark:text-brand-clean hover:bg-gray-200 dark:hover:bg-brand-royal/80'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  title={isListening ? 'Parar gravação' : 'Falar'}
                >
                  {isListening ? <MicOff size={18} className="animate-pulse" /> : <Mic size={18} />}
                </button>
              </div>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite ou fale sua mensagem..."
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-brand-royal border border-gray-200 dark:border-white/10 rounded-lg text-brand-midnight dark:text-brand-clean placeholder-gray-400 focus:outline-none focus:border-brand-aqua transition-colors"
                disabled={isLoading}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className="p-2 bg-brand-aqua text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Send size={18} />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

