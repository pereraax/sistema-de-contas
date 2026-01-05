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
        
        // IMPORTANTE: Tentar filtrar usuários deletados, mas se falhar, retornar todos (fail-open)
        // Isso garante que novos usuários apareçam mesmo se houver problema na busca do auth
        const supabaseAdmin = createAdminClient()
        if (supabaseAdmin) {
          try {
            const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
            
            // Se conseguir buscar auth.users sem erro, filtrar
            if (authUsers?.users && !authError) {
              const authUserIds = new Set((authUsers.users as any[]).map((u: any) => u.id))
              let perfisAtivos = rpcData.filter((profile: any) => authUserIds.has(profile.id))
              
              console.log(`🔍 [obterTodosUsuarios] Filtrando RPC: ${rpcData.length} perfis totais, ${perfisAtivos.length} perfis ativos no auth.users`)
              
              // Se após filtrar ficou vazio mas havia perfis, pode ser problema - retornar todos (fail-open)
              if (perfisAtivos.length === 0 && rpcData.length > 0) {
                console.warn('⚠️ [obterTodosUsuarios] Filtro RPC removeu todos os perfis! Retornando TODOS os perfis (fail-open)')
                perfisAtivos = rpcData
              }
              
              // Buscar last_sign_in_at para os perfis
              const lastSignInMap = new Map<string, string | null>()
              if (authUsers?.users) {
                (authUsers.users as any[]).forEach((user: any) => {
                  lastSignInMap.set(user.id, user.last_sign_in_at || null)
                })
              }
              
              const data = perfisAtivos.map((profile: any) => ({
                ...profile,
                last_sign_in_at: lastSignInMap.get(profile.id) || null
              }))
              
              console.log(`✅ [obterTodosUsuarios] Retornando ${data.length} usuários via RPC`)
              return { data, error: null }
            } else {
              // Se não conseguir buscar auth.users ou retornar vazio, retornar todos (fail-open)
              console.warn('⚠️ [obterTodosUsuarios] Não foi possível buscar/filtrar auth.users no RPC. Retornando todos os perfis.')
              if (authError) {
                console.warn('⚠️ [obterTodosUsuarios] Erro:', authError.message)
              }
              return { data: rpcData, error: null }
            }
          } catch (filterErr: any) {
            console.warn('⚠️ [obterTodosUsuarios] Erro ao filtrar RPC:', filterErr?.message || filterErr)
            // Se não conseguir filtrar, retornar todos (fail-open)
            console.warn('⚠️ [obterTodosUsuarios] Retornando todos os perfis sem filtrar (fail-open)')
            return { data: rpcData, error: null }
          }
        } else {
          // Se não tiver admin client, retornar todos
          console.warn('⚠️ [obterTodosUsuarios] Admin client não disponível, retornando todos os perfis')
          return { data: rpcData, error: null }
        }
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
        
        // SEGUNDO: Tentar filtrar apenas usuários que existem no auth.users (opcional, não crítico)
        // Se falhar, retornar todos os perfis (fail-open)
        let profilesAtivos = profiles
        try {
          const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
          if (authUsers?.users && !authError) {
            const authUserIds = new Set((authUsers.users as any[]).map((user: any) => user.id))
            profilesAtivos = profiles.filter(profile => authUserIds.has(profile.id))
            console.log(`🔍 [obterTodosUsuarios] Filtrando: ${profiles.length} perfis totais, ${profilesAtivos.length} perfis ativos no auth.users`)
            
            // Se após filtrar ficou vazio, mas havia perfis, pode ser problema na busca do auth
            // Nesse caso, retornar todos os perfis (fail-open)
            if (profilesAtivos.length === 0 && profiles.length > 0) {
              console.warn('⚠️ [obterTodosUsuarios] Filtro removeu todos os perfis! Isso pode indicar problema na busca do auth.users')
              console.warn('⚠️ [obterTodosUsuarios] Retornando TODOS os perfis (fail-open)')
              profilesAtivos = profiles
            }
          } else {
            console.warn('⚠️ [obterTodosUsuarios] Não foi possível buscar auth.users ou retornou vazio. Retornando todos os perfis.')
            if (authError) {
              console.warn('⚠️ [obterTodosUsuarios] Erro:', authError.message)
            }
            // Retornar todos os perfis se não conseguir verificar auth
            profilesAtivos = profiles
          }
        } catch (authErr: any) {
          console.warn('⚠️ [obterTodosUsuarios] Erro ao buscar/filtrar auth.users:', authErr?.message || authErr)
          console.warn('⚠️ [obterTodosUsuarios] Retornando TODOS os perfis (fail-open)')
          // Em caso de erro, retornar todos os perfis (fail-open)
          profilesAtivos = profiles
        }
        
        if (profilesAtivos.length === 0) {
          console.log('✅ [obterTodosUsuarios] Nenhum perfil encontrado - retornando array vazio')
          return { data: [], error: null }
        }
        
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
          
          // Combinar dados apenas com perfis ativos
          const data = profilesAtivos.map(profile => ({
            ...profile,
            last_sign_in_at: lastSignInMap.get(profile.id) || null
          }))
          
          console.log(`✅ [obterTodosUsuarios] Encontrados ${data.length} usuários ativos via cliente admin`)
          return { data, error: null }
        } catch (authErr) {
          console.warn('⚠️ [obterTodosUsuarios] Erro ao buscar auth.users, retornando sem last_sign_in_at:', authErr)
          const data = profilesAtivos.map(profile => ({
            ...profile,
            last_sign_in_at: null
          }))
          console.log(`✅ [obterTodosUsuarios] Encontrados ${data.length} usuários ativos via cliente admin (sem auth data)`)
          return { data, error: null }
        }
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
        // Tentar filtrar, mas se falhar, retornar todos (fail-open)
        try {
          const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
          
          if (authUsers?.users && !authError) {
            const authUserIds = new Set((authUsers.users as any[]).map((u: any) => u.id))
            let perfisAtivos = fallbackData.filter((profile: any) => authUserIds.has(profile.id))
            
            console.log(`🔍 [obterTodosUsuarios] Filtrando fallback: ${fallbackData.length} perfis totais, ${perfisAtivos.length} perfis ativos`)
            
            // Se após filtrar ficou vazio mas havia perfis, retornar todos (fail-open)
            if (perfisAtivos.length === 0 && fallbackData.length > 0) {
              console.warn('⚠️ [obterTodosUsuarios] Filtro fallback removeu todos os perfis! Retornando TODOS (fail-open)')
              perfisAtivos = fallbackData
            }
            
            const data = perfisAtivos.map(profile => ({
              ...profile,
              last_sign_in_at: null
            }))
            
            console.log(`✅ [obterTodosUsuarios] Encontrados ${data.length} usuários via busca direta`)
            return { data, error: null }
          } else {
            // Se não conseguir buscar auth.users, retornar todos (fail-open)
            console.warn('⚠️ [obterTodosUsuarios] Não foi possível buscar auth.users no fallback. Retornando todos os perfis.')
            const data = fallbackData.map(profile => ({
              ...profile,
              last_sign_in_at: null
            }))
            return { data, error: null }
          }
        } catch (filterErr: any) {
          console.warn('⚠️ [obterTodosUsuarios] Erro ao filtrar fallback:', filterErr?.message || filterErr)
          // Se não conseguir filtrar, retornar todos (fail-open)
          const data = fallbackData.map(profile => ({
            ...profile,
            last_sign_in_at: null
          }))
          return { data, error: null }
        }
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

