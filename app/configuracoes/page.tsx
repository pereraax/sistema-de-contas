import Sidebar from '@/components/Sidebar'
import { MenuButton } from '@/components/MobileMenu'
import ConfiguracoesView from '@/components/ConfiguracoesView'
import NotificationBell from '@/components/NotificationBell'
import UserProfileMenu from '@/components/UserProfileMenu'
import Logo from '@/components/Logo'
import { createClient } from '@/lib/supabase/server'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

// Função otimizada para carregar dados do perfil no servidor
async function loadProfileData() {
  try {
    const supabase = await createClient()
    
    // Buscar usuário e perfil em paralelo
    const [userResult, profileResult] = await Promise.all([
      supabase.auth.getUser(),
      supabase.auth.getUser().then(async ({ data: { user } }) => {
        if (!user) return { data: null, error: null }
        return supabase
          .from('profiles')
          .select('id, nome, email, cpf, whatsapp, whatsapp_key, plano, imagem_url, email_confirmed_at')
          .eq('id', user.id)
          .maybeSingle()
      })
    ])

    const { data: { user }, error: userError } = userResult
    const { data: profile, error: profileError } = profileResult

    if (userError || !user) {
      return null
    }

    return {
      user: {
        id: user.id,
        email: user.email || '',
        email_confirmed_at: user.email_confirmed_at || null,
      },
      profile: profile || null,
      whatsappKey: profile?.whatsapp_key || null,
    }
  } catch (error) {
    console.error('Erro ao carregar dados do perfil:', error)
    return null
  }
}

// Middleware já verifica autenticação, não precisa verificar novamente aqui

export default async function ConfiguracoesPage({
  searchParams,
}: {
  searchParams: { tab?: string } | null
}) {
  // Carregar dados do perfil no servidor para melhor performance
  const profileData = await loadProfileData()

  return (
    <div className="min-h-screen bg-brand-clean dark:bg-brand-midnight overflow-hidden">
      <Sidebar />
      <main className="lg:ml-64 p-3 sm:p-4 lg:p-8 dark:bg-brand-midnight pt-6 lg:pt-4 overflow-y-auto h-screen">
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
                Configurações
              </h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <NotificationBell />
              <UserProfileMenu />
            </div>
          </div>

          <Suspense fallback={
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-aqua"></div>
            </div>
          }>
            <ConfiguracoesView 
              tabAtivo={searchParams?.tab || 'perfil'} 
              initialProfileData={profileData}
            />
          </Suspense>
        </div>
      </main>
    </div>
  )
}
