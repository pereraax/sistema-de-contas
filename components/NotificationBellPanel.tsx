'use client'

import React from 'react'
import { Bell, CheckCircle2, AlertCircle, Info, X, FileText, LayoutList } from 'lucide-react'

export type NotificationCategory = 'registro' | 'aviso' | 'acao'

interface Notification {
  id: string
  message: string
  type: 'success' | 'info' | 'warning'
  timestamp: Date
  read?: boolean
  category?: NotificationCategory
  body?: string
}

interface NotificationBellPanelProps {
  buttonRef: React.RefObject<HTMLButtonElement | null>
  isOpen: boolean
  onToggle: () => void
  onClose: () => void
  unreadCount: number
  isMobile: boolean
  popupPosition: { top: number; right: number; width: number; maxHeight: number }
  filterButtons: { key: 'all' | NotificationCategory; icon: any; label: string }[]
  filterActive: string
  setFilterActive: (k: 'all' | NotificationCategory) => void
  notifications: Notification[]
  clearNotifications: () => void
  filteredNotifications: Notification[]
  getNotificationConfig: (type: string) => any
  formatNotificationTime: (timestamp: Date) => string
  deleteNotification: (id: string, e: React.MouseEvent) => void
}

export function NotificationBellPanel(props: NotificationBellPanelProps) {
  const {
    buttonRef,
    isOpen,
    onToggle,
    onClose,
    unreadCount,
    isMobile,
    popupPosition,
    filterButtons,
    filterActive,
    setFilterActive,
    notifications,
    clearNotifications,
    filteredNotifications,
    getNotificationConfig,
    formatNotificationTime,
    deleteNotification,
  } = props

  return (
    <div className="relative flex items-center">
      <button
        ref={buttonRef}
        onClick={onToggle}
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
            className="fixed inset-0 z-[9998] bg-black/20 dark:bg-black/40 animate-notification-backdrop"
            onClick={onClose}
            aria-hidden
          />
          <div
            className={`${isMobile ? 'fixed left-1/2 -translate-x-1/2' : 'absolute top-full right-0 mt-2'} z-[9999] ${isMobile ? '' : 'w-[420px] max-w-[420px] max-h-[calc(100vh-10rem)]'}`}
            style={isMobile ? {
              top: `${popupPosition.top}px`,
              width: `${popupPosition.width}px`,
              maxWidth: `${popupPosition.width}px`,
              maxHeight: `${popupPosition.maxHeight}px`
            } : {}}
          >
            <div
              className="animate-notification-panel bg-white/95 dark:bg-brand-royal/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto border border-gray-200/50 dark:border-brand-aqua/30 ring-1 ring-gray-200/30 dark:ring-brand-aqua/20 w-full h-full"
              role="dialog"
              aria-label="Central de notificações"
            >
              <div className="flex flex-1 min-h-0 min-w-0">
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

                <div className="flex flex-col flex-1 min-w-0">
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
                        {filteredNotifications.map((notification) => {
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
                                  <Icon size={16} className={config.iconColor} strokeWidth={2.5} />
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
          </div>
        </>
      )}
    </div>
  )
}
