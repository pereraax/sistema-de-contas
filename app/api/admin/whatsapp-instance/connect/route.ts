import { NextRequest, NextResponse } from 'next/server'
import { conectarInstancia } from '@/lib/whatsapp-instance-manager'

// Variável global para rastrear conexões em progresso
let conexaoEmProgresso = false
let promiseConexaoAtiva: Promise<any> | null = null

/**
 * POST - Conectar instância WhatsApp
 * Inicia conexão de forma assíncrona e retorna imediatamente
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const instanceName = body.instanceName || 'plenipay'
    const forceNew = body.forceNew === true

    console.log('🔄 [WhatsApp Instance API] ==========================================')
    console.log('🔄 [WhatsApp Instance API] Iniciando conexão:', instanceName)
    console.log('🔄 [WhatsApp Instance API] forceNew:', forceNew)
    console.log('🔄 [WhatsApp Instance API] conexaoEmProgresso:', conexaoEmProgresso)
    console.log('🔄 [WhatsApp Instance API] ==========================================')

    // Se já está conectando e não forçar novo, retornar status
    if (conexaoEmProgresso && promiseConexaoAtiva && !forceNew) {
      console.log('⚠️ [WhatsApp Instance API] Conexão já em progresso, aguardando...')
      return NextResponse.json({
        success: true,
        message: 'Conexão já em progresso. Aguarde...',
        status: 'connecting',
      })
    }

    // Se forceNew, cancelar conexão anterior
    if (forceNew && promiseConexaoAtiva) {
      console.log('🔄 [WhatsApp Instance API] Forçando nova conexão, cancelando anterior...')
      conexaoEmProgresso = false
      promiseConexaoAtiva = null
    }

    // Marcar como em progresso
    conexaoEmProgresso = true

    // CRÍTICO: Criar Promise e garantir execução imediata
    // Usar setTimeout(0) para garantir que executa após o response
    const iniciarConexao = async () => {
      try {
        console.log('🚀 [WhatsApp Instance API] ==========================================')
        console.log('🚀 [WhatsApp Instance API] Iniciando conexão assíncrona...')
        console.log('🚀 [WhatsApp Instance API] Chamando conectarInstancia...')
        console.log('🚀 [WhatsApp Instance API] instanceName:', instanceName)
        console.log('🚀 [WhatsApp Instance API] forceNew:', forceNew)
        console.log('🚀 [WhatsApp Instance API] ==========================================')
        
        const result = await conectarInstancia(instanceName, forceNew)
        
        console.log('✅ [WhatsApp Instance API] ==========================================')
        console.log('✅ [WhatsApp Instance API] Resultado da conexão:')
        console.log('   - success:', result.success)
        console.log('   - hasQR:', !!result.qrCode)
        console.log('   - connected:', (result as any).connected)
        console.log('   - error:', result.error)
        console.log('✅ [WhatsApp Instance API] ==========================================')
        
        return result
      } catch (error: any) {
        console.error('❌ [WhatsApp Instance API] ==========================================')
        console.error('❌ [WhatsApp Instance API] Erro na conexão assíncrona:')
        console.error('   - message:', error.message)
        console.error('   - stack:', error?.stack)
        console.error('❌ [WhatsApp Instance API] ==========================================')
        throw error
      } finally {
        // Liberar flag após um tempo para permitir nova tentativa
        setTimeout(() => {
          conexaoEmProgresso = false
          promiseConexaoAtiva = null
          console.log('🔄 [WhatsApp Instance API] Flag conexaoEmProgresso resetada')
        }, 15000)
      }
    }

    // Iniciar conexão de forma assíncrona usando setTimeout
    // Isso garante que a resposta HTTP é enviada antes de iniciar a conexão
    promiseConexaoAtiva = Promise.resolve().then(() => {
      // Pequeno delay para garantir que o response foi enviado
      return new Promise((resolve) => {
        setTimeout(() => {
          iniciarConexao().then(resolve).catch(() => resolve(null))
        }, 100)
      })
    })

    // Garantir que a Promise não seja perdida pelo garbage collector
    promiseConexaoAtiva.catch((error) => {
      console.error('❌ [WhatsApp Instance API] Promise de conexão rejeitada:', error)
    })

    // Retornar imediatamente - conexão está sendo iniciada em background
    console.log('✅ [WhatsApp Instance API] Retornando resposta imediata (conexão em background)')
    return NextResponse.json({
      success: true,
      message: 'Conexão iniciada. Aguarde alguns segundos e atualize o status.',
      status: 'connecting',
    })
  } catch (error: any) {
    conexaoEmProgresso = false
    promiseConexaoAtiva = null
    console.error('❌ [WhatsApp Instance API] Erro:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Erro ao iniciar conexão' 
      },
      { status: 500 }
    )
  }
}












