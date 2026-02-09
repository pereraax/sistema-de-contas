'use client'

import { useState } from 'react'
import { X, Mail, KeyRound } from 'lucide-react'
import { createNotification } from './NotificationBell'
import { enviarLinkRedefinicaoSenha } from '@/lib/auth'

interface ModalEsqueceuSenhaProps {
  isOpen: boolean
  onClose: () => void
  emailPadrao?: string
}

export default function ModalEsqueceuSenha({ isOpen, onClose, emailPadrao = '' }: ModalEsqueceuSenhaProps) {
  const [email, setEmail] = useState(emailPadrao)
  const [enviando, setEnviando] = useState(false)
  const [linkEnviado, setLinkEnviado] = useState(false)
  const [erro, setErro] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    if (!email.trim() || !email.includes('@')) {
      setErro('Informe um email válido')
      return
    }

    setEnviando(true)
    try {
      const result = await enviarLinkRedefinicaoSenha(email.trim())
      if (result.error) {
        setErro(result.error)
        createNotification(result.error, 'warning')
      } else {
        setLinkEnviado(true)
        createNotification('Link enviado! Verifique seu email (incluindo spam).', 'success')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao enviar. Tente novamente.'
      setErro(msg)
      createNotification(msg, 'warning')
    } finally {
      setEnviando(false)
    }
  }

  const handleClose = () => {
    setEmail(emailPadrao)
    setLinkEnviado(false)
    setErro('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-[#1e4976]/5 to-[#163a5f]/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#1e4976]/10 rounded-xl flex items-center justify-center">
                <KeyRound size={20} className="text-[#1e4976]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Esqueceu a senha?
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Enviaremos um link para redefinir
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={18} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-6">
          {linkEnviado ? (
            <div className="space-y-5">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <Mail size={32} className="text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Link enviado!</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Enviamos um link para redefinir sua senha em:
                  </p>
                  <p className="text-[#1e4976] font-semibold text-sm break-all mt-2 px-2">{email}</p>
                </div>
              </div>
              <div className="bg-blue-50 rounded-xl px-4 py-3 border border-blue-100">
                <p className="text-xs text-gray-700">
                  Verifique sua caixa de entrada (e a pasta de spam). Clique no link para criar uma nova senha.
                </p>
              </div>
              <button
                onClick={handleClose}
                className="w-full py-2.5 bg-[#1e4976] hover:bg-[#163a5f] text-white rounded-xl font-medium text-sm transition-colors"
              >
                Entendi
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Email *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#1e4976] focus:ring-2 focus:ring-[#1e4976]/10 transition-all"
                  required
                  disabled={enviando}
                />
              </div>
              {erro && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                  <p className="text-xs text-red-600">{erro}</p>
                </div>
              )}
              <button
                type="submit"
                disabled={enviando}
                className="w-full py-2.5 bg-gradient-to-r from-[#2c5aa0] via-[#1e4976] to-[#163a5f] hover:from-[#1e4976] hover:via-[#163a5f] hover:to-[#0f2847] text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {enviando ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar link de redefinição'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
