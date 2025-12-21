'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import { PlayCircle, Clock, Eye, Search, Filter } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Tutorial {
  id: string
  titulo: string
  descricao: string | null
  video_url: string | null
  video_arquivo_url: string | null
  thumbnail_url: string | null
  categoria: string | null
  ordem: number
  duracao_segundos: number | null
  visualizacoes: number
  criado_em: string
}

export default function TutoriaisPage() {
  const [tutoriais, setTutoriais] = useState<Tutorial[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('todas')

  useEffect(() => {
    carregarTutoriais()
  }, [])

  const carregarTutoriais = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('tutoriais')
        .select('*')
        .eq('ativo', true)
        .order('ordem', { ascending: true })
        .order('criado_em', { ascending: false })

      if (error) {
        console.error('Erro ao carregar tutoriais:', error)
      } else {
        setTutoriais(data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar tutoriais:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatarDuracao = (segundos: number | null) => {
    if (!segundos) return 'N/A'
    const minutos = Math.floor(segundos / 60)
    const segs = segundos % 60
    return `${minutos}:${segs.toString().padStart(2, '0')}`
  }

  const categorias = [
    { id: 'todas', label: 'Todas as Categorias' },
    { id: 'dividas', label: 'Dívidas' },
    { id: 'metas', label: 'Metas' },
    { id: 'calendario', label: 'Calendário' },
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'geral', label: 'Geral' },
  ]

  const tutoriaisFiltrados = tutoriais.filter(tutorial => {
    const matchSearch = tutorial.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tutorial.descricao && tutorial.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchCategoria = categoriaFiltro === 'todas' || tutorial.categoria === categoriaFiltro
    return matchSearch && matchCategoria
  })

  return (
    <div className="min-h-screen bg-brand-clean dark:bg-brand-midnight">
      <Sidebar />
      <main className="lg:ml-64 p-4 lg:p-8 dark:bg-brand-midnight">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-display font-bold text-brand-midnight dark:text-brand-clean mb-8">
            Tutoriais
          </h1>

          {/* Filtros e Busca */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brand-midnight/50 dark:text-brand-clean/50" size={20} />
                <input
                  type="text"
                  placeholder="Buscar tutoriais..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-brand-midnight border border-gray-300 dark:border-white/10 rounded-lg focus:outline-none focus:border-brand-aqua transition-smooth text-brand-midnight dark:text-brand-clean"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brand-midnight/50 dark:text-brand-clean/50" size={20} />
                <select
                  value={categoriaFiltro}
                  onChange={(e) => setCategoriaFiltro(e.target.value)}
                  className="pl-10 pr-4 py-2.5 bg-white dark:bg-brand-midnight border border-gray-300 dark:border-white/10 rounded-lg focus:outline-none focus:border-brand-aqua transition-smooth text-brand-midnight dark:text-brand-clean appearance-none"
                >
                  {categorias.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Lista de Tutoriais */}
          {loading ? (
            <div className="text-center py-12 text-brand-midnight/60 dark:text-brand-clean/60">
              Carregando tutoriais...
            </div>
          ) : tutoriaisFiltrados.length === 0 ? (
            <div className="bg-white dark:bg-brand-royal rounded-2xl p-12 text-center shadow-lg border border-gray-200 dark:border-white/10">
              <PlayCircle size={64} className="mx-auto mb-4 text-brand-midnight/30 dark:text-brand-clean/30" />
              <p className="text-brand-midnight/60 dark:text-brand-clean/60 text-lg">
                {searchTerm || categoriaFiltro !== 'todas'
                  ? 'Nenhum tutorial encontrado com os filtros selecionados'
                  : 'Nenhum tutorial disponível no momento'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tutoriaisFiltrados.map((tutorial) => (
                <div
                  key={tutorial.id}
                  className="bg-white dark:bg-brand-royal rounded-xl overflow-hidden shadow-lg border border-gray-200 dark:border-white/10 hover:shadow-xl transition-smooth cursor-pointer group"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-gradient-to-br from-brand-aqua/20 to-brand-blue/20 overflow-hidden">
                    {tutorial.thumbnail_url ? (
                      <img
                        src={tutorial.thumbnail_url}
                        alt={tutorial.titulo}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <PlayCircle size={64} className="text-brand-aqua/50" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-smooth flex items-center justify-center">
                      <div className="w-16 h-16 bg-white/90 dark:bg-brand-midnight/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <PlayCircle size={32} className="text-brand-aqua ml-1" />
                      </div>
                    </div>
                    {tutorial.duracao_segundos && (
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                        <Clock size={12} />
                        {formatarDuracao(tutorial.duracao_segundos)}
                      </div>
                    )}
                  </div>

                  {/* Conteúdo */}
                  <div className="p-4">
                    <h3 className="text-lg font-display text-brand-midnight dark:text-brand-clean mb-2 line-clamp-2">
                      {tutorial.titulo}
                    </h3>
                    {tutorial.descricao && (
                      <p className="text-sm text-brand-midnight/70 dark:text-brand-clean/70 mb-3 line-clamp-2">
                        {tutorial.descricao}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-xs text-brand-midnight/60 dark:text-brand-clean/60">
                      {tutorial.categoria && (
                        <span className="px-2 py-1 bg-brand-aqua/20 text-brand-aqua rounded">
                          {categorias.find(c => c.id === tutorial.categoria)?.label || tutorial.categoria}
                        </span>
                      )}
                      <div className="flex items-center gap-1">
                        <Eye size={14} />
                        <span>{tutorial.visualizacoes} visualizações</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

