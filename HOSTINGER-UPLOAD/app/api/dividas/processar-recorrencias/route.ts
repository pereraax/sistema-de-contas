import { processarRecorrencias } from '@/lib/processarRecorrencias'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const result = await processarRecorrencias()
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: result.message,
      novasDividasCriadas: result.data?.length || 0,
      dividasCriadas: result.data?.length || 0
    })
  } catch (error: any) {
    console.error('Erro ao processar recorrências:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao processar recorrências' },
      { status: 500 }
    )
  }
}

