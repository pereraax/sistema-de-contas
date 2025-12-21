import { obterAvisosAdmin } from '@/lib/admin-actions'
import CentralAvisos from '@/components/admin/CentralAvisos'
import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { verifyAdminToken } from '@/lib/admin-middleware'

async function AvisosContent() {
  const admin = await verifyAdminToken()
  const resultado = await obterAvisosAdmin()
  return <CentralAvisos avisos={resultado.data || []} adminId={admin?.id || ''} />
}

export default async function AdminAvisosPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-brand-clean mb-2" style={{ fontWeight: 700 }}>
          Central de Avisos
        </h1>
        <p className="font-semibold text-brand-clean/70" style={{ fontWeight: 600 }}>
          Envie avisos para todos os usuários da plataforma
        </p>
      </div>

      <Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 size={48} className="animate-spin text-brand-aqua" />
        </div>
      }>
        <AvisosContent />
      </Suspense>
    </div>
  )
}





