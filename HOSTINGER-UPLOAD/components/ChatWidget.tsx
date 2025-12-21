'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Minimize2, LogIn } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'

interface Message {
  id: string
  text: string
  sender: 'user' | 'support'
  timestamp: Date
}

export default function ChatWidget() {
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [hasStartedChat, setHasStartedChat] = useState(false)
  const [isStartingChat, setIsStartingChat] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    motivo: ''
  })
  const [isSubmittingForm, setIsSubmittingForm] = useState(false)
  const [isChatClosed, setIsChatClosed] = useState(false)
  const [assignedAgentName, setAssignedAgentName] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const lastUserActivityRef = useRef<Date | null>(null)
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null)
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null)
  const hasSentInactivityMessageRef = useRef(false)
  const lastSupportMessageIdRef = useRef<string | null>(null)

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }

  // Função para tocar som de notificação
  const playNotificationSound = () => {
    try {
      // Criar um som de notificação simples usando Web Audio API
      if (typeof window !== 'undefined' && window.AudioContext) {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        
        // Criar um tom de notificação agradável (duas notas)
        const playNote = (frequency: number, startTime: number) => {
          const oscillator = audioContext.createOscillator()
          const gainNode = audioContext.createGain()
          
          oscillator.connect(gainNode)
          gainNode.connect(audioContext.destination)
          
          oscillator.frequency.value = frequency
          oscillator.type = 'sine'
          
          gainNode.gain.setValueAtTime(0.3, startTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3)
          
          oscillator.start(startTime)
          oscillator.stop(startTime + 0.3)
        }
        
        // Tocar duas notas (notificação padrão)
        playNote(800, audioContext.currentTime)
        playNote(1000, audioContext.currentTime + 0.15)
      }
    } catch (error) {
      console.error('Erro ao tocar som de notificação:', error)
    }
  }

  // Verificar autenticação
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        setIsAuthenticated(!!user)
        
        // Se não estiver autenticado, limpar chat
        if (!user) {
          setMessages([])
          setHasStartedChat(false)
          setInputMessage('')
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error)
        setIsAuthenticated(false)
        setMessages([])
        setHasStartedChat(false)
      }
    }

    checkAuth()

    // Monitorar mudanças de autenticação (logout)
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setIsAuthenticated(false)
        setMessages([])
        setHasStartedChat(false)
        setShowForm(false)
        setInputMessage('')
        setFormData({ nome: '', email: '', motivo: '' })
        setIsOpen(false)
        setIsMinimized(false)
      } else if (event === 'SIGNED_IN' && session) {
        setIsAuthenticated(true)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    // Scroll automático apenas quando novas mensagens chegam
    if (messages.length > 0 && isOpen && !isMinimized) {
      // Pequeno delay para garantir que o DOM foi atualizado
      setTimeout(() => {
        scrollToBottom()
      }, 100)
    }
  }, [messages.length, isOpen, isMinimized])

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus()
    }
  }, [isOpen, isMinimized])

  const sendInactivityMessage = async () => {
    try {
      const response = await fetch('/api/chat/send-automatic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'inactivity',
          message: 'Olá! Você ainda está no chat? Se precisar de ajuda, estou aqui! 😊'
        })
      })

      if (response.ok) {
        hasSentInactivityMessageRef.current = true
        loadMessages()
        
        // Se após 2 minutos não houver resposta, encerrar o chat
        if (closeTimerRef.current) {
          clearTimeout(closeTimerRef.current)
        }
        
        closeTimerRef.current = setTimeout(() => {
          // Verificar se houve nova atividade
          const now = new Date()
          const lastActivity = lastUserActivityRef.current
          
          if (lastActivity && (now.getTime() - lastActivity.getTime()) >= 2 * 60 * 1000) {
            // Enviar mensagem de encerramento
            fetch('/api/chat/send-automatic', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                type: 'close',
                message: 'Como não recebemos resposta, estamos encerrando este chat. Se precisar de ajuda novamente, é só abrir um novo ticket! Obrigado! 👋'
              })
            }).then(() => {
              loadMessages()
              // Fechar o chat após 3 segundos
              setTimeout(() => {
                setIsOpen(false)
                setIsMinimized(false)
              }, 3000)
            })
          }
        }, 2 * 60 * 1000) // 2 minutos
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem de inatividade:', error)
    }
  }

  const resetInactivityTimer = () => {
    // Limpar timers existentes
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current)
    }
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
    }

    // Resetar flag de mensagem de inatividade se o usuário responder
    hasSentInactivityMessageRef.current = false

    // Atualizar última atividade
    lastUserActivityRef.current = new Date()

    // Se o chat estiver aberto e não minimizado, iniciar timer de 5 minutos
    if (isOpen && !isMinimized) {
      inactivityTimerRef.current = setTimeout(() => {
        // Verificar se ainda não houve nova atividade
        const now = new Date()
        const lastActivity = lastUserActivityRef.current
        
        if (lastActivity && (now.getTime() - lastActivity.getTime()) >= 5 * 60 * 1000) {
          if (!hasSentInactivityMessageRef.current) {
            sendInactivityMessage()
          }
        }
      }, 5 * 60 * 1000) // 5 minutos
    }
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return
    
    // Não permitir enviar mensagem se conversa estiver fechada
    if (isChatClosed) {
      alert('Esta conversa foi finalizada. Por favor, inicie uma nova conversa.')
      return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage.trim(),
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    const messageToSend = inputMessage.trim()
    setInputMessage('')
    setIsTyping(true)

    // Atualizar última atividade e resetar timer
    lastUserActivityRef.current = new Date()
    resetInactivityTimer()

    try {
      // Enviar mensagem para a API
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageToSend })
      })

      if (response.ok) {
        // Aguardar um pouco para garantir que a mensagem automática foi salva
        setTimeout(() => {
          loadMessages()
        }, 500)
      } else {
        console.error('Erro ao enviar mensagem')
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
    } finally {
      setIsTyping(false)
    }
  }

  const loadMessages = async () => {
    if (!isAuthenticated) return
    
    try {
      const response = await fetch('/api/chat/messages')
      if (response.ok) {
        const data = await response.json()
        const formattedMessages: Message[] = (data.messages || []).map((msg: any) => ({
          id: msg.id,
          text: msg.message,
          sender: msg.sender_type === 'support' ? 'support' : 'user',
          timestamp: new Date(msg.created_at)
        }))
        
        // Detectar novas mensagens do suporte
        const supportMessages = formattedMessages.filter(msg => msg.sender === 'support')
        const previousLastId = lastSupportMessageIdRef.current
        
        if (supportMessages.length > 0) {
          const lastSupportMessage = supportMessages[supportMessages.length - 1]
          
          // Se já tínhamos uma mensagem anterior e agora temos uma nova (ID diferente)
          if (previousLastId !== null && lastSupportMessage.id !== previousLastId) {
            // Nova mensagem do suporte detectada - tocar som
            playNotificationSound()
          }
          
          // Atualizar ID da última mensagem do suporte (inicializa na primeira vez)
          lastSupportMessageIdRef.current = lastSupportMessage.id
        }
        
        setMessages(formattedMessages)
        
        // Verificar se a conversa está finalizada
        const closed = data.isClosed || false
        setIsChatClosed(closed)
        
        // Atualizar nome do atendente se disponível, ou limpar se conversa fechada
        if (closed) {
          // Limpar nome do atendente quando conversa está fechada
          setAssignedAgentName(null)
          console.log('🔒 Conversa fechada - nome do atendente removido')
        } else if (data.assignedAgentName) {
          console.log('✅ Nome do atendente recebido:', data.assignedAgentName)
          setAssignedAgentName(data.assignedAgentName)
        } else {
          // Se não há nome e conversa está aberta, limpar também
          console.log('ℹ️ Conversa aberta mas sem nome de atendente ainda')
          setAssignedAgentName(null)
        }
        
        // Se a conversa estiver finalizada, manter mensagens mas bloquear input
        if (closed) {
          setIsChatClosed(true)
          setHasStartedChat(true) // Manter como iniciado para mostrar mensagens
          setShowForm(false) // Não mostrar formulário, mostrar mensagens
          lastSupportMessageIdRef.current = null // Resetar referência de mensagem do suporte
          setAssignedAgentName(null) // Resetar nome do atendente
          // Não limpar mensagens - deixar o usuário ver o histórico
        } else if (formattedMessages.length > 0) {
          // Se houver mensagens e não estiver finalizada, ocultar formulário
          setHasStartedChat(true)
          setShowForm(false)
        } else {
          // Se não houver mensagens, mostrar formulário
          if (isOpen && !isMinimized) {
            setShowForm(true)
            setHasStartedChat(false)
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error)
    }
  }

  const handleStartChat = async () => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    setIsStartingChat(true)
    try {
      // Verificar se já existe conversa
      const response = await fetch('/api/chat/messages')
      if (response.ok) {
        const data = await response.json()
        const closed = data.isClosed || false
        
        // Se a conversa estiver finalizada ou não houver mensagens, mostrar formulário
        if (closed || !data.messages || data.messages.length === 0) {
          setShowForm(true)
          setHasStartedChat(false)
          setIsChatClosed(false) // Resetar status de fechado
          // Limpar mensagens antigas se a conversa estava finalizada
          if (closed) {
            setMessages([])
          }
        } else {
          // Já existe conversa ativa, apenas carregar mensagens
          setHasStartedChat(true)
          setShowForm(false)
          loadMessages()
        }
      } else {
        // Em caso de erro na resposta, mostrar formulário
        setShowForm(true)
        setHasStartedChat(false)
      }
    } catch (error) {
      console.error('Erro ao iniciar chat:', error)
      // Em caso de erro, mostrar formulário mesmo assim
      setShowForm(true)
      setHasStartedChat(false)
    } finally {
      setIsStartingChat(false)
    }
  }

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    console.log('📝 Iniciando envio do formulário...', formData)
    
    // Validação mais rigorosa
    if (!formData.nome || !formData.nome.trim()) {
      console.error('❌ Nome não preenchido')
      alert('Por favor, preencha seu nome completo')
      return
    }
    
    if (!formData.email || !formData.email.trim() || !formData.email.includes('@')) {
      console.error('❌ Email inválido')
      alert('Por favor, preencha um email válido')
      return
    }
    
    if (!formData.motivo || !formData.motivo.trim()) {
      console.error('❌ Motivo não preenchido')
      alert('Por favor, descreva o motivo da sua solicitação')
      return
    }

    setIsSubmittingForm(true)

    try {
      // A API /api/chat/send já reabre a conversa automaticamente se estiver finalizada
      // Não precisamos chamar /api/chat/close aqui
      
      // Enviar mensagem com as informações do formulário
      const messageText = `Nome: ${formData.nome}\nEmail: ${formData.email}\nMotivo: ${formData.motivo}`
      
      console.log('📤 Enviando mensagem:', messageText)
      
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText })
      })

      console.log('📥 Resposta do servidor:', response.status, response.ok)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ Erro na resposta:', errorData)
        throw new Error(errorData.error || 'Erro ao enviar mensagem')
      }

      const responseData = await response.json()
      console.log('✅ Mensagem enviada com sucesso:', responseData)

      // Aguardar um pouco antes de enviar a mensagem automática
      await new Promise(resolve => setTimeout(resolve, 300))

      // Enviar mensagem de confirmação do suporte
      const confirmMessage = `Olá ${formData.nome}! 👋\n\nObrigado pelas informações! Recebemos sua solicitação:\n\n📧 Email: ${formData.email}\n📝 Motivo: ${formData.motivo}\n\nNossa equipe de suporte irá atendê-lo o mais breve possível. Aguarde um momento! 😊`
      
      console.log('📤 Enviando mensagem automática de confirmação...')
      
      const autoResponse = await fetch('/api/chat/send-automatic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'info',
          message: confirmMessage
        })
      })

      if (!autoResponse.ok) {
        console.error('❌ Erro ao enviar mensagem automática:', await autoResponse.json())
      } else {
        console.log('✅ Mensagem automática enviada com sucesso')
      }

      // Ocultar formulário, resetar estado e carregar mensagens
      setShowForm(false)
      setHasStartedChat(true)
      setIsChatClosed(false)
      setFormData({ nome: '', email: '', motivo: '' })
      lastSupportMessageIdRef.current = null // Resetar referência ao iniciar nova conversa
      
      console.log('🔄 Carregando mensagens...')
      
      // Aguardar um pouco mais antes de carregar mensagens
      setTimeout(() => {
        loadMessages()
      }, 1000)
    } catch (error: any) {
      console.error('❌ Erro ao enviar formulário:', error)
      const errorMessage = error.message || 'Erro desconhecido'
      alert('Erro ao enviar formulário: ' + errorMessage)
      setIsSubmittingForm(false)
    }
  }

  useEffect(() => {
    if (isOpen && !isMinimized && isAuthenticated) {
      // Carregar mensagens para verificar se já existe conversa
      loadMessages()
      
      if (hasStartedChat && !showForm && !isChatClosed && messages.length > 0) {
        // Atualizar mensagens a cada 3 segundos quando o chat estiver aberto e já iniciado
        const interval = setInterval(loadMessages, 3000)
        
        // Iniciar timer de inatividade
        resetInactivityTimer()
        
        return () => {
          clearInterval(interval)
          if (inactivityTimerRef.current) {
            clearTimeout(inactivityTimerRef.current)
          }
          if (closeTimerRef.current) {
            clearTimeout(closeTimerRef.current)
          }
        }
      }
    } else {
      // Limpar timers quando o chat estiver fechado ou minimizado
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current)
      }
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current)
      }
    }
  }, [isOpen, isMinimized, isAuthenticated, hasStartedChat, showForm, isChatClosed, messages.length])

  // Monitorar atividade do usuário (digitação)
  useEffect(() => {
    if (isOpen && !isMinimized && inputMessage) {
      lastUserActivityRef.current = new Date()
      resetInactivityTimer()
    }
  }, [inputMessage, isOpen, isMinimized])

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Ocultar no painel de admin
  if (pathname?.startsWith('/administracaosecr')) {
    return null
  }

  // Só mostrar o chat se o usuário estiver autenticado
  if (!isAuthenticated) {
    return null
  }

  return (
    <>
      {/* Botão flutuante do chat */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true)
            setIsMinimized(false)
          }}
          className="fixed bottom-6 right-6 z-[70] w-14 h-14 bg-brand-aqua text-brand-midnight rounded-full shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-300 flex items-center justify-center group animate-bounce-subtle"
          aria-label="Abrir chat de suporte"
        >
          <MessageCircle size={24} className="group-hover:scale-110 transition-transform" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white dark:border-brand-midnight animate-pulse"></span>
        </button>
      )}

      {/* Widget de chat */}
      {isOpen && (
        <div
          className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[70] bg-white dark:bg-brand-midnight rounded-2xl shadow-2xl border-2 border-gray-200 dark:border-brand-aqua/30 flex flex-col transition-all duration-300 ${
            isMinimized
              ? 'w-[calc(100vw-2rem)] sm:w-80 h-14 overflow-hidden'
              : 'w-[calc(100vw-2rem)] sm:w-96 h-[calc(100vh-10rem)] sm:h-[680px] max-h-[calc(100vh-10rem)] sm:max-h-[680px] overflow-hidden'
          }`}
          style={{
            height: isMinimized ? '3.5rem' : showForm ? 'calc(100vh - 10rem)' : 'calc(100vh - 10rem)',
            maxHeight: isMinimized ? '3.5rem' : showForm ? 'calc(100vh - 10rem)' : 'calc(100vh - 10rem)'
          }}
        >
          {/* Header do chat - FIXO (não rolável) */}
          <div className="bg-gradient-to-r from-brand-aqua to-brand-royal dark:from-brand-midnight dark:to-brand-royal rounded-t-2xl overflow-hidden flex-shrink-0">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 dark:bg-brand-aqua/20 rounded-full flex items-center justify-center">
                  <MessageCircle size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">Suporte ao Vivo</h3>
                  <p className="text-white/80 text-xs">Estamos aqui para ajudar</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-smooth"
                  aria-label={isMinimized ? 'Expandir chat' : 'Minimizar chat'}
                >
                  <Minimize2 size={18} className="text-white" />
                </button>
                <button
                  onClick={() => {
                    setIsOpen(false)
                    setIsMinimized(false)
                    lastSupportMessageIdRef.current = null // Resetar referência ao fechar chat
                  }}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-smooth"
                  aria-label="Fechar chat"
                >
                  <X size={18} className="text-white" />
                </button>
              </div>
            </div>
            
            {/* Atendente Atribuído ou Atendentes Disponíveis */}
            <div className="px-4 pb-3 border-t border-white/10 pt-3">
              {assignedAgentName ? (
                // Mostrar nome do atendente quando atribuído
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full border-2 border-brand-aqua overflow-hidden bg-brand-aqua/20 flex items-center justify-center">
                      <span className="text-brand-aqua text-xs font-bold">
                        {assignedAgentName.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white dark:border-brand-midnight"></div>
                  </div>
                  <p className="text-white text-sm font-medium">
                    <span className="text-brand-aqua">{assignedAgentName}</span> está te atendendo agora
                  </p>
                </div>
              ) : (
                // Mostrar atendentes disponíveis quando não há atendente atribuído
                <>
                  <p className="text-white/70 text-xs mb-2 font-medium">Atendentes disponíveis:</p>
                  <div className="flex items-center gap-2">
                    {[
                      { name: 'Ana Silva', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AnaSilva&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf' },
                      { name: 'Carlos Santos', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CarlosSantos&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf' },
                      { name: 'Mariana Costa', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MarianaCosta&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf' },
                      { name: 'Rafael Oliveira', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=RafaelOliveira&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf' }
                    ].map((atendente, index) => (
                      <div key={index} className="relative group">
                        <div className="w-8 h-8 rounded-full border-2 border-white/30 overflow-hidden bg-white/10 flex items-center justify-center">
                          <img 
                            src={atendente.avatar} 
                            alt={atendente.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback para inicial do nome se a imagem falhar
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                              const parent = target.parentElement
                              if (parent) {
                                parent.innerHTML = `<span class="text-white text-xs font-semibold">${atendente.name.charAt(0)}</span>`
                              }
                            }}
                          />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white dark:border-brand-midnight"></div>
                      </div>
                    ))}
                    <div className="ml-1 text-white/60 text-xs font-medium">
                      +4 online
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Área de mensagens - ÚNICA ÁREA ROLÁVEL */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 bg-gray-50 dark:bg-brand-royal/30 min-h-0" style={{ 
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'thin'
              }}>
                {!hasStartedChat && !showForm ? (
                  <div className="flex flex-col items-center justify-center h-full py-12">
                    <div className="text-center mb-6">
                      <div className="w-20 h-20 bg-brand-aqua/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MessageCircle size={40} className="text-brand-aqua" />
                      </div>
                      <h3 className="text-lg font-semibold text-brand-midnight dark:text-brand-clean mb-2">
                        Bem-vindo ao Suporte!
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-brand-clean/70 mb-6">
                        Clique no botão abaixo para iniciar uma conversa com nosso suporte
                      </p>
                      <button
                        onClick={handleStartChat}
                        disabled={isStartingChat}
                        className="px-6 py-3 bg-brand-aqua text-brand-midnight rounded-xl font-semibold hover:bg-brand-aqua/90 transition-smooth shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                      >
                        {isStartingChat ? (
                          <>
                            <div className="w-4 h-4 border-2 border-brand-midnight border-t-transparent rounded-full animate-spin"></div>
                            <span>Iniciando...</span>
                          </>
                        ) : (
                          <>
                            <MessageCircle size={20} />
                            <span>Iniciar Chat</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : showForm ? (
                  <div className="flex flex-col h-full py-4 overflow-y-auto overflow-x-hidden min-h-0" style={{ 
                    WebkitOverflowScrolling: 'touch',
                    scrollbarWidth: 'thin'
                  }}>
                    <div className="bg-white dark:bg-brand-royal rounded-2xl rounded-bl-sm px-4 py-3 border border-gray-200 dark:border-white/10 mb-4">
                      <h3 className="text-base font-semibold text-brand-midnight dark:text-brand-clean mb-2">
                        {isChatClosed ? 'Iniciar Nova Conversa' : 'Olá! 👋 Bem-vindo ao nosso suporte!'}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-brand-clean/70">
                        {isChatClosed 
                          ? 'Preencha o formulário abaixo para iniciar uma nova conversa com nosso suporte:'
                          : 'Para começarmos, precisamos de algumas informações:'
                        }
                      </p>
                    </div>
                    
                    <form 
                      onSubmit={(e) => {
                        console.log('📋 Form submit event disparado!')
                        handleSubmitForm(e)
                      }} 
                      className="space-y-4"
                      noValidate
                    >
                      <div>
                        <label className="block text-sm font-medium text-brand-midnight dark:text-brand-clean mb-1.5">
                          Nome Completo *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.nome}
                          onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                          placeholder="Seu nome completo"
                          className="w-full px-4 py-2.5 bg-white dark:bg-brand-midnight border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:border-brand-aqua transition-smooth text-brand-midnight dark:text-brand-clean placeholder-gray-400 dark:placeholder-brand-clean/50 text-sm"
                          disabled={isSubmittingForm}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-brand-midnight dark:text-brand-clean mb-1.5">
                          E-mail *
                        </label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="seu@email.com"
                          className="w-full px-4 py-2.5 bg-white dark:bg-brand-midnight border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:border-brand-aqua transition-smooth text-brand-midnight dark:text-brand-clean placeholder-gray-400 dark:placeholder-brand-clean/50 text-sm"
                          disabled={isSubmittingForm}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-brand-midnight dark:text-brand-clean mb-1.5">
                          Motivo da Ajuda *
                        </label>
                        <textarea
                          required
                          value={formData.motivo}
                          onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                          placeholder="Descreva como podemos ajudá-lo..."
                          rows={4}
                          className="w-full px-4 py-2.5 bg-white dark:bg-brand-midnight border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:border-brand-aqua transition-smooth text-brand-midnight dark:text-brand-clean placeholder-gray-400 dark:placeholder-brand-clean/50 text-sm resize-none"
                          disabled={isSubmittingForm}
                        />
                      </div>

                      <button
                        type="submit"
                        onClick={(e) => {
                          console.log('🔘 Botão clicado!')
                          console.log('📋 Estado do formulário:', {
                            nome: formData.nome,
                            email: formData.email,
                            motivo: formData.motivo,
                            isSubmitting: isSubmittingForm,
                            nomeValido: !!formData.nome.trim(),
                            emailValido: !!formData.email.trim(),
                            motivoValido: !!formData.motivo.trim()
                          })
                          // Não prevenir default aqui, deixar o form onSubmit lidar
                        }}
                        disabled={isSubmittingForm || !formData.nome.trim() || !formData.email.trim() || !formData.motivo.trim()}
                        className="w-full px-4 py-3 bg-brand-aqua text-brand-midnight rounded-xl font-semibold hover:bg-brand-aqua/90 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        style={{ cursor: isSubmittingForm || !formData.nome.trim() || !formData.email.trim() || !formData.motivo.trim() ? 'not-allowed' : 'pointer' }}
                      >
                        {isSubmittingForm ? (
                          <>
                            <div className="w-4 h-4 border-2 border-brand-midnight border-t-transparent rounded-full animate-spin"></div>
                            <span>Enviando...</span>
                          </>
                        ) : (
                          <>
                            <Send size={18} strokeWidth={2.5} />
                            <span>Enviar e Iniciar Conversa</span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                ) : isChatClosed && messages.length > 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-12">
                    <div className="text-center mb-6">
                      <div className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MessageCircle size={40} className="text-orange-500" />
                      </div>
                      <h3 className="text-lg font-semibold text-brand-midnight dark:text-brand-clean mb-2">
                        Conversa Finalizada
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-brand-clean/70 mb-6">
                        Esta conversa foi finalizada. Clique no botão abaixo para iniciar uma nova conversa com nosso suporte.
                      </p>
                  <button
                    onClick={() => {
                      setShowForm(true)
                      setHasStartedChat(false)
                      setIsChatClosed(false)
                      setMessages([])
                      setAssignedAgentName(null)
                    }}
                    className="px-6 py-3 bg-brand-aqua text-brand-midnight rounded-xl font-semibold hover:bg-brand-aqua/90 transition-smooth shadow-lg hover:shadow-xl flex items-center gap-2 mx-auto"
                  >
                    <MessageCircle size={20} />
                    <span>Iniciar Nova Conversa</span>
                  </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                        message.sender === 'user'
                          ? 'bg-brand-aqua text-brand-midnight rounded-br-sm'
                          : 'bg-white dark:bg-brand-royal text-brand-midnight dark:text-brand-clean rounded-bl-sm border border-gray-200 dark:border-white/10'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{message.text}</p>
                      <p
                        className={`text-xs mt-1 ${
                          message.sender === 'user'
                            ? 'text-brand-midnight/60'
                            : 'text-brand-midnight/50 dark:text-brand-clean/50'
                        }`}
                      >
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}

                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-white dark:bg-brand-royal rounded-2xl rounded-bl-sm px-4 py-2 border border-gray-200 dark:border-white/10">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-brand-aqua rounded-full animate-bounce"></span>
                            <span className="w-2 h-2 bg-brand-aqua rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                            <span className="w-2 h-2 bg-brand-aqua rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input de mensagem - FIXO (não rolável) - só aparece se conversa estiver aberta */}
              {hasStartedChat && !showForm && !isChatClosed && (
                <div className="p-4 border-t border-gray-200 dark:border-white/10 bg-white dark:bg-brand-midnight flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Digite sua mensagem..."
                      className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-brand-royal border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:border-brand-aqua transition-smooth text-brand-midnight dark:text-brand-clean placeholder-gray-400 dark:placeholder-brand-clean/50 text-sm"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!inputMessage.trim()}
                      className="p-2.5 bg-brand-aqua text-brand-midnight rounded-xl hover:bg-brand-aqua/90 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      aria-label="Enviar mensagem"
                    >
                      <Send size={18} strokeWidth={2.5} />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-brand-clean/50 mt-2 text-center">
                    Resposta média: menos de 1 minuto
                  </p>
                </div>
              )}

              {/* Mensagem quando conversa está fechada - FIXO (não rolável) - aparece no lugar do input */}
              {hasStartedChat && !showForm && isChatClosed && (
                <div className="p-4 border-t border-gray-200 dark:border-white/10 bg-orange-50 dark:bg-orange-900/20 flex-shrink-0">
                  <div className="flex items-center gap-3 p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl border border-orange-200 dark:border-orange-800">
                    <div className="flex-shrink-0">
                      <MessageCircle size={20} className="text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-orange-900 dark:text-orange-200 mb-1">
                        Conversa Finalizada
                      </p>
                      <p className="text-xs text-orange-700 dark:text-orange-300">
                        Esta conversa foi finalizada pelo suporte. Clique no botão abaixo para iniciar uma nova conversa.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowForm(true)
                      setHasStartedChat(false)
                      setIsChatClosed(false)
                      setMessages([])
                      setAssignedAgentName(null)
                    }}
                    className="w-full mt-3 px-4 py-2.5 bg-brand-aqua text-brand-midnight rounded-xl font-semibold hover:bg-brand-aqua/90 transition-smooth shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <MessageCircle size={18} />
                    <span>Iniciar Nova Conversa</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  )
}

