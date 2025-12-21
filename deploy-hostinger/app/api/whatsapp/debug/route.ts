import { NextRequest, NextResponse } from 'next/server'
import { getWhatsAppStatus, getQRCodeAtual } from '@/lib/whatsapp-baileys'
import { promises as fs } from 'fs'
import path from 'path'

/**
 * Endpoint de debug para verificar status do WhatsApp
 */
export async function GET(request: NextRequest) {
  try {
    const status = getWhatsAppStatus()
    const qrCode = getQRCodeAtual()
    
    // Verificar se existe pasta de auth
    const authDir = path.join(process.cwd(), 'whatsapp_auth')
    let authDirExists = false
    let authFiles: string[] = []
    
    try {
      await fs.access(authDir)
      authDirExists = true
      const files = await fs.readdir(authDir)
      authFiles = files
    } catch (e: any) {
      if (e.code !== 'ENOENT') {
        console.error('Erro ao verificar auth dir:', e)
      }
    }
    
    return NextResponse.json({
      status: {
        connected: status.connected,
        hasUser: !!status.user,
        userId: status.user?.id || null,
        userName: status.user?.name || null,
      },
      qrCode: {
        exists: !!qrCode,
        length: qrCode?.length || 0,
        preview: qrCode ? qrCode.substring(0, 50) + '...' : null,
      },
      auth: {
        dirExists: authDirExists,
        files: authFiles,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json(
      { 
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    )
  }
}
