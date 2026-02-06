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
    
    // Buscar usuário primeiro
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return null
    }

    // Buscar perfil do usuário (apenas campos necessários)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, nome, email, cpf, whatsapp, whatsapp_key, plano, imagem_url, email_confirmed_at')
      .eq('id', user.id)
      .maybeSingle()

    // Ignorar erro de perfil se não existir (pode ser criado depois)
    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Erro ao buscar perfil:', profileError)
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
