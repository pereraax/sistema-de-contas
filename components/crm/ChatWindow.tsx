'use client'

import { useRef, useEffect, useState } from 'react'
import { Button } from '@/components/crm/ui/Button'
import { Send, Paperclip, Smile, Braces, FileText } from 'lucide-react'
import { DYNAMIC_VARIABLES } from '@/lib/crm/constants'

export type ChatMessageType = 'text' | 'image' | 'audio' | 'video' | 'document' | 'sticker' | 'contact' | 'location'

export interface ChatMessage {
  id: string
  tipo: 'entrada' | 'saida'
  mensagem: string
  timestamp: string
  message_type?: ChatMessageType | string | null
  media_url?: string | null
  /** Status envio: sent, delivered, read (Z-API) */
  status_envio?: string | null
}

interface ChatWindowProps {
  messages: ChatMessage[]
  contactName?: string
  inputValue: string
  onInputChange: (value: string) => void
  onSend: () => void
  loading?: boolean
  disabled?: boolean
  onInsertVariable?: (variable: string) => void
  /** Se true, não mostra a barra com nome do contato (quem usa controla no topo). */
  hideHeader?: boolean
}

export function ChatWindow({
  messages,
  contactName,
  inputValue,
  onInputChange,
  onSend,
  loading = false,
  disabled = false,
  onInsertVariable,
  hideHeader = false,
}: ChatWindowProps) {
  const inputAreaRef = useRef<HTMLDivElement>(null)
  const variablesRef = useRef<HTMLDivElement>(null)
  const [showVariables, setShowVariables] = useState(false)

  useEffect(() => {
    if (!showVariables) return
    const close = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (variablesRef.current?.contains(target)) return
      if (target.closest('[data-variables-toggle]')) return
      setShowVariables(false)
    }
    document.addEventListener('click', close, true)
    return () => document.removeEventListener('click', close, true)
  }, [showVariables])

  const formatTime = (s: string) =>
    new Date(s).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  const messageText = (m: ChatMessage): string => {
    const v = m.mensagem
    if (v == null) return ''
    if (typeof v === 'string') return v === '[object Object]' ? '' : v
    if (typeof v === 'object' && v !== null && 'message' in v) return String((v as { message?: unknown }).message ?? '')
    if (typeof v === 'object' && v !== null && 'text' in v) return String((v as { text?: unknown }).text ?? '')
    return ''
  }

  const handleInsertVariable = (key: string) => {
    onInsertVariable?.(key)
    setShowVariables(false)
  }

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = messagesEndRef.current
    const container = scrollContainerRef.current
    if (el && container) {
      el.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [messages])

  return (
    <div className="flex flex-col h-full min-h-0 bg-zinc-950/30 relative overflow-hidden">
      {!hideHeader && contactName ? (
        <div className="p-2.5 border-b border-white/10 bg-zinc-900/50 flex-shrink-0">
          <p className="font-medium text-white truncate">{contactName}</p>
        </div>
      ) : null}
      <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-2 space-y-1.5 flex flex-col">
        {disabled && messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-zinc-500">
            Selecione um contato para ver a conversa
          </div>
        ) : (
          <>
            {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-shrink-0 ${m.tipo === 'saida' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2 ${
                m.tipo === 'saida'
                  ? 'bg-[#25D366] text-white rounded-br-md'
                  : 'bg-zinc-800 text-zinc-100 rounded-bl-md border border-white/10'
              }`}
            >
              {/* Mídia: imagem, áudio, vídeo, documento */}
              {(m.message_type === 'image' || m.message_type === 'sticker') && m.media_url && (
                <div className="mb-2">
                  <img
                    src={m.media_url}
                    alt={messageText(m) || 'Imagem'}
                    className="max-w-full max-h-64 rounded-lg object-contain"
                  />
                </div>
              )}
              {m.message_type === 'audio' && m.media_url && (
                <div className="mb-2">
                  <audio controls className="max-w-full h-10" src={m.media_url}>
                    Áudio não suportado
                  </audio>
                </div>
              )}
              {m.message_type === 'video' && m.media_url && (
                <div className="mb-2">
                  <video controls className="max-w-full max-h-64 rounded-lg" src={m.media_url}>
                    Vídeo não suportado
                  </video>
                </div>
              )}
              {m.message_type === 'document' && m.media_url && (
                <a
                  href={m.media_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 mb-2 px-3 py-2 rounded-lg bg-black/20 ${m.tipo === 'saida' ? 'text-white' : 'text-zinc-200'}`}
                >
                  <FileText size={20} />
                  <span className="text-sm truncate">{messageText(m) || 'Documento'}</span>
                </a>
              )}
              {(m.message_type === 'contact' || m.message_type === 'location' || m.message_type === 'text' || !m.message_type) && (
                <p className="text-sm whitespace-pre-wrap break-words">{messageText(m) || '—'}</p>
              )}
              {m.message_type === 'image' && messageText(m) && messageText(m) !== '[Imagem]' && (
                <p className="text-sm whitespace-pre-wrap break-words mt-1 opacity-90">{messageText(m)}</p>
              )}
              {m.message_type === 'video' && messageText(m) && messageText(m) !== '[Vídeo]' && (
                <p className="text-sm whitespace-pre-wrap break-words mt-1 opacity-90">{messageText(m)}</p>
              )}
              <div className={`text-[10px] mt-0.5 flex items-center gap-1 ${m.tipo === 'saida' ? 'justify-end text-white/80' : 'text-zinc-500'}`}>
                <span>{formatTime(m.timestamp)}</span>
                {m.tipo === 'saida' && m.status_envio && m.status_envio !== 'falha' && (
                  <span className="inline-flex" title={m.status_envio === 'read' ? 'Lido' : m.status_envio === 'delivered' ? 'Entregue' : 'Enviado'}>
                    {m.status_envio === 'read' ? (
                      <span className="text-blue-200">✓✓</span>
                    ) : m.status_envio === 'delivered' ? (
                      <span className="text-white/90">✓✓</span>
                    ) : (
                      <span className="text-white/80">✓</span>
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Aba de digitar — visível e estilo WhatsApp Web */}
      <div ref={inputAreaRef} className="relative px-3 py-2 border-t border-white/10 bg-zinc-900/50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="p-2 rounded-xl text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
            title="Anexar"
          >
            <Paperclip size={20} />
          </button>
          {onInsertVariable && DYNAMIC_VARIABLES.length > 0 && (
            <div className="relative">
              {showVariables && (
                <div
                  ref={variablesRef}
                  className="absolute left-0 bottom-full mb-1.5 w-44 p-2 rounded-lg bg-zinc-800 border border-white/10 shadow-xl z-20"
                >
                  <p className="text-xs text-zinc-500 mb-1.5 font-medium">Variáveis</p>
                  <div className="flex flex-col gap-1">
                    {DYNAMIC_VARIABLES.map((v) => (
                      <button
                        key={v.key}
                        type="button"
                        onClick={() => handleInsertVariable(v.key)}
                        className="w-full px-2 py-1.5 rounded-md bg-white/10 hover:bg-[#25D366]/20 text-zinc-200 text-xs hover:text-[#25D366] transition-colors text-left"
                      >
                        {v.key}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <button
                type="button"
                data-variables-toggle
                onClick={() => setShowVariables((v) => !v)}
                className={`p-2 rounded-xl transition-colors ${
                  showVariables
                    ? 'bg-[#25D366]/20 text-[#25D366]'
                    : 'text-zinc-400 hover:bg-white/10 hover:text-white'
                }`}
                title="Variáveis dinâmicas"
              >
                <Braces size={20} />
              </button>
            </div>
          )}
          <input
            type="text"
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && onSend()}
            placeholder="Digite sua mensagem..."
            className="flex-1 min-w-0 px-4 py-2.5 text-[15px] rounded-xl bg-zinc-800 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#25D366]/50 focus:border-[#25D366]/30"
            disabled={disabled}
          />
          <button
            type="button"
            className="p-2 rounded-xl text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
            title="Emoji"
          >
            <Smile size={20} />
          </button>
          <Button
            size="md"
            variant="primary"
            onClick={onSend}
            disabled={!inputValue.trim() || loading || disabled}
            className="!px-4 !py-2.5 !rounded-xl"
          >
            <Send size={20} />
          </Button>
        </div>
      </div>
    </div>
  )
}
