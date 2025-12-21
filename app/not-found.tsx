'use client'

import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-brand-clean dark:bg-brand-midnight flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-brand-royal rounded-xl shadow-lg p-6 border border-gray-200 dark:border-white/10 text-center">
        <h2 className="text-2xl font-bold text-brand-midnight dark:text-brand-clean mb-4">
          Página não encontrada
        </h2>
        <p className="text-gray-600 dark:text-brand-clean/70 mb-6">
          A página que você está procurando não existe.
        </p>
        <Link
          href="/home"
          className="inline-block px-4 py-2 bg-brand-aqua text-brand-midnight rounded-lg font-semibold hover:bg-brand-aqua/90 transition-smooth"
        >
          Voltar para Home
        </Link>
      </div>
    </div>
  )
}

















