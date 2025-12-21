import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { desconectarInstancia } from '@/lib/whatsapp-instance-manager'

/**
 * POST - Limpar credenciais WhatsApp (para forçar novo QR Code)
 * CRÍTICO: Desconecta o socket ANTES de limpar credenciais
 */
export async function POST(request: NextRequest) {
  try {
    // CRÍTICO: Desconectar socket ANTES de limpar credenciais
    // Isso garante que o WhatsApp não fica tentando usar uma sessão inválida
    console.log('🔄 [WhatsApp Clear Auth] Desconectando socket primeiro...')
    try {
      await desconectarInstancia('plenipay')
      console.log('✅ [WhatsApp Clear Auth] Socket desconectado')
      // Aguardar um pouco para garantir desconexão completa
      await new Promise(resolve => setTimeout(resolve, 3000))
    } catch (disconnectError: any) {
      console.warn('⚠️ [WhatsApp Clear Auth] Erro ao desconectar (pode não estar conectado):', disconnectError.message)
      // Continuar mesmo se erro ao desconectar
    }
    
    const authDir = path.join(process.cwd(), 'whatsapp_auth')
    
    try {
      // Verificar se existe
      try {
        await fs.access(authDir)
        console.log('🧹 [WhatsApp Clear Auth] Removendo credenciais...')
      } catch {
        console.log('ℹ️ [WhatsApp Clear Auth] Diretório não existe (ok)')
        return NextResponse.json({
          success: true,
          message: 'Não havia credenciais para remover.',
        })
      }
      
      // Remover com força máxima
      console.log('🧹 [WhatsApp Clear Auth] Removendo diretório com força máxima...')
      await fs.rm(authDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 1000 })
      console.log('✅ [WhatsApp Clear Auth] Diretório removido!')
      
      // Aguardar mais tempo para garantir que foi completamente deletado
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Verificar se realmente foi removido
      try {
        await fs.access(authDir)
        console.error('❌ [WhatsApp Clear Auth] ERRO: Diretório ainda existe!')
        return NextResponse.json(
          { 
            success: false,
            error: 'Não foi possível remover completamente o diretório. Tente deletar manualmente a pasta whatsapp_auth.'
          },
          { status: 500 }
        )
      } catch (verifyError: any) {
        if (verifyError.code === 'ENOENT') {
          console.log('✅ [WhatsApp Clear Auth] Confirmado: Diretório foi completamente removido!')
          return NextResponse.json({
            success: true,
            message: 'Credenciais removidas com sucesso! Agora você pode gerar um novo QR Code.',
          })
        }
        throw verifyError
      }
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return NextResponse.json({
          success: true,
          message: 'Não havia credenciais para remover.',
        })
      }
      throw error
    }
  } catch (error: any) {
    console.error('❌ [WhatsApp Clear Auth] Erro:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Erro ao limpar credenciais' 
      },
      { status: 500 }
    )
  }
}


