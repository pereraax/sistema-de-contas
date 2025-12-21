import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

/**
 * Endpoint para forçar limpeza completa das credenciais
 * Use quando o QR Code não aparecer
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🧹 [Force Clean] Iniciando limpeza completa...')
    
    const authDir = path.join(process.cwd(), 'whatsapp_auth')
    
    try {
      // Verificar se existe
      await fs.access(authDir)
      
      // Deletar tudo
      console.log('🗑️ [Force Clean] Deletando pasta whatsapp_auth...')
      await fs.rm(authDir, { recursive: true, force: true })
      
      // Aguardar um pouco para garantir
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Verificar se foi deletado
      try {
        await fs.access(authDir)
        console.error('❌ [Force Clean] Pasta ainda existe após deletar!')
        return NextResponse.json({
          success: false,
          message: 'Erro: Não foi possível deletar a pasta whatsapp_auth completamente',
        }, { status: 500 })
      } catch (e: any) {
        if (e.code === 'ENOENT') {
          console.log('✅ [Force Clean] Pasta deletada com sucesso!')
        }
      }
      
      console.log('✅ [Force Clean] Limpeza completa realizada!')
      return NextResponse.json({
        success: true,
        message: 'Credenciais deletadas com sucesso! Agora clique em "Conectar WhatsApp" novamente.',
      })
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        console.log('ℹ️ [Force Clean] Pasta whatsapp_auth não existe (já está limpo)')
        return NextResponse.json({
          success: true,
          message: 'Já estava limpo! Pode conectar agora.',
        })
      }
      
      throw error
    }
  } catch (error: any) {
    console.error('❌ [Force Clean] Erro:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Erro ao limpar credenciais' 
      },
      { status: 500 }
    )
  }
}












