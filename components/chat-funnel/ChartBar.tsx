'use client'

import { useEffect } from 'react'
import { Bar } from 'react-chartjs-2'
import { ensureChartsRegistered } from './charts'

export function ChartBar() {
  useEffect(() => {
    ensureChartsRegistered()
  }, [])

  const labels = ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7']
  const values = [42, 86, 55, 120, 64, 92, 78]

  return (
    <div className="rounded-2xl bg-white p-4 border border-slate-200 shadow-sm">
      <div className="text-xs font-semibold text-slate-600 mb-2">Gastos (últimos 7 dias)</div>
      <div className="h-44">
        <Bar
          data={{
            labels,
            datasets: [
              {
                label: 'R$',
                data: values,
                backgroundColor: 'rgba(56, 189, 248, 0.55)',
                borderColor: 'rgba(56, 189, 248, 0.9)',
                borderWidth: 1,
                borderRadius: 10,
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (ctx) => `R$ ${ctx.parsed.y}`,
                },
              },
            },
            scales: {
              x: {
                grid: { display: false },
                ticks: { color: '#64748b', font: { size: 11 } },
              },
              y: {
                grid: { color: 'rgba(148, 163, 184, 0.25)' },
                ticks: { color: '#64748b', font: { size: 11 } },
              },
            },
          }}
        />
      </div>
    </div>
  )
}

