/**
 * Rota de teste para verificar se a tabela lembretes está acessível
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabaseAdmin = createAdminClient()
    
    if (!supabaseAdmin) {
      return NextResponse.json({
        success: false,
        error: 'SUPABASE_SERVICE_ROLE_KEY não está configurada',
        message: 'Configure SUPABASE_SERVICE_ROLE_KEY no .env.local',
      }, { status: 500 })
    }

    // Teste 1: Verificar se consegue fazer SELECT
    console.log('🧪 [Test Lembretes] Testando SELECT...')
    const { data: selectData, error: selectError } = await supabaseAdmin
      .from('lembretes')
      .select('id')
      .limit(1)

    if (selectError) {
      return NextResponse.json({
        success: false,
        error: 'Erro ao fazer SELECT',
        details: {
          code: selectError.code,
          message: selectError.message,
          details: selectError.details,
          hint: selectError.hint,
        },
        isTableNotFound: selectError.code === '42P01' || 
          selectError.message?.includes('does not exist') ||
          selectError.message?.includes('relation'),
        isPermissionError: selectError.code === '42501' ||
          selectError.message?.includes('permission denied') ||
          selectError.message?.includes('row-level security'),
      }, { status: 500 })
    }

    // Teste 2: Verificar se consegue fazer INSERT (sem salvar)
    console.log('🧪 [Test Lembretes] Testando estrutura da tabela...')
    const { data: tableInfo, error: tableError } = await supabaseAdmin
      .from('lembretes')
      .select('*')
      .limit(0)

    if (tableError && tableError.code !== 'PGRST116') { // PGRST116 = no rows returned (é OK)
      return NextResponse.json({
        success: false,
        error: 'Erro ao verificar estrutura da tabela',
        details: {
          code: tableError.code,
          message: tableError.message,
        },
      }, { status: 500 })
    }

    // Teste 3: Verificar se service_role está funcionando
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY
    const serviceKeyLength = process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0

    return NextResponse.json({
      success: true,
      message: 'Tabela lembretes está acessível!',
      tests: {
        select: '✅ Funcionou',
        tableStructure: '✅ Funcionou',
        serviceRoleKey: hasServiceKey ? `✅ Configurada (${serviceKeyLength} caracteres)` : '❌ Não configurada',
      },
      data: {
        selectResult: selectData,
        tableInfo: 'Tabela existe e está acessível',
      },
    })
  } catch (error: any) {
    console.error('❌ [Test Lembretes] Erro:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro desconhecido',
      stack: error.stack,
    }, { status: 500 })
  }
}








