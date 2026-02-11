'use client'

import { usePathname, useRouter } from 'next/navigation'
import { 
  Users, 
  CreditCard, 
  Bell, 
  BarChart3,
  LogOut,
  Shield,
  MessageCircle,
  PlayCircle,
  Image as ImageIcon,
  TrendingUp,
  Terminal,
  Wallet
} from 'lucide-react'
import Image from 'next/image'

const menuItems = [
  { href: '/administracaosecr/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/administracaosecr/usuarios', label: 'Todos os Usuários', icon: Users },
  { href: '/administracaosecr/assinantes', label: 'Usuários Assinantes', icon: CreditCard },
  { href: '/administracaosecr/afiliados-saques', label: 'Saques Afiliados', icon: Wallet },
  { href: '/administracaosecr/avisos', label: 'Central de Avisos', icon: Bell },
  { href: '/administracaosecr/banners', label: 'Banners', icon: ImageIcon },
  { href: '/administracaosecr/chat', label: 'Chat de Suporte', icon: MessageCircle },
  { href: '/administracaosecr/tutoriais', label: 'Tutoriais', icon: PlayCircle },
  { href: '/administracaosecr/whatsapp', label: 'WhatsApp PLEN', icon: MessageCircle },
  { href: '/administracaosecr/pixel', label: 'Pixel do Facebook', icon: TrendingUp },
  { href: '/administracaosecr/logs', label: 'Logs do Servidor', icon: Terminal },
]

export default function AdminSidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = () => {
    document.cookie = 'admin_token=; path=/; max-age=0'
    router.push('/administracaosecr/login')
  }

  const handleNavigation = (href: string) => {
    router.push(href)
    if (onClose) {
      onClose()
    }
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#1A1A1A] border-r border-white/10 shadow-lg z-50">
      <div className="p-6">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/15 rounded-xl">
              <Shield size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-display font-bold text-white">
                Admin Panel
              </h2>
              <p className="text-xs font-semibold text-white/80">
                PLENIPAY
              </p>
            </div>
          </div>
        </div>
        
        <nav className="space-y-2 mb-8">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || 
              (item.href !== '/administracaosecr/dashboard' && pathname?.startsWith(item.href))
            
            return (
              <button
                key={item.href}
                onClick={() => handleNavigation(item.href)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-smooth text-left ${
                  isActive
                    ? 'bg-white/15 text-white shadow-lg'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <Icon size={20} strokeWidth={2} />
                <span className="font-bold">{item.label}</span>
              </button>
            )
          })}
        </nav>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-smooth text-left text-white hover:bg-red-900/20 hover:text-red-400"
        >
          <LogOut size={20} strokeWidth={2} />
          <span className="font-bold">Sair</span>
        </button>
      </div>
    </aside>
  )
}


