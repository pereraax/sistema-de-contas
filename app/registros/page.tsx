import Sidebar from '@/components/Sidebar'
import { MenuButton } from '@/components/MobileMenu'
import RegistrosLista from '@/components/RegistrosLista'
import NotificationBell from '@/components/NotificationBell'
import UserProfileMenu from '@/components/UserProfileMenu'
import Logo from '@/components/Logo'
import { obterRegistros, obterUsuarios } from '@/lib/actions'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

// Middleware já verifica autenticação, não precisa verificar novamente aqui

async function RegistrosContent({
  searchParams,
}: {
  searchParams: { nome?: string; tipo?: string; user_id?: string; etiqueta?: string; categoria?: string; data_inicio?: string; data_fim?: string } | null
}) {
  const filtros: any = {}
  if (searchParams?.nome) filtros.nome = searchParams.nome
  if (searchParams?.tipo) filtros.tipo = searchParams.tipo
  if (searchParams?.user_id) filtros.user_id = searchParams.user_id
  if (searchParams?.etiqueta) filtros.etiquetas = [searchParams.etiqueta]
  if (searchParams?.categoria) filtros.categoria = searchParams.categoria
  if (searchParams?.data_inicio) filtros.data_inicio = searchParams.data_inicio
  if (searchParams?.data_fim) filtros.data_fim = searchParams.data_fim

  const [registrosResult, usuariosResult] = await Promise.all([
    obterRegistros(filtros),
    obterUsuarios()
  ])

  return (
    <RegistrosLista
      registros={registrosResult.data || []}
      usuarios={usuariosResult.data || []}
      filtrosAtuais={searchParams}
    />
  )
}

export default async function RegistrosPage({
  searchParams,
}: {
  searchParams: { nome?: string; tipo?: string; user_id?: string; etiqueta?: string; categoria?: string; data_inicio?: string; data_fim?: string }
}) {

  return (
    <div className="min-h-screen bg-brand-clean dark:bg-[#1A1A1A]">
      <Sidebar />
      <main className="lg:ml-64 p-3 sm:p-4 lg:p-8 dark:bg-brand-midnight pt-3 sm:pt-4 lg:pt-4">
        <div className="max-w-7xl mx-auto">
          {/* Header: no mobile logo à esquerda do título; headbar compacta */}
          <div className="flex items-center justify-between gap-2 sm:gap-4 py-1 lg:py-0 mb-3 sm:mb-4">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <MenuButton />
              <div className="flex-shrink-0 w-9 h-9 flex items-center justify-center overflow-hidden rounded-lg lg:hidden [&_a]:!p-0 [&_a]:!w-full [&_a]:!h-full [&_img]:!w-full [&_img]:!h-full [&_img]:!object-contain">
                <Logo />
              </div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-display font-bold text-brand-midnight dark:text-brand-clean leading-none truncate min-w-0">
                Todos os Registros
              </h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <NotificationBell />
              <UserProfileMenu />
            </div>
          </div>

          <Suspense fallback={<div className="min-h-[320px] bg-transparent" aria-hidden="true" />}>
            <RegistrosContent searchParams={searchParams} />
          </Suspense>
        </div>
      </main>
    </div>
  )
}

