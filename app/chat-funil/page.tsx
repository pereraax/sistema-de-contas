import type { Metadata } from 'next'
import dynamic from 'next/dynamic'

const ChatFunnel = dynamic(() => import('@/components/chat-funnel/ChatFunnel'), {
  ssr: false,
})

export const metadata: Metadata = {
  title: 'Simulação de Chat | Funil Interativo',
  description:
    'Experimente uma simulação de conversa estilo WhatsApp com gráficos e respostas automáticas. Clique e veja a timeline evoluir em tempo real.',
  openGraph: {
    title: 'Simulação de Chat | Funil Interativo',
    description:
      'Landing page interativa que simula uma conversa de chat com botões, mensagens animadas e gráficos.',
    type: 'website',
  },
}

export default function ChatFunilPage() {
  return <ChatFunnel />
}

