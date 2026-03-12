export type ContactStatus =
  | 'novo_lead'
  | 'aguardando_email'
  | 'aguardando_codigo'
  | 'usuario_ativo'
  | 'cliente_pago'
  | 'inativo'

export const STATUS_LABELS: Record<ContactStatus, string> = {
  novo_lead: 'Novo lead',
  aguardando_email: 'Aguardando e-mail',
  aguardando_codigo: 'Aguardando código',
  usuario_ativo: 'Usuário ativo',
  cliente_pago: 'Cliente pago',
  inativo: 'Inativo',
}

export const KANBAN_COLUMNS: ContactStatus[] = [
  'novo_lead',
  'aguardando_email',
  'aguardando_codigo',
  'usuario_ativo',
  'cliente_pago',
  'inativo',
]

export const COPY_CATEGORIES = [
  { id: 'anuncio', label: 'Copy para anúncio' },
  { id: 'whatsapp', label: 'Copy para WhatsApp' },
  { id: 'conversao', label: 'Copy de conversão' },
  { id: 'reativacao', label: 'Copy de reativação' },
  { id: 'upsell', label: 'Copy de upsell' },
] as const

export const DYNAMIC_VARIABLES = [
  { key: '{nome}', label: 'Nome' },
  { key: '{valor}', label: 'Valor' },
  { key: '{categoria}', label: 'Categoria' },
] as const
