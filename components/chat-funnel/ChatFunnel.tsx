'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChatContainer } from './ChatContainer'
import { MessageBubble, type MessageFrom } from './MessageBubble'
import { TypingIndicator } from './TypingIndicator'
import { ActionButton } from './ActionButton'
import { ChartBar } from './ChartBar'
import { ChartPie } from './ChartPie'
import { ProgressCircle } from './ProgressCircle'
import { PromoCard } from './PromoCard'

type Message =
  | { id: string; from: MessageFrom; kind: 'text'; text: string }
  | { id: string; from: MessageFrom; kind: 'bar' }
  | { id: string; from: MessageFrom; kind: 'pie' }
  | { id: string; from: MessageFrom; kind: 'progress' }
  | { id: string; from: MessageFrom; kind: 'promo' }

type Step =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8

function nowId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export default function ChatFunnel() {
  const [step, setStep] = useState<Step>(1)
  const [typing, setTyping] = useState(false)
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: nowId('ai'),
      from: 'ai',
      kind: 'text',
      text: 'Oi! Eu sou o PLEN.\nQuer ver como fica controlar tudo por chat em segundos?',
    },
    {
      id: nowId('ai'),
      from: 'ai',
      kind: 'text',
      text: 'Clique nos botões abaixo para simular uma conversa real.',
    },
  ])

  const scrollerRef = useRef<HTMLDivElement | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  const currentActionLabel = useMemo(() => {
    switch (step) {
      case 1:
        return 'Camisa 110'
      case 2:
        return 'Quanto eu gastei nos últimos 7 dias?'
      case 3:
        return 'Divisão de gastos'
      case 4:
        return 'Ok, entendi'
      case 5:
        return 'Boleto do carro todo dia 12, R$1300'
      case 6:
        return 'Crie meta Iphone 16 - 5399'
      case 7:
        return 'Ver promoção'
      default:
        return 'Quero isso no meu negócio'
    }
  }, [step])

  // Auto-scroll sempre que entrar mensagem ou typing mudar
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages.length, typing])

  // Travar scroll externo para “parecer app”
  useEffect(() => {
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [])

  const push = (m: Message) => setMessages((prev) => [...prev, m])

  const runTypingThen = async (ms: number, fn: () => void) => {
    setTyping(true)
    await wait(ms)
    setTyping(false)
    fn()
  }

  const handleAction = async () => {
    if (typing) return

    if (step === 1) {
      push({ id: nowId('u'), from: 'user', kind: 'text', text: 'Camisa 110' })
      await runTypingThen(1000, () => {
        push({
          id: nowId('ai'),
          from: 'ai',
          kind: 'text',
          text: 'Gasto adicionado\n📌 Camisa (Roupas)\nR$110.00',
        })
        setStep(2)
      })
      return
    }

    if (step === 2) {
      push({
        id: nowId('u'),
        from: 'user',
        kind: 'text',
        text: 'Quanto eu gastei nos últimos 7 dias?',
      })
      await runTypingThen(1100, () => {
        push({
          id: nowId('ai'),
          from: 'ai',
          kind: 'text',
          text: 'Segue gráfico dos seus gastos dos últimos 7 dias:',
        })
        push({ id: nowId('ai'), from: 'ai', kind: 'bar' })
        setStep(3)
      })
      return
    }

    if (step === 3) {
      push({ id: nowId('u'), from: 'user', kind: 'text', text: 'Divisão de gastos' })
      await runTypingThen(900, () => {
        push({ id: nowId('ai'), from: 'ai', kind: 'pie' })
        setStep(4)
      })
      return
    }

    if (step === 4) {
      push({ id: nowId('u'), from: 'user', kind: 'text', text: 'Ok, entendi' })
      await runTypingThen(900, () => {
        push({
          id: nowId('ai'),
          from: 'ai',
          kind: 'text',
          text: 'Os gastos aumentaram em 20% essa semana.',
        })
        setStep(5)
      })
      return
    }

    if (step === 5) {
      push({
        id: nowId('u'),
        from: 'user',
        kind: 'text',
        text: 'Boleto do carro todo dia 12, R$1300',
      })
      await runTypingThen(1000, () => {
        push({ id: nowId('ai'), from: 'ai', kind: 'text', text: 'Lembrete adicionado ✅' })
        setStep(6)
      })
      return
    }

    if (step === 6) {
      push({
        id: nowId('u'),
        from: 'user',
        kind: 'text',
        text: 'Crie meta Iphone 16 - 5399',
      })
      await runTypingThen(1100, () => {
        push({ id: nowId('ai'), from: 'ai', kind: 'text', text: 'Meta criada. Quer acompanhar o progresso?' })
        push({ id: nowId('ai'), from: 'ai', kind: 'progress' })
        setStep(7)
      })
      return
    }

    if (step === 7) {
      push({ id: nowId('u'), from: 'user', kind: 'text', text: 'Ver promoção' })
      await runTypingThen(900, () => {
        push({ id: nowId('ai'), from: 'ai', kind: 'text', text: 'Encontrei promoção para você:' })
        push({ id: nowId('ai'), from: 'ai', kind: 'promo' })
        push({
          id: nowId('ai'),
          from: 'ai',
          kind: 'text',
          text: 'Quer que eu configure isso agora para você e te entregue pronto?',
        })
        setStep(8)
      })
      return
    }

    // step 8 CTA final
    window.location.href = '/checkout'
  }

  return (
    <ChatContainer>
      <div className="relative">
        {/* Área rolável do chat */}
        <div
          ref={scrollerRef}
          className="h-[calc(100vh-48px-96px)] sm:h-[calc(100vh-48px-104px)] overflow-y-auto px-4 py-5 bg-slate-100"
        >
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {messages.map((m) => (
                <MessageItem key={m.id} message={m} />
              ))}
            </AnimatePresence>

            {typing && (
              <motion.div
                key="typing"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <TypingIndicator />
              </motion.div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>

        {/* Barra fixa de ação */}
        <div className="border-t border-slate-200 bg-white px-4 py-4">
          <div className="space-y-2">
            <ActionButton label={currentActionLabel} onClick={handleAction} disabled={typing} />
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Etapa {Math.min(step, 7)} / 7</span>
              <span className="font-medium">{step < 8 ? 'simulação de chat' : 'finalizar'}</span>
            </div>
          </div>
        </div>
      </div>
    </ChatContainer>
  )
}

function MessageItem({ message }: { message: Message }) {
  if (message.kind === 'text') {
    return <MessageBubble from={message.from}>{message.text}</MessageBubble>
  }

  if (message.kind === 'bar') {
    return (
      <MessageBubble from={message.from}>
        <ChartBar />
      </MessageBubble>
    )
  }

  if (message.kind === 'pie') {
    return (
      <MessageBubble from={message.from}>
        <ChartPie />
      </MessageBubble>
    )
  }

  if (message.kind === 'progress') {
    return (
      <MessageBubble from={message.from}>
        <ProgressCircle label="Meta criada" percent={62} />
      </MessageBubble>
    )
  }

  return (
    <MessageBubble from={message.from}>
      <PromoCard />
    </MessageBubble>
  )
}

function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

