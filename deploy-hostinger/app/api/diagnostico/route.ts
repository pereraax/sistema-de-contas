import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  const diagnosticos: any = {
    timestamp: new Date().toISOString(),
    env: {},
    conexoes: {},
    tabelas: {},
    erros: []
  }

  try {
    // 1. Verificar variáveis de ambiente
    diagnosticos.env = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL 
        ? `${process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30)}...` 
        : '❌ NÃO DEFINIDA',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        ? `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 30)}...`
        : '❌ NÃO DEFINIDA',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
        ? `${process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 30)}...`
        : '❌ NÃO DEFINIDA',
    }

    // 2. Testar conexão cliente normal
    try {
      const supabase = await createClient()
      
      // Testar profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1)
      
      diagnosticos.tabelas.profiles = {
        acessivel: !profilesError,
        erro: profilesError?.message || null
      }

      // Testar admin_users
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('count')
        .limit(1)
      
      diagnosticos.tabelas.admin_users = {
        acessivel: !adminError,
        erro: adminError?.message || null
      }

      diagnosticos.conexoes.cliente_normal = {
        status: 'ok',
        profiles: !profilesError,
        admin_users: !adminError
      }

      if (profilesError) {
        diagnosticos.erros.push({
          tipo: 'tabela_profiles',
          mensagem: profilesError.message,
          detalhes: profilesError
        })
      }

      if (adminError) {
        diagnosticos.erros.push({
          tipo: 'tabela_admin_users',
          mensagem: adminError.message,
          detalhes: adminError
        })
      }

    } catch (err: any) {
      diagnosticos.conexoes.cliente_normal = {
        status: 'erro',
        erro: err.message
      }
      diagnosticos.erros.push({
        tipo: 'conexao_cliente',
        mensagem: err.message,
        detalhes: err
      })
    }

    // 3. Testar conexão admin
    try {
      const adminClient = createAdminClient()
      if (adminClient) {
        const { data: adminTestData, error: adminTestError } = await adminClient
          .from('admin_users')
          .select('count')
          .limit(1)
        
        diagnosticos.conexoes.cliente_admin = {
          status: adminTestError ? 'erro' : 'ok',
          erro: adminTestError?.message || null
        }
      } else {
        diagnosticos.conexoes.cliente_admin = {
          status: 'nao_disponivel',
          motivo: 'SUPABASE_SERVICE_ROLE_KEY não configurada'
        }
      }
    } catch (err: any) {
      diagnosticos.conexoes.cliente_admin = {
        status: 'erro',
        erro: err.message
      }
    }

    // 4. Verificar autenticação
    try {
      const supabase = await createClient()
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      diagnosticos.conexoes.autenticacao = {
        status: sessionError ? 'erro' : 'ok',
        tem_sessao: !!session,
        erro: sessionError?.message || null
      }
    } catch (err: any) {
      diagnosticos.conexoes.autenticacao = {
        status: 'erro',
        erro: err.message
      }
    }

  } catch (err: any) {
    diagnosticos.erro_geral = err.message
    diagnosticos.erros.push({
      tipo: 'erro_geral',
      mensagem: err.message,
      detalhes: err
    })
  }

  return NextResponse.json(diagnosticos, { status: 200 })
}
















