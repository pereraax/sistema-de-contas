import { unstable_noStore } from 'next/cache'
import { obterTodosUsuarios } from '@/lib/admin-auth'
import UsuariosLista from '@/components/admin/UsuariosLista'
import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

async function UsuariosContent() {
  unstable_noStore()
  const resultado = await obterTodosUsuarios()
  
  if (resultado.error) {
    console.error('Erro ao carregar usuários:', resultado.error)
  }
  
  return <UsuariosLista usuarios={resultado.data || []} error={resultado.error} />
}

export default async function AdminUsuariosPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-4 sm:mb-6 lg:mb-8 pt-2 sm:pt-0 pl-0 sm:pl-0">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-display font-bold text-brand-clean mb-1 sm:mb-2">
          Todos os Usuários
        </h1>
        <p className="text-xs sm:text-sm lg:text-base font-semibold text-brand-clean/70">
          Gerencie todos os usuários cadastrados na plataforma
        </p>
      </div>

      <Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 size={48} className="animate-spin text-brand-aqua" />
        </div>
      }>
        <UsuariosContent />
      </Suspense>
    </div>
  )
}


