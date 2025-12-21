import { NextRequest, NextResponse } from 'next/server'
import { verificarStatusInstancia } from '@/lib/whatsapp-instance-manager'

export const dynamic = 'force-dynamic'

/**
 * GET - Verificar status da instância WhatsApp
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const instanceName = searchParams.get('instanceName') || 'plenipay'

    const status = await verificarStatusInstancia(instanceName)
    
    // CRÍTICO: Normalizar QR Code antes de retornar
    // QR Code base64 válido deve ter pelo menos 5000 caracteres
    const TAMANHO_MINIMO_QR_CODE = 5000
    let qrCode = status.qrCode
    if (qrCode && typeof qrCode === 'string') {
      try {
        // Extrair apenas a parte base64 para validar tamanho
        let base64Part = qrCode
        if (qrCode.startsWith('data:image')) {
          base64Part = qrCode.includes(',') ? qrCode.split(',')[1] : qrCode.replace(/^data:image\/[^;]+;base64,?/, '')
        }
        
        // Remover espaços e quebras de linha
        const base64Limpo = base64Part.trim().replace(/\s/g, '').replace(/[^A-Za-z0-9+\/=]/g, '')
        
        // CRÍTICO: Validar tamanho mínimo - QR Code truncado tem menos de 5000 caracteres
        if (base64Limpo.length < TAMANHO_MINIMO_QR_CODE) {
          console.error(`❌ [Status API] QR Code TRUNCADO ou INVÁLIDO!`)
          console.error(`   - Tamanho atual: ${base64Limpo.length} caracteres`)
          console.error(`   - Tamanho mínimo esperado: ${TAMANHO_MINIMO_QR_CODE} caracteres`)
          console.error(`   - Preview: ${base64Limpo.substring(0, 100)}...`)
          qrCode = null
        } else if (!/^[A-Za-z0-9+\/]/.test(base64Limpo)) {
          console.error('❌ [Status API] Base64 inválido: começa com caractere não-base64')
          console.error('   - Primeiros 10 chars:', base64Limpo.substring(0, 10))
          qrCode = null
        } else {
          // Garantir formato correto
          if (!qrCode.startsWith('data:image/png;base64,')) {
            qrCode = `data:image/png;base64,${base64Limpo}`
          } else {
            // Validar que o base64 após a vírgula está completo
            const afterComma = qrCode.split(',')[1]
            if (!afterComma || afterComma.length < TAMANHO_MINIMO_QR_CODE) {
              console.error(`❌ [Status API] QR Code com prefixo mas base64 truncado (${afterComma?.length || 0} chars)`)
              qrCode = null
            }
          }
        }
      } catch (error: any) {
        console.error('❌ [Status API] Erro ao normalizar QR Code:', error.message)
        qrCode = null
      }
    }
    
    return NextResponse.json({
      ...status,
      qrCode,
    })
  } catch (error: any) {
    console.error('❌ [Status API] ==========================================')
    console.error('❌ [Status API] ERRO ao verificar status:')
    console.error('   - Message:', error.message)
    console.error('   - Stack:', error.stack)
    console.error('   - Full Error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2))
    console.error('❌ [Status API] ==========================================')
    
    return NextResponse.json(
      { 
        connected: false,
        status: 'error',
        phoneNumber: null,
        qrCode: null,
        error: error.message || 'Erro ao verificar status. Verifique os logs do servidor.' 
      },
      { status: 500 }
    )
  }
}


