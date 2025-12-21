import { verifyAdminToken } from '@/lib/admin-middleware'
import CentralBanners from '@/components/admin/CentralBanners'
import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'

async function BannersContent() {
  const admin = await verifyAdminToken()
  if (!admin) {
    return null
  }
  return <CentralBanners />
}

export default async function AdminBannersPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-brand-clean mb-2" style={{ fontWeight: 700 }}>
          Gerenciar Banners
        </h1>
        <p className="font-semibold text-brand-clean/70" style={{ fontWeight: 600 }}>
          Gerencie os banners exibidos na home page. Adicione, edite ou remova banners e configure o tempo de transição.
        </p>
      </div>

      <Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 size={48} className="animate-spin text-brand-aqua" />
        </div>
      }>
        <BannersContent />
      </Suspense>
    </div>
  )
}

