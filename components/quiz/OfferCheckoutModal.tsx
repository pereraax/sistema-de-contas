'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Shield,
  ShoppingCart,
  CreditCard,
  Smartphone,
  Loader2,
  Info,
  Headphones,
  Copy,
  QrCode,
  CheckCircle,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { createNotification } from '@/components/NotificationBell'
import logoTipoFundoClaro from '@/assets/fundo claro.png'
import type { QRCodeToDataURLOptions } from 'qrcode'

const SOFT_BLUE = '#4F7CFF' // Azul mais suave
const PLANO_ANUAL_VALOR = 29.9

type OfferCheckoutModalProps = {
  open: boolean
  onClose: () => void
}

function formatarCPF(value: string) {
  const cpf = value.replace(/\D/g, '')
  if (cpf.length <= 11) return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  return value
}

function formatarCelular(value: string) {
  const v = value.replace(/\D/g, '')
  if (v.length <= 10) return v.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  return v.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
}

function validarCPF(cpf: string): boolean {
  const cpfLimpo = cpf.replace(/\D/g, '')
  if (cpfLimpo.length !== 11) return false
  if (/^(\d)\1{10}$/.test(cpfLimpo)) return false
  let soma = 0
  let resto
  for (let i = 1; i <= 9; i++) soma += parseInt(cpfLimpo.substring(i - 1, i)) * (11 - i)
  resto = (soma * 10) % 11
  if (resto === 10 || resto === 11) resto = 0
  if (resto !== parseInt(cpfLimpo.substring(9, 10))) return false
  soma = 0
  for (let i = 1; i <= 10; i++) soma += parseInt(cpfLimpo.substring(i - 1, i)) * (12 - i)
  resto = (soma * 10) % 11
  if (resto === 10 || resto === 11) resto = 0
  if (resto !== parseInt(cpfLimpo.substring(10, 11))) return false
  return true
}

export function OfferCheckoutModal({ open, onClose }: OfferCheckoutModalProps) {
  const [loading, setLoading] = useState(false)
  const [loadingAuth, setLoadingAuth] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    celular: '',
    cpf: '',
    cupom: '',
    metodoPagamento: 'PIX' as 'PIX' | 'CREDIT_CARD',
  })
  const [step, setStep] = useState<'form' | 'pix'>('form')
  const [pixData, setPixData] = useState<{
    pixQrCode?: string | null
    pixCopyPaste?: string | null
    subscriptionId: string
    paymentId?: string | null
  } | null>(null)
  const [pixCopied, setPixCopied] = useState(false)
  const [pixLoading, setPixLoading] = useState(false)
  const [paymentCompleted, setPaymentCompleted] = useState(false)
  const [pixTimeout, setPixTimeout] = useState(false)
  const [manualCheckLoading, setManualCheckLoading] = useState(false)
  const [manualCheckNote, setManualCheckNote] = useState<string | null>(null)
  /** Erro do último checkout (API); mensagem vinda do servidor + dica de diagnóstico */
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  // Gera QR em cima do payload (pixCopyPaste) para garantir "escaneabilidade" no app do banco.
  const [generatedPixQrCode, setGeneratedPixQrCode] = useState<string | null>(null)

  const checkAuth = useCallback(async () => {
    if (!open) return
    setLoadingAuth(true)
    try {
      const supabase = createClient()
      const { data: { user: u } } = await supabase.auth.getUser()
      setUser(u)
      if (u) {
        const { data: p } = await supabase.from('profiles').select('*').eq('id', u.id).single()
        setProfile(p)
        setFormData((prev) => ({
          ...prev,
          nome: p?.nome || u.user_metadata?.full_name || u.email?.split('@')[0] || '',
          email: p?.email || u.email || '',
          celular: p?.whatsapp ? formatarCelular(p.whatsapp) : '',
          cpf: p?.cpf ? formatarCPF(p.cpf) : '',
        }))
      } else {
        setFormData({ nome: '', email: '', celular: '', cpf: '', cupom: '', metodoPagamento: 'PIX' })
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingAuth(false)
    }
  }, [open])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    if (!open) {
      setStep('form')
      setPixData(null)
      setPaymentCompleted(false)
      setPixTimeout(false)
      setManualCheckLoading(false)
      setManualCheckNote(null)
      setGeneratedPixQrCode(null)
      setCheckoutError(null)
    }
  }, [open])

  // Timeout: se após 40s no step PIX ainda não tiver QR, mostrar opção de voltar
  useEffect(() => {
    if (step !== 'pix' || pixData?.pixQrCode || pixData?.pixCopyPaste || paymentCompleted) return
    const t = setTimeout(() => setPixTimeout(true), 40000)
    return () => clearTimeout(t)
  }, [step, pixData?.pixQrCode, pixData?.pixCopyPaste, paymentCompleted])

  // Buscar QR Code PIX quando a assinatura foi criada mas o QR não veio na resposta (Asaas pode demorar)
  useEffect(() => {
    if (step !== 'pix' || !pixData?.subscriptionId) return
    const hasQr = pixData.pixQrCode || pixData.pixCopyPaste
    if (hasQr) return

    let cancelled = false
    setPixLoading(true)
    const fetchQr = async () => {
      try {
        const res = await fetch(`/api/pagamento/pix-guest?subscriptionId=${encodeURIComponent(pixData.subscriptionId)}`)
        const data = await res.json()
        if (cancelled) return
        if (data.success && (data.pixQrCode || data.pixCopyPaste)) {
          setPixData((prev) => prev ? { ...prev, pixQrCode: data.pixQrCode ?? undefined, pixCopyPaste: data.pixCopyPaste ?? undefined, paymentId: data.paymentId ?? prev.paymentId } : null)
          setPixLoading(false)
        }
      } catch {
        if (!cancelled) setPixLoading(false)
      }
    }
    fetchQr()
    const t = setInterval(fetchQr, 2500)
    return () => {
      cancelled = true
      clearInterval(t)
      setPixLoading(false)
    }
  }, [step, pixData?.subscriptionId, pixData?.pixQrCode, pixData?.pixCopyPaste])

  // Só gera QR no cliente se o Asaas não enviar imagem: o PNG oficial do Asaas é a forma mais segura para o banco ler.
  useEffect(() => {
    if (step !== 'pix') return
    if (pixData?.pixQrCode) {
      setGeneratedPixQrCode(null)
      return
    }
    const payload = (pixData?.pixCopyPaste ?? '').toString().replace(/\s+/g, '').trim()
    if (!payload) {
      setGeneratedPixQrCode(null)
      return
    }

    let cancelled = false
    setGeneratedPixQrCode(null)

    const run = async () => {
      try {
        const qrcodeMod = await import('qrcode')
        const QR = qrcodeMod?.default ?? qrcodeMod
        // Escaneabilidade: mais resolução + margem pequena.
        const opts: QRCodeToDataURLOptions = {
          margin: 2,
          // `width` é mais confiável pra renderizar bem em telas diferentes
          width: 512,
          errorCorrectionLevel: 'M',
          type: 'image/png',
        } as any
        const dataUrl = await QR.toDataURL(payload, opts)
        if (!cancelled) setGeneratedPixQrCode(dataUrl)
      } catch {
        // Se falhar, volta a usar a imagem base64/href que o Asaas devolveu.
        if (!cancelled) setGeneratedPixQrCode(null)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [step, pixData?.pixCopyPaste, pixData?.pixQrCode])

  // Polling status do PIX (guest): verificação imediata + a cada 1s (webhook Asaas deixa instantâneo)
  useEffect(() => {
    if (step !== 'pix' || !pixData?.subscriptionId || paymentCompleted) return
    const subId = pixData.subscriptionId
      const check = async () => {
      try {
        const pixProvider = (process.env.NEXT_PUBLIC_PIX_PROVIDER || '').toLowerCase()
        const pid = pixData?.paymentId ? `&paymentId=${encodeURIComponent(String(pixData.paymentId))}` : ''
        const url = pixProvider === 'woovi'
          ? `/api/pagamento/woovi/status-guest?chargeId=${encodeURIComponent(subId)}&t=${Date.now()}`
          : `/api/pagamento/status-guest?subscriptionId=${encodeURIComponent(subId)}${pid}&t=${Date.now()}`
        const res = await fetch(url, { cache: 'no-store', credentials: 'same-origin' })
        const data = await res.json().catch(() => ({}))
        if (data?.pago === true) {
          setPaymentCompleted(true)
            setPixLoading(false)
        }
      } catch {
        // silencioso
      }
    }
    check()
    const t = setInterval(check, 1000)
    return () => clearInterval(t)
  }, [step, pixData?.subscriptionId, paymentCompleted])

  const checkPaymentNow = useCallback(async () => {
    if (!pixData?.subscriptionId || paymentCompleted) return
    setManualCheckLoading(true)
    setManualCheckNote(null)
    try {
      const pixProvider = (process.env.NEXT_PUBLIC_PIX_PROVIDER || '').toLowerCase()
      const pid = pixData?.paymentId ? `&paymentId=${encodeURIComponent(String(pixData.paymentId))}` : ''
      const url = pixProvider === 'woovi'
        ? `/api/pagamento/woovi/status-guest?chargeId=${encodeURIComponent(pixData.subscriptionId)}&t=${Date.now()}`
        : `/api/pagamento/status-guest?subscriptionId=${encodeURIComponent(pixData.subscriptionId)}${pid}&t=${Date.now()}`
      const res = await fetch(url, { cache: 'no-store', credentials: 'same-origin' })
      const data = await res.json().catch(() => ({}))
      if (data?.pago === true) {
        setPaymentCompleted(true)
        createNotification('Pagamento confirmado!', 'success')
        setManualCheckNote('Pagamento confirmado! Se tudo estiver certo, você já deve receber o e-mail de acesso.')
      } else {
        const status = data?.paymentStatus ? String(data.paymentStatus) : ''
        const msg = status
          ? `Ainda não confirmou (status: ${status}). Aguarde alguns segundos e toque em "Já paguei" novamente.`
          : 'Ainda não confirmou. Aguarde alguns segundos e toque em "Já paguei" novamente.'
        createNotification(msg, 'warning')
        setManualCheckNote(msg)
      }
    } catch {
      createNotification('Não consegui verificar agora. Tente novamente em instantes.', 'warning')
      setManualCheckNote('Não consegui verificar agora. Tente novamente em instantes.')
    } finally {
      setManualCheckLoading(false)
    }
  }, [pixData?.subscriptionId, pixData?.paymentId, paymentCompleted])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nome.trim()) {
      createNotification('Preencha seu nome', 'warning')
      return
    }
    if (!formData.email.trim()) {
      createNotification('Preencha seu e-mail', 'warning')
      return
    }
    const cpfLimpo = formData.cpf.replace(/\D/g, '')
    if (cpfLimpo.length !== 11 || !validarCPF(formData.cpf)) {
      createNotification('CPF inválido', 'warning')
      return
    }

    setLoading(true)
    setCheckoutError(null)
    try {
      const pixProvider = (process.env.NEXT_PUBLIC_PIX_PROVIDER || '').toLowerCase()
      const checkoutUrl = (formData.metodoPagamento === 'PIX' && pixProvider === 'woovi')
        ? '/api/pagamento/woovi/checkout-guest'
        : '/api/pagamento/checkout-guest'

      const res = await fetch(checkoutUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: formData.nome.trim(),
          email: formData.email.trim(),
          celular: formData.celular.replace(/\D/g, ''),
          cpf: cpfLimpo,
          metodoPagamento: formData.metodoPagamento,
        }),
      })
      const text = await res.text()
      let data: { success?: boolean; error?: string; subscriptionId?: string; metodoPagamento?: string; pixQrCode?: string; pixCopyPaste?: string; paymentUrl?: string; paymentId?: string | null } = {}
      try {
        data = JSON.parse(text)
      } catch {
        data = { error: res.ok ? 'Resposta inválida' : `Erro do servidor (${res.status}). Verifique as variáveis ASAAS no Railway.` }
      }

      if (!res.ok) {
        throw new Error(data.error || `Erro ${res.status} ao processar o pagamento.`)
      }
      const metodo = String(data.metodoPagamento || formData.metodoPagamento || '').toUpperCase().trim()
      const isPix = metodo === 'PIX'
      const subId = data.subscriptionId || (data as any).chargeId
      if (isPix && subId) {
        const hasQr = !!(data.pixQrCode || data.pixCopyPaste)
        setPixData({
          pixQrCode: data.pixQrCode ?? null,
          pixCopyPaste: data.pixCopyPaste ?? null,
          subscriptionId: subId,
          paymentId: data.paymentId ?? null,
        })
        setStep('pix')
        setPixTimeout(false)
        setPaymentCompleted(false)
        setManualCheckNote(null)
        setPixLoading(!hasQr)
        setLoading(false)
        return
      }
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl
        return
      }
      createNotification('Checkout realizado!', 'success')
      onClose()
    } catch (err: any) {
      const msg = err.message || 'Erro ao processar pagamento'
      setCheckoutError(msg)
      createNotification(msg, 'warning')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'tween', duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
          className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl"
          style={{ color: '#0f172a' }}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 z-10 rounded-full p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Header */}
          <div
            className="rounded-t-2xl px-4 py-5 text-white"
            style={{ backgroundColor: SOFT_BLUE }}
          >
            <div className="flex items-center justify-center gap-3">
              <Image
                src={logoTipoFundoClaro}
                alt="Plenipay"
                width={120}
                height={32}
                className="h-8 w-auto object-contain brightness-0 invert"
                unoptimized
              />
              <span className="font-semibold text-sm sm:text-base">Plenipay – Assistente Financeiro</span>
            </div>
            <button
              type="button"
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-2.5 text-sm font-medium text-slate-800"
            >
              <Shield className="h-4 w-4" style={{ color: SOFT_BLUE }} />
              Compra segura
            </button>
          </div>

          {loadingAuth ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin" style={{ color: SOFT_BLUE }} />
            </div>
          ) : paymentCompleted ? (
            <div className="p-8 text-center space-y-4">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: `${SOFT_BLUE}20` }}>
                <CheckCircle className="h-10 w-10" style={{ color: SOFT_BLUE }} />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Pagamento concluído</h3>
              <p className="text-sm text-slate-600">
                Enviamos um e-mail para você com o link de acesso. Acesse sua conta em <strong>plenipay.com</strong> e utilize todos os benefícios.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-xl py-3.5 text-base font-semibold text-white mt-4"
                style={{ backgroundColor: SOFT_BLUE }}
              >
                Fechar
              </button>
            </div>
          ) : step === 'pix' && pixData ? (
            <>
              <div className="p-4 space-y-4">
                <div className="text-center">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full mb-3" style={{ backgroundColor: `${SOFT_BLUE}20` }}>
                    <QrCode className="h-6 w-6" style={{ color: SOFT_BLUE }} />
                  </div>
                  <h3 className="font-semibold text-slate-800">Pague com PIX</h3>
                  <p className="text-sm text-slate-500 mt-1">Escaneie o QR Code ou copie o código no app do seu banco</p>
                </div>
                {pixTimeout && !pixData.pixQrCode && !pixData.pixCopyPaste ? (
                  <div className="flex flex-col items-center justify-center py-6 space-y-3">
                    <p className="text-sm text-slate-600 text-center">O QR Code está demorando mais que o esperado.</p>
                    <p className="text-xs text-slate-500 text-center">Verifique sua conexão ou tente novamente em instantes. Você também pode voltar e escolher pagamento com cartão.</p>
                    <button
                      type="button"
                      onClick={() => { setStep('form'); setPixData(null); setPixTimeout(false); setPixLoading(false); }}
                      className="rounded-xl py-2.5 px-4 text-sm font-medium border border-slate-300 text-slate-700 hover:bg-slate-50"
                    >
                      Voltar e tentar outra forma
                    </button>
                  </div>
                ) : (!pixData.pixQrCode && !pixData.pixCopyPaste) || pixLoading ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Loader2 className="h-10 w-10 animate-spin mb-3" style={{ color: SOFT_BLUE }} />
                    <p className="text-sm text-slate-600">Gerando QR Code PIX...</p>
                    <p className="text-xs text-slate-500 mt-1">Aguarde alguns segundos</p>
                  </div>
                ) : (
                  <>
                    {(pixData.pixQrCode || generatedPixQrCode) && (
                      <div className="flex justify-center bg-white p-4 rounded-xl border border-slate-200">
                        <img
                          src={
                            pixData.pixQrCode
                              ? pixData.pixQrCode.startsWith('data:')
                                ? pixData.pixQrCode
                                : pixData.pixQrCode.startsWith('http')
                                  ? pixData.pixQrCode
                                  : `data:image/png;base64,${pixData.pixQrCode.replace(/^\s*=+/, '')}`
                              : (generatedPixQrCode ?? '')
                          }
                          alt="QR Code PIX"
                          className="w-80 h-80 object-contain"
                        />
                      </div>
                    )}
                    {pixData.pixCopyPaste && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Código PIX (copiar e colar)</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            readOnly
                            value={String(pixData.pixCopyPaste).replace(/\s+/g, '').trim()}
                            className="flex-1 rounded-lg border border-slate-200 px-3 py-2.5 text-xs text-slate-600 bg-slate-50"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (pixData.pixCopyPaste) {
                                navigator.clipboard.writeText(
                                  String(pixData.pixCopyPaste).replace(/\s+/g, '').trim()
                                )
                                setPixCopied(true)
                                createNotification('Código copiado!', 'success')
                                setTimeout(() => setPixCopied(false), 2000)
                              }
                            }}
                            className="rounded-lg px-4 py-2.5 flex items-center gap-2 text-sm font-medium text-white shrink-0"
                            style={{ backgroundColor: SOFT_BLUE }}
                          >
                            <Copy className="h-4 w-4" />
                            {pixCopied ? 'Copiado!' : 'Copiar'}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
                <p className="text-center text-xs text-slate-500">
                  Após o pagamento, seu acesso será liberado em instantes. Você receberá um e-mail de boas-vindas.
                </p>
                <button
                  type="button"
                  onClick={checkPaymentNow}
                  disabled={manualCheckLoading || paymentCompleted}
                  className="w-full rounded-xl py-3 text-sm font-semibold border border-slate-200 text-slate-800 bg-white hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {manualCheckLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    'Já paguei'
                  )}
                </button>
                {manualCheckNote && (
                  <p className="text-center text-xs text-slate-600">
                    {manualCheckNote}
                  </p>
                )}
                <p className="text-center text-xs mt-2 flex items-center justify-center gap-1.5" style={{ color: SOFT_BLUE }}>
                  <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                  Verificando pagamento...
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Resumo */}
              <div
                className="mx-4 mt-4 rounded-xl px-4 py-4 text-white"
                style={{ backgroundColor: SOFT_BLUE }}
              >
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    Assinatura
                  </span>
                  <span>R$ {PLANO_ANUAL_VALOR.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="mt-3 flex justify-between border-t border-white/30 pt-3 font-bold">
                  <span>TOTAL</span>
                  <span>R$ {PLANO_ANUAL_VALOR.toFixed(2).replace('.', ',')}</span>
                </div>
                <p className="mt-1 text-xs opacity-85">Cobrado anualmente. Renovação automática.</p>
              </div>

              <form onSubmit={handleSubmit} className="p-4 space-y-4">
                <p className="text-center text-xs text-slate-500">
                  Preencha seus dados e pague. O e-mail informado será seu login para acessar a plataforma.
                </p>
                <h3 className="text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Seus dados
                </h3>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Nome *</label>
                  <input
                    type="text"
                    required
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-slate-900 placeholder-slate-400 focus:border-[#4F7CFF] focus:outline-none focus:ring-2 focus:ring-[#4F7CFF]/20"
                    placeholder="Nome e sobrenome"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">E-mail *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-slate-900 placeholder-slate-400 focus:border-[#4F7CFF] focus:outline-none focus:ring-2 focus:ring-[#4F7CFF]/20"
                    placeholder="seu@email.com"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Celular (WhatsApp) *</label>
                  <input
                    type="tel"
                    value={formData.celular}
                    onChange={(e) => setFormData({ ...formData, celular: formatarCelular(e.target.value) })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-slate-900 placeholder-slate-400 focus:border-[#4F7CFF] focus:outline-none focus:ring-2 focus:ring-[#4F7CFF]/20"
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">CPF *</label>
                  <input
                    type="text"
                    required
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: formatarCPF(e.target.value) })}
                    maxLength={14}
                    placeholder="000.000.000-00"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-slate-900 placeholder-slate-400 focus:border-[#4F7CFF] focus:outline-none focus:ring-2 focus:ring-[#4F7CFF]/20"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Cupom (opcional)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.cupom}
                      onChange={(e) => setFormData({ ...formData, cupom: e.target.value })}
                      placeholder="Código do cupom"
                      className="flex-1 rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-[#4F7CFF] focus:outline-none focus:ring-2 focus:ring-[#4F7CFF]/20"
                    />
                    <button type="button" className="rounded-lg px-4 py-2.5 text-sm font-medium text-white" style={{ backgroundColor: SOFT_BLUE }}>
                      Aplicar
                    </button>
                  </div>
                </div>

                <h3 className="pt-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Método de pagamento
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, metodoPagamento: 'PIX' })}
                    className={`flex items-center justify-center gap-2 rounded-xl border-2 py-3 transition-all ${
                      formData.metodoPagamento === 'PIX'
                        ? 'border-current bg-opacity-10 text-white'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                    style={formData.metodoPagamento === 'PIX' ? { borderColor: SOFT_BLUE, backgroundColor: `${SOFT_BLUE}20`, color: SOFT_BLUE } : {}}
                  >
                    <Smartphone className="h-5 w-5" />
                    <span className="text-sm font-medium">PIX</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, metodoPagamento: 'CREDIT_CARD' })}
                    className={`flex items-center justify-center gap-2 rounded-xl border-2 py-3 transition-all ${
                      formData.metodoPagamento === 'CREDIT_CARD'
                        ? 'border-current bg-opacity-10'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                    style={formData.metodoPagamento === 'CREDIT_CARD' ? { borderColor: SOFT_BLUE, backgroundColor: `${SOFT_BLUE}20`, color: SOFT_BLUE } : {}}
                  >
                    <CreditCard className="h-5 w-5" />
                    <span className="text-sm font-medium">Cartão</span>
                  </button>
                </div>

                <div className="flex gap-2 rounded-lg bg-slate-100 p-3 text-sm text-slate-600">
                  <Info className="h-5 w-5 shrink-0 text-slate-500" />
                  <ul className="list-inside list-disc space-y-0.5 text-xs">
                    <li>Pagamento à vista.</li>
                    <li>Liberação após confirmação do pagamento.</li>
                    <li>Preencha o WhatsApp para receber o acesso.</li>
                  </ul>
                </div>

                {checkoutError && (
                  <div
                    role="alert"
                    className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950 space-y-2"
                  >
                    <p className="font-semibold text-amber-900">Não foi possível iniciar o pagamento</p>
                    <p className="text-amber-900/90 whitespace-pre-wrap break-words">{checkoutError}</p>
                    <ul className="list-disc list-inside text-amber-900/85 space-y-1">
                      <li>
                        Chave <code className="rounded bg-amber-100/80 px-1">hmlg</code> → URL{' '}
                        <code className="rounded bg-amber-100/80 px-1">api-sandbox.asaas.com/v3</code>
                      </li>
                      <li>
                        Chave <code className="rounded bg-amber-100/80 px-1">prod</code> → URL{' '}
                        <code className="rounded bg-amber-100/80 px-1">api.asaas.com/v3</code>
                      </li>
                      <li>Depois de mudar o .env, reinicie o servidor (<code className="rounded bg-amber-100/80 px-1">npm run dev</code>).</li>
                    </ul>
                    <p className="text-[11px] text-amber-800/90">
                      Diagnóstico: abra{' '}
                      <a
                        href="/api/pagamento/asaas-health"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium underline underline-offset-2"
                      >
                        /api/pagamento/asaas-health
                      </a>{' '}
                      no navegador. Guia completo no projeto:{' '}
                      <code className="rounded bg-amber-100/80 px-1">docs/CHECKOUT-PIX-ASAAS-SIMPLES.md</code>
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl py-4 text-base font-bold text-white disabled:opacity-70"
                  style={{ backgroundColor: SOFT_BLUE }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Processando...
                    </span>
                  ) : (
                    'Assinar agora'
                  )}
                </button>
                <a
                  href="/suporte"
                  className="flex items-center justify-center gap-2 py-2 text-sm text-slate-500 hover:text-slate-700"
                >
                  <Headphones className="h-4 w-4" />
                  Atendimento
                </a>
              </form>
            </>
          )}

          <div className="rounded-b-2xl px-4 py-3 text-center text-xs text-slate-400" style={{ backgroundColor: `${SOFT_BLUE}12` }}>
            Pagamento seguro · Dados protegidos
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
