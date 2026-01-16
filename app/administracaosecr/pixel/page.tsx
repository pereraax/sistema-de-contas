'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Save, Edit, Lightbulb, CheckCircle } from 'lucide-react'
import { createNotification } from '@/components/NotificationBell'

export default function AdminPixelPage() {
  const [pixelId, setPixelId] = useState('')
  const [pixelToken, setPixelToken] = useState('')
  const [editando, setEditando] = useState(false)
  const [loading, setLoading] = useState(false)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    carregarPixelId()
  }, [])

  const carregarPixelId = async () => {
    try {
      setCarregando(true)
      
      // Carregar Pixel ID
      const responseId = await fetch('/api/admin/platform-config?key=facebook_pixel_id')
      if (responseId.ok) {
        const dataId = await responseId.json()
        if (dataId.value) {
          setPixelId(dataId.value)
        }
      }
      
      // Carregar Pixel Token
      const responseToken = await fetch('/api/admin/platform-config?key=facebook_pixel_token')
      if (responseToken.ok) {
        const dataToken = await responseToken.json()
        if (dataToken.value) {
          setPixelToken(dataToken.value)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configurações do Pixel:', error)
    } finally {
      setCarregando(false)
    }
  }

  const salvarPixelId = async () => {
    if (!pixelId.trim()) {
      createNotification('Pixel ID não pode estar vazio', 'warning')
      return
    }

    // Validar formato (apenas números)
    if (!/^\d+$/.test(pixelId.trim())) {
      createNotification('Pixel ID inválido. Use apenas números.', 'warning')
      return
    }

    setLoading(true)
    try {
      // Salvar Pixel ID
      const responseId = await fetch('/api/admin/platform-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: 'facebook_pixel_id',
          value: pixelId.trim(),
        }),
      })

      const dataId = await responseId.json()

      if (!responseId.ok) {
        createNotification(dataId.error || 'Erro ao salvar Pixel ID', 'warning')
        return
      }

      // Salvar Pixel Token (opcional)
      if (pixelToken.trim()) {
        const responseToken = await fetch('/api/admin/platform-config', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            key: 'facebook_pixel_token',
            value: pixelToken.trim(),
          }),
        })

        const dataToken = await responseToken.json()

        if (!responseToken.ok) {
          createNotification(dataToken.error || 'Erro ao salvar Pixel Token', 'warning')
          return
        }
      } else {
        // Se o token estiver vazio, remover do banco
        await fetch('/api/admin/platform-config', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            key: 'facebook_pixel_token',
            value: null,
          }),
        })
      }

      createNotification('Configurações do Pixel salvas com sucesso!', 'success')
      setEditando(false)
      
      // Recarregar após 1 segundo para aplicar o Pixel
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error: any) {
      createNotification('Erro ao salvar configurações do Pixel', 'warning')
    } finally {
      setLoading(false)
    }
  }

  if (carregando) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-aqua"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-brand-aqua/20 rounded-xl">
            <TrendingUp size={24} className="text-brand-aqua" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold text-brand-clean" style={{ fontWeight: 700 }}>
              Pixel do Facebook
            </h1>
            <p className="text-sm font-semibold text-brand-clean/70" style={{ fontWeight: 600 }}>
              Configure o Pixel do Facebook para rastrear conversões em toda a plataforma
            </p>
          </div>
        </div>
      </div>

      <div className="bg-brand-royal/50 rounded-xl p-6 border border-white/10 shadow-lg">
        <div className="space-y-6">
          <div className="space-y-6">
            {/* Pixel ID */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-brand-clean/90">
                Pixel ID do Facebook
              </label>
              {editando ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={pixelId}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '')
                      setPixelId(value)
                    }}
                    placeholder="Ex: 123456789012345"
                    className="px-4 py-3 bg-brand-midnight border border-brand-aqua/30 rounded-lg text-brand-clean text-sm w-full focus:outline-none focus:border-brand-aqua"
                    maxLength={20}
                  />
                  <p className="text-xs text-brand-clean/60">
                    Encontre seu Pixel ID em: Gerenciador de Eventos → Configurações → ID do Pixel
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 px-4 py-3 bg-brand-midnight/50 border border-white/10 rounded-lg">
                      <p className="text-sm text-brand-clean">
                        {pixelId || 'Nenhum Pixel ID configurado'}
                      </p>
                    </div>
                    <button
                      onClick={() => setEditando(true)}
                      className="px-4 py-3 bg-brand-aqua text-brand-midnight rounded-lg hover:bg-brand-aqua/90 transition-smooth font-semibold flex items-center gap-2"
                      style={{ color: 'white' }}
                    >
                      <Edit size={18} />
                      {pixelId ? 'Editar' : 'Adicionar'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Pixel Token */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-brand-clean/90">
                Token do Pixel do Facebook <span className="text-xs text-brand-clean/60">(Opcional)</span>
              </label>
              {editando ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={pixelToken}
                    onChange={(e) => setPixelToken(e.target.value)}
                    placeholder="Ex: EAABsbCS1iHgBO..."
                    className="px-4 py-3 bg-brand-midnight border border-brand-aqua/30 rounded-lg text-brand-clean text-sm w-full focus:outline-none focus:border-brand-aqua"
                  />
                  <p className="text-xs text-brand-clean/60">
                    Token de acesso do Facebook (opcional). Encontre em: Gerenciador de Eventos → Configurações → Token de Acesso
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex-1 px-4 py-3 bg-brand-midnight/50 border border-white/10 rounded-lg">
                    <p className="text-sm text-brand-clean">
                      {pixelToken ? '••••••••••••••••' : 'Nenhum token configurado'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Botões de ação */}
            {editando && (
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={salvarPixelId}
                  disabled={loading || !pixelId.trim() || !/^\d+$/.test(pixelId.trim())}
                  className="px-6 py-2.5 bg-brand-aqua text-brand-midnight rounded-lg hover:bg-brand-aqua/90 transition-smooth font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  style={{ color: 'white' }}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-midnight"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Salvar
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setEditando(false)
                    carregarPixelId()
                  }}
                  disabled={loading}
                  className="px-6 py-2.5 bg-brand-midnight/50 text-brand-clean rounded-lg hover:bg-brand-midnight/70 transition-smooth font-medium disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
            )}

            {/* Status */}
            {!editando && pixelId && (
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle size={18} />
                <span className="text-sm font-medium">Pixel do Facebook ativo</span>
              </div>
            )}
          </div>

          <div className="bg-blue-900/20 rounded-xl p-4 border border-blue-800/30">
            <div className="flex items-start gap-3">
              <Lightbulb className="text-blue-400 flex-shrink-0 mt-0.5" size={20} />
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-blue-300">
                  Como encontrar seu Pixel ID
                </h3>
                <ol className="text-xs text-blue-200 space-y-1 list-decimal list-inside">
                  <li>Acesse o Gerenciador de Eventos do Facebook</li>
                  <li>Selecione seu Pixel ou crie um novo</li>
                  <li>Vá em Configurações</li>
                  <li>Copie o ID do Pixel (formato: apenas números)</li>
                </ol>
                <p className="text-xs text-blue-300/80 mt-2">
                  📎 Link: <a href="https://business.facebook.com/events_manager" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-200">business.facebook.com/events_manager</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

