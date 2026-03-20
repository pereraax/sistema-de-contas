/* eslint-disable react/no-unescaped-entities */
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { CheckCircle, Loader2, MessageCircle, X } from 'lucide-react'
import { createNotification } from '@/components/NotificationBell'

type CaptureEmailPhone = {
  email: string
  celularDigits: string
  celularFormatted: string
  nome: string
}

type PreCheckoutCaptureModalProps = {
  open: boolean
  onClose: () => void
  onContinue: (data: CaptureEmailPhone) => void
}

function formatarCelularBr(v: string): string {
  const digits = String(v || '').replace(/\D/g, '')
  const normalized = digits.length === 13 && digits.startsWith('55') ? digits.slice(2) : digits

  if (normalized.length <= 10) {
    // 10 dígitos (DDD + 8)
    return normalized.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }
  // 11 dígitos (DDD + 9)
  return normalized.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
}

function normalizeEmail(e: string): string {
  return String(e || '').trim().toLowerCase()
}

function isEmailLike(v: string): boolean {
  return !!v && v.includes('@') && v.includes('.')
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full bg-white/80 animate-[bounce_1s_infinite]" />
      <span className="h-2 w-2 rounded-full bg-white/80 animate-[bounce_1s_infinite] [animation-delay:120ms]" />
      <span className="h-2 w-2 rounded-full bg-white/80 animate-[bounce_1s_infinite] [animation-delay:240ms]" />
      <span className="sr-only">Digitando...</span>
    </div>
  )
}

export function PreCheckoutCaptureModal({ open, onClose, onContinue }: PreCheckoutCaptureModalProps) {
  const [stage, setStage] = useState<'start' | 'email' | 'phone' | 'done'>('start')
  const [typing, setTyping] = useState(false)
  const [busy, setBusy] = useState(false)
  const [errorText, setErrorText] = useState<string | null>(null)

  const [email, setEmail] = useState('')
  const [emailTouched, setEmailTouched] = useState(false)

  const [celularDigits, setCelularDigits] = useState('')
  const [celTouched, setCelTouched] = useState(false)

  const confettiEmailFired = useRef(false)
  const confettiPhoneFired = useRef(false)

  const celularFormatted = useMemo(() => formatarCelularBr(celularDigits), [celularDigits])

  const nomeAuto = useMemo(() => {
    const local = normalizeEmail(email).split('@')[0] || ''
    const cleaned = local.replace(/[\W_]+/g, ' ').trim()
    const first = cleaned.split(' ').filter(Boolean)[0] || 'Assinante'
    const cap = first.charAt(0).toUpperCase() + first.slice(1)
    return cap || 'Assinante'
  }, [email])

  useEffect(() => {
    if (!open) return
    setStage('start')
    setTyping(false)
    setBusy(false)
    setErrorText(null)
    setEmail('')
    setEmailTouched(false)
    setCelularDigits('')
    setCelTouched(false)
    confettiEmailFired.current = false
    confettiPhoneFired.current = false
  }, [open])

  const fireConfetti = (kind: 'email' | 'phone') => {
    if (kind === 'email' && confettiEmailFired.current) return
    if (kind === 'phone' && confettiPhoneFired.current) return

    if (kind === 'email') confettiEmailFired.current = true
    if (kind === 'phone') confettiPhoneFired.current = true

    const duration = 2400
    const end = Date.now() + duration
    const colors = ['#1e4976', '#163a5f', '#2c5aa0', '#ffffff', '#4f7cff', '#22c55e']

    const frame = () => {
      confetti({
        particleCount: 8,
        angle: 65,
        spread: 55,
        origin: { x: 0.2, y: 0.9 },
        colors,
      })
      confetti({
        particleCount: 8,
        angle: 115,
        spread: 55,
        origin: { x: 0.8, y: 0.9 },
        colors,
      })

      if (Date.now() < end) requestAnimationFrame(frame)
    }

    setTimeout(() => frame(), 200)
  }

  const assistantTextStart =
    'já vou te dar um super presente que você já vai poder utilizar quando acessar a assistente'
  const assistantAskEmail = 'perfeito agora me diga seu email que vai acessar...'
  const assistantAskPhone = 'perfeito agora me diga seu número...'
  const assistantDone = 'pronto, você está registrado, continue para começar a organizar sua vida financeira'

  const canContinueEmail = isEmailLike(email)
  const canContinuePhone = celularDigits.replace(/\D/g, '').length >= 10

  const handleRegisterAndContinue = async () => {
    if (busy) return
    setBusy(true)
    setErrorText(null)

    try {
      const payload = {
        email: normalizeEmail(email),
        celularDigits: celularDigits.replace(/\D/g, ''),
        nome: nomeAuto,
      }

      const res = await fetch('/api/auth/precheckout-create-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok || data?.success !== true) {
        const msg = data?.error || 'Erro ao criar sua conta. Tente novamente.'
        setErrorText(msg)
        createNotification(msg, 'warning')
        return
      }

      onContinue({
        email: payload.email,
        celularDigits: payload.celularDigits,
        celularFormatted,
        nome: nomeAuto,
      })
    } catch (e: any) {
      const msg = e?.message || 'Erro inesperado ao criar conta.'
      setErrorText(msg)
      createNotification(msg, 'warning')
    } finally {
      setBusy(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      <motion.div
        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.28 }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-full p-2 text-slate-500 hover:bg-slate-100"
          aria-label="Fechar"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-4 pt-10 pb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#4F7CFF]/15">
              <MessageCircle className="h-5 w-5 text-[#4F7CFF]" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900">Receber o presente</div>
              <div className="text-xs text-slate-500">Etapa rápida antes do checkout</div>
            </div>
          </div>

          <div className="space-y-3">
            {/* Assistant bubble */}
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl bg-[#1e4976] text-white px-4 py-3 shadow-sm">
                <div className="text-sm leading-relaxed whitespace-pre-line">{assistantTextStart}</div>
              </div>
            </div>

            {stage === 'start' && (
              <div className="flex items-center justify-center pt-1">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    if (busy) return
                    setBusy(false)
                    setTyping(true)
                    setTimeout(() => {
                      setTyping(false)
                      setStage('email')
                    }, 850)
                  }}
                  className="w-full rounded-xl py-3.5 text-sm font-semibold text-white"
                  style={{ backgroundColor: '#4F7CFF' }}
                >
                  Quero receber
                </button>
              </div>
            )}

            {typing && stage !== 'done' && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl bg-slate-800 text-white px-4 py-3 shadow-sm border border-white/10">
                  <TypingDots />
                </div>
              </div>
            )}

            {stage === 'email' && (
              <>
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl bg-slate-800 text-white px-4 py-3 shadow-sm border border-white/10">
                    <div className="text-sm leading-relaxed whitespace-pre-line">{assistantAskEmail}</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-slate-700">Seu e-mail *</label>
                  <input
                    type="email"
                    value={email}
                    onBlur={() => setEmailTouched(true)}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-slate-900 placeholder-slate-400 focus:border-[#4F7CFF] focus:outline-none focus:ring-2 focus:ring-[#4F7CFF]/20"
                  />
                  {emailTouched && !canContinueEmail && <p className="text-xs text-amber-600">Digite um e-mail válido.</p>}

                  <button
                    type="button"
                    disabled={!canContinueEmail || busy}
                    onClick={() => {
                      setTyping(true)
                      setEmailTouched(true)
                      setTimeout(() => {
                        setTyping(false)
                        fireConfetti('email')
                        setStage('phone')
                      }, 850)
                    }}
                    className="w-full rounded-xl py-3 text-sm font-semibold text-white"
                    style={{ backgroundColor: '#4F7CFF' }}
                  >
                    Confirmar e-mail
                  </button>
                </div>
              </>
            )}

            {stage === 'phone' && (
              <>
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl bg-slate-800 text-white px-4 py-3 shadow-sm border border-white/10">
                    <div className="text-sm leading-relaxed whitespace-pre-line">{assistantAskPhone}</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-slate-700">Seu número *</label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={celularFormatted}
                    onBlur={() => setCelTouched(true)}
                    onChange={(e) => {
                      const digits = String(e.target.value || '').replace(/\D/g, '')
                      const normalized = digits.length === 13 && digits.startsWith('55') ? digits.slice(2) : digits
                      setCelularDigits(normalized)
                    }}
                    placeholder="(00) 00000-0000"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-slate-900 placeholder-slate-400 focus:border-[#4F7CFF] focus:outline-none focus:ring-2 focus:ring-[#4F7CFF]/20"
                  />

                  {celTouched && !canContinuePhone && <p className="text-xs text-amber-600">Digite um número com DDD.</p>}

                  <button
                    type="button"
                    disabled={!canContinuePhone || busy}
                    onClick={() => {
                      setTyping(true)
                      setCelTouched(true)
                      setTimeout(() => {
                        setTyping(false)
                        fireConfetti('phone')
                        setStage('done')
                      }, 900)
                    }}
                    className="w-full rounded-xl py-3 text-sm font-semibold text-white"
                    style={{ backgroundColor: '#4F7CFF' }}
                  >
                    Confirmar número
                  </button>
                </div>
              </>
            )}

            {stage === 'done' && (
              <div className="space-y-4 pt-2">
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl bg-[#1e4976] text-white px-4 py-3 shadow-sm">
                    <div className="text-sm leading-relaxed whitespace-pre-line">{assistantDone}</div>
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: '#4F7CFF18' }}>
                    <CheckCircle className="h-7 w-7 text-[#4F7CFF]" />
                  </div>
                </div>

                {errorText && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">
                    {errorText}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleRegisterAndContinue}
                  disabled={busy}
                  className="w-full rounded-xl py-3.5 text-base font-semibold text-white"
                  style={{ backgroundColor: '#4F7CFF' }}
                >
                  {busy ? (
                    <span className="inline-flex items-center gap-2 justify-center">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Criando sua conta...
                    </span>
                  ) : (
                    'Continuar para o checkout'
                  )}
                </button>

                <p className="text-center text-xs text-slate-500">Em seguida, você vai finalizar o pagamento com PIX.</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

