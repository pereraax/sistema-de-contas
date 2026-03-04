'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2, KeyRound } from 'lucide-react'
import Link from 'next/link'

function RedefinirSenhaContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [erro, setErro] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [salvando, setSalvando] = useState(false)

  // Processar hash, token_hash ou code ao montar (vários formatos do Supabase)
  useEffect(() => {
    const processarAuth = async () => {
      const supabase = createClient()

      // 1. Verificar hash (#access_token) PRIMEIRO - fluxo implícito (hash não vem no request, só no client)
      const hash = typeof window !== 'undefined' ? window.location.hash : ''
      if (hash && hash.includes('access_token')) {
        const hashParams = new URLSearchParams(hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        if (accessToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          })
          if (!error) {
            window.history.replaceState(null, '', window.location.pathname + window.location.search)
            setStatus('ready')
            return
          }
        }
      }

      // 2. Verificar code na query (fluxo PKCE) - Supabase recovery usa isso
      const code = searchParams?.get('code')
      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error && data?.session) {
          setStatus('ready')
          return
        }
        // Fallback: tentar verifyOtp com code como token_hash (alguns fluxos usam isso)
        const { data: otpData, error: otpError } = await supabase.auth.verifyOtp({
          type: 'recovery',
          token_hash: code,
        })
        if (!otpError && otpData?.session) {
          setStatus('ready')
          return
        }
      }

      // 3. Verificar token_hash na query
      const tokenHash = searchParams?.get('token_hash')
      const type = searchParams?.get('type') || 'recovery'
      if (tokenHash) {
        const { data, error } = await supabase.auth.verifyOtp({
          type: type as 'recovery',
          token_hash: tokenHash,
        })
        if (!error && data?.session) {
          setStatus('ready')
          return
        }
      }

      // 4. Verificar token na query (formato alternativo)
      const token = searchParams?.get('token')
      if (token) {
        const { data, error } = await supabase.auth.verifyOtp({
          type: 'recovery',
          token_hash: token,
        })
        if (!error && data?.session) {
          setStatus('ready')
          return
        }
      }

      // 5. Verificar se já tem sessão
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setStatus('ready')
        return
      }

      setErro('Link inválido ou expirado. Solicite um novo link de redefinição.')
      setStatus('error')
    }

    processarAuth()
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    if (senha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (senha !== confirmarSenha) {
      setErro('As senhas não coincidem.')
      return
    }

    setSalvando(true)
    try {
      const supabase = createClient()
      const { data: { user }, error } = await supabase.auth.updateUser({ password: senha })
      if (error) {
        setErro(error.message || 'Erro ao atualizar senha.')
        setSalvando(false)
        return
      }
      if (user?.id) {
        await supabase.from('profiles').update({ precisa_definir_senha: false, updated_at: new Date().toISOString() }).eq('id', user.id)
      }
      router.push('/login?mensagem=' + encodeURIComponent('Senha alterada! Faça login com sua nova senha.'))
    } catch (err) {
      setErro('Erro inesperado. Tente novamente.')
      setSalvando(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 max-w-sm w-full text-center">
          <Loader2 className="w-12 h-12 text-[#1e4976] animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Validando seu link...</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 max-w-sm w-full text-center space-y-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <KeyRound size={32} className="text-red-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Link inválido</h1>
            <p className="text-gray-600 text-sm">{erro}</p>
          </div>
          <Link
            href="/login"
            className="block w-full py-2.5 bg-[#1e4976] hover:bg-[#163a5f] text-white rounded-xl font-semibold text-sm transition-colors text-center"
          >
            Voltar ao login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8 max-w-md w-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[#1e4976]/10 rounded-xl flex items-center justify-center">
            <KeyRound size={20} className="text-[#1e4976]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Nova senha</h1>
            <p className="text-sm text-gray-500">Digite e confirme sua nova senha</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Nova senha *</label>
            <div className="relative">
              <input
                type={mostrarSenha ? 'text' : 'password'}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full px-3 py-2.5 pr-10 bg-white border border-gray-200 rounded-xl text-base focus:outline-none focus:border-[#1e4976] focus:ring-2 focus:ring-[#1e4976]/10"
                required
                minLength={6}
                disabled={salvando}
              />
              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#1e4976]"
              >
                {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Confirmar senha *</label>
            <input
              type={mostrarSenha ? 'text' : 'password'}
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              placeholder="Repita a senha"
              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-base focus:outline-none focus:border-[#1e4976] focus:ring-2 focus:ring-[#1e4976]/10"
              required
              disabled={salvando}
            />
          </div>
          {erro && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-xs text-red-600">{erro}</p>
            </div>
          )}
          <button
            type="submit"
            disabled={salvando}
            className="w-full py-2.5 bg-gradient-to-r from-[#2c5aa0] via-[#1e4976] to-[#163a5f] hover:from-[#1e4976] text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {salvando ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </>
            ) : (
              'Redefinir senha'
            )}
          </button>
        </form>
        <p className="text-center text-xs text-gray-500 mt-4">
          <Link href="/login" className="text-[#1e4976] hover:underline">
            Voltar ao login
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function RedefinirSenhaPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 text-[#1e4976] animate-spin" />
      </div>
    }>
      <RedefinirSenhaContent />
    </Suspense>
  )
}
