'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Minimize2, LogIn, Check, CheckCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'

interface Message {
  id: string
  text: string
  sender: 'user' | 'support'
  timestamp: Date
  isRead?: boolean
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
  const guestRestoreAttemptedRef = useRef(false)
  /** Timer de 5 min: se o usuário não responder à última mensagem do atendente, o chat é encerrado */
  const responseTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Nome fictício para exibir (nunca "Administrador" para o usuário)
  const nomeExibidoAtendente = (nome: string | null): string | null => {
    if (!nome) return null
    const lower = nome.trim().toLowerCase()
    if (lower === 'administrador' || lower === 'admin') return 'Ana Silva'
    return nome
  }

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
        guestRestoreAttemptedRef.current = false
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
    
    // No mobile o chat é um painel menor (não tela cheia), então não travar o body
    if (!isOpen || isMinimized) {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''
    }
    
    return () => {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''
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
      timestamp: new Date(),
      isRead: false
    }

    setMessages(prev => [...prev, userMessage])
    const messageToSend = inputMessage.trim()
    setInputMessage('')
    setIsTyping(true)

    // Atualizar última atividade e resetar timer; cancelar timer de 5 min (usuário respondeu)
    lastUserActivityRef.current = new Date()
    resetInactivityTimer()
    if (responseTimeoutRef.current) {
      clearTimeout(responseTimeoutRef.current)
      responseTimeoutRef.current = null
    }

    try {
      const url = isAuthenticated ? '/api/chat/send' : '/api/chat/guest/send'
      const opts: RequestInit = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageToSend })
      }
      if (!isAuthenticated) opts.credentials = 'include'
      const response = await fetch(url, opts)

      if (response.ok) {
        setTimeout(() => {
          if (isAuthenticated) loadMessages()
          else loadGuestMessages()
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
          timestamp: new Date(msg.created_at),
          isRead: !!msg.is_read
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
          if (responseTimeoutRef.current) {
            clearTimeout(responseTimeoutRef.current)
            responseTimeoutRef.current = null
          }
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
          // Cronograma de 5 min: última mensagem do atendente → usuário deve responder em 5 min
          const lastMsg = formattedMessages[formattedMessages.length - 1]
          if (lastMsg.sender === 'support') {
            if (responseTimeoutRef.current) {
              clearTimeout(responseTimeoutRef.current)
              responseTimeoutRef.current = null
            }
            const deadline = lastMsg.timestamp.getTime() + 5 * 60 * 1000
            const remaining = deadline - Date.now()
            if (remaining > 0) {
              responseTimeoutRef.current = setTimeout(() => {
                responseTimeoutRef.current = null
                fetch('/api/chat/close-by-timeout', { method: 'POST' })
                  .then(() => loadMessages())
              }, remaining)
            }
          } else {
            if (responseTimeoutRef.current) {
              clearTimeout(responseTimeoutRef.current)
              responseTimeoutRef.current = null
            }
          }
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
      setShowForm(true)
      setHasStartedChat(false)
      setIsChatClosed(false)
      setMessages([])
      setIsStartingChat(true)
      try {
        const res = await fetch('/api/chat/guest/messages', { credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          if (data.messages?.length > 0) {
            const formattedMessages: Message[] = (data.messages || []).map((msg: any) => ({
              id: msg.id,
              text: msg.message,
              sender: msg.sender_type === 'support' ? 'support' : 'user',
              timestamp: new Date(msg.created_at),
              isRead: !!msg.is_read
            }))
            setMessages(formattedMessages)
            setHasStartedChat(true)
            setShowForm(false)
            setIsChatClosed(data.isClosed || false)
            setAssignedAgentName(data.assignedAgentName ?? null)
          }
        }
      } catch (_) {
        // manter formulário visível
      } finally {
        setIsStartingChat(false)
      }
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

  const loadGuestMessages = async () => {
    try {
      const response = await fetch('/api/chat/guest/messages', { credentials: 'include' })
      if (!response.ok) return
      const data = await response.json()
      const formattedMessages: Message[] = (data.messages || []).map((msg: any) => ({
        id: msg.id,
        text: msg.message,
        sender: msg.sender_type === 'support' ? 'support' : 'user',
        timestamp: new Date(msg.created_at),
        isRead: !!msg.is_read
      }))
      const supportMessages = formattedMessages.filter(msg => msg.sender === 'support')
      const previousLastId = lastSupportMessageIdRef.current
      if (supportMessages.length > 0) {
        const lastSupportMessage = supportMessages[supportMessages.length - 1]
        if (previousLastId !== null && lastSupportMessage.id !== previousLastId) {
          playNotificationSound()
        }
        lastSupportMessageIdRef.current = lastSupportMessage.id
      }
      setMessages(formattedMessages)
      setIsChatClosed(data.isClosed || false)
      setAssignedAgentName(data.assignedAgentName ?? null)
      if (data.isClosed) {
        setAssignedAgentName(null)
        setHasStartedChat(true)
        setShowForm(false)
        lastSupportMessageIdRef.current = null
      } else if (formattedMessages.length > 0) {
        setHasStartedChat(true)
        setShowForm(false)
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens do visitante:', error)
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
      const messageText = `Nome: ${formData.nome}\nEmail: ${formData.email}\nMotivo: ${formData.motivo}`
      const confirmMessage = `Olá ${formData.nome}! 👋\n\nObrigado pelas informações! Recebemos sua solicitação:\n\n📧 Email: ${formData.email}\n📝 Motivo: ${formData.motivo}\n\nNossa equipe de suporte irá atendê-lo o mais breve possível. Aguarde um momento! 😊`

      if (!isAuthenticated) {
        // Fluxo visitante (sem login)
        console.log('📤 Enviando como visitante...')
        const response = await fetch('/api/chat/guest/start', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome: formData.nome, email: formData.email, motivo: formData.motivo })
        })
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Erro ao iniciar chat')
        }
        await new Promise(resolve => setTimeout(resolve, 300))
        await fetch('/api/chat/guest/send-automatic', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'info', message: confirmMessage })
        })
      } else {
        // Fluxo usuário logado
        const response = await fetch('/api/chat/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: messageText })
        })
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Erro ao enviar mensagem')
        }
        await new Promise(resolve => setTimeout(resolve, 300))
        const autoResponse = await fetch('/api/chat/send-automatic', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'info', message: confirmMessage })
        })
        if (!autoResponse.ok) {
          console.error('❌ Erro ao enviar mensagem automática:', await autoResponse.json())
        }
      }

      setShowForm(false)
      setHasStartedChat(true)
      setIsChatClosed(false)
      setFormData({ nome: '', email: '', motivo: '' })
      lastSupportMessageIdRef.current = null
      setTimeout(() => {
        if (isAuthenticated) loadMessages()
        else loadGuestMessages()
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
      if (!showForm) loadMessages()
      if (hasStartedChat && !showForm && !isChatClosed && messages.length > 0) {
        const interval = setInterval(loadMessages, 3000)
        resetInactivityTimer()
        return () => {
          clearInterval(interval)
          if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current)
          if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
          if (responseTimeoutRef.current) {
            clearTimeout(responseTimeoutRef.current)
            responseTimeoutRef.current = null
          }
        }
      }
    } else if (isOpen && !isMinimized && !isAuthenticated) {
      if (!guestRestoreAttemptedRef.current) {
        guestRestoreAttemptedRef.current = true
        fetch('/api/chat/guest/messages', { credentials: 'include' })
          .then((res) => res.ok ? res.json() : null)
          .then((data) => {
            if (data?.messages?.length > 0) {
              const formattedMessages: Message[] = (data.messages || []).map((msg: any) => ({
                id: msg.id,
                text: msg.message,
                sender: msg.sender_type === 'support' ? 'support' : 'user',
                timestamp: new Date(msg.created_at),
                isRead: !!msg.is_read
              }))
              setMessages(formattedMessages)
              setHasStartedChat(true)
              setShowForm(false)
              setIsChatClosed(data.isClosed || false)
              setAssignedAgentName(data.assignedAgentName ?? null)
            }
          })
          .catch(() => { guestRestoreAttemptedRef.current = false })
      }
      if (hasStartedChat && !showForm) {
        loadGuestMessages()
        const interval = setInterval(loadGuestMessages, 3000)
        return () => clearInterval(interval)
      }
    } else {
      // Limpar timers quando o chat estiver fechado ou minimizado
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current)
      }
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current)
      }
      if (responseTimeoutRef.current) {
        clearTimeout(responseTimeoutRef.current)
        responseTimeoutRef.current = null
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
  
  // Ocultar em páginas de funil/quiz (experiência PWA limpa, sem chat ao vivo)
  if (pathname === '/diagnostico-quiz' || pathname?.startsWith('/diagnostico-quiz/')) {
    return null
  }

  // Páginas sem barra inferior (mobile): botão mais baixo
  const publicRoutesNoBottomNav = ['/', '/login', '/cadastro', '/planos', '/termos', '/privacidade', '/suporte']
  const isPublicPage = pathname != null && publicRoutesNoBottomNav.includes(pathname)

  return (
    <>
      {/* Botão flutuante do chat — leve movimento (float sutil) */}
      {!isOpen && (
        <div
          className={`fixed right-4 sm:right-6 z-[40] lg:z-[9998] animate-float-subtle ${
            isPublicPage ? 'bottom-6 lg:bottom-4' : 'bottom-20 lg:bottom-4 sm:lg:bottom-6'
          }`}
        >
          <button
            onClick={() => {
              setIsOpen(true)
              setIsMinimized(false)
            }}
            className="w-14 h-14 bg-gradient-to-br from-[#2c5aa0] to-[#163a5f] text-white rounded-full shadow-lg shadow-[#1e4976]/30 hover:shadow-xl hover:shadow-[#1e4976]/40 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center group"
            aria-label="Abrir chat de suporte"
          >
            <MessageCircle size={24} className="text-white group-hover:scale-110 transition-transform" strokeWidth={2} />
            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white animate-pulse" aria-hidden></span>
          </button>
        </div>
      )}

      {/* Widget de chat */}
      {isOpen && (
        <div
          className={`fixed z-[9999] bg-white dark:bg-brand-midnight shadow-2xl flex flex-col transition-all duration-300 ${
            isMinimized
              ? `right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-80 h-14 rounded-2xl border-2 border-gray-200 dark:border-brand-aqua/30 overflow-hidden ${isPublicPage ? 'bottom-6 lg:bottom-4' : 'bottom-20 lg:bottom-4 lg:sm:bottom-6'}`
              : 'top-[10%] left-3 right-3 bottom-24 max-h-[78vh] rounded-2xl border-2 border-gray-200 dark:border-brand-aqua/30 overflow-hidden sm:top-auto sm:bottom-20 sm:left-auto sm:right-6 sm:w-96 sm:h-[680px] sm:max-h-[680px] lg:bottom-6'
          }`}
        >
          {/* Header do chat - FIXO (não rolável) - degradê para melhor leitura */}
          <div className="bg-gradient-to-r from-[#2c5aa0] via-[#1e4976] to-[#163a5f] dark:from-[#2c5aa0] dark:via-[#1e4976] dark:to-[#163a5f] sm:rounded-t-2xl overflow-hidden flex-shrink-0 shadow-lg">
            <div className="p-3 sm:p-4 flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <MessageCircle size={18} className="sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-white font-semibold text-xs sm:text-sm truncate">Suporte ao Vivo</h3>
                  <p className="text-white/90 text-[10px] sm:text-xs truncate">Estamos aqui para ajudar</p>
                </div>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1 sm:p-1.5 hover:bg-white/20 rounded-lg transition-smooth"
                  aria-label={isMinimized ? 'Expandir chat' : 'Minimizar chat'}
                >
                  <Minimize2 size={16} className="sm:w-[18px] sm:h-[18px] text-white" />
                </button>
                <button
                  onClick={() => {
                    setIsOpen(false)
                    setIsMinimized(false)
                    lastSupportMessageIdRef.current = null // Resetar referência ao fechar chat
                  }}
                  className="p-1 sm:p-1.5 hover:bg-white/20 rounded-lg transition-smooth"
                  aria-label="Fechar chat"
                >
                  <X size={16} className="sm:w-[18px] sm:h-[18px] text-white" />
                </button>
              </div>
            </div>
            
            {/* Atendente Atribuído ou Atendentes Disponíveis */}
            <div className="px-3 sm:px-4 pb-2 sm:pb-3 border-t border-white/15 pt-2 sm:pt-3">
              {assignedAgentName ? (
                // Mostrar nome fictício do atendente (sempre em branco para boa leitura)
                (() => {
                  const nome = nomeExibidoAtendente(assignedAgentName)
                  if (!nome) return null
                  return (
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="relative flex-shrink-0">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-white/50 overflow-hidden bg-white/20 flex items-center justify-center">
                          <span className="text-white text-[10px] sm:text-xs font-bold">
                            {nome.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-400 rounded-full border-2 border-white"></div>
                      </div>
                      <p className="text-white text-xs sm:text-sm font-medium truncate min-w-0">
                        <span className="text-white font-semibold">{nome}</span> está te atendendo agora
                      </p>
                    </div>
                  )
                })()
              ) : (
                // Mostrar atendentes disponíveis quando não há atendente atribuído
                <>
                  <p className="text-white/70 text-[10px] sm:text-xs mb-1.5 sm:mb-2 font-medium">Atendentes disponíveis:</p>
                  <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto">
                    {[
                      { name: 'Ana Silva', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AnaSilva&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf' },
                      { name: 'Carlos Santos', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CarlosSantos&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf' },
                      { name: 'Mariana Costa', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MarianaCosta&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf' },
                      { name: 'Rafael Oliveira', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=RafaelOliveira&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf' }
                    ].map((atendente, index) => (
                      <div key={index} className="relative group flex-shrink-0">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-white/30 overflow-hidden bg-white/10 flex items-center justify-center">
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
                                parent.innerHTML = `<span class="text-white text-[10px] sm:text-xs font-semibold">${atendente.name.charAt(0)}</span>`
                              }
                            }}
                          />
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-400 rounded-full border-2 border-white dark:border-brand-midnight"></div>
                      </div>
                    ))}
                    <div className="ml-0.5 sm:ml-1 text-white/60 text-[10px] sm:text-xs font-medium flex-shrink-0">
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
              <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 space-y-3 sm:space-y-4 bg-gray-50 dark:bg-brand-royal/30 min-h-0" style={{ 
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'thin'
              }}>
                {!hasStartedChat && !showForm ? (
                  <div className="flex flex-col items-center justify-center h-full py-8 sm:py-12 px-4">
                    <div className="text-center mb-4 sm:mb-6">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-brand-aqua/20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                        <MessageCircle size={32} className="sm:w-10 sm:h-10 text-brand-aqua" />
                      </div>
                      <h3 className="text-base sm:text-lg font-semibold text-brand-midnight dark:text-brand-clean mb-1.5 sm:mb-2">
                        Bem-vindo ao Suporte!
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-brand-clean/70 mb-4 sm:mb-6">
                        Clique no botão abaixo para iniciar uma conversa com nosso suporte
                      </p>
                      <button
                        onClick={handleStartChat}
                        disabled={isStartingChat}
                        className="px-4 sm:px-6 py-2.5 sm:py-3 bg-brand-aqua text-white rounded-xl font-semibold hover:bg-brand-aqua/90 transition-smooth shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto text-sm"
                      >
                        {isStartingChat ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-white">Iniciando...</span>
                          </>
                        ) : (
                          <>
                            <MessageCircle size={18} className="sm:w-5 sm:h-5 text-white" />
                            <span className="text-white">Iniciar Chat</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : showForm ? (
                  <div className="flex flex-col h-full py-3 sm:py-4 overflow-y-auto overflow-x-hidden min-h-0" style={{ 
                    WebkitOverflowScrolling: 'touch',
                    scrollbarWidth: 'thin'
                  }}>
                    <div className="bg-white dark:bg-brand-royal rounded-xl sm:rounded-2xl rounded-bl-sm px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 dark:border-white/10 mb-3 sm:mb-4">
                      <h3 className="text-sm sm:text-base font-semibold text-brand-midnight dark:text-brand-clean mb-1.5 sm:mb-2">
                        {isChatClosed ? 'Iniciar Nova Conversa' : 'Olá! 👋 Bem-vindo ao nosso suporte!'}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-brand-clean/70">
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
                      className="space-y-3 sm:space-y-4"
                      noValidate
                    >
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-brand-midnight dark:text-brand-clean mb-1 sm:mb-1.5">
                          Nome Completo *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.nome}
                          onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                          placeholder="Seu nome completo"
                          className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-white dark:bg-brand-midnight border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:border-brand-aqua transition-smooth text-brand-midnight dark:text-brand-clean placeholder-gray-400 dark:placeholder-brand-clean/50 text-sm"
                          disabled={isSubmittingForm}
                        />
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-brand-midnight dark:text-brand-clean mb-1 sm:mb-1.5">
                          E-mail *
                        </label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="seu@email.com"
                          className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-white dark:bg-brand-midnight border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:border-brand-aqua transition-smooth text-brand-midnight dark:text-brand-clean placeholder-gray-400 dark:placeholder-brand-clean/50 text-sm"
                          disabled={isSubmittingForm}
                        />
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-brand-midnight dark:text-brand-clean mb-1 sm:mb-1.5">
                          Motivo da Ajuda *
                        </label>
                        <textarea
                          required
                          value={formData.motivo}
                          onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                          placeholder="Descreva como podemos ajudá-lo..."
                          rows={4}
                          className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-white dark:bg-brand-midnight border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:border-brand-aqua transition-smooth text-brand-midnight dark:text-brand-clean placeholder-gray-400 dark:placeholder-brand-clean/50 text-sm resize-none"
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
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-brand-aqua text-white rounded-xl font-semibold hover:bg-brand-aqua/90 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                        style={{ cursor: isSubmittingForm || !formData.nome.trim() || !formData.email.trim() || !formData.motivo.trim() ? 'not-allowed' : 'pointer' }}
                      >
                        {isSubmittingForm ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-white">Enviando...</span>
                          </>
                        ) : (
                          <>
                            <Send size={18} strokeWidth={2.5} className="text-white" />
                            <span className="text-white">Enviar e Iniciar Conversa</span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                ) : isChatClosed && messages.length > 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-8 sm:py-12 px-4">
                    <div className="text-center mb-4 sm:mb-6">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                        <MessageCircle size={32} className="sm:w-10 sm:h-10 text-orange-500" />
                      </div>
                      <h3 className="text-base sm:text-lg font-semibold text-brand-midnight dark:text-brand-clean mb-1.5 sm:mb-2">
                        Conversa Finalizada
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-brand-clean/70 mb-4 sm:mb-6">
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
                    className="px-4 sm:px-6 py-2.5 sm:py-3 bg-brand-aqua text-white rounded-xl font-semibold hover:bg-brand-aqua/90 transition-smooth shadow-lg hover:shadow-xl flex items-center gap-2 mx-auto text-sm"
                  >
                    <MessageCircle size={18} className="sm:w-5 sm:h-5 text-white" />
                    <span className="text-white">Iniciar Nova Conversa</span>
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
                      className={`max-w-[85%] sm:max-w-[80%] rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 ${
                        message.sender === 'user'
                          ? 'bg-brand-aqua text-white rounded-br-sm'
                          : 'bg-white dark:bg-brand-royal text-brand-midnight dark:text-brand-clean rounded-bl-sm border border-gray-200 dark:border-white/10'
                      }`}
                    >
                      <p className="text-xs sm:text-sm leading-relaxed break-words">{message.text}</p>
                      <div
                        className={`flex items-center gap-1.5 mt-1 ${
                          message.sender === 'user'
                            ? 'text-white/80'
                            : 'text-brand-midnight/50 dark:text-brand-clean/50'
                        }`}
                      >
                        <span className="text-[10px] sm:text-xs">
                          {formatTime(message.timestamp)}
                        </span>
                        {message.sender === 'support' ? (
                          <CheckCheck size={12} className="flex-shrink-0 opacity-90" />
                        ) : message.isRead ? (
                          <CheckCheck size={12} className="flex-shrink-0 opacity-90" />
                        ) : (
                          <Check size={12} className="flex-shrink-0 opacity-80" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-white dark:bg-brand-royal rounded-xl sm:rounded-2xl rounded-bl-sm px-3 sm:px-4 py-2 border border-gray-200 dark:border-white/10">
                          <div className="flex gap-1">
                            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-brand-aqua rounded-full animate-bounce"></span>
                            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-brand-aqua rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-brand-aqua rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
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
                <div className="p-3 sm:p-4 border-t border-gray-200 dark:border-white/10 bg-white dark:bg-brand-midnight flex-shrink-0 safe-area-inset-bottom">
                  <div className="flex items-center gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Digite sua mensagem..."
                      className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-100 dark:bg-brand-royal border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:border-brand-aqua transition-smooth text-brand-midnight dark:text-brand-clean placeholder-gray-400 dark:placeholder-brand-clean/50 text-sm"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!inputMessage.trim()}
                      className="p-2 sm:p-2.5 bg-brand-aqua text-white rounded-xl hover:bg-brand-aqua/90 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0"
                      aria-label="Enviar mensagem"
                    >
                      <Send size={18} strokeWidth={2.5} className="text-white" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-brand-clean/50 mt-1.5 sm:mt-2 text-center">
                    Resposta média: menos de 1 minuto
                  </p>
                </div>
              )}

              {/* Mensagem quando conversa está fechada - FIXO (não rolável) - aparece no lugar do input */}
              {hasStartedChat && !showForm && isChatClosed && (
                <div className="p-3 sm:p-4 border-t border-gray-200 dark:border-white/10 bg-orange-50 dark:bg-orange-900/20 flex-shrink-0 safe-area-inset-bottom">
                  <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl border border-orange-200 dark:border-orange-800">
                    <div className="flex-shrink-0">
                      <MessageCircle size={18} className="sm:w-5 sm:h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-orange-900 dark:text-orange-200 mb-0.5 sm:mb-1">
                        Conversa Finalizada
                      </p>
                      <p className="text-[10px] sm:text-xs text-orange-700 dark:text-orange-300">
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
                    className="w-full mt-2 sm:mt-3 px-3 sm:px-4 py-2 sm:py-2.5 bg-brand-aqua text-white rounded-xl font-semibold hover:bg-brand-aqua/90 transition-smooth shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm"
                  >
                    <MessageCircle size={16} className="sm:w-[18px] sm:h-[18px] text-white" />
                    <span className="text-white">Iniciar Nova Conversa</span>
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

