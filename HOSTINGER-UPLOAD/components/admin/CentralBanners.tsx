'use client'

import { useState, useEffect } from 'react'
import { Plus, X, Trash2, Eye, EyeOff, Upload, ArrowUp, ArrowDown, Image as ImageIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import ModalConfirmacao from '@/components/ModalConfirmacao'
import ImageEditor from './ImageEditor'

interface Banner {
  id: string
  imagem_url: string
  ordem: number
  ativo: boolean
  tempo_transicao: number
  created_at: string
  updated_at: string
}

export default function CentralBanners() {
  const router = useRouter()
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [bannerParaDeletar, setBannerParaDeletar] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [tempoTransicaoGlobal, setTempoTransicaoGlobal] = useState(5)
  const [showImageEditor, setShowImageEditor] = useState(false)
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  
  const [formData, setFormData] = useState({
    imagem_url: '',
    ordem: '0',
    ativo: true,
    tempo_transicao: '5',
  })

  useEffect(() => {
    carregarBanners()
  }, [])

  const carregarBanners = async () => {
    try {
      const response = await fetch('/api/admin/banners')
      if (response.ok) {
        const data = await response.json()
        setBanners(data.banners || [])
        // Pegar tempo de transição do primeiro banner ou usar padrão
        if (data.banners && data.banners.length > 0) {
          setTempoTransicaoGlobal(data.banners[0].tempo_transicao || 5)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar banners:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione uma imagem válida')
      return
    }

    // Validar tamanho (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Arquivo muito grande. Máximo 10MB')
      return
    }

    // Abrir editor de imagem
    setSelectedImageFile(file)
    setShowImageEditor(true)
  }

  const handleImageEditorSave = async (croppedBlob: Blob) => {
    setShowImageEditor(false)
    setUploading(true)

    try {
      // Converter blob para File
      const croppedFile = new File([croppedBlob], selectedImageFile?.name || 'banner.jpg', {
        type: 'image/jpeg',
        lastModified: Date.now()
      })

      // Usar a API de upload existente
      const formDataUpload = new FormData()
      formDataUpload.append('file', croppedFile)
      formDataUpload.append('folder', 'banners')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao fazer upload')
      }

      const data = await response.json()
      setFormData({ ...formData, imagem_url: data.url })
      setSelectedImageFile(null)
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error)
      alert('Erro ao fazer upload da imagem: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  const handleImageEditorCancel = () => {
    setShowImageEditor(false)
    setSelectedImageFile(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.imagem_url) {
      alert('Por favor, faça upload de uma imagem')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/admin/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          ordem: parseInt(formData.ordem) || 0,
          tempo_transicao: parseInt(formData.tempo_transicao) || 5,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        alert(`Erro: ${data.error}`)
        return
      }

      router.refresh()
      await carregarBanners()
      setShowModal(false)
      setFormData({
        imagem_url: '',
        ordem: String(banners.length),
        ativo: true,
        tempo_transicao: String(tempoTransicaoGlobal),
      })
    } catch (error) {
      alert('Erro ao criar banner')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleAtivo = async (bannerId: string, ativo: boolean) => {
    try {
      const response = await fetch(`/api/admin/banners/${bannerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: !ativo }),
      })

      if (!response.ok) {
        alert('Erro ao atualizar banner')
        return
      }

      router.refresh()
      await carregarBanners()
    } catch (error) {
      alert('Erro ao atualizar banner')
    }
  }

  const handleDeletar = async () => {
    if (!bannerParaDeletar) return

    try {
      const response = await fetch(`/api/admin/banners/${bannerParaDeletar}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        alert('Erro ao deletar banner')
        return
      }

      router.refresh()
      await carregarBanners()
      setBannerParaDeletar(null)
    } catch (error) {
      alert('Erro ao deletar banner')
    }
  }

  const handleAtualizarOrdem = async (bannerId: string, novaOrdem: number) => {
    try {
      const response = await fetch(`/api/admin/banners/${bannerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ordem: novaOrdem }),
      })

      if (!response.ok) {
        alert('Erro ao atualizar ordem')
        return
      }

      router.refresh()
      await carregarBanners()
    } catch (error) {
      alert('Erro ao atualizar ordem')
    }
  }

  const handleAtualizarTempoTransicao = async (bannerId: string, tempo: number) => {
    try {
      const response = await fetch(`/api/admin/banners/${bannerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempo_transicao: tempo }),
      })

      if (!response.ok) {
        alert('Erro ao atualizar tempo de transição')
        return
      }

      // Atualizar tempo global se for o primeiro banner
      if (banners.length > 0 && banners[0].id === bannerId) {
        setTempoTransicaoGlobal(tempo)
      }

      router.refresh()
      await carregarBanners()
    } catch (error) {
      alert('Erro ao atualizar tempo de transição')
    }
  }

  if (loading && banners.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-brand-clean">Carregando banners...</div>
      </div>
    )
  }

  const bannersOrdenados = [...banners].sort((a, b) => a.ordem - b.ordem)

  return (
    <div className="space-y-6">
      {/* Botão criar banner */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-3 bg-brand-aqua text-brand-midnight rounded-xl font-semibold hover:bg-brand-aqua/90 transition-smooth shadow-lg hover:shadow-xl flex items-center gap-2"
        >
          <Plus size={20} />
          Novo Banner
        </button>
      </div>

      {/* Lista de banners */}
      <div className="space-y-4">
        {bannersOrdenados.map((banner, index) => (
          <div
            key={banner.id}
            className={`bg-brand-royal rounded-2xl p-6 shadow-lg border border-white/10 ${banner.ativo ? '' : 'opacity-60'}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-lg font-semibold text-brand-clean">
                    Banner #{banner.ordem + 1}
                  </h3>
                  {!banner.ativo && (
                    <span className="px-2 py-1 bg-gray-900/50 text-gray-400 text-xs rounded-lg">
                      Inativo
                    </span>
                  )}
                </div>
                
                {/* Preview da imagem */}
                <div className="mb-4 rounded-xl overflow-hidden border border-white/10 bg-brand-midnight/50">
                  <img
                    src={banner.imagem_url}
                    alt={`Banner ${banner.ordem + 1}`}
                    className="w-full h-auto max-h-64 object-cover"
                  />
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-brand-clean/90 mb-1">
                      Tempo de Transição (segundos)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={banner.tempo_transicao}
                      onChange={(e) => {
                        const tempo = parseInt(e.target.value) || 5
                        handleAtualizarTempoTransicao(banner.id, tempo)
                      }}
                      className="w-32 px-3 py-2 bg-brand-midnight border border-white/20 rounded-lg focus:outline-none focus:border-brand-aqua transition-smooth text-brand-clean"
                    />
                  </div>

                  <div className="flex items-center gap-2 text-xs text-brand-clean/50">
                    <span>Ordem: {banner.ordem}</span>
                    <span>•</span>
                    <span>
                      Criado em: {new Date(banner.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center gap-2">
                {/* Botões de ordem */}
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => {
                      if (index > 0) {
                        const bannerAnterior = bannersOrdenados[index - 1]
                        handleAtualizarOrdem(banner.id, bannerAnterior.ordem)
                        handleAtualizarOrdem(bannerAnterior.id, banner.ordem)
                      }
                    }}
                    disabled={index === 0}
                    className="p-2 bg-brand-midnight text-brand-clean rounded-lg hover:bg-white/10 transition-smooth disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Mover para cima"
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    onClick={() => {
                      if (index < bannersOrdenados.length - 1) {
                        const proximoBanner = bannersOrdenados[index + 1]
                        handleAtualizarOrdem(banner.id, proximoBanner.ordem)
                        handleAtualizarOrdem(proximoBanner.id, banner.ordem)
                      }
                    }}
                    disabled={index === bannersOrdenados.length - 1}
                    className="p-2 bg-brand-midnight text-brand-clean rounded-lg hover:bg-white/10 transition-smooth disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Mover para baixo"
                  >
                    <ArrowDown size={16} />
                  </button>
                </div>

                {/* Botões de ação */}
                <div className="flex flex-col gap-2 mt-2">
                  <button
                    onClick={() => handleToggleAtivo(banner.id, banner.ativo)}
                    className={`p-2 rounded-lg transition-smooth ${
                      banner.ativo
                        ? 'bg-green-900/20 text-green-400 hover:bg-green-900/30'
                        : 'bg-gray-900/20 text-gray-400 hover:bg-gray-900/30'
                    }`}
                    title={banner.ativo ? 'Desativar' : 'Ativar'}
                  >
                    {banner.ativo ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                  <button
                    onClick={() => setBannerParaDeletar(banner.id)}
                    className="p-2 bg-red-900/20 text-red-400 rounded-lg hover:bg-red-900/30 transition-smooth"
                    title="Deletar"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {banners.length === 0 && (
        <div className="bg-brand-royal rounded-2xl p-12 text-center shadow-lg border border-white/10">
          <ImageIcon size={48} className="mx-auto mb-4 text-brand-clean/40" />
          <p className="text-brand-clean/60 text-lg">Nenhum banner criado ainda</p>
          <p className="text-brand-clean/40 text-sm mt-2">
            Clique em "Novo Banner" para adicionar o primeiro
          </p>
        </div>
      )}

      {/* Modal criar banner */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 glass-backdrop">
          <div className="bg-brand-royal rounded-3xl p-6 shadow-2xl border border-white/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-display font-bold text-brand-clean">
                Criar Novo Banner
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-smooth"
              >
                <X size={24} className="text-brand-clean" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-brand-clean/90 mb-2">
                  Upload de Imagem (1920x720 recomendado)
                </label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 px-4 py-3 bg-brand-midnight border border-white/20 rounded-xl text-brand-clean cursor-pointer hover:bg-brand-midnight/80 transition-smooth flex items-center justify-center gap-2">
                    <Upload size={18} />
                    {uploading ? 'Enviando...' : formData.imagem_url ? 'Imagem selecionada' : 'Escolher Imagem'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleSelectImage}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                  {formData.imagem_url && (
                    <div className="w-20 h-20 rounded-lg overflow-hidden border border-white/20">
                      <img src={formData.imagem_url} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-brand-clean/50 mt-2">
                  Tamanho recomendado: 1920x720px (proporção 8:3). Máximo 10MB.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-clean/90 mb-2">
                  Ordem de Exibição
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.ordem}
                  onChange={(e) => setFormData({ ...formData, ordem: e.target.value })}
                  className="w-full px-4 py-3 bg-brand-midnight border border-white/20 rounded-xl focus:outline-none focus:border-brand-aqua transition-smooth text-brand-clean"
                />
                <p className="text-xs text-brand-clean/50 mt-2">
                  Banners com menor número aparecem primeiro. Deixe 0 para adicionar no final.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-clean/90 mb-2">
                  Tempo de Transição (segundos)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={formData.tempo_transicao}
                  onChange={(e) => setFormData({ ...formData, tempo_transicao: e.target.value })}
                  className="w-full px-4 py-3 bg-brand-midnight border border-white/20 rounded-xl focus:outline-none focus:border-brand-aqua transition-smooth text-brand-clean"
                />
                <p className="text-xs text-brand-clean/50 mt-2">
                  Tempo em segundos para transição automática entre banners (padrão: 5s).
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading || uploading || !formData.imagem_url}
                  className="flex-1 px-6 py-3 bg-brand-aqua text-brand-midnight rounded-xl font-semibold hover:bg-brand-aqua/90 transition-smooth disabled:opacity-50"
                >
                  {loading ? 'Criando...' : 'Criar Banner'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 bg-brand-midnight text-brand-clean rounded-xl font-semibold hover:bg-white/10 transition-smooth"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal confirmar deletar */}
      {bannerParaDeletar && (
        <ModalConfirmacao
          titulo="Deletar Banner"
          mensagem="Tem certeza que deseja deletar este banner? Esta ação não pode ser desfeita."
          onConfirmar={handleDeletar}
          onCancelar={() => setBannerParaDeletar(null)}
          textoConfirmar="Deletar"
          tipo="danger"
        />
      )}

      {/* Editor de Imagem */}
      {showImageEditor && selectedImageFile && (
        <ImageEditor
          imageFile={selectedImageFile}
          aspectRatio={8/3}
          onSave={handleImageEditorSave}
          onCancel={handleImageEditorCancel}
        />
      )}
    </div>
  )
}

