'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { obterEstatisticas } from '@/lib/actions'
import { TrendingUp, TrendingDown, ChevronDown, ChevronLeft, ChevronRight, Check, Moon, Sun, User, Crown } from 'lucide-react'
import { useFiltroData } from './FiltroRapidoDataWrapper'
import { MenuButton } from './MobileMenu'
import NotificationBell from './NotificationBell'
import UserProfileMenu from './UserProfileMenu'
import ReceitasDespesasDonut from './ReceitasDespesasDonut'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Logo from './Logo'

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

/** Retorna dataInicio e dataFim (ISO) para o primeiro e último dia do mês selecionado (ano atual). */
function datasDoMes(nomeMes: string, ano: number = new Date().getFullYear()) {
  const indice = MESES.indexOf(nomeMes)
  if (indice < 0) return { dataInicio: undefined, dataFim: undefined }
  const inicio = new Date(ano, indice, 1, 0, 0, 0, 0)
  const fim = new Date(ano, indice + 1, 0, 23, 59, 59, 999)
  return {
    dataInicio: inicio.toISOString(),
    dataFim: fim.toISOString()
  }
}

/** Retorna dataInicio e dataFim (ISO) para os últimos N dias (incluindo hoje). */
function datasUltimosDias(dias: number) {
  const fim = new Date()
  fim.setHours(23, 59, 59, 999)
  const inicio = new Date(fim)
  inicio.setDate(inicio.getDate() - (dias - 1))
  inicio.setHours(0, 0, 0, 0)
  return { dataInicio: inicio.toISOString(), dataFim: fim.toISOString() }
}

const FILTROS_DIAS = [3, 5, 7, 10] as const

export default function HomeLayoutNovo() {
  const { dataInicio, dataFim, setFiltroData } = useFiltroData()
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
  const [gastosPorBanco, setGastosPorBanco] = useState<Array<{ banco: string; gastos: number; saldo: number }>>([])
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<{ nome: string; imagem_url?: string }>({ nome: 'Usuário' })
  
  const meses = MESES
  
  // Obter mês atual
  const mesAtual = meses[new Date().getMonth()]
  const [mesSelecionado, setMesSelecionado] = useState<string>(mesAtual)
  const [diasSelecionado, setDiasSelecionado] = useState<number | null>(null)
  const [dropdownAberto, setDropdownAberto] = useState(false)
  const [isFading, setIsFading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Sincronizar filtro de data: se filtro por dias ativo usa últimos N dias; senão usa o mês
  useEffect(() => {
    if (diasSelecionado !== null) {
      const { dataInicio: ini, dataFim: fim } = datasUltimosDias(diasSelecionado)
      setFiltroData(ini, fim)
    } else {
      const { dataInicio: ini, dataFim: fim } = datasDoMes(mesSelecionado)
      setFiltroData(ini, fim)
    }
  }, [mesSelecionado, diasSelecionado, setFiltroData])

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
      document.body.style.backgroundColor = '#1A1A1A'
      const mainElements = document.querySelectorAll('.min-h-screen, main')
      mainElements.forEach((el: any) => {
        if (el) el.style.backgroundColor = '#1A1A1A'
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
    router.push('/configuracoes?tab=perfil')
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

  const carregarEstatisticas = useCallback(async () => {
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
    } catch {
      setStats({
        totalEntradas: 0,
        totalSaidas: 0,
        saldo: 0,
        receitasPendentes: 0,
        despesasPendentes: 0,
        qtdReceitasPendentes: 0,
        qtdDespesasPendentes: 0
      })
    } finally {
      setLoading(false)
    }
  }, [dataInicio, dataFim])

  useEffect(() => {
    setLoading(true)
    carregarEstatisticas()
    const t = setInterval(carregarEstatisticas, 60000)
    return () => clearInterval(t)
  }, [carregarEstatisticas])

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
      {/* Header: no mobile logo ao lado do perfil; headbar compacta */}
      <div className="flex items-center justify-between gap-2 sm:gap-4 py-1 lg:py-0">
        {/* Esquerda: no mobile Logo + perfil + saudação + toggle; no desktop perfil + saudação + toggle */}
        <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 min-w-0">
          {/* Logo só no mobile, mesmo tamanho do ícone de perfil (36px) */}
          <div className="flex-shrink-0 w-9 h-9 flex items-center justify-center overflow-hidden rounded-lg lg:hidden [&_a]:!p-0 [&_a]:!w-full [&_a]:!h-full [&_img]:!w-full [&_img]:!h-full [&_img]:!object-contain">
            <Logo />
          </div>
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="relative flex-shrink-0">
              {/* Ícone de coroa acima do avatar = dono da conta */}
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 z-10 flex items-center justify-center w-5 h-5 rounded-full bg-amber-400 shadow-sm" title="Dono da conta">
                <Crown size={10} className="text-amber-900" strokeWidth={2.5} />
              </div>
              <button
                onClick={handlePerfilClick}
                type="button"
                className="w-9 h-9 border-[2.5px] border-brand-aqua bg-brand-aqua/10 dark:bg-brand-aqua/20 rounded-full hover:bg-brand-aqua/20 dark:hover:bg-brand-aqua/30 transition-smooth flex items-center justify-center overflow-hidden flex-shrink-0 cursor-pointer relative"
                title="Configurações de perfil"
              >
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
            <span className="text-sm sm:text-base font-bold text-brand-midnight dark:text-brand-clean -tracking-tight min-w-0 truncate max-w-[180px] sm:max-w-[220px]" style={{ fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, system-ui, sans-serif', fontWeight: 700 }}>
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

      {/* Filtros de dias: 3, 5, 7, 10 dias — filtragem imediata */}
      <div className="flex flex-wrap justify-center gap-2 mb-4">
        {FILTROS_DIAS.map((d) => {
          const ativo = diasSelecionado === d
          return (
            <button
              key={d}
              type="button"
              onClick={() => setDiasSelecionado(ativo ? null : d)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                ativo
                  ? 'bg-brand-aqua text-white dark:bg-[#252525] dark:text-white shadow-md'
                  : 'bg-white dark:bg-brand-midnight border border-gray-200 dark:border-white/20 text-brand-midnight dark:text-brand-clean hover:border-brand-aqua/50'
              }`}
            >
              {d} dias
            </button>
          )
        })}
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

      {/* Cards de Receitas e Despesas - compacto, centralizado, visual clean */}
      <div className="flex justify-center mb-6">
        <div className="w-full max-w-sm sm:max-w-md bg-white dark:bg-[#252525] rounded-2xl px-5 py-4 shadow-sm border border-gray-100 dark:border-white/10">
          <div className="grid grid-cols-2 gap-6">
            {/* Receitas */}
            <div className="flex flex-col items-center justify-center py-1">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="p-1.5 bg-green-50 dark:bg-green-900/30 rounded-lg">
                  <TrendingUp className="text-green-600 dark:text-green-400" size={18} />
                </div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Receitas</p>
              </div>
              <p className="text-base sm:text-lg font-bold text-green-600 dark:text-green-400 tabular-nums">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(totalEntradas)}
              </p>
            </div>

            {/* Despesas */}
            <div className="flex flex-col items-center justify-center py-1 border-l border-gray-200 dark:border-white/10">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="p-1.5 bg-red-50 dark:bg-red-900/30 rounded-lg">
                  <TrendingDown className="text-red-600 dark:text-red-400" size={18} />
                </div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Despesas</p>
              </div>
              <p className="text-base sm:text-lg font-bold text-red-600 dark:text-red-400 tabular-nums">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(totalSaidas)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Seção Pendências e alertas + Gastos por banco: centralizada, dois blocos lado a lado */}
      <div className="mb-6 flex flex-col items-center">
        <h2 className="text-lg font-bold text-brand-midnight dark:text-brand-clean mb-4 w-full text-center">
          Pendências e alertas
        </h2>
        <div className="w-full max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Coluna esquerda: Receitas e Despesas pendentes (um acima do outro) */}
          <div className="flex flex-col gap-3 min-w-0">
            <div className="bg-white dark:bg-[#252525] rounded-2xl px-4 py-4 shadow-sm border border-gray-100 dark:border-white/10 relative">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <TrendingUp className="text-green-600 dark:text-green-400" size={20} />
                </div>
                <p className="text-sm font-semibold text-brand-midnight dark:text-brand-clean">
                  Receitas pendentes
                </p>
                {qtdReceitasPendentes > 0 && (
                  <span className="ml-auto bg-green-500 text-white text-xs font-bold min-w-[1.25rem] h-5 flex items-center justify-center rounded-full">
                    {qtdReceitasPendentes}
                  </span>
                )}
              </div>
              <p className="text-xl font-bold text-green-600 dark:text-green-400 tabular-nums">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(receitasPendentes)}
              </p>
            </div>
            <div className="bg-white dark:bg-[#252525] rounded-2xl px-4 py-4 shadow-sm border border-gray-100 dark:border-white/10 relative">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <TrendingDown className="text-red-600 dark:text-red-400" size={20} />
                </div>
                <p className="text-sm font-semibold text-brand-midnight dark:text-brand-clean">
                  Despesas pendentes
                </p>
                {qtdDespesasPendentes > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs font-bold min-w-[1.25rem] h-5 flex items-center justify-center rounded-full">
                    {qtdDespesasPendentes}
                  </span>
                )}
              </div>
              <p className="text-xl font-bold text-red-600 dark:text-red-400 tabular-nums">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(despesasPendentes)}
              </p>
            </div>
          </div>

          {/* Coluna direita: Painel Gastos por banco */}
          <div className="bg-white dark:bg-[#252525] rounded-2xl px-4 py-4 shadow-sm border border-gray-100 dark:border-white/10 min-w-0 flex flex-col">
            <div className="flex items-center justify-between gap-2 mb-1">
              <p className="text-sm font-semibold text-brand-midnight dark:text-brand-clean">
                Gastos por banco
              </p>
              <Link
                href="/gastos-por-banco"
                className="text-xs font-medium text-brand-aqua hover:underline shrink-0"
              >
                Ver detalhes
              </Link>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 whitespace-normal">
              Ao criar um registro, escolha o banco para ver gastos e saldo aqui.
            </p>
            <div className="space-y-2 max-h-[200px] overflow-y-auto flex-1 min-h-0">
              {[
                { id: 'inter', nome: 'Inter' },
                { id: 'c6bank', nome: 'C6 Bank' },
                { id: 'nubank', nome: 'Nubank' },
                { id: 'itau', nome: 'Itaú' },
                { id: 'santander', nome: 'Santander' },
                { id: 'picpay', nome: 'PicPay' },
                { id: 'mercadopago', nome: 'Mercado Pago' },
                { id: 'bradesco', nome: 'Bradesco' },
                { id: 'caixa', nome: 'Caixa' },
              ].map((b) => {
                const row = gastosPorBanco.find((r) => r.banco === b.id) || { gastos: 0, saldo: 0 }
                return (
                  <div
                    key={b.id}
                    className="flex items-center justify-between gap-2 py-2 px-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 shrink-0"
                  >
                    <span className="text-sm font-medium text-brand-midnight dark:text-brand-clean truncate min-w-0">
                      {b.nome}
                    </span>
                    <div className="flex items-center gap-2 sm:gap-3 text-xs shrink-0">
                      <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        Gastos: <span className="font-medium text-red-600 dark:text-red-400">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row.gastos)}
                        </span>
                      </span>
                      <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        Saldo: <span className={`font-medium ${row.saldo >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row.saldo)}
                        </span>
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
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

