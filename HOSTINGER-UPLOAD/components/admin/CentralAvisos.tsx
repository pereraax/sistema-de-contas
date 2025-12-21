'use client'

import { useState } from 'react'
import { Plus, X, AlertCircle, Info, AlertTriangle, CheckCircle, Trash2, Eye, EyeOff } from 'lucide-react'
import CheckboxModerno from '../CheckboxModerno'
import { criarAvisoAdmin, desativarAviso, ativarAviso, deletarAviso } from '@/lib/admin-actions'
import { useRouter } from 'next/navigation'
import ModalConfirmacao from '@/components/ModalConfirmacao'

interface AdminAviso {
  id: string
  titulo: string
  mensagem: string
  tipo: 'info' | 'warning' | 'error' | 'success'
  mostrar_popup: boolean
  ativo: boolean
  criado_por: string
  created_at: string
  updated_at: string
  data_expiracao?: string | null
}

interface CentralAvisosProps {
  avisos: AdminAviso[]
  adminId: string
}

export default function CentralAvisos({ avisos: avisosIniciais, adminId }: CentralAvisosProps) {
  const router = useRouter()
  const [avisos, setAvisos] = useState(avisosIniciais)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [avisoParaDeletar, setAvisoParaDeletar] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    titulo: '',
    mensagem: '',
    tipo: 'info' as 'info' | 'warning' | 'error' | 'success',
    mostrar_popup: false,
    expira_em: '', // Data e hora de expiração (formato: YYYY-MM-DDTHH:mm)
    expira_em_dias: '', // Número de dias para expirar (alternativa)
    usar_data_expiracao: false, // Se deve usar data de expiração
  })

  const tipoConfig = {
    info: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-900/20', border: 'border-blue-800/50' },
    warning: { icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-900/20', border: 'border-orange-800/50' },
    error: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-900/20', border: 'border-red-800/50' },
    success: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-900/20', border: 'border-green-800/50' },
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Calcular data de expiração se necessário
      let dataExpiracao: string | null = null
      
      if (formData.usar_data_expiracao) {
        if (formData.expira_em_dias) {
          // Calcular a partir de hoje + X dias
          const dias = parseInt(formData.expira_em_dias)
          const data = new Date()
          data.setDate(data.getDate() + dias)
          dataExpiracao = data.toISOString()
        } else if (formData.expira_em) {
          // Usar data/hora específica
          dataExpiracao = new Date(formData.expira_em).toISOString()
        }
      }

      const resultado = await criarAvisoAdmin({
        titulo: formData.titulo,
        mensagem: formData.mensagem,
        tipo: formData.tipo,
        mostrar_popup: formData.mostrar_popup,
        adminId,
        data_expiracao: dataExpiracao,
      })

      if (resultado.error) {
        alert(`Erro: ${resultado.error}`)
        setLoading(false)
        return
      }

      // Atualizar lista
      router.refresh()
      setShowModal(false)
      setFormData({
        titulo: '',
        mensagem: '',
        tipo: 'info',
        mostrar_popup: false,
        expira_em: '',
        expira_em_dias: '',
        usar_data_expiracao: false,
      })
    } catch (error) {
      alert('Erro ao criar aviso')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleAtivo = async (avisoId: string, ativo: boolean) => {
    if (ativo) {
      await desativarAviso(avisoId)
    } else {
      await ativarAviso(avisoId)
    }
    router.refresh()
  }

  const handleDeletar = async () => {
    if (!avisoParaDeletar) return

    const resultado = await deletarAviso(avisoParaDeletar)
    if (resultado.success) {
      router.refresh()
      setAvisoParaDeletar(null)
    } else {
      alert(`Erro: ${resultado.error}`)
    }
  }

  return (
    <div className="space-y-6">
      {/* Botão criar aviso */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-3 bg-brand-aqua text-brand-midnight rounded-xl font-semibold hover:bg-brand-aqua/90 transition-smooth shadow-lg hover:shadow-xl flex items-center gap-2"
        >
          <Plus size={20} />
          Novo Aviso
        </button>
      </div>

      {/* Lista de avisos */}
      <div className="space-y-4">
        {avisos.map((aviso) => {
          const config = tipoConfig[aviso.tipo]
          const Icon = config.icon

          return (
            <div
              key={aviso.id}
              className={`bg-brand-royal rounded-2xl p-6 shadow-lg border ${config.border} ${aviso.ativo ? '' : 'opacity-60'}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`p-3 rounded-xl ${config.bg}`}>
                    <Icon size={24} className={config.color} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-brand-clean">
                        {aviso.titulo}
                      </h3>
                      {aviso.mostrar_popup && (
                        <span className="px-2 py-1 bg-brand-aqua/20 text-brand-aqua text-xs rounded-lg">
                          Popup
                        </span>
                      )}
                      {!aviso.ativo && (
                        <span className="px-2 py-1 bg-gray-900/50 text-gray-400 text-xs rounded-lg">
                          Inativo
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-brand-clean/70 mb-2">
                      {aviso.mensagem}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-brand-clean/50 flex-wrap">
                      <span>Tipo: {aviso.tipo}</span>
                      <span>
                        Criado em: {new Date(aviso.created_at).toLocaleDateString('pt-BR')}
                      </span>
                      {aviso.data_expiracao && (
                        <span className="text-orange-400">
                          Expira em: {new Date(aviso.data_expiracao).toLocaleDateString('pt-BR')} às {new Date(aviso.data_expiracao).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleAtivo(aviso.id, aviso.ativo)}
                    className={`p-2 rounded-lg transition-smooth ${
                      aviso.ativo
                        ? 'bg-green-900/20 text-green-400 hover:bg-green-900/30'
                        : 'bg-gray-900/20 text-gray-400 hover:bg-gray-900/30'
                    }`}
                    title={aviso.ativo ? 'Desativar' : 'Ativar'}
                  >
                    {aviso.ativo ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                  <button
                    onClick={() => setAvisoParaDeletar(aviso.id)}
                    className="p-2 bg-red-900/20 text-red-400 rounded-lg hover:bg-red-900/30 transition-smooth"
                    title="Deletar"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {avisos.length === 0 && (
        <div className="bg-brand-royal rounded-2xl p-12 text-center shadow-lg border border-white/10">
          <p className="text-brand-clean/60 text-lg">Nenhum aviso criado ainda</p>
        </div>
      )}

      {/* Modal criar aviso */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 glass-backdrop">
          <div className="bg-brand-royal rounded-3xl p-6 shadow-2xl border border-white/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-display font-bold text-brand-clean">
                Criar Novo Aviso
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
                  Título
                </label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-brand-midnight border border-white/20 rounded-xl focus:outline-none focus:border-brand-aqua transition-smooth text-brand-clean placeholder-brand-clean/50"
                  placeholder="Título do aviso"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-clean/90 mb-2">
                  Mensagem
                </label>
                <textarea
                  value={formData.mensagem}
                  onChange={(e) => setFormData({ ...formData, mensagem: e.target.value })}
                  required
                  rows={4}
                  className="w-full px-4 py-3 bg-brand-midnight border border-white/20 rounded-xl focus:outline-none focus:border-brand-aqua transition-smooth text-brand-clean placeholder-brand-clean/50 resize-none"
                  placeholder="Mensagem do aviso"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-clean/90 mb-2">
                  Tipo
                </label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value as any })}
                  className="w-full px-4 py-3 bg-brand-midnight border border-white/20 rounded-xl focus:outline-none focus:border-brand-aqua transition-smooth text-brand-clean"
                >
                  <option value="info">Informação</option>
                  <option value="warning">Aviso</option>
                  <option value="error">Erro</option>
                  <option value="success">Sucesso</option>
                </select>
              </div>

              <CheckboxModerno
                id="mostrar_popup"
                checked={formData.mostrar_popup}
                onChange={(checked) => setFormData({ ...formData, mostrar_popup: checked })}
                label="Mostrar como popup quando usuário logar"
                size="md"
              />

              <div className="bg-brand-midnight/50 rounded-xl p-4 space-y-4">
                <CheckboxModerno
                  id="usar_data_expiracao"
                  checked={formData.usar_data_expiracao}
                  onChange={(checked) => setFormData({ ...formData, usar_data_expiracao: checked })}
                  label="Definir data de expiração"
                  size="md"
                />

                {formData.usar_data_expiracao && (
                  <div className="space-y-3 pl-8">
                    <div>
                      <label className="block text-sm font-medium text-brand-clean/90 mb-2">
                        Expirar em (dias)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.expira_em_dias}
                        onChange={(e) => setFormData({ ...formData, expira_em_dias: e.target.value, expira_em: '' })}
                        placeholder="Ex: 7 (expira em 7 dias)"
                        className="w-full px-4 py-3 bg-brand-midnight border border-white/20 rounded-xl focus:outline-none focus:border-brand-aqua transition-smooth text-brand-clean placeholder-brand-clean/50"
                        style={{ color: '#E6E6E6' }}
                      />
                    </div>
                    <div className="text-center text-sm text-brand-clean/60">ou</div>
                    <div>
                      <label className="block text-sm font-medium text-brand-clean/90 mb-2">
                        Data e hora específica de expiração
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.expira_em}
                        onChange={(e) => setFormData({ ...formData, expira_em: e.target.value, expira_em_dias: '' })}
                        className="w-full px-4 py-3 bg-brand-midnight border border-white/20 rounded-xl focus:outline-none focus:border-brand-aqua transition-smooth text-brand-clean"
                        style={{ color: '#E6E6E6' }}
                      />
                    </div>
                    <p className="text-xs text-brand-clean/50">
                      Se não definir, o aviso ficará ativo indefinidamente até ser desativado manualmente.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-brand-aqua text-brand-midnight rounded-xl font-semibold hover:bg-brand-aqua/90 transition-smooth disabled:opacity-50"
                >
                  {loading ? 'Criando...' : 'Criar Aviso'}
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
      {avisoParaDeletar && (
        <ModalConfirmacao
          titulo="Deletar Aviso"
          mensagem="Tem certeza que deseja deletar este aviso? Esta ação não pode ser desfeita."
          onConfirmar={handleDeletar}
          onCancelar={() => setAvisoParaDeletar(null)}
          textoConfirmar="Deletar"
          tipo="danger"
        />
      )}
    </div>
  )
}

