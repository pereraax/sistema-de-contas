'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageCircle, Send, Search, User, Clock, CheckCircle } from 'lucide-react'
import AdminLayoutWrapper from '@/components/admin/AdminLayoutWrapper'

interface Conversation {
  user_id: string
  user_email: string
  user_name: string
  last_message: string
  last_message_time: string
  unread_count: number
  total_messages: number
}

interface Message {
  id: string
  user_id: string
  message: string
  sender_type: 'user' | 'support'
  is_read: boolean
  created_at: string
}

export default function AdminChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isClosed, setIsClosed] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [showCloseModal, setShowCloseModal] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadConversations()
    const interval = setInterval(loadConversations, 5000) // Atualizar a cada 5 segundos
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (selectedUserId) {
      loadUserMessages(selectedUserId)
      const interval = setInterval(() => loadUserMessages(selectedUserId), 3000) // Atualizar mensagens a cada 3 segundos
      return () => clearInterval(interval)
    }
  }, [selectedUserId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/chat/conversations')
      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations || [])
      }
    } catch (error) {
      console.error('Erro ao carregar conversas:', error)
    }
  }

  const loadUserMessages = async (userId: string) => {
    try {
      const response = await fetch(`/api/chat/user-messages?user_id=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
        setIsClosed(data.is_closed || false)
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error)
    }
  }

  const handleCloseConversation = () => {
    if (!selectedUserId) return
    setShowCloseModal(true)
  }

  const confirmCloseConversation = async () => {
    if (!selectedUserId) return

    setIsClosing(true)
    setShowCloseModal(false)
    
    try {
      const response = await fetch('/api/chat/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: selectedUserId })
      })

      const responseData = await response.json()
      
      if (response.ok) {
        setIsClosed(true)
        setIsClosing(false)
        await loadConversations()
        await loadUserMessages(selectedUserId)
        
        // Enviar mensagem automática de encerramento
        try {
          await fetch('/api/chat/respond', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: selectedUserId,
              message: 'Esta conversa foi finalizada pelo suporte. Se precisar de mais ajuda, abra um novo ticket. Obrigado! 👋'
            })
          })
        } catch (msgError) {
          console.error('Erro ao enviar mensagem de encerramento:', msgError)
          // Não bloquear se a mensagem falhar
        }
        
        await loadUserMessages(selectedUserId)
      } else {
        const errorMessage = responseData?.error || 'Erro desconhecido ao finalizar conversa'
        console.error('Erro ao finalizar conversa:', errorMessage)
        alert('Erro ao finalizar conversa: ' + errorMessage)
        setIsClosing(false)
      }
    } catch (error: any) {
      console.error('Erro ao finalizar conversa:', error)
      const errorMessage = error?.message || error?.toString() || 'Erro desconhecido'
      alert('Erro ao finalizar conversa: ' + errorMessage)
      setIsClosing(false)
    }
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !selectedUserId) return

    setLoading(true)
    try {
      const response = await fetch('/api/chat/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: selectedUserId,
          message: inputMessage.trim()
        })
      })

      if (response.ok) {
        setInputMessage('')
        await loadUserMessages(selectedUserId)
        await loadConversations()
        inputRef.current?.focus()
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Hoje'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ontem'
    } else {
      return date.toLocaleDateString('pt-BR')
    }
  }

  const filteredConversations = conversations.filter(conv =>
    conv.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.user_email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectedConversation = conversations.find(c => c.user_id === selectedUserId)

  const totalConversations = conversations.length
  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unread_count, 0)
  const activeConversations = conversations.filter(conv => {
    const lastMessageDate = new Date(conv.last_message_time)
    const hoursSinceLastMessage = (Date.now() - lastMessageDate.getTime()) / (1000 * 60 * 60)
    return hoursSinceLastMessage < 24 // Conversas ativas nas últimas 24h
  }).length

  return (
    <AdminLayoutWrapper>
      <div className="w-full" style={{ marginLeft: '-18rem', width: 'calc(100% + 18rem)' }}>
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-display font-bold text-brand-clean mb-2" style={{ fontWeight: 700 }}>
            Chat de Suporte
          </h1>
          <p className="font-semibold text-brand-clean/70" style={{ fontWeight: 600 }}>
            Gerencie todas as conversas com os clientes
          </p>
        </div>

        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 w-full">
          <div className="bg-brand-royal rounded-2xl p-6 shadow-lg border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-blue-900/20">
                <MessageCircle size={24} className="text-blue-400" strokeWidth={2} />
              </div>
            </div>
            <p className="text-sm text-brand-clean/70 mb-1 font-bold" style={{ fontWeight: 700 }}>
              Total de Conversas
            </p>
            <p className="text-3xl font-display font-bold text-blue-400" style={{ fontWeight: 700 }}>
              {totalConversations}
            </p>
          </div>

          <div className="bg-brand-royal rounded-2xl p-6 shadow-lg border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-red-900/20">
                <MessageCircle size={24} className="text-red-400" strokeWidth={2} />
              </div>
            </div>
            <p className="text-sm text-brand-clean/70 mb-1 font-bold" style={{ fontWeight: 700 }}>
              Mensagens Não Lidas
            </p>
            <p className="text-3xl font-display font-bold text-red-400" style={{ fontWeight: 700 }}>
              {totalUnread}
            </p>
          </div>

          <div className="bg-brand-royal rounded-2xl p-6 shadow-lg border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-green-900/20">
                <MessageCircle size={24} className="text-green-400" strokeWidth={2} />
              </div>
            </div>
            <p className="text-sm text-brand-clean/70 mb-1 font-bold" style={{ fontWeight: 700 }}>
              Conversas Ativas (24h)
            </p>
            <p className="text-3xl font-display font-bold text-green-400" style={{ fontWeight: 700 }}>
              {activeConversations}
            </p>
          </div>
        </div>

        {/* Layout principal */}
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 w-full" style={{ height: 'calc(100vh - 250px)', maxHeight: 'calc(100vh - 250px)' }}>
          {/* Lista de conversas */}
          <div className="bg-brand-royal rounded-2xl shadow-lg border border-white/10 flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 250px)', maxHeight: 'calc(100vh - 250px)' }}>
            {/* Header */}
            <div className="p-4 border-b border-white/10">
              <h2 className="text-xl font-display text-brand-clean mb-3">
                Conversas
              </h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brand-clean/50" size={18} />
                <input
                  type="text"
                  placeholder="Buscar conversas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-brand-midnight/50 border border-white/10 rounded-xl focus:outline-none focus:border-brand-aqua transition-smooth text-brand-clean placeholder-brand-clean/40 text-sm"
                />
              </div>
            </div>

            {/* Lista */}
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              {filteredConversations.length === 0 ? (
                <div className="p-2 text-center text-brand-clean/50">
                  <MessageCircle size={48} className="mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Nenhuma conversa encontrada</p>
                </div>
              ) : (
                <div className="divide-y divide-white/10">
                  {filteredConversations.map((conv) => (
                    <button
                      key={conv.user_id}
                      onClick={() => setSelectedUserId(conv.user_id)}
                      className={`w-full p-4 text-left hover:bg-brand-midnight/50 transition-smooth ${
                        selectedUserId === conv.user_id
                          ? 'bg-brand-aqua/20 border-l-4 border-brand-aqua'
                          : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-brand-aqua/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <User size={20} className="text-brand-aqua" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-semibold text-brand-clean text-sm truncate">
                              {conv.user_name}
                            </p>
                            {conv.unread_count > 0 && (
                              <span className="bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">
                                {conv.unread_count}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-brand-clean/60 truncate mb-1">
                            {conv.user_email}
                          </p>
                          <p className="text-xs text-brand-clean/50 truncate mb-2">
                            {conv.last_message}
                          </p>
                          <div className="flex items-center gap-2">
                            <Clock size={12} className="text-brand-clean/40" />
                            <span className="text-xs text-brand-clean/40">
                              {formatDate(conv.last_message_time)} às {formatTime(conv.last_message_time)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Área de chat */}
          <div className="bg-brand-royal rounded-2xl shadow-lg border border-white/10 flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 250px)', maxHeight: 'calc(100vh - 250px)' }}>
            {selectedUserId ? (
              <>
                {/* Header do chat */}
                <div className="p-4 border-b border-white/10 bg-brand-midnight/50 flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-brand-aqua/20 rounded-full flex items-center justify-center">
                      <User size={24} className="text-brand-aqua" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-brand-clean text-lg">
                          {selectedConversation?.user_name || 'Usuário'}
                        </h3>
                        {isClosed && (
                          <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full border border-red-500/30">
                            Finalizada
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-brand-clean/60">
                        {selectedConversation?.user_email}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-brand-clean/50">
                          {selectedConversation?.total_messages || 0} mensagens
                        </p>
                      </div>
                      {!isClosed && (
                        <button
                          onClick={handleCloseConversation}
                          disabled={isClosing}
                          className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-smooth flex items-center gap-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed border border-red-500/30"
                          title="Finalizar conversa"
                        >
                          <CheckCircle size={16} />
                          {isClosing ? 'Finalizando...' : 'Finalizar'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Mensagens */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-brand-midnight/30 scrollbar-hide min-h-0">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender_type === 'support' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                          message.sender_type === 'support'
                            ? 'bg-brand-aqua text-brand-midnight rounded-br-sm shadow-lg'
                            : 'bg-brand-royal text-brand-clean rounded-bl-sm border border-white/10 shadow-md'
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{message.message}</p>
                        <p
                          className={`text-xs mt-2 ${
                            message.sender_type === 'support'
                              ? 'text-brand-midnight/60'
                              : 'text-brand-clean/50'
                          }`}
                        >
                          {formatTime(message.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-white/10 bg-brand-midnight/50 flex-shrink-0">
                  {isClosed ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-brand-clean/60">
                        Esta conversa foi finalizada. O usuário não pode mais enviar mensagens.
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <input
                        ref={inputRef}
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Digite sua resposta..."
                        className="flex-1 px-4 py-3 bg-brand-royal border border-white/10 rounded-xl focus:outline-none focus:border-brand-aqua transition-smooth text-brand-clean placeholder-brand-clean/40"
                        disabled={loading}
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!inputMessage.trim() || loading}
                        className="p-3 bg-brand-aqua text-brand-midnight rounded-xl hover:bg-brand-aqua/90 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                      >
                        <Send size={20} strokeWidth={2.5} />
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center min-h-0" style={{ height: '100%' }}>
                <div className="text-center">
                  <div className="w-20 h-20 bg-brand-aqua/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle size={40} className="text-brand-aqua" />
                  </div>
                  <h3 className="text-xl font-display text-brand-clean mb-2">
                    Selecione uma conversa
                  </h3>
                  <p className="text-brand-clean/60">
                    Escolha uma conversa da lista para começar a responder
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Confirmação */}
      {showCloseModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => !isClosing && setShowCloseModal(false)}
        >
          <div 
            className="bg-brand-royal rounded-2xl shadow-2xl border-2 border-white/10 max-w-md w-full p-6 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle size={24} className="text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-display text-brand-clean mb-2">
                  Finalizar Conversa
                </h3>
                <p className="text-brand-clean/70 text-sm leading-relaxed">
                  Tem certeza que deseja finalizar esta conversa? O usuário não poderá mais enviar mensagens após a finalização.
                </p>
              </div>
            </div>

            <div className="bg-brand-midnight/50 rounded-xl p-4 mb-6 border border-white/10">
              <p className="text-xs text-brand-clean/60 mb-2 font-medium">Usuário:</p>
              <p className="text-sm text-brand-clean font-semibold">
                {selectedConversation?.user_name || 'Usuário'}
              </p>
              <p className="text-xs text-brand-clean/50 mt-1">
                {selectedConversation?.user_email}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCloseModal(false)}
                disabled={isClosing}
                className="flex-1 px-4 py-3 bg-brand-midnight/50 hover:bg-brand-midnight/70 text-brand-clean rounded-xl font-semibold transition-smooth disabled:opacity-50 disabled:cursor-not-allowed border border-white/10"
              >
                Cancelar
              </button>
              <button
                onClick={confirmCloseConversation}
                disabled={isClosing}
                className="flex-1 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl font-semibold transition-smooth disabled:opacity-50 disabled:cursor-not-allowed border border-red-500/30 flex items-center justify-center gap-2"
              >
                {isClosing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                    <span>Finalizando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} />
                    <span>Finalizar Conversa</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayoutWrapper>
  )
}

