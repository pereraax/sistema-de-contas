import Sidebar from '@/components/Sidebar'
import { MenuButton } from '@/components/MobileMenu'
import ConfiguracoesView from '@/components/ConfiguracoesView'
import NotificationBell from '@/components/NotificationBell'
import UserProfileMenu from '@/components/UserProfileMenu'
import Logo from '@/components/Logo'
import { createClient } from '@/lib/supabase/server'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

// Otimizado: getSession primeiro (mais rápido), fallback para getUser se necessário
async function loadProfileData() {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    let user = session?.user

    if (!user) {
      const { data: { user: u } } = await supabase.auth.getUser()
      user = u
    }
    if (!user) return null

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, nome, email, cpf, whatsapp, whatsapp_key, plano, imagem_url, email_confirmed_at')
      .eq('id', user.id)
      .maybeSingle()

    return {
      user: {
        id: user.id,
        email: user.email || '',
        email_confirmed_at: user.email_confirmed_at || null,
        user_metadata: user.user_metadata || null,
      },
      profile: profile || null,
      whatsappKey: profile?.whatsapp_key || null,
    }
  } catch (error) {
    console.error('Erro ao carregar dados do perfil:', error)
    return null
  }
}

// Wrapper assíncrono para streaming - shell renderiza imediatamente
async function ProfileContentWrapper({ profilePromise, tabAtivo }: { profilePromise: ReturnType<typeof loadProfileData>; tabAtivo: string }) {
  const profileData = await profilePromise
  return <ConfiguracoesView tabAtivo={tabAtivo} initialProfileData={profileData} />
}

function ProfileSkeleton() {
  return (
    <div className="bg-brand-white dark:bg-brand-royal rounded-2xl shadow-lg border border-brand-clean dark:border-white/10 overflow-hidden animate-pulse">
      <div className="border-b border-brand-clean p-4 flex gap-2">
        <div className="h-10 w-32 bg-gray-200 dark:bg-white/10 rounded" />
        <div className="h-10 w-24 bg-gray-200 dark:bg-white/10 rounded" />
        <div className="h-10 w-36 bg-gray-200 dark:bg-white/10 rounded" />
      </div>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4 pb-4 border-b border-gray-200 dark:border-white/10">
          <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-white/10" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-32 bg-gray-200 dark:bg-white/10 rounded" />
            <div className="h-4 w-48 bg-gray-200 dark:bg-white/10 rounded" />
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-4 w-full bg-gray-200 dark:bg-white/10 rounded" />
          <div className="h-4 w-3/4 bg-gray-200 dark:bg-white/10 rounded" />
        </div>
      </div>
    </div>
  )
}

export default async function ConfiguracoesPage({
  searchParams,
}: {
  searchParams: { tab?: string } | null
}) {
  const tabAtivo = searchParams?.tab || 'perfil'
  // Streaming: NÃO aguardar - renderiza shell imediatamente, dados em paralelo
  const profilePromise = loadProfileData()

  return (
    <div className="min-h-screen bg-brand-clean dark:bg-[#1A1A1A] overflow-hidden">
      <Sidebar />
      <main className="lg:ml-64 p-3 sm:p-4 lg:p-8 dark:bg-[#1A1A1A] pt-3 lg:pt-4 overflow-y-auto h-screen">
        <div className="max-w-7xl mx-auto">
          {/* Header: no mobile logo ao lado do título (igual à Home) */}
          <div className="flex items-center justify-between gap-2 sm:gap-4 py-1 lg:py-0 mb-3 sm:mb-4">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              {/* Logo só no mobile, mesmo tamanho do ícone de perfil (igual à Home) */}
              <div className="flex-shrink-0 w-9 h-9 flex items-center justify-center overflow-hidden rounded-lg lg:hidden [&_a]:!p-0 [&_a]:!w-full [&_a]:!h-full [&_img]:!w-full [&_img]:!h-full [&_img]:!object-contain">
                <Logo />
              </div>
              <MenuButton />
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-display font-bold text-brand-midnight dark:text-brand-clean leading-none truncate min-w-0">
                Configurações
              </h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <NotificationBell />
              <UserProfileMenu />
            </div>
          </div>

          <Suspense fallback={<ProfileSkeleton />}>
            <ProfileContentWrapper profilePromise={profilePromise} tabAtivo={tabAtivo} />
          </Suspense>
        </div>
      </main>
    </div>
  )
}
