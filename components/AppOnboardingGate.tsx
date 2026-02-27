'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppPlatform } from '@/components/AppPlatformProvider'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

/**
 * No app (iPhone): se o usuário acabou de logar e ainda não completou o onboarding,
 * redireciona para /onboarding (bem-vindo + notificações + quiz → planos).
 * No site ou se já completou, renderiza os children normalmente.
 */
export default function AppOnboardingGate({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const isApp = useAppPlatform()
  const [shouldRedirect, setShouldRedirect] = useState<boolean | null>(null)

  useEffect(() => {
    if (!isApp) {
      setShouldRedirect(false)
      return
    }
    const check = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setShouldRedirect(false)
        return
      }
      const completed = (user.user_metadata as Record<string, unknown>)?.app_onboarding_completed_at
      if (completed) {
        setShouldRedirect(false)
        return
      }
      router.replace('/onboarding')
      setShouldRedirect(true)
    }
    check()
  }, [isApp, router])

  if (shouldRedirect === true) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D1B2A]">
        <Loader2 className="w-10 h-10 text-[#00C2FF] animate-spin" />
      </div>
    )
  }

  if (shouldRedirect === null && isApp) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D1B2A]">
        <Loader2 className="w-10 h-10 text-[#00C2FF] animate-spin" />
      </div>
    )
  }

  return <>{children}</>
}
