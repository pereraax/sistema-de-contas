import { NextRequest, NextResponse } from 'next/server'

// API para Text-to-Speech usando Google Cloud TTS (gratuito)
export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    if (!text) {
      return NextResponse.json(
        { error: 'Texto não fornecido' },
        { status: 400 }
      )
    }

    // Verificar se Google Cloud TTS está configurado
    const googleTtsKey = process.env.GOOGLE_TTS_API_KEY
    if (!googleTtsKey) {
      return NextResponse.json(
        { error: 'Google TTS não configurado' },
        { status: 503 }
      )
    }

    // Usar Google Cloud Text-to-Speech API
    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${googleTtsKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode: 'pt-BR',
            // Tentar vozes masculinas em ordem de preferência
            // pt-BR-Neural2-C é masculina, pt-BR-Neural2-B também pode ser
            name: 'pt-BR-Neural2-C', // Voz neural moderna masculina (mais grave)
            ssmlGender: 'MALE' // Garantir voz masculina
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: 0.95, // Velocidade ligeiramente mais lenta para parecer mais masculina
            pitch: -4.0, // Tom muito mais grave (masculino) - range: -20.0 a 20.0
            volumeGainDb: 0
          }
        }),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error('Erro no Google TTS:', error)
      return NextResponse.json(
        { error: 'Erro ao gerar áudio' },
        { status: 500 }
      )
    }

    const data = await response.json()
    const audioContent = data.audioContent

    // Converter base64 para blob
    const audioBuffer = Buffer.from(audioContent, 'base64')
    
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length.toString(),
      },
    })
  } catch (error: any) {
    console.error('Erro no TTS:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao processar TTS' },
      { status: 500 }
    )
  }
}

