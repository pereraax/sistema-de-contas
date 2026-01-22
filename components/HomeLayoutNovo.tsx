'use client'

import { useState, useEffect, useRef } from 'react'
import { obterEstatisticas, atualizarImagemProprioPerfil } from '@/lib/actions'
import { TrendingUp, TrendingDown, ChevronDown, ChevronLeft, ChevronRight, Check, Moon, Sun, User } from 'lucide-react'
import { useFiltroData } from './FiltroRapidoDataWrapper'
import { MenuButton } from './MobileMenu'
import NotificationBell from './NotificationBell'
import UserProfileMenu from './UserProfileMenu'
import ReceitasDespesasDonut from './ReceitasDespesasDonut'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function HomeLayoutNovo() {
  const { dataInicio, dataFim } = useFiltroData()
  const router = useRouter()
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [stats, setStats] = useState<{
    totalEntradas: number
    totalSaidas: number
    saldo: number
    receitasPendentes: number
    despesasPendentes: number
    qtdReceitasPendentes: number
    qtdDespesasPendentes: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<{ nome: string; imagem_url?: string }>({ nome: 'Usuário' })
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]
  
  // Obter mês atual
  const mesAtual = meses[new Date().getMonth()]
  const [mesSelecionado, setMesSelecionado] = useState<string>(mesAtual)
  const [dropdownAberto, setDropdownAberto] = useState(false)
  const [isFading, setIsFading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Funções para navegar entre meses
  const irParaMesAnterior = () => {
    const indexAtual = meses.indexOf(mesSelecionado)
    if (indexAtual > 0) {
      setIsFading(true)
      setTimeout(() => {
        setMesSelecionado(meses[indexAtual - 1])
        setIsFading(false)
      }, 150)
    }
  }

  const irParaProximoMes = () => {
    const indexAtual = meses.indexOf(mesSelecionado)
    if (indexAtual < meses.length - 1) {
      setIsFading(true)
      setTimeout(() => {
        setMesSelecionado(meses[indexAtual + 1])
        setIsFading(false)
      }, 150)
    }
  }

  // Carregar tema atual
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    const darkMode = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)
    setIsDarkMode(darkMode)
  }, [])

  const applyTheme = (dark: boolean) => {
    if (dark) {
      document.documentElement.classList.add('dark')
      document.body.style.backgroundColor = '#0D1B2A'
      const mainElements = document.querySelectorAll('.min-h-screen, main')
      mainElements.forEach((el: any) => {
        if (el) el.style.backgroundColor = '#0D1B2A'
      })
    } else {
      document.documentElement.classList.remove('dark')
      document.body.style.backgroundColor = ''
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

  const handlePerfilClick = () => {
    // Abrir seletor de arquivo para upload de imagem
    fileInputRef.current?.click()
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      alert('Formato de imagem não suportado. Use JPG, PNG, WEBP ou GIF.')
      return
    }

    // Validar tamanho (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Imagem muito grande. Máximo 2MB.')
      return
    }

    setUploadingImage(true)

    try {
      // Fazer upload da imagem
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      uploadFormData.append('folder', 'perfis')
      uploadFormData.append('bucket', 'avatares')

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      })

      const uploadData = await uploadResponse.json()

      if (!uploadResponse.ok || uploadData.error) {
        if (uploadData.error?.includes('Bucket') && uploadData.error?.includes('not found')) {
          throw new Error('Bucket "avatares" não encontrado. Por favor, crie o bucket no Supabase Storage.')
        }
        throw new Error(uploadData.error || 'Erro ao fazer upload da imagem')
      }

      console.log('📤 [Upload] Upload concluído, URL recebida:', uploadData.url)

      // Atualizar o perfil com a URL da imagem
      const result = await atualizarImagemProprioPerfil(uploadData.url)

      if (result.error) {
        console.error('❌ Erro ao atualizar imagem:', result.error)
        alert('Erro ao atualizar imagem de perfil: ' + result.error)
      } else {
        console.log('✅ [Upload] Imagem atualizada no perfil com sucesso')
        // Atualizar o estado local
        setUserProfile(prev => ({
          ...prev,
          imagem_url: uploadData.url
        }))
      }
    } catch (error: any) {
      console.error('❌ Erro no upload:', error)
      alert('Erro ao fazer upload da imagem: ' + (error.message || 'Erro desconhecido'))
    } finally {
      setUploadingImage(false)
      // Limpar o input para permitir selecionar o mesmo arquivo novamente
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Carregar perfil do usuário
  useEffect(() => {
    const carregarPerfil = async () => {
      try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('nome, imagem_url')
            .eq('id', user.id)
            .maybeSingle()
          
          // Determinar o nome a ser exibido: perfil > user_metadata > email > "Usuário"
          let nomeExibido = 'Usuário'
          
          if (profile?.nome && profile.nome.trim()) {
            nomeExibido = profile.nome.trim()
          } else if (user.user_metadata?.nome && user.user_metadata.nome.trim()) {
            nomeExibido = user.user_metadata.nome.trim()
          } else if (user.email) {
            // Usar a parte antes do @ do email como fallback
            nomeExibido = user.email.split('@')[0]
          }
          
            setUserProfile({
            nome: nomeExibido,
            imagem_url: profile?.imagem_url || undefined
            })
        }
      } catch (error) {
        console.error('Erro ao carregar perfil:', error)
      }
    }
    
    carregarPerfil()
  }, [])

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownAberto(false)
      }
    }

    if (dropdownAberto) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [dropdownAberto])

  const carregarEstatisticas = async () => {
    try {
      const result = await obterEstatisticas(dataInicio, dataFim)
      
      if (result.error) {
        setStats({
          totalEntradas: 0,
          totalSaidas: 0,
          saldo: 0,
          receitasPendentes: 0,
          despesasPendentes: 0,
          qtdReceitasPendentes: 0,
          qtdDespesasPendentes: 0
        })
      } else {
        const totalEntradas = result.totalEntradas || 0
        const totalSaidas = result.totalSaidas || 0
        const saldo = totalEntradas - totalSaidas
        
        // TODO: Buscar receitas e despesas pendentes do banco
        // Por enquanto, usando valores mockados
        setStats({
          totalEntradas,
          totalSaidas,
          saldo,
          receitasPendentes: 700,
          despesasPendentes: 1900,
          qtdReceitasPendentes: 1,
          qtdDespesasPendentes: 2
        })
      }
      setLoading(false)
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
      setStats({
        totalEntradas: 0,
        totalSaidas: 0,
        saldo: 0,
        receitasPendentes: 0,
        despesasPendentes: 0,
        qtdReceitasPendentes: 0,
        qtdDespesasPendentes: 0
      })
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarEstatisticas()
    const interval = setInterval(() => {
      carregarEstatisticas()
    }, 10000)
    return () => clearInterval(interval)
  }, [dataInicio, dataFim])

  // Valores padrão enquanto carrega
  const totalEntradas = stats?.totalEntradas ?? 0
  const totalSaidas = stats?.totalSaidas ?? 0
  const saldo = stats?.saldo ?? 0
  const receitasPendentes = stats?.receitasPendentes ?? 0
  const despesasPendentes = stats?.despesasPendentes ?? 0
  const qtdReceitasPendentes = stats?.qtdReceitasPendentes ?? 0
  const qtdDespesasPendentes = stats?.qtdDespesasPendentes ?? 0

  return (
    <div className="space-y-6">
      {/* Header com ícone de perfil e toggle à esquerda, e ícones de notificação/perfil à direita */}
      <div className="flex items-center justify-between gap-4 mb-0">
        {/* Ícone de perfil com saudação e toggle à esquerda */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="relative">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                className="hidden"
                disabled={uploadingImage}
              />
            <button
              onClick={handlePerfilClick}
                disabled={uploadingImage}
                className="w-9 h-9 border-[2.5px] border-brand-aqua bg-brand-aqua/10 dark:bg-brand-aqua/20 rounded-full hover:bg-brand-aqua/20 dark:hover:bg-brand-aqua/30 transition-smooth flex items-center justify-center overflow-hidden flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed relative"
                title={uploadingImage ? "Enviando imagem..." : "Adicionar foto de perfil"}
              >
                {uploadingImage ? (
                  <div className="w-full h-full flex items-center justify-center bg-brand-aqua/20">
                    <div className="w-4 h-4 border-2 border-brand-aqua border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : userProfile?.imagem_url ? (
                <img 
                  src={userProfile.imagem_url} 
                  alt={userProfile.nome || 'Perfil'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    const parent = target.parentElement
                    if (parent) {
                      const inicial = (userProfile?.nome || 'U').charAt(0).toUpperCase()
                      parent.innerHTML = `<span class="text-brand-aqua font-semibold text-sm">${inicial}</span>`
                    }
                  }}
                />
              ) : (
                <span className="text-brand-aqua font-semibold text-sm">
                  {(userProfile?.nome || 'U').charAt(0).toUpperCase()}
                </span>
              )}
            </button>
            </div>
            <span className="text-xl sm:text-2xl font-bold text-brand-midnight dark:text-brand-clean -tracking-tight" style={{ fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, system-ui, sans-serif', fontWeight: 700 }}>
              Olá, {userProfile.nome} 👋!
            </span>
          </div>
          
          {/* Toggle Dark/Light Mode */}
          <button
            onClick={toggleDarkMode}
            className="relative w-14 h-7 bg-white dark:bg-gray-700 rounded-full flex items-center px-1 transition-colors duration-300 border border-gray-200 dark:border-gray-600"
            title={isDarkMode ? 'Modo Claro' : 'Modo Escuro'}
          >
            {/* Ícones nas extremidades */}
            <div className="absolute left-1 flex items-center justify-center">
              <Sun size={14} className="text-gray-600 dark:text-gray-400" strokeWidth={2} />
            </div>
            <div className="absolute right-1 flex items-center justify-center">
              <Moon size={14} className="text-gray-600 dark:text-gray-400" strokeWidth={2} />
            </div>
            
            {/* Indicador deslizante */}
            <div className={`absolute w-6 h-6 rounded-full shadow-md transition-transform duration-300 flex items-center justify-center ${
              isDarkMode 
                ? 'bg-gray-50 dark:bg-gray-50 border-2 border-gray-200 dark:border-gray-300 translate-x-7' 
                : 'bg-white border-2 border-gray-200 translate-x-0'
            }`}>
              {isDarkMode ? (
                <Moon size={12} className="text-gray-700" strokeWidth={2.5} />
              ) : (
                <Sun size={12} className="text-gray-700" strokeWidth={2} />
              )}
            </div>
          </button>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3 ml-auto">
          <NotificationBell />
          <UserProfileMenu />
        </div>
      </div>

      {/* Seletor de mês centralizado */}
      <div className="flex justify-center items-center gap-2 -mt-4 mb-6">
        {/* Seta esquerda */}
        <button
          type="button"
          onClick={irParaMesAnterior}
          disabled={meses.indexOf(mesSelecionado) === 0}
          className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-brand-midnight/50 transition-smooth disabled:opacity-30 disabled:cursor-not-allowed"
          title="Mês anterior"
        >
          <ChevronLeft 
            size={18}
            className="text-brand-aqua"
            strokeWidth={2.5}
          />
        </button>

        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownAberto(!dropdownAberto)}
            className={`flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-brand-midnight border border-gray-200 dark:border-white/20 rounded-full hover:border-brand-aqua/50 focus:outline-none focus:border-brand-aqua transition-smooth ${isFading ? 'opacity-50' : 'opacity-100'}`}
          >
            <span className="text-sm font-medium text-brand-midnight dark:text-brand-clean transition-opacity duration-150">
              {mesSelecionado}
            </span>
            <ChevronDown 
              className={`text-brand-aqua transition-transform duration-200 ${dropdownAberto ? 'rotate-180' : ''}`}
              size={14}
              strokeWidth={2}
            />
          </button>

          {dropdownAberto && (
            <>
              {/* Overlay para fechar ao clicar fora */}
              <div 
                className="fixed inset-0 z-[40] bg-transparent"
                onClick={() => setDropdownAberto(false)}
              />
              
              {/* Dropdown Menu */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 backdrop-blur-md bg-gray-50/80 dark:bg-brand-midnight/80 border-2 border-gray-200 dark:border-white/20 rounded-xl shadow-2xl z-[50] overflow-hidden animate-fade-in transform transition-all duration-200 ease-out">
                <div className="max-h-64 overflow-y-auto">
                  {meses.map((mes) => (
                    <button
                      key={mes}
                      type="button"
                      onClick={() => {
                        setMesSelecionado(mes)
                        setDropdownAberto(false)
                      }}
                      className={`w-full px-4 py-3 text-left flex items-center justify-between hover:bg-brand-aqua/10 dark:hover:bg-brand-aqua/20 transition-smooth border-b border-gray-100 dark:border-white/5 last:border-b-0 ${
                        mes === mesSelecionado
                          ? 'bg-brand-aqua/20 dark:bg-brand-aqua/30 text-brand-aqua font-semibold'
                          : 'text-brand-midnight dark:text-brand-clean'
                      }`}
                    >
                      <span className="text-sm">{mes}</span>
                      {mes === mesSelecionado && (
                        <Check size={18} className="text-brand-aqua" strokeWidth={2.5} />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Seta direita */}
        <button
          type="button"
          onClick={irParaProximoMes}
          disabled={meses.indexOf(mesSelecionado) === meses.length - 1}
          className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-brand-midnight/50 transition-smooth disabled:opacity-30 disabled:cursor-not-allowed"
          title="Próximo mês"
        >
          <ChevronRight 
            size={18}
            className="text-brand-aqua"
            strokeWidth={2.5}
          />
        </button>
      </div>

      {/* Saldo atual em contas - CENTRALIZADO */}
      <div className="text-center mb-8">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Saldo atual em contas</p>
        <p className={`text-4xl sm:text-5xl font-bold ${
          saldo >= 0 ? 'text-green-600' : 'text-red-600'
        }`}>
          {new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          }).format(saldo)}
        </p>
      </div>

      {/* Cards de Receitas e Despesas - Fundo compartilhado, lado a lado */}
      <div className="bg-white dark:bg-brand-royal rounded-xl p-4 shadow-md border border-gray-100 dark:border-white/10 mb-6">
        <div className="grid grid-cols-2 gap-4">
          {/* Card Receitas */}
          <div className="flex flex-col items-center justify-center">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-green-50 dark:bg-green-900/30 rounded-lg">
                <TrendingUp className="text-green-600 dark:text-green-400" size={18} />
              </div>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Receitas</p>
            </div>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(totalEntradas)}
            </p>
          </div>

          {/* Card Despesas */}
          <div className="flex flex-col items-center justify-center">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-red-50 dark:bg-red-900/30 rounded-lg">
                <TrendingDown className="text-red-600 dark:text-red-400" size={18} />
              </div>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Despesas</p>
            </div>
            <p className="text-lg font-bold text-red-600 dark:text-red-400">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(totalSaidas)}
            </p>
          </div>
        </div>
      </div>

      {/* Seção Pendências e alertas */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-brand-midnight dark:text-brand-clean mb-4">
          Pendências e alertas
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card Receitas Pendentes */}
          <div className="bg-white dark:bg-brand-royal rounded-xl p-6 shadow-lg border border-gray-100 dark:border-white/10 relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <TrendingUp className="text-green-600 dark:text-green-400" size={24} />
              </div>
              <p className="text-sm font-semibold text-brand-midnight dark:text-brand-clean">
                Receitas pendentes
              </p>
              {qtdReceitasPendentes > 0 && (
                <span className="ml-auto bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {qtdReceitasPendentes}
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(receitasPendentes)}
            </p>
          </div>

          {/* Card Despesas Pendentes */}
          <div className="bg-white dark:bg-brand-royal rounded-xl p-6 shadow-lg border border-gray-100 dark:border-white/10 relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <TrendingDown className="text-red-600 dark:text-red-400" size={24} />
              </div>
              <p className="text-sm font-semibold text-brand-midnight dark:text-brand-clean">
                Despesas pendentes
              </p>
              {qtdDespesasPendentes > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {qtdDespesasPendentes}
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(despesasPendentes)}
            </p>
          </div>
        </div>
      </div>

      {/* Comparativo Mensal - Pessoal */}
      <div className="mb-16 sm:mb-20 lg:mb-20">
        <h2 className="text-lg font-bold text-brand-midnight dark:text-brand-clean mb-4">
          Comparativo Mensal - Pessoal
        </h2>
        <ReceitasDespesasDonut hideTitle={true} />
      </div>
    </div>
  )
}

