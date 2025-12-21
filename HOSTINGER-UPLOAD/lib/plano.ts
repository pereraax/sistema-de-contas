'use server'

import { createClient } from './supabase/server'

export type Plano = 'teste' | 'basico' | 'premium'

export interface PlanoFeatures {
  // Registros
  podeCriarRegistros: boolean
  limiteRegistrosMensais: number | null // null = ilimitado
  
  // Funcionalidades principais
  podeCriarDividas: boolean
  podeCriarEmprestimos: boolean
  podeRegistrarSalario: boolean
  podeUsarCalendario: boolean
  podeUsarMetas: boolean
  limiteMetas: number | null // null = ilimitado
  
  // Dashboard e relatórios
  podeUsarDashboard: boolean
  podeUsarDashboardAvancado: boolean // Gráficos avançados e projeções
  podeExportarRelatorios: boolean
  podeExportarAvancado: boolean // Múltiplos formatos
  
  // Usuários/Pessoas
  podeCriarUsuarios: boolean
  limiteUsuarios: number | null // null = ilimitado
  
  // Recursos especiais
  podeUploadDocumentos: boolean
  podeUsarGameDinamico: boolean
  
  // Filtros
  podeUsarFiltrosAvancados: boolean
}

const featuresPorPlano: Record<Plano, PlanoFeatures> = {
  teste: {
    podeCriarRegistros: true,
    limiteRegistrosMensais: 50,
    podeCriarDividas: false,
    podeCriarEmprestimos: false,
    podeRegistrarSalario: false,
    podeUsarCalendario: false,
    podeUsarMetas: false,
    limiteMetas: 0,
    podeUsarDashboard: true,
    podeUsarDashboardAvancado: false,
    podeExportarRelatorios: false,
    podeExportarAvancado: false,
    podeCriarUsuarios: true,
    limiteUsuarios: 2,
    podeUploadDocumentos: false,
    podeUsarGameDinamico: false,
    podeUsarFiltrosAvancados: false,
  },
  basico: {
    podeCriarRegistros: true,
    limiteRegistrosMensais: null, // ilimitado
    podeCriarDividas: true,
    podeCriarEmprestimos: false,
    podeRegistrarSalario: true,
    podeUsarCalendario: true,
    podeUsarMetas: true,
    limiteMetas: 3,
    podeUsarDashboard: true,
    podeUsarDashboardAvancado: false,
    podeExportarRelatorios: true,
    podeExportarAvancado: false,
    podeCriarUsuarios: true,
    limiteUsuarios: 10,
    podeUploadDocumentos: false,
    podeUsarGameDinamico: false,
    podeUsarFiltrosAvancados: true,
  },
  premium: {
    podeCriarRegistros: true,
    limiteRegistrosMensais: null, // ilimitado
    podeCriarDividas: true,
    podeCriarEmprestimos: true,
    podeRegistrarSalario: true,
    podeUsarCalendario: true,
    podeUsarMetas: true,
    limiteMetas: null, // ilimitado
    podeUsarDashboard: true,
    podeUsarDashboardAvancado: true,
    podeExportarRelatorios: true,
    podeExportarAvancado: true,
    podeCriarUsuarios: true,
    limiteUsuarios: null, // ilimitado
    podeUploadDocumentos: true,
    podeUsarGameDinamico: true,
    podeUsarFiltrosAvancados: true,
  },
}

/**
 * Obtém o plano atual do usuário autenticado
 * Verifica se o plano está ativo e não expirado
 */
export async function obterPlanoUsuario(): Promise<Plano> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return 'teste'
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('plano, plano_status, plano_data_fim')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return 'teste'
  }

  // Se o plano é 'teste', sempre retornar teste (independente do status)
  if (profile.plano === 'teste') {
    return 'teste'
  }

  // Para planos pagos (basico/premium), verificar se está ativo e não expirado
  if (profile.plano === 'basico' || profile.plano === 'premium') {
    // Só retornar o plano se status for 'ativo' e não expirado
    if (profile.plano_status === 'ativo') {
      const dataFim = profile.plano_data_fim ? new Date(profile.plano_data_fim) : null
      if (dataFim && dataFim > new Date()) {
        return profile.plano as Plano
      }
    }
  }

  // Se expirado, cancelado, trial ou qualquer outro caso, retornar teste
  return 'teste'
}

/**
 * Obtém as features disponíveis para o usuário atual
 */
export async function obterFeaturesUsuario(): Promise<PlanoFeatures> {
  const plano = await obterPlanoUsuario()
  return featuresPorPlano[plano]
}

/**
 * Verifica se uma feature específica está disponível para o plano
 */
export async function verificarFeature(feature: keyof PlanoFeatures, plano: Plano): Promise<boolean> {
  return !!featuresPorPlano[plano][feature]
}

/**
 * Verifica se o usuário pode criar mais registros este mês
 */
export async function podeCriarRegistro(): Promise<{ pode: boolean; motivo?: string }> {
  const features = await obterFeaturesUsuario()
  
  if (!features.podeCriarRegistros) {
    return { pode: false, motivo: 'Criação de registros não disponível no seu plano' }
  }

  // Se não tem limite, pode criar
  if (features.limiteRegistrosMensais === null) {
    return { pode: true }
  }

  // Verificar contador mensal
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { pode: false, motivo: 'Usuário não autenticado' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('registros_mes_atual, registros_mes_referencia')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return { pode: false, motivo: 'Perfil não encontrado' }
  }

  // Verificar se mudou de mês (precisa resetar)
  const mesAtual = new Date().getMonth()
  const mesReferencia = profile.registros_mes_referencia 
    ? new Date(profile.registros_mes_referencia).getMonth()
    : mesAtual

  const registrosUsados = mesAtual === mesReferencia 
    ? (profile.registros_mes_atual || 0)
    : 0

  if (registrosUsados >= features.limiteRegistrosMensais) {
    return { 
      pode: false, 
      motivo: `Limite de ${features.limiteRegistrosMensais} registros/mês atingido. Faça upgrade para criar registros ilimitados.` 
    }
  }

  return { pode: true }
}

/**
 * Verifica se o usuário pode criar mais usuários/pessoas
 */
export async function podeCriarUsuario(): Promise<{ pode: boolean; motivo?: string }> {
  const features = await obterFeaturesUsuario()
  
  if (!features.podeCriarUsuarios) {
    return { pode: false, motivo: 'Criação de usuários não disponível no seu plano' }
  }

  // Se não tem limite, pode criar
  if (features.limiteUsuarios === null) {
    return { pode: true }
  }

  // Contar usuários existentes
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { pode: false, motivo: 'Usuário não autenticado' }
  }

  const { data: usuarios, error } = await supabase
    .from('users')
    .select('id', { count: 'exact' })
    .eq('account_owner_id', user.id)

  if (error) {
    return { pode: false, motivo: 'Erro ao verificar usuários' }
  }

  const totalUsuarios = usuarios?.length || 0

  if (totalUsuarios >= features.limiteUsuarios) {
    return { 
      pode: false, 
      motivo: `Limite de ${features.limiteUsuarios} usuários atingido. Faça upgrade para criar usuários ilimitados.` 
    }
  }

  return { pode: true }
}

/**
 * Verifica se o usuário pode criar mais metas
 */
export async function podeCriarMeta(): Promise<{ pode: boolean; motivo?: string }> {
  const features = await obterFeaturesUsuario()
  
  if (!features.podeUsarMetas) {
    return { pode: false, motivo: 'Sistema de metas não disponível no seu plano' }
  }

  // Se não tem limite, pode criar
  if (features.limiteMetas === null) {
    return { pode: true }
  }

  // Contar metas existentes
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { pode: false, motivo: 'Usuário não autenticado' }
  }

  const { data: metas, error } = await supabase
    .from('metas_cofrinho')
    .select('id', { count: 'exact' })
    .eq('user_id', user.id)

  if (error) {
    return { pode: false, motivo: 'Erro ao verificar metas' }
  }

  const totalMetas = metas?.length || 0

  if (totalMetas >= features.limiteMetas) {
    return { 
      pode: false, 
      motivo: `Limite de ${features.limiteMetas} metas atingido. Faça upgrade para criar metas ilimitadas.` 
    }
  }

  return { pode: true }
}

/**
 * Incrementa o contador de registros do mês
 */
export async function incrementarRegistroMes(): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return
  }

  // Usar função SQL para incrementar (já verifica reset de mês)
  await supabase.rpc('incrementar_registro_mes', { user_uuid: user.id })
}




