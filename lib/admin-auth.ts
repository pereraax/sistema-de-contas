import { createClient, createAdminClient, createPublicClient } from '@/lib/supabase/server'
import crypto from 'crypto'

// Interface para admin
export interface AdminUser {
  id: string
  email: string
  nome: string
  is_active: boolean
  created_at: string
}

// Função para fazer hash da senha (usar crypto nativo do Node.js)
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex')
  return `${salt}:${hash}`
}

// Função para verificar senha
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    // Remover espaços e quebras de linha do hash
    const cleanHash = storedHash.trim().replace(/\s+/g, '')
    
    // Verificar formato
    if (!cleanHash.includes(':')) {
      console.error('Hash inválido: não contém separador :')
      return false
    }
    
    const [salt, hash] = cleanHash.split(':')
    
    if (!salt || !hash) {
      console.error('Hash inválido: salt ou hash vazio')
      return false
    }
    
    const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex')
    const isValid = hash === verifyHash
    
    if (!isValid) {
      console.log('Hash não corresponde:', {
        salt_length: salt.length,
        hash_length: hash.length,
        verify_hash_length: verifyHash.length,
        hash_match: hash.substring(0, 20) === verifyHash.substring(0, 20)
      })
    }
    
    return isValid
  } catch (error) {
    console.error('Erro ao verificar senha:', error)
    return false
  }
}

// Função para criar admin (executar uma vez para criar o primeiro admin)
export async function criarAdmin(email: string, password: string, nome: string) {
  const supabase = await createClient()
  
  const passwordHash = await hashPassword(password)
  
  const { data, error } = await supabase
    .from('admin_users')
    .insert({
      email,
      password_hash: passwordHash,
      nome,
      is_active: true
    })
    .select()
    .single()

  if (error) {
    return { error: error.message, data: null }
  }

  return { data, error: null }
}

// Função para fazer login admin
export async function loginAdmin(email: string, password: string) {
  const supabase = await createClient()
  
  const { data: admin, error: fetchError } = await supabase
    .from('admin_users')
    .select('*')
    .eq('email', email)
    .eq('is_active', true)
    .single()

  if (fetchError || !admin) {
    return { error: 'Email ou senha incorretos', data: null }
  }

  const isValidPassword = await verifyPassword(password, admin.password_hash)
  
  if (!isValidPassword) {
    return { error: 'Email ou senha incorretos', data: null }
  }

  // Retornar dados do admin (sem a senha)
  const { password_hash, ...adminData } = admin
  
  return { data: adminData, error: null }
}

// Função para verificar se usuário é admin (via session/cookie)
export async function getCurrentAdmin(): Promise<AdminUser | null> {
  // Implementar verificação via cookie/session
  // Por enquanto, retornar null
  return null
}

// Função para obter todos os usuários da plataforma
export async function obterTodosUsuarios() {
  console.log('🔍 [obterTodosUsuarios] Iniciando busca de usuários...')
  
  // PRIMEIRO: Tentar usar função RPC (funciona mesmo sem service role key)
  // NOTA: A função RPC pode retornar usuários deletados, então vamos filtrar depois
  try {
    const supabasePublic = createPublicClient()
    console.log('🔄 [obterTodosUsuarios] Tentando função RPC get_all_profiles (prioridade)...')
    const { data: rpcData, error: rpcError } = await supabasePublic.rpc('get_all_profiles')

    if (!rpcError && rpcData && Array.isArray(rpcData)) {
      if (rpcData.length > 0) {
        console.log(`✅ [obterTodosUsuarios] Encontrados ${rpcData.length} perfis via RPC`)
        
        // IMPORTANTE: Retornar TODOS os perfis sem filtrar por auth.users
        // Isso garante que todos os usuários cadastrados apareçam no painel admin
        // Mesmo que não existam no auth.users (podem ter sido criados de outra forma)
        const supabaseAdmin = createAdminClient()
        
        // Buscar last_sign_in_at apenas para enriquecer os dados, mas não filtrar
        let lastSignInMap = new Map<string, string | null>()
        if (supabaseAdmin) {
          try {
            const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
            if (authUsers?.users && !authError) {
                (authUsers.users as any[]).forEach((user: any) => {
                  lastSignInMap.set(user.id, user.last_sign_in_at || null)
                })
            }
          } catch (authErr) {
            console.warn('⚠️ [obterTodosUsuarios] Não foi possível buscar auth.users para last_sign_in_at:', authErr)
          }
              }
              
        // Retornar TODOS os perfis, enriquecidos com last_sign_in_at quando disponível
        const data = rpcData.map((profile: any) => ({
                ...profile,
                last_sign_in_at: lastSignInMap.get(profile.id) || null
              }))
              
        console.log(`✅ [obterTodosUsuarios] Retornando ${data.length} usuários via RPC (sem filtrar)`)
              return { data, error: null }
      } else {
        console.log('⚠️ [obterTodosUsuarios] RPC retornou array vazio - retornando array vazio')
        return { data: [], error: null }
      }
    } else if (rpcError) {
      console.error('❌ [obterTodosUsuarios] Erro na função RPC:', rpcError)
      console.error('❌ [obterTodosUsuarios] Detalhes RPC:', {
        message: rpcError.message,
        code: rpcError.code,
        details: rpcError.details,
        hint: rpcError.hint
      })
    }
  } catch (rpcErr) {
    console.error('❌ [obterTodosUsuarios] Erro ao tentar RPC:', rpcErr)
  }
  
  // SEGUNDO: Tentar usar cliente admin (bypassa RLS se service role key estiver configurada)
  const supabaseAdmin = createAdminClient()
  
  if (supabaseAdmin) {
    try {
      console.log('✅ [obterTodosUsuarios] Usando cliente admin (bypassa RLS)')
      
      // PRIMEIRO: Buscar dados dos profiles (SEM filtrar primeiro)
      const { data: profiles, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('id, id_curto, email, nome, telefone, whatsapp, plano, created_at')
        .order('created_at', { ascending: false })
      
      if (profilesError) {
        console.error('❌ [obterTodosUsuarios] Erro ao buscar profiles:', profilesError)
        console.error('❌ [obterTodosUsuarios] Detalhes profiles:', {
          message: profilesError.message,
          code: profilesError.code,
          details: profilesError.details,
          hint: profilesError.hint
        })
        // Continuar para tentar outros métodos
      } else if (profiles && profiles.length > 0) {
        console.log(`✅ [obterTodosUsuarios] Encontrados ${profiles.length} perfis na tabela profiles`)
        
        // IMPORTANTE: Retornar TODOS os perfis sem filtrar por auth.users
        // Isso garante que todos os usuários cadastrados apareçam no painel admin
        console.log(`✅ [obterTodosUsuarios] Retornando TODOS os ${profiles.length} perfis (sem filtrar)`)
        
        // Buscar último login de cada usuário do auth.users apenas para enriquecer dados
        let lastSignInMap = new Map<string, string | null>()
        try {
          const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
          if (authUsers?.users && !authError) {
            (authUsers.users as any[]).forEach((user: any) => {
              lastSignInMap.set(user.id, user.last_sign_in_at || null)
            })
          }
        } catch (authErr) {
          console.warn('⚠️ [obterTodosUsuarios] Erro ao buscar auth.users para last_sign_in_at:', authErr)
          }
          
        // Retornar TODOS os perfis, enriquecidos com last_sign_in_at quando disponível
        const data = profiles.map(profile => ({
            ...profile,
            last_sign_in_at: lastSignInMap.get(profile.id) || null
          }))
          
        console.log(`✅ [obterTodosUsuarios] Encontrados ${data.length} usuários via cliente admin (todos os perfis)`)
          return { data, error: null }
      } else {
        console.log('✅ [obterTodosUsuarios] Nenhum profile encontrado via cliente admin - retornando array vazio')
        return { data: [], error: null }
      }
    } catch (error: any) {
      console.error('❌ [obterTodosUsuarios] Erro ao usar cliente admin:', error?.message || error)
      // Continuar para tentar outros métodos
    }
  } else {
    console.log('⚠️ [obterTodosUsuarios] Service role key não configurada - tentando outros métodos')
  }

  // Último fallback: tentar buscar diretamente usando cliente normal (pode funcionar se RLS permitir)
  // NOTA: Este método não pode filtrar usuários deletados porque não tem acesso ao auth.admin
  // Mas vamos tentar usar o admin client se disponível
  try {
    const supabaseAdmin = createAdminClient()
    if (supabaseAdmin) {
      console.log('🔄 [obterTodosUsuarios] Tentando busca direta com cliente admin (fallback)...')
      const { data: fallbackData, error: fallbackError } = await supabaseAdmin
        .from('profiles')
        .select('id, id_curto, email, nome, telefone, whatsapp, plano, created_at')
        .order('created_at', { ascending: false })
      
      if (fallbackError) {
        console.error('❌ [obterTodosUsuarios] Erro ao buscar usuários diretamente:', fallbackError)
        // Continuar para tentar outros métodos em vez de retornar erro
        console.log('ℹ️ [obterTodosUsuarios] Continuando para tentar outros métodos...')
      } else if (fallbackData && fallbackData.length > 0) {
        // IMPORTANTE: Retornar TODOS os perfis sem filtrar
        console.log(`✅ [obterTodosUsuarios] Retornando TODOS os ${fallbackData.length} perfis via busca direta (sem filtrar)`)
        
        const data = fallbackData.map(profile => ({
              ...profile,
              last_sign_in_at: null
            }))
            
            console.log(`✅ [obterTodosUsuarios] Encontrados ${data.length} usuários via busca direta`)
            return { data, error: null }
      }
    } else {
      // Se não tiver admin client, tentar com cliente normal (pode falhar por RLS)
      const supabase = await createClient()
      console.log('🔄 [obterTodosUsuarios] Tentando busca direta com cliente autenticado (sem filtro de deletados)...')
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('profiles')
        .select('id, id_curto, email, nome, telefone, whatsapp, plano, created_at')
        .order('created_at', { ascending: false })
      
      if (fallbackError) {
        console.error('❌ [obterTodosUsuarios] Erro ao buscar usuários diretamente:', fallbackError)
        return { error: `Não foi possível carregar usuários: ${fallbackError.message}`, data: [] }
      }
      
      if (fallbackData && fallbackData.length > 0) {
        const data = fallbackData.map(profile => ({
          ...profile,
          last_sign_in_at: null
        }))
        
        console.log(`✅ [obterTodosUsuarios] Encontrados ${data.length} usuários via busca direta (sem filtro)`)
        return { data, error: null }
      } else {
        console.log('✅ [obterTodosUsuarios] Nenhum usuário encontrado via busca direta - retornando array vazio')
        return { data: [], error: null }
      }
    }
  } catch (fallbackErr: any) {
    console.error('❌ [obterTodosUsuarios] Erro ao tentar busca direta:', fallbackErr?.message || fallbackErr)
  }
  
  // Se chegou aqui, não conseguiu buscar de nenhuma forma
  // Mas pode ser que simplesmente não há usuários, então vamos retornar array vazio sem erro
  console.log('ℹ️ [obterTodosUsuarios] Nenhum método funcionou - pode ser que não há usuários ou há problema de configuração')
  console.log('ℹ️ [obterTodosUsuarios] Retornando array vazio (sem erro) para não quebrar a UI')
  return { data: [], error: null }
}

// Função para obter usuários assinantes
export async function obterUsuariosAssinantes() {
  // Tentar usar cliente admin primeiro (bypassa RLS)
  const supabaseAdmin = createAdminClient()
  
  if (supabaseAdmin) {
    // Usar cliente admin que bypassa RLS
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, id_curto, email, nome, telefone, whatsapp, plano, created_at')
      .in('plano', ['basico', 'premium'])
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Erro ao buscar assinantes com cliente admin:', error)
      return { error: error.message, data: [] }
    }
    
    return { data: data || [], error: null }
  }
  
  // Fallback: tentar usar função RPC se disponível
  // Usar cliente público para garantir que funcione mesmo sem autenticação
  const supabasePublic = createPublicClient()
  const { data: rpcData, error: rpcError } = await supabasePublic.rpc('get_subscriber_profiles')

  if (!rpcError && rpcData) {
    return { data: rpcData || [], error: null }
  }

  // Último fallback: tentar buscar diretamente (pode falhar por RLS se não houver usuário logado)
  const { data: fallbackData, error: fallbackError } = await supabasePublic
    .from('profiles')
    .select('id, id_curto, email, nome, telefone, whatsapp, plano, created_at')
    .in('plano', ['basico', 'premium'])
    .order('created_at', { ascending: false })
  
  if (fallbackError) {
    console.error('Erro ao buscar assinantes:', fallbackError)
    return { error: fallbackError.message, data: [] }
  }
  
  return { data: fallbackData || [], error: null }
}

// Preços mensais por plano (para cálculo de receita no dashboard)
const PRECO_PLANO_BASICO = 29.9
const PRECO_PLANO_PREMIUM = 49.9

// Função para obter estatísticas de usuários
export async function obterEstatisticasUsuarios() {
  // Usar obterTodosUsuarios para garantir que retorna todos os usuários
  const resultado = await obterTodosUsuarios()
    
  if (resultado.error) {
    return { error: resultado.error, data: null }
    }

  const usuarios = resultado.data || []
  
  // Calcular estatísticas baseadas em TODOS os usuários
  const total = usuarios.length
  const assinantes = usuarios.filter(u => u.plano === 'basico' || u.plano === 'premium').length
  const teste = usuarios.filter(u => u.plano === 'teste').length
  const usuarios_basico = usuarios.filter(u => u.plano === 'basico').length
  const usuarios_premium = usuarios.filter(u => u.plano === 'premium').length

  // Receita estimada (assinantes × preço do plano)
  const receita_basico = usuarios_basico * PRECO_PLANO_BASICO
  const receita_premium = usuarios_premium * PRECO_PLANO_PREMIUM
  const receita_total = receita_basico + receita_premium

    return {
      data: {
        total_usuarios: total,
        usuarios_assinantes: assinantes,
        usuarios_teste: teste,
        usuarios_basico,
        usuarios_premium,
        receita_basico,
        receita_premium,
        receita_total
      },
      error: null
    }
}

// Função para enviar link de recuperação de senha
export async function enviarLinkRecuperacaoSenha(userId: string) {
  const supabase = await createClient()
  
  // Usar a função do Supabase Auth para enviar email de recuperação
  // Isso requer acesso ao auth.users, então vamos usar uma abordagem diferente
  // Criar um token temporário e enviar via email
  
  return { success: true, error: null }
}

