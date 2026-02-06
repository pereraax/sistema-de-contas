import { Suspense } from 'react'
import Sidebar from '@/components/Sidebar'
import { MenuButton } from '@/components/MobileMenu'
import NotificationBell from '@/components/NotificationBell'
import UserProfileMenu from '@/components/UserProfileMenu'
import Logo from '@/components/Logo'
import { Loader2 } from 'lucide-react'
import JuntarDinheiroView from '@/components/JuntarDinheiroView'
import { obterMetasCofrinho } from '@/lib/actions'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

async function JuntarDinheiroContent({ metaId }: { metaId?: string }) {
  try {
    const resultado = await obterMetasCofrinho()
    
    if (!resultado) {
      return <JuntarDinheiroView metasIniciais={[]} metaId={metaId} />
    }
    
    if (resultado.error) {
      console.error('Erro ao obter metas:', resultado.error)
      return <JuntarDinheiroView metasIniciais={[]} metaId={metaId} />
    }
    
    const metas = Array.isArray(resultado.data) ? resultado.data : []
    
    // Se um metaId foi especificado, filtrar apenas essa meta
    if (metaId) {
      const metaEspecifica = metas.find(m => m.id === metaId)
      if (!metaEspecifica) {
        // Se a meta não foi encontrada, redirecionar para minhas-metas
        redirect('/minhas-metas')
      }
      return <JuntarDinheiroView metasIniciais={[metaEspecifica]} metaId={metaId} />
    }
    
    // Se não há metaId, redirecionar para minhas-metas
    redirect('/minhas-metas')
  } catch (error: any) {
    console.error('Erro ao carregar conteúdo:', error)
    return <JuntarDinheiroView metasIniciais={[]} metaId={metaId} />
  }
}

export default function JuntarDinheiroPage({
  searchParams,
}: {
  searchParams: { meta?: string }
}) {
  const metaId = searchParams?.meta

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#1A1A1A]">
      <Sidebar />
      <main className="lg:ml-64 p-3 sm:p-4 md:p-8 bg-gray-50 dark:bg-brand-midnight pt-3 sm:pt-4 lg:pt-4">
        <div className="max-w-7xl mx-auto">
          {/* Header: no mobile logo à esquerda do título; headbar compacta */}
          <div className="flex items-center justify-between gap-2 sm:gap-4 py-1 lg:py-0 mb-3 sm:mb-4">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="flex-shrink-0 w-9 h-9 flex items-center justify-center overflow-hidden rounded-lg lg:hidden [&_a]:!p-0 [&_a]:!w-full [&_a]:!h-full [&_img]:!w-full [&_img]:!h-full [&_img]:!object-contain">
                <Logo />
              </div>
              <MenuButton />
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-display font-bold text-gray-900 dark:text-brand-clean leading-none truncate min-w-0">
                Juntar Dinheiro
              </h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <NotificationBell />
              <UserProfileMenu />
            </div>
          </div>

          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-screen">
                <Loader2 size={48} className="animate-spin text-brand-aqua" />
              </div>
            }
          >
            <JuntarDinheiroContent metaId={metaId} />
          </Suspense>
        </div>
      </main>
    </div>
  )
}
