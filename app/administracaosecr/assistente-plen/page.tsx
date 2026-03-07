'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Redirecionamento: o painel Assistente Plen foi substituído pelo Chatbot Builder.
 * Toda automação Plen vem do Chatbot Builder (Administração → Chatbot Builder).
 */
export default function AssistentePlenRedirectPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/administracaosecr/plen/chatbot-builder')
  }, [router])
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-900 text-white">
      <p>Redirecionando para o Chatbot Builder...</p>
    </div>
  )
}
