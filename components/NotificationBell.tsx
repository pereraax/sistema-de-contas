'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Bell, CheckCircle2, AlertCircle, Info, X, FileText, LayoutList } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'

export type NotificationCategory = 'registro' | 'aviso' | 'acao'

interface Notification {
  id: string
  message: string
  type: 'success' | 'info' | 'warning'
  timestamp: Date
  read?: boolean
  category?: NotificationCategory
  /** Corpo/detalhe (ex.: mensagem completa de aviso admin) */
  body?: string
}

type Toast = { message: string; type: 'success' | 'info' | 'warning' } | null

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [toast, setToast] = useState<Toast>(null)
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [popupPosition, setPopupPosition] = useState({ top: 0, right: 0, width: 380, maxHeight: 600 })
  const [isMobile, setIsMobile] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [filterActive, setFilterActive] = useState<'all' | NotificationCategory>('all')
  const buttonRef = useRef<HTMLButtonElement>(null)
  const router = useRouter()

  const inferCategory = (n: Notification): NotificationCategory => {
    if (n.category) return n.category
    const msg = (n.message || '').toLowerCase()
    if (/registro|registrad[oa]|dívida|parcela|empréstimo|gasto|entrada|salário|salario/.test(msg)) return 'registro'
    if (n.type === 'warning') return 'aviso'
    if (n.type === 'success') return 'acao'
    return 'acao'
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])


  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const updatePosition = () => {
        if (!buttonRef.current) return
        const rect = buttonRef.current.getBoundingClientRect()
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight
        
        if (isMobile) {
          // MOBILE: centralizar horizontalmente, posicionar abaixo do botão
          const popupWidth = Math.min(380, viewportWidth - 32)
          const top = rect.bottom + 8 // Posicionar logo abaixo do botão
          const left = (viewportWidth - popupWidth) / 2 // Centralizar horizontalmente
          const availableHeight = viewportHeight - top - 16
          const maxHeight = Math.max(200, Math.min(availableHeight, 600))
          
          setPopupPosition({
            top,
            right: viewportWidth - left - popupWidth, // Converter left para right
            width: popupWidth,
            maxHeight
          })
        } else {
          // DESKTOP: usar absolute positioning relativo ao container
          // Não precisa calcular posição, o CSS vai cuidar disso
          setPopupPosition({
            top: 0, // Não usado no desktop (usa top-full do CSS)
            right: 0, // Não usado no desktop (usa right-0 do CSS)
            width: 380, // Largura fixa no desktop
            maxHeight: 600 // Altura máxima no desktop
          })
        }
      }
      // Pequeno delay para garantir DOM atualizado
      const timeoutId = setTimeout(updatePosition, 10)
      updatePosition()
      window.addEventListener('resize', updatePosition)
      window.addEventListener('scroll', updatePosition, true)
      return () => {
        clearTimeout(timeoutId)
        window.removeEventListener('resize', updatePosition)
        window.removeEventListener('scroll', updatePosition, true)
      }
    }
  }, [isOpen])

  useEffect(() => {
    // Carregar notificações do localStorage apenas uma vez
    const saved = localStorage.getItem('notifications')
    if (saved) {
      try {
        const parsed = JSON.parse(saved).map((n: any) => {
          const msg = (n.message || '').toLowerCase()
          const inferredCategory = n.category
            || (/registro|registrad[oa]|dívida|parcela|empréstimo|gasto|entrada|salário|salario/.test(msg) ? 'registro' : null)
            || (n.type === 'warning' ? 'aviso' : 'acao')
          return {
            ...n,
            timestamp: new Date(n.timestamp),
            read: n.read !== undefined ? n.read : false,
            category: inferredCategory
          }
        })
        setNotifications(parsed)
      } catch (e) {
        console.error('Erro ao carregar notificações:', e)
      }
    }

    // Carregar avisos criados no painel admin (Central de Avisos) para exibir no filtro "Avisos"
    async function carregarAvisosAdmin() {
      try {
        const response = await fetch('/api/user/avisos', { cache: 'no-store' })
        if (!response.ok) return

        const data = await response.json()
        const avisos = data.avisos || []

        const avisosNotificacoes: Notification[] = avisos.map((aviso: { id: string; titulo: string; mensagem?: string; tipo: string; created_at: string; read?: boolean }) => ({
          id: `admin-${aviso.id}`,
          message: aviso.titulo,
          body: aviso.mensagem,
          type: (aviso.tipo === 'error' ? 'warning' : aviso.tipo) as 'success' | 'info' | 'warning',
          timestamp: new Date(aviso.created_at),
          read: !!aviso.read,
          category: 'aviso' as NotificationCategory
        }))

        setNotifications((prev) => {
          const outros = prev.filter((n) => !String(n.id).startsWith('admin-'))
          const updated = [...avisosNotificacoes, ...outros]
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 50)
          try {
            localStorage.setItem('notifications', JSON.stringify(updated))
          } catch (_) {}
          return updated
        })
      } catch (error) {
        console.error('Erro ao carregar avisos:', error)
      }
    }

    carregarAvisosAdmin()
  }, [])

  // Recarregar avisos ao abrir o painel para exibir avisos novos criados no admin
  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    fetch('/api/user/avisos', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : { avisos: [] }))
      .then((data) => {
        if (cancelled) return
        const avisos = data.avisos || []
        const avisosNotificacoes: Notification[] = avisos.map((aviso: { id: string; titulo: string; mensagem?: string; tipo: string; created_at: string; read?: boolean }) => ({
          id: `admin-${aviso.id}`,
          message: aviso.titulo,
          body: aviso.mensagem,
          type: (aviso.tipo === 'error' ? 'warning' : aviso.tipo) as 'success' | 'info' | 'warning',
          timestamp: new Date(aviso.created_at),
          read: !!aviso.read,
          category: 'aviso' as NotificationCategory
        }))
        setNotifications((prev) => {
          const outros = prev.filter((n) => !String(n.id).startsWith('admin-'))
          const updated = [...avisosNotificacoes, ...outros]
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 50)
          try {
            localStorage.setItem('notifications', JSON.stringify(updated))
          } catch (_) {}
          return updated
        })
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [isOpen])

  useEffect(() => {
    // Listener para novas notificações
    const handleNotification = (event: CustomEvent) => {
      const message = event.detail?.message ?? ''
      const type = (event.detail?.type || 'info') as 'success' | 'info' | 'warning'
      const detailCategory = event.detail?.category as NotificationCategory | undefined
      const msg = message.toLowerCase()
      const category: NotificationCategory = detailCategory
        || (/registro|registrad[oa]|dívida|parcela|empréstimo|gasto|entrada|salário|salario/.test(msg) ? 'registro' : null)
        || (type === 'warning' ? 'aviso' : 'acao')
      const newNotification: Notification = {
        id: Date.now().toString(),
        message,
        type,
        timestamp: new Date(),
        read: false,
        category
      }
      
      setNotifications((prev) => {
        const updated = [newNotification, ...prev].slice(0, 10) // Máximo 10
        localStorage.setItem('notifications', JSON.stringify(updated))
        return updated
      })

      // Toast imediato: aparece no canto da tela assim que der o erro/aviso
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
      setToast({ message, type })
      toastTimeoutRef.current = setTimeout(() => {
        setToast(null)
        toastTimeoutRef.current = null
      }, 5000)
    }

    window.addEventListener('notification' as any, handleNotification as EventListener)
    
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
      window.removeEventListener('notification' as any, handleNotification as EventListener)
    }
  }, []) // Array vazio - listener é criado apenas uma vez

  // Marcar todas como lidas ao abrir o dropdown e sincronizar avisos admin com o backend
  useEffect(() => {
    if (isOpen) {
      setNotifications((prev) => {
        const hasUnread = prev.some(n => !n.read)
        if (hasUnread) {
          // Marcar avisos admin como vistos no backend
          prev.forEach((n) => {
            if (String(n.id).startsWith('admin-') && !n.read) {
              const avisoId = n.id.replace(/^admin-/, '')
              fetch('/api/user/avisos/marcar-visto', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ avisoId })
              }).catch(() => {})
            }
          })
          const updated = prev.map(n => ({ ...n, read: true }))
          try {
            localStorage.setItem('notifications', JSON.stringify(updated))
          } catch (_) {}
          return updated
        }
        return prev
      })
    }
  }, [isOpen])

  const unreadCount = notifications.filter(n => !n.read).length
  const filteredNotifications = filterActive === 'all'
    ? notifications
    : notifications.filter((n) => inferCategory(n) === filterActive)

  const filterButtons: { key: 'all' | NotificationCategory; icon: typeof LayoutList; label: string }[] = [
    { key: 'all', icon: LayoutList, label: 'Todas' },
    { key: 'registro', icon: FileText, label: 'Registros' },
    { key: 'aviso', icon: AlertCircle, label: 'Avisos' },
    { key: 'acao', icon: CheckCircle2, label: 'Ações feitas' },
  ]

  const getNotificationConfig = (type: string) => {
    switch (type) {
      case 'success':
        return {
          icon: CheckCircle2,
          accent: 'border-l-green-500',
          iconBg: 'bg-green-500/10 dark:bg-green-500',
          iconColor: 'text-green-600 dark:text-white',
          borderColor: 'border-l-green-500',
          bgGradient: 'from-green-50/80 via-emerald-50/60 to-green-50/80 dark:from-green-900/90 dark:via-emerald-900/80 dark:to-green-900/90',
          glow: 'shadow-green-500/30',
        }
      case 'warning':
        return {
          icon: AlertCircle,
          accent: 'border-l-amber-500',
          iconBg: 'bg-amber-500/10 dark:bg-amber-500',
          iconColor: 'text-amber-600 dark:text-white',
          borderColor: 'border-l-orange-500',
          bgGradient: 'from-orange-50/80 via-amber-50/60 to-orange-50/80 dark:from-amber-900/90 dark:via-orange-900/80 dark:to-amber-900/90',
          glow: 'shadow-orange-500/30',
        }
      default:
        return {
          icon: Info,
          accent: 'border-l-brand-aqua',
          iconBg: 'bg-brand-aqua/10 dark:bg-brand-aqua',
          iconColor: 'text-brand-aqua dark:text-white',
          borderColor: 'border-l-brand-aqua',
          bgGradient: 'from-brand-aqua/10 via-blue-50/60 to-brand-aqua/10 dark:from-brand-aqua/80 dark:via-brand-royal/70 dark:to-brand-aqua/80',
          glow: 'shadow-brand-aqua/30',
        }
    }
  }

  const formatNotificationTime = (timestamp: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / 60000)
    
    if (diffInMinutes < 1) {
      return 'Agora'
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m atrás`
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60)
      return `${hours}h atrás`
    } else {
      return format(timestamp, 'dd/MM/yyyy HH:mm', { locale: ptBR })
    }
  }

  const clearNotifications = () => {
    setNotifications([])
    localStorage.removeItem('notifications')
  }

  const deleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevenir que clique no X abra a notificação
    setNotifications((prev) => {
      const updated = prev.filter(n => n.id !== id)
      localStorage.setItem('notifications', JSON.stringify(updated))
      return updated
    })
  }

  return (
    <>
      {/* Toast: portal no body para não afetar layout nem bloquear cliques; posição fixa no canto */}
      {mounted && toast && typeof document !== 'undefined' && document.body && createPortal(
        (() => {
          const config = getNotificationConfig(toast.type)
          const Icon = config.icon
          return (
            <div
              className={`fixed top-[4.75rem] right-4 z-[10001] w-[320px] max-w-[calc(100vw-2rem)] rounded-2xl border-l-4 ${config.accent} bg-white/70 dark:bg-gray-900/60 backdrop-blur-2xl border border-white/20 dark:border-white/10 ring-1 ring-white/20 dark:ring-white/5 shadow-xl shadow-black/10 p-3.5 flex items-start gap-3 animate-slide-in-right-notification`}
              role="alert"
            >
              <div className={`flex-shrink-0 ${config.iconBg} rounded-xl p-2`}>
                <Icon size={18} className={config.iconColor} strokeWidth={2.5} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white leading-snug">
                  {toast.message}
                </p>
                <p className="text-[11px] text-gray-600 dark:text-gray-200 mt-0.5">Agora</p>
              </div>
              <button
                onClick={() => { setToast(null); if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current); toastTimeoutRef.current = null }}
                className="flex-shrink-0 p-1.5 rounded-lg hover:bg-white/30 dark:hover:bg-white/10 transition-colors"
                aria-label="Fechar"
              >
                <X size={16} className="text-gray-500 dark:text-gray-200 hover:text-gray-700 dark:hover:text-white" strokeWidth={2.5} />
              </button>
            </div>
          )
        })(),
        document.body
      )}

    <div className="relative flex items-center">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 text-brand-midnight dark:text-brand-clean hover:bg-brand-clean dark:hover:bg-white/10 rounded-xl transition-all duration-300 flex items-center justify-center group hover:scale-110 active:scale-95 z-50"
      >
        <div className="relative">
          <Bell size={24} strokeWidth={2.5} className="relative z-10 transition-transform duration-300 group-hover:rotate-12" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 bg-brand-aqua text-white text-xs font-bold rounded-full min-w-[20px] h-[20px] flex items-center justify-center shadow-md ring-2 ring-white dark:ring-brand-midnight z-20 px-1.5">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[9998] bg-transparent"
            onClick={() => setIsOpen(false)}
          />
          <div 
            className={`${isMobile ? 'fixed left-1/2 -translate-x-1/2' : 'absolute top-full right-0 mt-2'} bg-white/95 dark:bg-brand-royal/95 backdrop-blur-xl rounded-3xl shadow-2xl z-[9999] overflow-hidden flex flex-col pointer-events-auto border border-gray-200/50 dark:border-brand-aqua/30 ring-1 ring-gray-200/30 dark:ring-brand-aqua/20 ${isMobile ? '' : 'w-[420px] max-w-[420px] max-h-[calc(100vh-10rem)]'}`}
            style={isMobile ? {
              top: `${popupPosition.top}px`,
              width: `${popupPosition.width}px`,
              maxWidth: `${popupPosition.width}px`,
              maxHeight: `${popupPosition.maxHeight}px`
            } : {}}
          >
            <div className="flex flex-1 min-h-0 min-w-0">
              {/* Lateral esquerda - filtros com separadores */}
              <div className="flex flex-col w-[4.5rem] flex-shrink-0 border-r border-gray-200/60 dark:border-white/10 bg-gray-50/90 dark:bg-white/[0.06] py-2">
                {filterButtons.map(({ key, icon: Icon, label }, index) => {
                  const isActive = filterActive === key
                  const isLast = index === filterButtons.length - 1
                  return (
                    <div key={key} className="flex flex-col">
                      <button
                        onClick={() => setFilterActive(key)}
                        title={label}
                        className={`flex flex-col items-center justify-center py-3 px-1.5 rounded-lg transition-all duration-200 w-full ${
                          isActive
                            ? 'bg-brand-aqua/15 dark:bg-white/15 text-brand-aqua dark:text-white'
                            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200/70 dark:hover:bg-white/10 hover:text-gray-700 dark:hover:text-gray-200'
                        }`}
                      >
                        <Icon size={20} strokeWidth={2.5} className="flex-shrink-0" />
                        <span className="text-[11px] font-medium mt-1.5 leading-tight text-center w-full px-0.5 line-clamp-2">{label}</span>
                      </button>
                      {!isLast && (
                        <div className="mx-2 my-0.5 h-px bg-gray-200/80 dark:bg-white/10 flex-shrink-0" aria-hidden />
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Conteúdo: header + lista */}
              <div className="flex flex-col flex-1 min-w-0">
                {/* Header clean */}
                <div className="relative px-4 py-3.5 border-b border-gray-200/60 dark:border-white/10 bg-white/80 dark:bg-white/[0.06] overflow-hidden">
                  <div className="relative flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex-shrink-0 p-2 rounded-xl bg-gray-100/80 dark:bg-white/10">
                        <Bell size={18} className="text-brand-aqua dark:text-white" strokeWidth={2.5} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-[15px] text-gray-800 dark:text-white tracking-tight truncate">
                          Notificações
                        </h3>
                        {unreadCount > 0 && (
                          <p className="text-[11px] text-gray-500 dark:text-gray-300 font-medium mt-0.5">
                            {unreadCount} {unreadCount === 1 ? 'não lida' : 'não lidas'}
                          </p>
                        )}
                      </div>
                    </div>
                    {notifications.length > 0 && (
                      <button
                        onClick={clearNotifications}
                        className="flex-shrink-0 px-3 py-1.5 text-[11px] font-semibold text-brand-aqua dark:text-white rounded-lg border border-gray-200/80 dark:border-white/20 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                      >
                        Limpar todas
                      </button>
                    )}
                  </div>
                </div>
            
                {/* Lista de notificações (filtrada) - clean */}
                <div className="overflow-y-auto flex-1 min-h-0 bg-white dark:bg-transparent custom-scrollbar">
                  {filteredNotifications.length === 0 ? (
                <div className="p-10 text-center">
                  <div className="inline-flex p-4 rounded-2xl bg-gray-100/80 dark:bg-white/10 mb-3">
                    <Bell size={40} className="text-gray-400 dark:text-gray-500" strokeWidth={1.5} />
                  </div>
                  <p className="text-gray-700 dark:text-white text-sm font-semibold mb-0.5">
                    {filterActive === 'all' ? 'Nenhuma notificação' : 'Nada neste filtro'}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 text-[11px]">
                    {filterActive === 'all' ? 'Você está em dia! ✨' : 'Tente outro filtro.'}
                  </p>
                </div>
              ) : (
                <div className="p-2.5 space-y-1.5">
                  {filteredNotifications.map((notification, index) => {
                    const config = getNotificationConfig(notification.type)
                    const Icon = config.icon
                    const isUnread = !notification.read
                    
                    return (
                      <div
                        key={notification.id}
                        className={`group relative pl-3 pr-2.5 py-2.5 rounded-xl border-l-[3px] ${config.borderColor} bg-gray-50/80 dark:bg-white/[0.06] hover:bg-gray-100/80 dark:hover:bg-white/10 transition-colors duration-200`}
                      >
                        {isUnread && (
                          <div className={`absolute left-0 top-0 bottom-0 w-0.5 rounded-r ${notification.type === 'success' ? 'bg-green-500' : notification.type === 'warning' ? 'bg-amber-500' : 'bg-brand-aqua'}`} />
                        )}
                        <div className="relative flex items-start gap-2.5">
                          <div className={`flex-shrink-0 ${config.iconBg} rounded-lg p-1.5`}>
                            <Icon size={16} className={`${config.iconColor}`} strokeWidth={2.5} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-medium text-gray-900 dark:text-white leading-snug mb-0.5 line-clamp-2">
                              {notification.message}
                            </p>
                            {'body' in notification && notification.body && (
                              <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug line-clamp-2 mb-1">
                                {notification.body}
                              </p>
                            )}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[11px] text-gray-500 dark:text-gray-400">
                                {formatNotificationTime(notification.timestamp)}
                              </span>
                              {isUnread && (
                                <span className="px-1.5 py-0.5 bg-brand-aqua/15 dark:bg-brand-aqua/25 text-brand-aqua text-[9px] font-semibold rounded-full uppercase tracking-wide">
                                  Nova
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={(e) => deleteNotification(notification.id, e)}
                            className="flex-shrink-0 p-1.5 rounded-lg hover:bg-gray-200/80 dark:hover:bg-white/15 opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="Fechar notificação"
                          >
                            <X size={14} className="text-gray-400 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400" strokeWidth={2.5} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
    </>
  )
}

// Função helper para criar notificações (category opcional: registro, aviso, acao)
export function createNotification(
  message: string,
  type: 'success' | 'info' | 'warning' | 'error' = 'info',
  category?: NotificationCategory
) {
  const event = new CustomEvent('notification', {
    detail: { message, type: type === 'error' ? 'warning' : type, category }
  })
  window.dispatchEvent(event)
}

