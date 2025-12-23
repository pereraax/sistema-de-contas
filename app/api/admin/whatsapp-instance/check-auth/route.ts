import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

/**
 * GET - Verificar se existem credenciais WhatsApp
 */
export async function GET(request: NextRequest) {
  try {
    const authDir = path.join(process.cwd(), 'whatsapp_auth')
    
    try {
      await fs.access(authDir)
      // Diretório existe, listar arquivos
      const files = await fs.readdir(authDir)
      
      return NextResponse.json({
        exists: true,
        hasCredentials: files.length > 0,
        files: files,
        message: files.length > 0 
          ? `Existem ${files.length} arquivo(s) de credenciais. Limpe antes de gerar novo QR Code.`
          : 'Diretório existe mas está vazio.',
      })
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return NextResponse.json({
          exists: false,
          hasCredentials: false,
          files: [],
          message: 'Não há credenciais salvas. Pode gerar QR Code.',
        })
      }
      throw error
    }
  } catch (error: any) {
    console.error('❌ [WhatsApp] Erro ao verificar credenciais:', error)
    return NextResponse.json(
      { 
        exists: false,
        hasCredentials: false,
        error: error.message || 'Erro ao verificar credenciais' 
      },
      { status: 500 }
    )
  }
}













