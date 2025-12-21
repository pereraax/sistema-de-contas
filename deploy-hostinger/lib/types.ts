export type TipoRegistro = 'entrada' | 'saida' | 'divida'

export interface User {
  id: string
  nome: string
  created_at: string
}

export type RecorrenciaTipo = 'diaria' | 'semanal' | 'quinzenal' | 'mensal' | 'bimestral' | 'trimestral' | 'semestral' | 'anual'

export interface Registro {
  id: string
  user_id: string
  nome: string
  observacao?: string
  tipo: TipoRegistro
  valor: number
  categoria?: string
  etiquetas: string[]
  parcelas_totais: number
  parcelas_pagas: number
  data_registro: string
  created_at: string
  user?: User
  // Campos de recorrência
  is_recorrente?: boolean
  recorrencia_tipo?: RecorrenciaTipo
  recorrencia_dia?: number // Dia do mês (1-31) ou dia da semana (0-6)
  recorrencia_dia_semana?: number // Dia da semana (0-6, onde 0 = domingo)
  divida_original_id?: string
  proxima_recorrencia?: string
  ativo?: boolean
}

export interface Emprestimo {
  id: string
  nome_pessoa: string
  valor: number
  observacao?: string
  cpf?: string
  celular?: string
  arquivo_url?: string
  data_emprestimo: string
  data_pagamento?: string
  parcelas_totais: number
  parcelas_pagas: number
  created_at: string
}

export type PeriodicidadeCofrinho = 'diario' | 'semanal' | 'mensal'
export type StatusCofrinho = 'ativo' | 'concluido' | 'pausado'

export interface MetaCofrinho {
  id: string
  user_id: string
  nome: string
  icone?: string
  meta_total: number
  valor_acumulado: number
  periodicidade: PeriodicidadeCofrinho
  status: StatusCofrinho
  valor_max_por_bau?: number
  num_baus_total?: number
  data_inicio?: string
  data_conclusao?: string
  created_at: string
}

export interface DepositoCofrinho {
  id: string
  meta_id: string
  user_id: string
  valor_original: number
  desconto: number
  valor_depositado: number
  bau_tipo: number
  data_deposito: string
  created_at: string
}

export interface BauMeta {
  id: string
  meta_id: string
  user_id: string
  numero_bau: number
  valor_original: number
  coletado: boolean
  data_coleta?: string
  valor_depositado?: number
  desconto_aplicado?: number
  created_at: string
}

