'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogIn, Loader2 } from 'lucide-react'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      console.log('Tentando fazer login...', { email })
      
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      console.log('Resposta recebida:', response.status, response.statusText)

      const data = await response.json()
      console.log('Dados recebidos:', data)

      if (!response.ok) {
        setError(data.error || 'Erro ao fazer login')
        setLoading(false)
        return
      }

      if (!data.token) {
        setError('Token não recebido do servidor')
        setLoading(false)
        return
      }

      // Salvar token admin em cookie
      document.cookie = `admin_token=${data.token}; path=/; max-age=86400; SameSite=Lax; Secure=false` // 24 horas
      console.log('✅ Login bem-sucedido!')
      console.log('Cookie salvo:', document.cookie.includes('admin_token'))
      
      // Aguardar um pouco antes de redirecionar
      await new Promise(resolve => setTimeout(resolve, 200))
      
      // Redirecionar para painel
      window.location.href = '/administracaosecr/dashboard'
    } catch (err: any) {
      console.error('Erro no login:', err)
      setError(err.message || 'Erro ao conectar com o servidor')
      setLoading(false)
    }
  }

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-brand-midnight via-brand-royal to-brand-midnight flex items-center justify-center p-4"
      style={{
        background: 'linear-gradient(to bottom right, #0D1B2A, #1B263B, #0D1B2A)',
        minHeight: '100vh',
        width: '100%',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
    >
      <div className="w-full max-w-md">
        <div 
          className="bg-brand-royal/90 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/10"
          style={{
            backgroundColor: 'rgba(27, 38, 59, 0.9)',
            backdropFilter: 'blur(16px)',
            borderRadius: '1.5rem',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-aqua/20 rounded-2xl mb-4">
              <LogIn size={32} className="text-brand-aqua" />
            </div>
            <h1 
              className="text-3xl font-display font-bold text-brand-clean mb-2"
              style={{ color: '#E6E6E6', fontWeight: 700 }}
            >
              Painel Administrativo
            </h1>
            <p 
              className="font-semibold text-brand-clean/70"
              style={{ color: 'rgba(230, 230, 230, 0.7)', fontWeight: 600 }}
            >
              Acesso restrito ao administrador
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div 
                className="bg-red-900/30 border border-red-800/50 rounded-xl p-4"
                style={{
                  backgroundColor: 'rgba(127, 29, 29, 0.3)',
                  border: '1px solid rgba(153, 27, 27, 0.5)',
                  borderRadius: '0.75rem',
                  padding: '1rem'
                }}
              >
                <p className="text-red-300 text-sm" style={{ color: '#FCA5A5' }}>
                  {error}
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-brand-clean/90 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-brand-midnight border border-white/20 rounded-xl focus:outline-none focus:border-brand-aqua transition-smooth text-brand-clean placeholder-brand-clean/50"
                style={{
                  backgroundColor: '#0D1B2A',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#E6E6E6'
                }}
                placeholder="admin@plenipay.com"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-brand-clean/90 mb-2">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-brand-midnight border border-white/20 rounded-xl focus:outline-none focus:border-brand-aqua transition-smooth text-brand-clean placeholder-brand-clean/50"
                style={{
                  backgroundColor: '#0D1B2A',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#E6E6E6'
                }}
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-brand-aqua text-brand-midnight rounded-xl font-semibold hover:bg-brand-aqua/90 transition-smooth shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: '#00C2FF',
                color: '#0D1B2A'
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  <LogIn size={20} />
                  Entrar
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

