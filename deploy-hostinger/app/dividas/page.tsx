'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { MenuButton } from '@/components/MobileMenu'
import DividasLista from '@/components/DividasLista'
import PlanoGuard from '@/components/PlanoGuard'
import NotificationBell from '@/components/NotificationBell'
import UserProfileMenu from '@/components/UserProfileMenu'
import Logo from '@/components/Logo'
import { obterDividas } from '@/lib/actions'
import { Loader2 } from 'lucide-react'

export default function DividasPage() {
  const [dividas, setDividas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const carregarDividas = async () => {
    try {
      setLoading(true)
      const result = await obterDividas()
      setDividas(result?.data || [])
    } catch (error) {
      console.error('Erro ao carregar dívidas:', error)
      setDividas([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarDividas()
    
    // Listener para recarregar quando a página receber foco (voltar de outra página)
    const handleFocus = () => {
      carregarDividas()
    }
    
    window.addEventListener('focus', handleFocus)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  return (
    <div className="min-h-screen bg-brand-clean dark:bg-brand-midnight">
      <Sidebar />
      <main className="lg:ml-64 p-3 sm:p-4 lg:p-8 dark:bg-brand-midnight pt-6 lg:pt-4">
        <div className="max-w-7xl mx-auto">
          {/* Logotipo centralizado acima do header */}
          <div className="flex justify-center mb-2 lg:hidden">
            <div className="w-40 sm:w-52">
              <Logo />
            </div>
          </div>

          {/* Header com notificações */}
          <div className="flex items-center justify-between gap-4 mb-4 sm:mb-6">
            <div className="flex items-center gap-3">
              <MenuButton />
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-brand-midnight dark:text-brand-clean leading-none">
                Dívidas
              </h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <NotificationBell />
              <UserProfileMenu />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-brand-aqua" size={32} />
            </div>
          ) : (
            <PlanoGuard feature="Gerenciamento de Dívidas" planoNecessario="basico">
              <DividasLista 
                dividas={dividas} 
                onDividasChange={(novasDividas) => {
                  setDividas(novasDividas)
                  // Recarregar dados do servidor quando houver mudança
                  setTimeout(() => {
                    carregarDividas()
                  }, 300)
                }} 
              />
            </PlanoGuard>
          )}
        </div>
      </main>
    </div>
  )
}

