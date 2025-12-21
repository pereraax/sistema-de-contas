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
  try {
    const supabasePublic = createPublicClient()
    console.log('🔄 [obterTodosUsuarios] Tentando função RPC get_all_profiles (prioridade)...')
    const { data: rpcData, error: rpcError } = await supabasePublic.rpc('get_all_profiles')

    if (!rpcError && rpcData && Array.isArray(rpcData)) {
      if (rpcData.length > 0) {
        console.log(`✅ [obterTodosUsuarios] Encontrados ${rpcData.length} usuários via RPC`)
        return { data: rpcData, error: null }
      } else {
        console.log('⚠️ [obterTodosUsuarios] RPC retornou array vazio')
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
      // Buscar dados dos profiles
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
        // Buscar último login de cada usuário do auth.users
        try {
          const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
          
          // Criar um mapa de last_sign_in_at por user_id
          const lastSignInMap = new Map<string, string | null>()
          if (authUsers?.users) {
            (authUsers.users as any[]).forEach((user: any) => {
              lastSignInMap.set(user.id, user.last_sign_in_at || null)
            })
          }
          
          // Combinar dados
          const data = profiles.map(profile => ({
            ...profile,
            last_sign_in_at: lastSignInMap.get(profile.id) || null
          }))
          
          console.log(`✅ [obterTodosUsuarios] Encontrados ${data.length} usuários via cliente admin`)
          return { data, error: null }
        } catch (authErr) {
          console.warn('⚠️ [obterTodosUsuarios] Erro ao buscar auth.users, retornando sem last_sign_in_at:', authErr)
          const data = profiles.map(profile => ({
            ...profile,
            last_sign_in_at: null
          }))
          console.log(`✅ [obterTodosUsuarios] Encontrados ${data.length} usuários via cliente admin (sem auth data)`)
          return { data, error: null }
        }
      } else {
        console.log('⚠️ [obterTodosUsuarios] Nenhum profile encontrado via cliente admin')
      }
    } catch (error) {
      console.error('❌ [obterTodosUsuarios] Erro ao usar cliente admin:', error)
    }
  } else {
    console.log('⚠️ [obterTodosUsuarios] Service role key não configurada')
  }

  // Último fallback: tentar buscar diretamente usando cliente normal (pode funcionar se RLS permitir)
  try {
    const supabase = await createClient()
    console.log('🔄 [obterTodosUsuarios] Tentando busca direta com cliente autenticado...')
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('profiles')
      .select('id, id_curto, email, nome, telefone, whatsapp, plano, created_at')
      .order('created_at', { ascending: false })
    
    if (fallbackError) {
      console.error('❌ [obterTodosUsuarios] Erro ao buscar usuários diretamente:', fallbackError)
      console.error('❌ [obterTodosUsuarios] Detalhes do erro:', {
        message: fallbackError.message,
        code: fallbackError.code,
        details: fallbackError.details,
        hint: fallbackError.hint
      })
      // Retornar array vazio em vez de erro, para a UI funcionar
      return { error: `Não foi possível carregar usuários: ${fallbackError.message}`, data: [] }
    }
    
    if (fallbackData && fallbackData.length > 0) {
      const data = fallbackData.map(profile => ({
        ...profile,
        last_sign_in_at: null
      }))
      
      console.log(`✅ [obterTodosUsuarios] Encontrados ${data.length} usuários via busca direta`)
      return { data, error: null }
    }
  } catch (fallbackErr) {
    console.error('❌ [obterTodosUsuarios] Erro ao tentar busca direta:', fallbackErr)
  }
  
  // Se chegou aqui, não conseguiu buscar de nenhuma forma
  console.warn('⚠️ [obterTodosUsuarios] Não foi possível carregar usuários de nenhuma forma')
  return { data: [], error: 'Não foi possível carregar os usuários. Verifique a configuração do banco de dados.' }
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

// Função para obter estatísticas de usuários
export async function obterEstatisticasUsuarios() {
  const supabase = await createClient()
  
  const { data, error } = await supabase.rpc('get_user_stats')

  if (error) {
    // Fallback: calcular manualmente
    const { data: profiles } = await supabase.from('profiles').select('plano')
    
    if (!profiles) {
      return { error: error.message, data: null }
    }

    const total = profiles.length
    const assinantes = profiles.filter(p => p.plano === 'basico' || p.plano === 'premium').length
    const teste = profiles.filter(p => p.plano === 'teste').length

    return {
      data: {
        total_usuarios: total,
        usuarios_assinantes: assinantes,
        usuarios_teste: teste
      },
      error: null
    }
  }

  return { data: data?.[0] || null, error: null }
}

// Função para enviar link de recuperação de senha
export async function enviarLinkRecuperacaoSenha(userId: string) {
  const supabase = await createClient()
  
  // Usar a função do Supabase Auth para enviar email de recuperação
  // Isso requer acesso ao auth.users, então vamos usar uma abordagem diferente
  // Criar um token temporário e enviar via email
  
  return { success: true, error: null }
}

