'use client'

import { useState, useEffect } from 'react'
import { User, Moon, Sun, Settings, LogOut, Crown } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function UserProfileMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [userProfile, setUserProfile] = useState<{ nome: string; imagem_url?: string | null } | null>(null)
  const router = useRouter()

  const carregarPerfil = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase
        .from('profiles')
        .select('nome, imagem_url')
        .eq('id', user.id)
        .maybeSingle()
      const md = user.user_metadata
      const nome = profile?.nome?.trim() || md?.full_name?.trim() || md?.name?.trim() || md?.nome?.trim() || user.email?.split('@')[0] || 'Usuário'
      setUserProfile({ nome, imagem_url: profile?.imagem_url ?? null })
    } catch (_) {}
  }

  useEffect(() => {
    carregarPerfil()
  }, [])

  useEffect(() => {
    if (isOpen) {
      carregarPerfil()
      router.prefetch('/configuracoes?tab=perfil')
    }
  }, [isOpen, router])

  useEffect(() => {
    // Carregar preferência de tema do localStorage
    const savedTheme = localStorage.getItem('theme')
    const darkMode = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)
    setIsDarkMode(darkMode)
    applyTheme(darkMode)
  }, [])

  const applyTheme = (dark: boolean) => {
    if (dark) {
      document.documentElement.classList.add('dark')
      // Aplicar cor de fundo escura
      document.body.style.backgroundColor = '#0D1B2A' // Cor da imagem (midnight blue)
      // Aplicar em todos os elementos principais
      const mainElements = document.querySelectorAll('.min-h-screen, main')
      mainElements.forEach((el: any) => {
        if (el) el.style.backgroundColor = '#0D1B2A'
      })
    } else {
      document.documentElement.classList.remove('dark')
      document.body.style.backgroundColor = ''
      // Remover cor de fundo escura
      const mainElements = document.querySelectorAll('.min-h-screen, main')
      mainElements.forEach((el: any) => {
        if (el) el.style.backgroundColor = ''
      })
    }
  }

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode
    setIsDarkMode(newDarkMode)
    localStorage.setItem('theme', newDarkMode ? 'dark' : 'light')
    applyTheme(newDarkMode)
  }

  const handlePerfil = () => {
    setIsOpen(false)
    router.push('/configuracoes?tab=perfil')
  }

  const handleLogout = async () => {
    // Prevenir múltiplos cliques
    if (isLoggingOut) return
    
    setIsLoggingOut(true)
    setIsOpen(false)
    
    try {
      const supabase = createClient()
      
      // Limpar sessão completamente
      await supabase.auth.signOut()
      
      // Limpar todos os cookies relacionados ao Supabase
      const cookies = document.cookie.split(';')
      cookies.forEach(cookie => {
        const eqPos = cookie.indexOf('=')
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
        // Limpar cookies do Supabase
        if (name.startsWith('sb-') || name.includes('supabase')) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`
        }
      })
      
      // Limpar localStorage relacionado ao Supabase
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') || key.includes('supabase')) {
          localStorage.removeItem(key)
        }
      })
      
      // Limpar sessionStorage
      sessionStorage.clear()
      
      // Aguardar um pouco para garantir que tudo foi limpo
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Redirecionar para página inicial (não login, para mostrar landing page)
      window.location.href = '/'
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
      // Mesmo em caso de erro, limpar e redirecionar
      localStorage.clear()
      sessionStorage.clear()
      window.location.href = '/'
    }
  }

  return (
    <div className="relative flex items-center">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex-shrink-0 w-9 h-9 border-[2.5px] border-brand-aqua bg-brand-aqua/10 dark:bg-brand-aqua/20 rounded-full hover:bg-brand-aqua/20 dark:hover:bg-brand-aqua/30 transition-smooth flex items-center justify-center overflow-hidden cursor-pointer"
        title="Minha conta"
      >
        {/* Coroa = dono da conta */}
        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 z-10 flex items-center justify-center w-5 h-5 rounded-full bg-amber-400 shadow-sm" title="Dono da conta">
          <Crown size={10} className="text-amber-900" strokeWidth={2.5} />
        </div>
        {userProfile?.imagem_url ? (
          <img
            src="/api/user/avatar"
            alt={userProfile.nome || 'Perfil'}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
              const parent = target.parentElement
              if (parent) {
                const fallback = parent.querySelector('[data-crown-fallback]') as HTMLElement
                if (fallback) fallback.style.display = 'flex'
              }
            }}
          />
        ) : null}
        <span
          data-crown-fallback
          className="text-brand-aqua font-semibold text-sm w-full h-full flex items-center justify-center"
          style={{ display: userProfile?.imagem_url ? 'none' : 'flex' }}
        >
          {(userProfile?.nome || 'U').charAt(0).toUpperCase()}
        </span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[90] bg-transparent"
            onClick={() => setIsOpen(false)}
            style={{ 
              left: '256px', 
              top: 0,
              right: 0,
              bottom: 0,
              width: 'calc(100% - 256px)'
            }}
          />
          <div className="absolute right-0 top-12 w-64 bg-white dark:bg-brand-midnight rounded-2xl shadow-2xl z-[95] overflow-hidden flex flex-col animate-scale-up pointer-events-auto border-2 border-gray-200 dark:border-brand-aqua/30">
            <div className="p-4 border-b border-gray-200 dark:border-brand-aqua/20 bg-gradient-to-r from-brand-aqua/10 to-brand-royal/10 dark:from-brand-midnight dark:to-brand-royal/50">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden bg-brand-aqua/15 dark:bg-white/15 border-2 border-brand-aqua/30 dark:border-white/20 flex items-center justify-center">
                  {userProfile?.imagem_url ? (
                    <img
                      src={userProfile.imagem_url}
                      alt={userProfile.nome || 'Perfil'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                        const fallback = e.currentTarget.nextElementSibling as HTMLElement
                        if (fallback) fallback.style.display = 'flex'
                      }}
                    />
                  ) : null}
                  <div
                    className="w-full h-full flex items-center justify-center text-brand-aqua dark:text-white"
                    style={{ display: userProfile?.imagem_url ? 'none' : 'flex' }}
                  >
                    <User size={20} strokeWidth={2} />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display font-bold text-lg text-brand-midnight dark:text-white truncate">
                    {userProfile?.nome || 'Perfil'}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Minha conta</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col bg-white dark:bg-brand-royal/80">
              <button
                onClick={handlePerfil}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-brand-aqua/10 dark:hover:bg-brand-aqua/20 transition-smooth text-left border-b border-gray-100 dark:border-white/10"
              >
                <div className="p-2 bg-brand-aqua/10 dark:bg-white/15 rounded-lg">
                  <Settings size={18} className="text-brand-midnight dark:text-white" />
                </div>
                <span className="text-sm font-semibold text-brand-midnight dark:text-brand-clean">
                  Configurações do Perfil
                </span>
              </button>
              <button
                onClick={toggleDarkMode}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-brand-aqua/10 dark:hover:bg-brand-aqua/20 transition-smooth text-left border-b border-gray-100 dark:border-white/10"
              >
                <div className="p-2 bg-brand-aqua/10 dark:bg-brand-aqua/20 rounded-lg">
                  {isDarkMode ? (
                    <Sun size={18} className="text-brand-midnight dark:text-yellow-400" />
                  ) : (
                    <Moon size={18} className="text-brand-midnight dark:text-brand-clean" />
                  )}
                </div>
                <span className="text-sm font-semibold text-brand-midnight dark:text-brand-clean">
                  {isDarkMode ? 'Modo Claro' : 'Modo Escuro'}
                </span>
              </button>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 transition-smooth text-left mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="p-1.5">
                  <LogOut size={16} className="text-red-500 dark:text-red-400" />
                </div>
                <span className="text-xs text-red-500 dark:text-red-400 font-bold">
                  {isLoggingOut ? 'Saindo...' : 'Sair da Conta'}
                </span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

