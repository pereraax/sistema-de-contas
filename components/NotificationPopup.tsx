'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, TrendingUp, Crown, Target, Sparkles } from 'lucide-react'

interface Notification {
  id: string
  message: string
  icon: 'purchase' | 'goal' | 'premium' | 'achievement'
  timestamp: number
}

const nomesBrasileiros = [
  'Ana Clara', 'Bruna', 'Carlos', 'Daniela', 'Eduardo', 'Fernanda', 'Gabriel', 'Helena',
  'Isabela', 'João', 'Juliana', 'Lucas', 'Mariana', 'Natália', 'Pedro', 'Rafaela',
  'Sofia', 'Thiago', 'Vanessa', 'Wagner', 'Yasmin', 'Zeca', 'Amanda', 'Bruno',
  'Camila', 'Diego', 'Elisa', 'Felipe', 'Giovanna', 'Henrique', 'Igor', 'Jéssica',
  'Karine', 'Leonardo', 'Mirella', 'Nicolas', 'Olivia', 'Paulo', 'Quésia', 'Renata'
]

const cidadesBrasileiras = [
  'São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Brasília', 'Salvador',
  'Curitiba', 'Fortaleza', 'Recife', 'Porto Alegre', 'Manaus',
  'Goiânia', 'Belém', 'Vitória', 'Florianópolis', 'Natal',
  'Campinas', 'São Luís', 'Maceió', 'João Pessoa', 'Aracaju'
]

const planos = ['Plano Básico', 'Plano Premium', 'Plano Anual']

const tiposMensagens = [
  {
    type: 'purchase',
    templates: [
      '{nome} de {cidade} acabou de assinar o {plano}',
      '{nome} de {cidade} se tornou assinante do {plano}',
      '{nome} de {cidade} acabou de adquirir o {plano}',
    ],
    icon: 'purchase' as const
  },
  {
    type: 'goal',
    templates: [
      '{nome} acabou de completar sua meta com os baús de MM',
      '{nome} alcançou sua meta financeira usando os baús',
      '{nome} completou uma meta e ganhou recompensas',
    ],
    icon: 'goal' as const
  },
  {
    type: 'premium',
    templates: [
      '{nome} de {cidade} fez upgrade para Premium',
      '{nome} de {cidade} desbloqueou recursos Premium',
      '{nome} de {cidade} agora é Premium',
    ],
    icon: 'premium' as const
  },
  {
    type: 'achievement',
    templates: [
      '{nome} registrou 100 transações este mês',
      '{nome} economizou R$ 500,00 este mês',
      '{nome} atingiu 30 dias de uso consecutivo',
    ],
    icon: 'achievement' as const
  }
]

function gerarNomeAleatorio(): string {
  return nomesBrasileiros[Math.floor(Math.random() * nomesBrasileiros.length)]
}

function gerarCidadeAleatoria(): string {
  return cidadesBrasileiras[Math.floor(Math.random() * cidadesBrasileiras.length)]
}

function gerarPlanoAleatorio(): string {
  return planos[Math.floor(Math.random() * planos.length)]
}

function gerarMensagem(): Notification {
  const tipoMensagem = tiposMensagens[Math.floor(Math.random() * tiposMensagens.length)]
  const template = tipoMensagem.templates[Math.floor(Math.random() * tipoMensagem.templates.length)]
  
  const nome = gerarNomeAleatorio()
  const cidade = gerarCidadeAleatoria()
  const plano = gerarPlanoAleatorio()
  
  let mensagem = template
    .replace('{nome}', nome)
    .replace('{cidade}', cidade)
    .replace('{plano}', plano)
  
  return {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    message: mensagem,
    icon: tipoMensagem.icon,
    timestamp: Date.now()
  }
}

function getIcon(iconType: Notification['icon']) {
  switch (iconType) {
    case 'purchase':
      return <CheckCircle2 size={16} className="sm:w-5 sm:h-5 text-white" strokeWidth={2.5} />
    case 'goal':
      return <Target size={16} className="sm:w-5 sm:h-5 text-white" strokeWidth={2.5} />
    case 'premium':
      return <Crown size={16} className="sm:w-5 sm:h-5 text-white" strokeWidth={2.5} />
    case 'achievement':
      return <Sparkles size={16} className="sm:w-5 sm:h-5 text-white" strokeWidth={2.5} />
    default:
      return <TrendingUp size={16} className="sm:w-5 sm:h-5 text-white" strokeWidth={2.5} />
  }
}

export default function NotificationPopup() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isVisible, setIsVisible] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const pathname = usePathname()

  // Verificar autenticação e rota
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        setIsAuthenticated(!!user)
      } catch (error) {
        setIsAuthenticated(false)
      } finally {
        setIsChecking(false)
      }
    }

    checkAuth()

    // Monitorar mudanças de autenticação
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session?.user)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Só mostrar na landing page (/) e se não estiver autenticado
  useEffect(() => {
    if (isChecking) return
    
    // Só mostrar se estiver na landing page E não estiver autenticado
    const shouldShow = pathname === '/' && !isAuthenticated
    setIsVisible(shouldShow)
  }, [pathname, isAuthenticated, isChecking])

  useEffect(() => {
    if (!isVisible || isChecking) return

    let timeouts: NodeJS.Timeout[] = []

    const mostrarProximaNotificacao = () => {
      const novaNotificacao = gerarMensagem()
      setNotifications(prev => [novaNotificacao])
      
      // Remover após 5 segundos
      const removeTimeout = setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== novaNotificacao.id))
      }, 5000)
      timeouts.push(removeTimeout)
    }

    const agendarProxima = (delay: number) => {
      const timeout = setTimeout(() => {
        mostrarProximaNotificacao()
        // Agendar próxima com intervalo aleatório
        const intervalos = [5000, 6000, 10000, 12000]
        const proximoIntervalo = intervalos[Math.floor(Math.random() * intervalos.length)]
        agendarProxima(proximoIntervalo)
      }, delay)
      timeouts.push(timeout)
    }

    // Mostrar primeira notificação após 3 segundos
    agendarProxima(3000)

    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout))
    }
  }, [isVisible])

  if (notifications.length === 0) return null

  return (
    <div className="fixed bottom-4 left-3 sm:bottom-6 sm:left-6 z-[100] space-y-2 sm:space-y-3">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className="bg-gradient-to-r from-[#00C2FF] via-[#00B8F5] to-[#0099CC] text-white rounded-lg sm:rounded-xl shadow-2xl p-2.5 sm:p-4 w-[260px] sm:min-w-[320px] sm:max-w-[400px] border border-white/20 backdrop-blur-sm animate-slide-up"
        >
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
              {getIcon(notification.icon)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium leading-relaxed">
                {notification.message}
              </p>
              <p className="text-[10px] sm:text-xs text-white/70 mt-0.5 sm:mt-1">
                agora mesmo
              </p>
            </div>
            <button
              onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
              className="flex-shrink-0 text-white/70 hover:text-white transition-colors p-0.5"
            >
              <svg width="14" height="14" className="sm:w-4 sm:h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 4L4 12M4 4l8 8" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
