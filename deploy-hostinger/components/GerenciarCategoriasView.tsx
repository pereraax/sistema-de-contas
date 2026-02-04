'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus,
  UtensilsCrossed,
  Car,
  Home,
  ShoppingBag,
  Heart,
  GraduationCap,
  Briefcase,
  Gamepad2,
  Dumbbell,
  Plane,
  Camera,
  Music,
  Gift,
  Wallet,
  CreditCard,
  Tag,
  Edit,
  Trash2,
  MoreVertical,
  Image as ImageIcon,
  Palette,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react'
import ModalConfirmacao from './ModalConfirmacao'

// Tipos de ícones disponíveis
const iconosDisponiveis = [
  { name: 'UtensilsCrossed', icon: UtensilsCrossed, color: 'text-red-600' },
  { name: 'Car', icon: Car, color: 'text-purple-600' },
  { name: 'Home', icon: Home, color: 'text-blue-600' },
  { name: 'ShoppingBag', icon: ShoppingBag, color: 'text-green-600' },
  { name: 'Heart', icon: Heart, color: 'text-pink-600' },
  { name: 'GraduationCap', icon: GraduationCap, color: 'text-indigo-600' },
  { name: 'Briefcase', icon: Briefcase, color: 'text-amber-600' },
  { name: 'Gamepad2', icon: Gamepad2, color: 'text-green-600' },
  { name: 'Dumbbell', icon: Dumbbell, color: 'text-orange-600' },
  { name: 'Plane', icon: Plane, color: 'text-cyan-600' },
  { name: 'Camera', icon: Camera, color: 'text-purple-600' },
  { name: 'Music', icon: Music, color: 'text-pink-600' },
  { name: 'Gift', icon: Gift, color: 'text-yellow-600' },
  { name: 'Wallet', icon: Wallet, color: 'text-emerald-600' },
  { name: 'CreditCard', icon: CreditCard, color: 'text-gray-600' },
  { name: 'Tag', icon: Tag, color: 'text-blue-600' },
]

interface Categoria {
  id: string
  nome: string
  icone: string
  cor: string
  tipo: 'padrao' | 'personalizada'
}

export default function GerenciarCategoriasView() {
  const router = useRouter()
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [modalCriarAberto, setModalCriarAberto] = useState(false)
  const [modalEditarAberto, setModalEditarAberto] = useState(false)
  const [categoriaEditando, setCategoriaEditando] = useState<Categoria | null>(null)
  const [categoriaExcluindo, setCategoriaExcluindo] = useState<Categoria | null>(null)
  const [menuAberto, setMenuAberto] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    nome: '',
    icone: 'Tag',
    cor: '#1e4976',
  })
  
  const handleCategoriaClick = (categoria: Categoria) => {
    // Redirecionar para registros com filtro de categoria
    router.push(`/registros?categoria=${categoria.id}`)
  }

  // Categorias padrão
  const categoriasPadrao: Categoria[] = [
    { id: 'alimentacao', nome: 'Alimentação', icone: 'UtensilsCrossed', cor: '#dc2626', tipo: 'padrao' },
    { id: 'transporte', nome: 'Transporte', icone: 'Car', cor: '#9333ea', tipo: 'padrao' },
    { id: 'moradia', nome: 'Moradia', icone: 'Home', cor: '#2563eb', tipo: 'padrao' },
    { id: 'compras', nome: 'Compras', icone: 'ShoppingBag', cor: '#059669', tipo: 'padrao' },
    { id: 'saude', nome: 'Saúde', icone: 'Heart', cor: '#db2777', tipo: 'padrao' },
    { id: 'educacao', nome: 'Educação', icone: 'GraduationCap', cor: '#4f46e5', tipo: 'padrao' },
    { id: 'trabalho', nome: 'Trabalho', icone: 'Briefcase', cor: '#d97706', tipo: 'padrao' },
    { id: 'entretenimento', nome: 'Entretenimento', icone: 'Gamepad2', cor: '#059669', tipo: 'padrao' },
    { id: 'fitness', nome: 'Fitness', icone: 'Dumbbell', cor: '#ea580c', tipo: 'padrao' },
    { id: 'viagem', nome: 'Viagem', icone: 'Plane', cor: '#0891b2', tipo: 'padrao' },
    { id: 'sem-categoria', nome: 'Sem categoria', icone: 'Tag', cor: '#4b5563', tipo: 'padrao' },
  ]

  useEffect(() => {
    // Carregar categorias do localStorage (ou do banco de dados no futuro)
    const categoriasSalvas = localStorage.getItem('categorias_personalizadas')
    const personalizadas = categoriasSalvas ? JSON.parse(categoriasSalvas) : []
    setCategorias([...categoriasPadrao, ...personalizadas])
  }, [])

  const handleCriarCategoria = () => {
    if (!formData.nome.trim()) return

    const novaCategoria: Categoria = {
      id: `cat-${Date.now()}`,
      nome: formData.nome,
      icone: formData.icone,
      cor: formData.cor,
      tipo: 'personalizada',
    }

    const personalizadas = categorias.filter(c => c.tipo === 'personalizada')
    personalizadas.push(novaCategoria)
    localStorage.setItem('categorias_personalizadas', JSON.stringify(personalizadas))

    setCategorias([...categoriasPadrao, ...personalizadas])
    setFormData({ nome: '', icone: 'Tag', cor: '#1e4976' })
    setModalCriarAberto(false)
  }

  const handleEditarCategoria = () => {
    if (!categoriaEditando || !formData.nome.trim()) return

    const personalizadas = categorias
      .filter(c => c.tipo === 'personalizada')
      .map(c => c.id === categoriaEditando.id ? { ...c, nome: formData.nome, icone: formData.icone, cor: formData.cor } : c)
    
    localStorage.setItem('categorias_personalizadas', JSON.stringify(personalizadas))
    setCategorias([...categoriasPadrao, ...personalizadas])
    setModalEditarAberto(false)
    setCategoriaEditando(null)
    setFormData({ nome: '', icone: 'Tag', cor: '#1e4976' })
  }

  const handleExcluirCategoria = () => {
    if (!categoriaExcluindo) return

    const personalizadas = categorias
      .filter(c => c.tipo === 'personalizada' && c.id !== categoriaExcluindo.id)
    
    localStorage.setItem('categorias_personalizadas', JSON.stringify(personalizadas))
    setCategorias([...categoriasPadrao, ...personalizadas])
    setCategoriaExcluindo(null)
  }

  const abrirModalEditar = (categoria: Categoria) => {
    if (categoria.tipo === 'padrao') return // Não pode editar padrão
    setCategoriaEditando(categoria)
    setFormData({ nome: categoria.nome, icone: categoria.icone, cor: categoria.cor })
    setModalEditarAberto(true)
    setMenuAberto(null)
  }

  const abrirModalExcluir = (categoria: Categoria) => {
    if (categoria.tipo === 'padrao') return // Não pode excluir padrão
    setCategoriaExcluindo(categoria)
    setMenuAberto(null)
  }

  const getIconComponent = (iconName: string) => {
    const iconData = iconosDisponiveis.find(i => i.name === iconName)
    return iconData ? iconData.icon : Tag
  }

  const coresDisponiveis = [
    '#1e4976', '#10b981', '#ef4444', '#f59e0b', '#a855f7', '#ec4899', '#6366f1', '#06b6d4', '#6b7280'
  ]

  return (
    <>
      <div>
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-gray-900 dark:text-brand-clean mb-2">
            Gerenciar Categorias
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Organize suas finanças com categorias personalizadas
          </p>
        </div>

        <div className="flex justify-end mb-6">
          <button
            onClick={() => {
              setFormData({ nome: '', icone: 'Tag', cor: '#1e4976' })
              setModalCriarAberto(true)
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#2c5aa0] via-[#1e4976] to-[#163a5f] hover:from-[#1e4976] hover:via-[#163a5f] hover:to-[#0f2847] text-white rounded-lg font-semibold transition-all duration-300 shadow-md hover:shadow-lg"
          >
            <Plus size={20} />
            <span>Nova Categoria</span>
          </button>
        </div>

        <div className="space-y-2">
          {categorias.map((categoria) => {
            const IconComponent = getIconComponent(categoria.icone)
            const isPersonalizada = categoria.tipo === 'personalizada'

            return (
              <div
                key={categoria.id}
                className="bg-white dark:bg-brand-royal rounded-xl p-4 shadow-md border border-gray-200 dark:border-white/10 hover:shadow-lg transition-all duration-300 relative group"
              >
                <button
                  onClick={() => handleCategoriaClick(categoria)}
                  className="w-full flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${categoria.cor}60` }}
                    >
                      <IconComponent size={24} style={{ color: categoria.cor }} strokeWidth={2.5} />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-brand-clean mb-1">
                        {categoria.nome}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {categoria.tipo === 'padrao' ? 'Padrão' : 'Personalizada'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
                </button>
                {isPersonalizada && (
                  <div className="absolute top-4 right-12">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setMenuAberto(menuAberto === categoria.id ? null : categoria.id)
                      }}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded transition-colors"
                    >
                      <MoreVertical size={18} className="text-gray-600 dark:text-gray-400" />
                    </button>
                    {menuAberto === categoria.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setMenuAberto(null)}
                        />
                        <div className="absolute right-0 top-8 bg-white dark:bg-brand-midnight rounded-lg shadow-xl border border-gray-200 dark:border-white/20 z-20 min-w-[140px] overflow-hidden">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              abrirModalEditar(categoria)
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 dark:hover:bg-white/10 text-left"
                          >
                            <Edit size={16} className="text-blue-600" />
                            <span className="text-sm text-gray-900 dark:text-gray-100">Editar</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              abrirModalExcluir(categoria)
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-left"
                          >
                            <Trash2 size={16} className="text-red-600" />
                            <span className="text-sm text-red-600">Excluir</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Modal Criar Categoria */}
      {modalCriarAberto && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-brand-royal rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 dark:text-brand-clean mb-4">
              Nova Categoria
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nome da Categoria
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg bg-white dark:bg-brand-midnight text-gray-900 dark:text-brand-clean focus:outline-none focus:ring-2 focus:ring-[#1e4976]"
                  placeholder="Ex: Pizzaria"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ícone
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {iconosDisponiveis.map((iconData) => {
                    const Icon = iconData.icon
                    const isSelected = formData.icone === iconData.name
                    return (
                      <button
                        key={iconData.name}
                        type="button"
                        onClick={() => setFormData({ ...formData, icone: iconData.name })}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          isSelected
                            ? 'border-[#1e4976] bg-[#1e4976]/10'
                            : 'border-gray-200 dark:border-white/20 hover:border-[#1e4976]/50'
                        }`}
                      >
                        <Icon size={24} className={iconData.color} />
                      </button>
                    )
                  })}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cor
                </label>
                <div className="flex gap-2">
                  {coresDisponiveis.map((cor) => (
                    <button
                      key={cor}
                      type="button"
                      onClick={() => setFormData({ ...formData, cor })}
                      className={`w-10 h-10 rounded-lg border-2 transition-all ${
                        formData.cor === cor ? 'border-gray-900 dark:border-white scale-110' : 'border-gray-300 dark:border-white/20'
                      }`}
                      style={{ backgroundColor: cor }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setModalCriarAberto(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCriarCategoria}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-[#2c5aa0] via-[#1e4976] to-[#163a5f] hover:from-[#1e4976] hover:via-[#163a5f] hover:to-[#0f2847] text-white rounded-lg font-semibold transition-colors"
              >
                Criar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Categoria */}
      {modalEditarAberto && categoriaEditando && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-brand-royal rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 dark:text-brand-clean mb-4">
              Editar Categoria
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nome da Categoria
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg bg-white dark:bg-brand-midnight text-gray-900 dark:text-brand-clean focus:outline-none focus:ring-2 focus:ring-[#1e4976]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ícone
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {iconosDisponiveis.map((iconData) => {
                    const Icon = iconData.icon
                    const isSelected = formData.icone === iconData.name
                    return (
                      <button
                        key={iconData.name}
                        type="button"
                        onClick={() => setFormData({ ...formData, icone: iconData.name })}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          isSelected
                            ? 'border-[#1e4976] bg-[#1e4976]/10'
                            : 'border-gray-200 dark:border-white/20 hover:border-[#1e4976]/50'
                        }`}
                      >
                        <Icon size={24} className={iconData.color} />
                      </button>
                    )
                  })}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cor
                </label>
                <div className="flex gap-2">
                  {coresDisponiveis.map((cor) => (
                    <button
                      key={cor}
                      type="button"
                      onClick={() => setFormData({ ...formData, cor })}
                      className={`w-10 h-10 rounded-lg border-2 transition-all ${
                        formData.cor === cor ? 'border-gray-900 dark:border-white scale-110' : 'border-gray-300 dark:border-white/20'
                      }`}
                      style={{ backgroundColor: cor }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setModalEditarAberto(false)
                  setCategoriaEditando(null)
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleEditarCategoria}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-[#2c5aa0] via-[#1e4976] to-[#163a5f] hover:from-[#1e4976] hover:via-[#163a5f] hover:to-[#0f2847] text-white rounded-lg font-semibold transition-colors"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Exclusão */}
      {categoriaExcluindo && (
        <ModalConfirmacao
          onConfirmar={handleExcluirCategoria}
          onCancelar={() => setCategoriaExcluindo(null)}
          titulo="Excluir Categoria"
          mensagem={`Tem certeza que deseja excluir a categoria "${categoriaExcluindo.nome}"?`}
          textoConfirmar="Excluir"
          textoCancelar="Cancelar"
          tipo="danger"
        />
      )}
    </>
  )
}

