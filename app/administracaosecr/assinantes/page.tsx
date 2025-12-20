import { obterUsuariosAssinantes } from '@/lib/admin-auth'
import UsuariosLista from '@/components/admin/UsuariosLista'
import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

async function AssinantesContent() {
  const resultado = await obterUsuariosAssinantes()
  return <UsuariosLista usuarios={resultado.data || []} />
}

export default async function AdminAssinantesPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-brand-clean mb-2" style={{ fontWeight: 700 }}>
          Usuários Assinantes
        </h1>
        <p className="font-semibold text-brand-clean/70" style={{ fontWeight: 600 }}>
          Usuários com planos ativos (Básico ou Premium)
        </p>
      </div>

      <Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 size={48} className="animate-spin text-brand-aqua" />
        </div>
      }>
        <AssinantesContent />
      </Suspense>
    </div>
  )
}





