'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Interface para aviso admin
export interface AdminAviso {
  id: string
  titulo: string
  mensagem: string
  tipo: 'info' | 'warning' | 'error' | 'success'
  mostrar_popup: boolean
  ativo: boolean
  criado_por: string
  created_at: string
  updated_at: string
}

// Criar novo aviso
export async function criarAvisoAdmin(data: {
  titulo: string
  mensagem: string
  tipo: 'info' | 'warning' | 'error' | 'success'
  mostrar_popup: boolean
  adminId: string
  data_expiracao?: string | null
}) {
  const supabase = await createClient()
  
  const { data: aviso, error } = await supabase
    .from('admin_avisos')
    .insert({
      titulo: data.titulo,
      mensagem: data.mensagem,
      tipo: data.tipo,
      mostrar_popup: data.mostrar_popup,
      ativo: true,
      criado_por: data.adminId,
      data_expiracao: data.data_expiracao || null
    })
    .select()
    .single()

  if (error) {
    return { error: error.message, data: null }
  }

  revalidatePath('/admin')
  revalidatePath('/home')
  
  return { data: aviso, error: null }
}

// Obter todos os avisos
export async function obterAvisosAdmin() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('admin_avisos')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return { error: error.message, data: [] }
  }

  return { data: data || [], error: null }
}

// Obter avisos ativos para usuários
export async function obterAvisosAtivos(userId: string) {
  const supabase = await createClient()
  
  // Buscar avisos ativos que o usuário ainda não viu
  const { data: avisos, error: avisosError } = await supabase
    .from('admin_avisos')
    .select('*')
    .eq('ativo', true)
    .order('created_at', { ascending: false })

  if (avisosError) {
    return { error: avisosError.message, data: [] }
  }

  // Filtrar avisos que não expiraram
  const agora = new Date()
  const avisosNaoExpirados = avisos?.filter(aviso => {
    // Se não tem data_expiracao, não expira
    if (!aviso.data_expiracao) return true
    // Se tem data_expiracao, verificar se ainda não passou
    return new Date(aviso.data_expiracao) > agora
  }) || []

  // Buscar quais avisos o usuário já viu
  const { data: avisosVistos, error: vistosError } = await supabase
    .from('avisos_vistos')
    .select('aviso_id')
    .eq('user_id', userId)

  const avisosVistosIds = new Set(avisosVistos?.map(a => a.aviso_id) || [])

  // Filtrar avisos não vistos e não expirados
  const avisosNaoVistos = avisosNaoExpirados.filter(a => !avisosVistosIds.has(a.id))

  return { data: avisosNaoVistos, error: null }
}

// Marcar aviso como visto
export async function marcarAvisoComoVisto(avisoId: string, userId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('avisos_vistos')
    .insert({
      aviso_id: avisoId,
      user_id: userId
    })
    .select()
    .single()

  if (error && !error.message.includes('duplicate')) {
    return { error: error.message, success: false }
  }

  return { success: true, error: null }
}

// Desativar aviso
export async function desativarAviso(avisoId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('admin_avisos')
    .update({ ativo: false })
    .eq('id', avisoId)

  if (error) {
    return { error: error.message, success: false }
  }

  revalidatePath('/admin')
  revalidatePath('/home')
  
  return { success: true, error: null }
}

// Ativar aviso
export async function ativarAviso(avisoId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('admin_avisos')
    .update({ ativo: true })
    .eq('id', avisoId)

  if (error) {
    return { error: error.message, success: false }
  }

  revalidatePath('/admin')
  revalidatePath('/home')
  
  return { success: true, error: null }
}

// Deletar aviso
export async function deletarAviso(avisoId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('admin_avisos')
    .delete()
    .eq('id', avisoId)

  if (error) {
    return { error: error.message, success: false }
  }

  revalidatePath('/admin')
  
  return { success: true, error: null }
}

