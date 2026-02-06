'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Cookie } from 'lucide-react'

const STORAGE_KEY = 'plenipay_cookie_consent'

function useIsDark() {
  const [isDark, setIsDark] = useState(false)
  useEffect(() => {
    const read = () => {
      try {
        const hasClass = document.documentElement.classList.contains('dark')
        const saved = localStorage.getItem('theme')
        const dark = hasClass || saved === 'dark' || (!saved && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches)
        setIsDark(!!dark)
      } catch {
        setIsDark(false)
      }
    }
    read()
    const observer = new MutationObserver(read)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    if (typeof window !== 'undefined') window.addEventListener('storage', read)
    return () => {
      observer.disconnect()
      if (typeof window !== 'undefined') window.removeEventListener('storage', read)
    }
  }, [])
  return isDark
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)
  const [mounted, setMounted] = useState(false)
  const isDark = useIsDark()

  useEffect(() => {
    setMounted(true)
    try {
      const value = localStorage.getItem(STORAGE_KEY)
      if (value !== 'accepted' && value !== 'declined') {
        setVisible(true)
      }
    } catch {
      setVisible(true)
    }
  }, [])

  const accept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'accepted')
    } catch {}
    setVisible(false)
  }

  const decline = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'declined')
    } catch {}
    setVisible(false)
  }

  if (!mounted || !visible) return null

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[9999] p-4 sm:p-5 animate-slide-up"
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-desc"
    >
      <div className={`max-w-4xl mx-auto rounded-2xl shadow-2xl overflow-hidden transition-colors ${isDark ? 'bg-[#1e293b] border border-white/10' : 'bg-white border border-gray-200'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 sm:p-5">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-brand-aqua/15 flex items-center justify-center">
              <Cookie className="text-brand-aqua" size={22} strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h2 id="cookie-consent-title" className={`text-base font-semibold mb-0.5 ${isDark ? 'text-white' : 'text-brand-midnight'}`}>
                Utilizamos cookies
              </h2>
              <p id="cookie-consent-desc" className={`text-sm ${isDark ? 'text-white/80' : 'text-brand-midnight/80'}`}>
                Para melhorar sua experiência, analisar o tráfego e personalizar conteúdo utilizamos cookies.{' '}
                Ao continuar, você concorda com nossa{' '}
                <Link href="/privacidade" className="text-brand-aqua hover:underline font-medium">
                  Política de Privacidade
                </Link>.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={decline}
              className={`px-4 py-2.5 text-sm font-medium rounded-xl transition-colors ${isDark ? 'text-white/70 hover:bg-white/10' : 'text-brand-midnight/70 hover:bg-gray-100'}`}
              aria-label="Recusar cookies opcionais"
            >
              Recusar
            </button>
            <button
              onClick={accept}
              className="px-5 py-2.5 text-sm font-semibold bg-brand-aqua hover:bg-brand-aqua/90 text-white rounded-xl transition-colors shadow-md hover:shadow-lg"
              aria-label="Aceitar cookies"
            >
              Aceitar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
