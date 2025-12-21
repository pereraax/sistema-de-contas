import { obterEstatisticas } from '@/lib/actions'

export default async function ResumoGeral() {
  const stats = await obterEstatisticas()

  if (stats.error) {
    return (
      <div className="bg-brand-white rounded-2xl p-6 shadow-lg border border-brand-clean">
        <p className="text-red-600">Erro ao carregar estatísticas</p>
      </div>
    )
  }

  const saldo = (stats.totalEntradas || 0) - (stats.totalSaidas || 0)

  return (
    <div className="space-y-4">
      <div className="bg-brand-white rounded-2xl p-6 shadow-lg border border-brand-clean animate-fade-in">
        <h2 className="text-xl font-display font-bold text-brand-midnight mb-4">
          Resumo Geral
        </h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-brand-midnight dark:text-brand-clean mb-1 font-bold">Total Recebido</p>
            <p className="text-2xl text-green-600" style={{ fontWeight: 900 }}>
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(stats.totalEntradas || 0)}
            </p>
          </div>
          <div>
            <p className="text-sm text-brand-midnight dark:text-brand-clean mb-1 font-bold">Total Gasto</p>
            <p className="text-2xl text-red-600" style={{ fontWeight: 900 }}>
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(stats.totalSaidas || 0)}
            </p>
          </div>
          <div>
            <p className="text-sm text-brand-midnight dark:text-brand-clean mb-1 font-bold">Saldo</p>
            <p
              className={`text-2xl ${
                saldo >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
              style={{ fontWeight: 900 }}
            >
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(saldo)}
            </p>
          </div>
          <div>
            <p className="text-sm text-brand-midnight dark:text-brand-clean mb-1 font-bold">Dívidas Pendentes</p>
            <p className="text-2xl text-orange-600" style={{ fontWeight: 900 }}>
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(stats.totalDividasPendentes || 0)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

