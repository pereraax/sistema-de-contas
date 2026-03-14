import { Suspense } from 'react'
import Sidebar from '@/components/Sidebar'
import { MenuButton } from '@/components/MobileMenu'
import PlanoGuard from '@/components/PlanoGuard'
import NotificationBell from '@/components/NotificationBell'
import UserProfileMenu from '@/components/UserProfileMenu'
import Logo from '@/components/Logo'
import { Loader2 } from 'lucide-react'
import { obterMetasCofrinho } from '@/lib/actions'
import MinhasMetasView from '@/components/MinhasMetasView'
import Image from 'next/image'

export const dynamic = 'force-dynamic'

async function MinhasMetasContent() {
  try {
    const resultado = await obterMetasCofrinho()
    
    if (!resultado) {
      return <MinhasMetasView metas={[]} />
    }
    
    if (resultado.error) {
      // "Não autenticado" é esperado quando alguém acessa sem login; não logar como erro
      if (resultado.error !== 'Não autenticado') {
        console.error('Erro ao obter metas:', resultado.error)
      }
      return <MinhasMetasView metas={[]} />
    }
    
    const metas = Array.isArray(resultado.data) ? resultado.data : []
    return <MinhasMetasView metas={metas} />
  } catch (error: any) {
    console.error('Erro ao carregar conteúdo:', error)
    return <MinhasMetasView metas={[]} />
  }
}

export default function MinhasMetasPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#1A1A1A]">
      <Sidebar />
      <main className="lg:ml-64 p-3 sm:p-4 md:p-8 bg-gray-50 dark:bg-brand-midnight pt-3 sm:pt-4 lg:pt-4">
        <div className="max-w-7xl mx-auto">
          {/* Header: no mobile logo à esquerda do título; headbar compacta */}
          <div className="relative z-30 flex items-center justify-between gap-2 sm:gap-4 py-1 lg:py-0 mb-3 sm:mb-4">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <MenuButton />
              <div className="flex-shrink-0 w-9 h-9 flex items-center justify-center overflow-hidden rounded-lg lg:hidden [&_a]:!p-0 [&_a]:!w-full [&_a]:!h-full [&_img]:!w-full [&_img]:!h-full [&_img]:!object-contain">
                <Logo />
              </div>
              <div className="p-1.5 sm:p-2 bg-brand-aqua/20 rounded-lg sm:rounded-xl flex-shrink-0 flex items-center justify-center">
                <Image 
                  src="/porco-azul.png" 
                  alt="Juntar Dinheiro" 
                  width={32} 
                  height={32}
                  className="sm:w-10 sm:h-10 object-contain"
                  priority
                  style={{ background: 'transparent' }}
                />
              </div>
              <div className="flex flex-col justify-center min-w-0">
                <h1 className="text-base sm:text-lg font-display font-bold text-gray-900 dark:text-brand-clean leading-tight truncate">
                  Confira suas metas:
                </h1>
                <p className="text-gray-600 dark:text-brand-clean/70 text-xs sm:text-sm leading-tight mt-0.5 truncate">
                  Gerencie suas metas de economia
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <NotificationBell />
              <UserProfileMenu />
            </div>
          </div>

          {/* Conteúdo protegido por PlanoGuard - apenas o conteúdo abaixo do header */}
          <PlanoGuard feature="Sistema de Metas" planoNecessario="basico">
            <Suspense
              fallback={
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={48} className="animate-spin text-brand-aqua" />
                </div>
              }
            >
              <MinhasMetasContent />
            </Suspense>
          </PlanoGuard>
        </div>
      </main>
    </div>
  )
}

