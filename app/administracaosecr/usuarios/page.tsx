import { obterTodosUsuarios } from '@/lib/admin-auth'
import UsuariosLista from '@/components/admin/UsuariosLista'
import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

async function UsuariosContent() {
  const resultado = await obterTodosUsuarios()
  
  if (resultado.error) {
    console.error('Erro ao carregar usuários:', resultado.error)
  }
  
  return <UsuariosLista usuarios={resultado.data || []} error={resultado.error} />
}

export default async function AdminUsuariosPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-brand-clean mb-2" style={{ fontWeight: 700 }}>
          Todos os Usuários
        </h1>
        <p className="font-semibold text-brand-clean/70" style={{ fontWeight: 600 }}>
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


