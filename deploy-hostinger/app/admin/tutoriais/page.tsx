'use client'

import { useState, useEffect } from 'react'
import AdminLayoutWrapper from '@/components/admin/AdminLayoutWrapper'
import { Plus, Edit, Trash2, PlayCircle, Upload, X, Save, Clock, Eye } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { createNotification } from '@/components/NotificationBell'

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
  ativo: boolean
  visualizacoes: number
  criado_em: string
}

export default function AdminTutoriaisPage() {
  const [tutoriais, setTutoriais] = useState<Tutorial[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [tutorialEditando, setTutorialEditando] = useState<Tutorial | null>(null)
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    video_url: '',
    video_arquivo_url: '',
    thumbnail_url: '',
    categoria: 'geral',
    ordem: 0,
    duracao_segundos: '',
    ativo: true,
  })
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false)

  useEffect(() => {
    carregarTutoriais()
  }, [])

  const carregarTutoriais = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('tutoriais')
        .select('*')
        .order('ordem', { ascending: true })
        .order('criado_em', { ascending: false })

      if (error) {
        console.error('Erro ao carregar tutoriais:', error)
        createNotification('Erro ao carregar tutoriais', 'warning')
      } else {
        setTutoriais(data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar tutoriais:', error)
      createNotification('Erro ao carregar tutoriais', 'warning')
    } finally {
      setLoading(false)
    }
  }

  const handleNovoTutorial = () => {
    setTutorialEditando(null)
    setFormData({
      titulo: '',
      descricao: '',
      video_url: '',
      video_arquivo_url: '',
      thumbnail_url: '',
      categoria: 'geral',
      ordem: tutoriais.length,
      duracao_segundos: '',
      ativo: true,
    })
    setShowModal(true)
  }

  const handleEditar = (tutorial: Tutorial) => {
    setTutorialEditando(tutorial)
    setFormData({
      titulo: tutorial.titulo,
      descricao: tutorial.descricao || '',
      video_url: tutorial.video_url || '',
      video_arquivo_url: tutorial.video_arquivo_url || '',
      thumbnail_url: tutorial.thumbnail_url || '',
      categoria: tutorial.categoria || 'geral',
      ordem: tutorial.ordem,
      duracao_segundos: tutorial.duracao_segundos?.toString() || '',
      ativo: tutorial.ativo,
    })
    setShowModal(true)
  }

  const handleSalvar = async () => {
    if (!formData.titulo.trim()) {
      createNotification('Título é obrigatório', 'warning')
      return
    }

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        createNotification('Não autenticado', 'warning')
        return
      }

      const tutorialData = {
        titulo: formData.titulo.trim(),
        descricao: formData.descricao.trim() || null,
        video_url: formData.video_url.trim() || null,
        video_arquivo_url: formData.video_arquivo_url.trim() || null,
        thumbnail_url: formData.thumbnail_url.trim() || null,
        categoria: formData.categoria || null,
        ordem: formData.ordem,
        duracao_segundos: formData.duracao_segundos ? parseInt(formData.duracao_segundos) : null,
        ativo: formData.ativo,
        criado_por: user.id,
      }

      if (tutorialEditando) {
        // Atualizar
        const { error } = await supabase
          .from('tutoriais')
          .update(tutorialData)
          .eq('id', tutorialEditando.id)

        if (error) throw error
        createNotification('Tutorial atualizado com sucesso!', 'success')
      } else {
        // Criar
        const { error } = await supabase
          .from('tutoriais')
          .insert([tutorialData])

        if (error) throw error
        createNotification('Tutorial criado com sucesso!', 'success')
      }

      setShowModal(false)
      carregarTutoriais()
    } catch (error: any) {
      console.error('Erro ao salvar tutorial:', error)
      createNotification('Erro ao salvar tutorial: ' + error.message, 'warning')
    }
  }

  const handleExcluir = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este tutorial?')) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('tutoriais')
        .delete()
        .eq('id', id)

      if (error) throw error
      createNotification('Tutorial excluído com sucesso!', 'success')
      carregarTutoriais()
    } catch (error: any) {
      console.error('Erro ao excluir tutorial:', error)
      createNotification('Erro ao excluir tutorial: ' + error.message, 'warning')
    }
  }

  const handleUploadVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingVideo(true)
    try {
      const supabase = createClient()
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `tutoriais/videos/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('emprestimos')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('emprestimos')
        .getPublicUrl(filePath)

      setFormData({ ...formData, video_arquivo_url: data.publicUrl })
      createNotification('Vídeo enviado com sucesso!', 'success')
    } catch (error: any) {
      console.error('Erro ao fazer upload do vídeo:', error)
      createNotification('Erro ao fazer upload do vídeo: ' + error.message, 'warning')
    } finally {
      setUploadingVideo(false)
    }
  }

  const handleUploadThumbnail = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingThumbnail(true)
    try {
      const supabase = createClient()
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `tutoriais/thumbnails/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('emprestimos')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('emprestimos')
        .getPublicUrl(filePath)

      setFormData({ ...formData, thumbnail_url: data.publicUrl })
      createNotification('Thumbnail enviada com sucesso!', 'success')
    } catch (error: any) {
      console.error('Erro ao fazer upload da thumbnail:', error)
      createNotification('Erro ao fazer upload da thumbnail: ' + error.message, 'warning')
    } finally {
      setUploadingThumbnail(false)
    }
  }

  const formatarDuracao = (segundos: number | null) => {
    if (!segundos) return 'N/A'
    const minutos = Math.floor(segundos / 60)
    const segs = segundos % 60
    return `${minutos}:${segs.toString().padStart(2, '0')}`
  }

  return (
    <AdminLayoutWrapper>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-brand-clean mb-2">
              Gerenciar Tutoriais
            </h1>
            <p className="text-brand-clean/70">
              Crie e gerencie os tutoriais da plataforma
            </p>
          </div>
          <button
            onClick={handleNovoTutorial}
            className="px-6 py-3 bg-brand-aqua text-brand-midnight rounded-xl font-semibold hover:bg-brand-aqua/90 transition-smooth flex items-center gap-2"
          >
            <Plus size={20} />
            Novo Tutorial
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-brand-clean/60">
            Carregando tutoriais...
          </div>
        ) : tutoriais.length === 0 ? (
          <div className="bg-brand-royal rounded-2xl p-12 text-center border border-white/10">
            <PlayCircle size={64} className="mx-auto mb-4 text-brand-clean/30" />
            <p className="text-brand-clean/60 text-lg mb-4">
              Nenhum tutorial cadastrado
            </p>
            <button
              onClick={handleNovoTutorial}
              className="px-6 py-3 bg-brand-aqua text-brand-midnight rounded-xl font-semibold hover:bg-brand-aqua/90 transition-smooth inline-flex items-center gap-2"
            >
              <Plus size={20} />
              Criar Primeiro Tutorial
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tutoriais.map((tutorial) => (
              <div
                key={tutorial.id}
                className="bg-brand-royal rounded-xl overflow-hidden border border-white/10 hover:border-brand-aqua/50 transition-smooth"
              >
                <div className="relative aspect-video bg-gradient-to-br from-brand-aqua/20 to-brand-blue/20">
                  {tutorial.thumbnail_url ? (
                    <img
                      src={tutorial.thumbnail_url}
                      alt={tutorial.titulo}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <PlayCircle size={48} className="text-brand-aqua/50" />
                    </div>
                  )}
                  {!tutorial.ativo && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                      Inativo
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-display text-brand-clean mb-2 line-clamp-2">
                    {tutorial.titulo}
                  </h3>
                  {tutorial.descricao && (
                    <p className="text-sm text-brand-clean/70 mb-3 line-clamp-2">
                      {tutorial.descricao}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs text-brand-clean/60 mb-3">
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      {formatarDuracao(tutorial.duracao_segundos)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye size={12} />
                      {tutorial.visualizacoes}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditar(tutorial)}
                      className="flex-1 px-3 py-2 bg-brand-aqua/20 text-brand-aqua rounded-lg hover:bg-brand-aqua/30 transition-smooth flex items-center justify-center gap-1 text-sm"
                    >
                      <Edit size={16} />
                      Editar
                    </button>
                    <button
                      onClick={() => handleExcluir(tutorial.id)}
                      className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-smooth"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de Criar/Editar */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-brand-royal rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/10">
              <div className="sticky top-0 bg-brand-royal border-b border-white/10 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-display text-brand-clean">
                  {tutorialEditando ? 'Editar Tutorial' : 'Novo Tutorial'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-smooth"
                >
                  <X size={20} className="text-brand-clean" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-brand-clean mb-2">
                    Título *
                  </label>
                  <input
                    type="text"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    className="w-full px-4 py-2 bg-brand-midnight border border-white/10 rounded-lg text-brand-clean focus:outline-none focus:border-brand-aqua"
                    placeholder="Ex: Como criar uma dívida"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-clean mb-2">
                    Descrição
                  </label>
                  <textarea
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 bg-brand-midnight border border-white/10 rounded-lg text-brand-clean focus:outline-none focus:border-brand-aqua resize-none"
                    placeholder="Descrição do tutorial..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-brand-clean mb-2">
                      Categoria
                    </label>
                    <select
                      value={formData.categoria}
                      onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                      className="w-full px-4 py-2 bg-brand-midnight border border-white/10 rounded-lg text-brand-clean focus:outline-none focus:border-brand-aqua"
                    >
                      <option value="geral">Geral</option>
                      <option value="dividas">Dívidas</option>
                      <option value="metas">Metas</option>
                      <option value="calendario">Calendário</option>
                      <option value="dashboard">Dashboard</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-brand-clean mb-2">
                      Ordem
                    </label>
                    <input
                      type="number"
                      value={formData.ordem}
                      onChange={(e) => setFormData({ ...formData, ordem: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 bg-brand-midnight border border-white/10 rounded-lg text-brand-clean focus:outline-none focus:border-brand-aqua"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-clean mb-2">
                    URL do Vídeo (YouTube, Vimeo, etc.)
                  </label>
                  <input
                    type="url"
                    value={formData.video_url}
                    onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                    className="w-full px-4 py-2 bg-brand-midnight border border-white/10 rounded-lg text-brand-clean focus:outline-none focus:border-brand-aqua"
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-clean mb-2">
                    Upload de Vídeo
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="flex-1 px-4 py-2 bg-brand-midnight border border-white/10 rounded-lg text-brand-clean cursor-pointer hover:bg-brand-midnight/80 transition-smooth flex items-center justify-center gap-2">
                      <Upload size={18} />
                      {uploadingVideo ? 'Enviando...' : 'Escolher Arquivo'}
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleUploadVideo}
                        className="hidden"
                        disabled={uploadingVideo}
                      />
                    </label>
                    {formData.video_arquivo_url && (
                      <span className="text-xs text-brand-clean/60">✓ Vídeo enviado</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-clean mb-2">
                    Upload de Thumbnail
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="flex-1 px-4 py-2 bg-brand-midnight border border-white/10 rounded-lg text-brand-clean cursor-pointer hover:bg-brand-midnight/80 transition-smooth flex items-center justify-center gap-2">
                      <Upload size={18} />
                      {uploadingThumbnail ? 'Enviando...' : 'Escolher Imagem'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleUploadThumbnail}
                        className="hidden"
                        disabled={uploadingThumbnail}
                      />
                    </label>
                    {formData.thumbnail_url && (
                      <div className="w-12 h-12 rounded overflow-hidden border border-white/10">
                        <img src={formData.thumbnail_url} alt="Thumbnail" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-brand-clean mb-2">
                      Duração (segundos)
                    </label>
                    <input
                      type="number"
                      value={formData.duracao_segundos}
                      onChange={(e) => setFormData({ ...formData, duracao_segundos: e.target.value })}
                      className="w-full px-4 py-2 bg-brand-midnight border border-white/10 rounded-lg text-brand-clean focus:outline-none focus:border-brand-aqua"
                      placeholder="Ex: 300 (5 minutos)"
                    />
                  </div>

                  <div className="flex items-center pt-8">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.ativo}
                        onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                        className="w-4 h-4 rounded border-white/20 bg-brand-midnight text-brand-aqua focus:ring-brand-aqua"
                      />
                      <span className="text-sm text-brand-clean">Tutorial ativo</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 bg-brand-midnight text-brand-clean rounded-lg hover:bg-brand-midnight/80 transition-smooth"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSalvar}
                    className="flex-1 px-4 py-2 bg-brand-aqua text-brand-midnight rounded-lg font-semibold hover:bg-brand-aqua/90 transition-smooth flex items-center justify-center gap-2"
                  >
                    <Save size={18} />
                    Salvar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayoutWrapper>
  )
}

