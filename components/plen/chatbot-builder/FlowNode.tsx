'use client'

import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'

export type FlowNodeType =
  | 'inicio'
  | 'mensagem'
  | 'menu'
  | 'condicao'
  | 'ia'
  | 'registrar_gasto'
  | 'registrar_receita'
  | 'delay'
  | 'lembrete'
  | 'webhook'
  | 'fim'

export interface FlowNodeData {
  label: string
  nodeType: FlowNodeType
  /** Config do bloco (mensagem, condições, etc.) */
  config?: Record<string, unknown>
}

const TYPE_LABELS: Record<FlowNodeType, string> = {
  inicio: 'Início',
  mensagem: 'Mensagem',
  menu: 'Menu',
  condicao: 'Condição',
  ia: 'IA',
  registrar_gasto: 'Registrar gasto',
  registrar_receita: 'Registrar receita',
  delay: 'Delay',
  lembrete: 'Lembrete',
  webhook: 'Webhook',
  fim: 'Fim',
}

const TYPE_COLORS: Record<FlowNodeType, string> = {
  inicio: 'bg-emerald-500/20 border-emerald-400/60 text-emerald-200',
  mensagem: 'bg-blue-500/20 border-blue-400/60 text-blue-200',
  menu: 'bg-violet-500/20 border-violet-400/60 text-violet-200',
  condicao: 'bg-amber-500/20 border-amber-400/60 text-amber-200',
  ia: 'bg-cyan-500/20 border-cyan-400/60 text-cyan-200',
  registrar_gasto: 'bg-rose-500/20 border-rose-400/60 text-rose-200',
  registrar_receita: 'bg-green-500/20 border-green-400/60 text-green-200',
  delay: 'bg-orange-500/20 border-orange-400/60 text-orange-200',
  lembrete: 'bg-yellow-500/20 border-yellow-400/60 text-yellow-200',
  webhook: 'bg-slate-500/20 border-slate-400/60 text-slate-200',
  fim: 'bg-red-500/20 border-red-400/60 text-red-200',
}

function FlowNodeComponent({ data, selected }: NodeProps<FlowNodeData>) {
  const nodeType = (data?.nodeType || 'mensagem') as FlowNodeType
  const label = data?.label || TYPE_LABELS[nodeType]
  const colorClass = TYPE_COLORS[nodeType] || TYPE_COLORS.mensagem
  const isInicio = nodeType === 'inicio'
  const isFim = nodeType === 'fim'
  const isCondicao = nodeType === 'condicao'

  return (
    <div
      className={`relative px-4 py-3 rounded-xl border-2 min-w-[160px] max-w-[220px] shadow-lg ${colorClass} ${
        selected ? 'ring-2 ring-white/50' : ''
      }`}
    >
      {!isInicio && (
        <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-white/60" />
      )}
      <div className="text-sm font-semibold truncate" title={label}>
        {label}
      </div>
      {data?.config?.preview && (
        <div className="text-xs opacity-80 mt-1 truncate" title={String(data.config.preview)}>
          {String(data.config.preview).slice(0, 40)}…
        </div>
      )}
      {!isFim && !isCondicao && (
        <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-white/60" />
      )}
      {isCondicao && (
        <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 pb-0.5">
          <Handle type="source" id="sim" position={Position.Bottom} className="!w-2 !h-2 !bg-green-400 !relative !translate-y-1/2" />
          <Handle type="source" id="nao" position={Position.Bottom} className="!w-2 !h-2 !bg-red-400 !relative !translate-y-1/2" />
        </div>
      )}
    </div>
  )
}

export const FlowNode = memo(FlowNodeComponent)
