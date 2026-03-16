'use client'

import { useEffect } from 'react'
import { Pie } from 'react-chartjs-2'
import { ensureChartsRegistered } from './charts'

export function ChartPie() {
  useEffect(() => {
    ensureChartsRegistered()
  }, [])

  const labels = ['Alimentação', 'Transporte', 'Lazer', 'Contas fixas', 'Jantar fora']
  const values = [32, 14, 18, 24, 12]

  return (
    <div className="rounded-2xl bg-white p-4 border border-slate-200 shadow-sm">
      <div className="text-xs font-semibold text-slate-600 mb-2">Divisão de gastos</div>
      <div className="h-52">
        <Pie
          data={{
            labels,
            datasets: [
              {
                data: values,
                backgroundColor: [
                  'rgba(34, 211, 238, 0.75)',
                  'rgba(59, 130, 246, 0.75)',
                  'rgba(168, 85, 247, 0.75)',
                  'rgba(100, 116, 139, 0.75)',
                  'rgba(16, 185, 129, 0.75)',
                ],
                borderColor: 'rgba(255,255,255,0.9)',
                borderWidth: 2,
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: { color: '#334155', font: { size: 11 } },
              },
            },
          }}
        />
      </div>
    </div>
  )
}

