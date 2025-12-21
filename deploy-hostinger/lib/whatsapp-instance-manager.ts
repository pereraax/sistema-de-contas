/**
 * Gerenciador de Instâncias WhatsApp - Sistema Próprio PleniPay
 * Gerencia múltiplas sessões WhatsApp usando Baileys
 */

import { connectWhatsApp, enviarMensagemWhatsApp, getWhatsAppStatus, disconnectWhatsApp } from './whatsapp-baileys'
import { createClient } from './supabase/server'

interface WhatsAppInstance {
  id: string
  instanceName: string
  status: 'disconnected' | 'connecting' | 'connected' | 'error'
  phoneNumber: string | null
  qrCode: string | null
  createdAt: Date
  connectedAt: Date | null
}

/**
 * Criar ou obter instância WhatsApp
 */
export async function criarOuObterInstancia(instanceName: string = 'plenipay'): Promise<{ success: boolean; instance?: any; error?: string }> {
  try {
    const supabase = await createClient()

    // Verificar se instância já existe
    const { data: existing } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('instance_name', instanceName)
      .single()

    if (existing) {
      return {
        success: true,
        instance: existing,
      }
    }

    // Criar nova instância
    const { data: newInstance, error } = await supabase
      .from('whatsapp_instances')
      .insert({
        instance_name: instanceName,
        status: 'disconnected',
      })
      .select()
      .single()

    if (error) {
      return {
        success: false,
        error: `Erro ao criar instância: ${error.message}`,
      }
    }

    return {
      success: true,
      instance: newInstance,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Erro ao criar instância',
    }
  }
}

/**
 * Conectar instância WhatsApp
 */
export async function conectarInstancia(instanceName: string = 'plenipay', forceNew: boolean = false): Promise<{ success: boolean; qrCode?: string; error?: string }> {
  try {
    console.log('🔄 [Instance Manager] ==========================================')
    console.log('🔄 [Instance Manager] Iniciando conectarInstancia')
    console.log('🔄 [Instance Manager] instanceName:', instanceName)
    console.log('🔄 [Instance Manager] forceNew:', forceNew)
    console.log('🔄 [Instance Manager] ==========================================')

    const supabase = await createClient()

    // Criar ou obter instância
    console.log('📋 [Instance Manager] Criando/obtendo instância...')
    const instanceResult = await criarOuObterInstancia(instanceName)
    if (!instanceResult.success || !instanceResult.instance) {
      console.error('❌ [Instance Manager] Erro ao criar/obter instância:', instanceResult.error)
      return {
        success: false,
        error: instanceResult.error || 'Erro ao criar instância',
      }
    }
    console.log('✅ [Instance Manager] Instância obtida:', instanceResult.instance.id)

    // Atualizar status para "connecting"
    console.log('📝 [Instance Manager] Atualizando status para "connecting"...')
    await supabase
      .from('whatsapp_instances')
      .update({
        status: 'connecting',
        updated_at: new Date().toISOString(),
      })
      .eq('instance_name', instanceName)
    console.log('✅ [Instance Manager] Status atualizado')

    // Conectar WhatsApp via Baileys
    console.log('🔌 [Instance Manager] Chamando connectWhatsApp...')
    console.log('🔌 [Instance Manager] Aguardando resultado (pode levar até 90 segundos)...')
    
    const result: any = await connectWhatsApp(forceNew)
    
    console.log('📥 [Instance Manager] ==========================================')
    console.log('📥 [Instance Manager] Resultado do connectWhatsApp:')
    console.log('   - success:', result?.success)
    console.log('   - hasQR:', !!result?.qrCode)
    console.log('   - connected:', result?.connected)
    console.log('   - error:', result?.error)
    console.log('📥 [Instance Manager] ==========================================')

    // Verificar se result é um objeto com success ou é o socket
    let connectionResult: any
    if (result && typeof result === 'object' && 'success' in result) {
      connectionResult = result
    } else {
      // Se retornou socket, verificar status atual
      const status = getWhatsAppStatus()
      connectionResult = {
        success: status.connected || !!status.qrCode,
        connected: status.connected,
        qrCode: status.qrCode,
      }
      console.log('📥 [Instance Manager] Status do Baileys após conexão:')
      console.log('   - connected:', status.connected)
      console.log('   - hasQRCode:', !!status.qrCode)
      console.log('   - qrCode type:', typeof status.qrCode)
      console.log('   - qrCode length:', status.qrCode?.length || 0)
    }

    // CRÍTICO: Se não tem QR Code no resultado mas deveria ter, aguardar um pouco
    // O Baileys pode demorar alguns segundos para gerar o QR Code
    if (connectionResult.success && !connectionResult.qrCode && !connectionResult.connected) {
      console.log('⏳ [Instance Manager] Aguardando QR Code ser gerado pelo Baileys...')
      console.log('⏳ [Instance Manager] Isso pode levar 5-30 segundos...')
      
      // Aguardar até 30 segundos para o QR Code aparecer
      for (let i = 0; i < 30; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000)) // Aguardar 1 segundo
        
        const statusCheck = getWhatsAppStatus()
        if (statusCheck.qrCode) {
          console.log(`✅ [Instance Manager] QR Code encontrado após ${i + 1} segundos!`)
          connectionResult.qrCode = statusCheck.qrCode
          break
        }
        
        // Log a cada 5 segundos
        if ((i + 1) % 5 === 0) {
          console.log(`⏳ [Instance Manager] Ainda aguardando QR Code... (${i + 1}/30 segundos)`)
        }
      }
    }

    if (connectionResult.success && connectionResult.qrCode) {
      // IMPORTANTE: O Baileys retorna uma string CURTA (100-300 chars) que representa o conteúdo do QR Code
      // Esta string NÃO é uma imagem base64 ainda - precisa ser convertida
      // NÃO validar tamanho ANTES da conversão, pois a string original é pequena por design
      
      let qrCodeBase64 = connectionResult.qrCode
      
      console.log('🔄 [Instance Manager] ==========================================')
      console.log('🔄 [Instance Manager] Processando QR Code do Baileys...')
      console.log('   - Tipo:', typeof qrCodeBase64)
      console.log('   - Tamanho original:', qrCodeBase64?.length || 0)
      console.log('   - Preview:', qrCodeBase64?.substring(0, 100) || 'N/A')
      
      // Se não começar com data:image, converter usando qrcode
      if (!qrCodeBase64.startsWith('data:image')) {
        try {
          const qrcode = await import('qrcode')
          
          console.log('🔄 [Instance Manager] Gerando imagem QR Code...')
          
          // Gerar imagem QR Code com configurações otimizadas para WhatsApp
          qrCodeBase64 = await qrcode.toDataURL(qrCodeBase64, {
            errorCorrectionLevel: 'H', // Nível H (High) - melhor correção de erros
            type: 'image/png',
            // Removido: quality não é válido para PNG
            margin: 4, // Margem maior
            width: 512, // Tamanho grande
            color: {
              dark: '#000000', // Preto absoluto
              light: '#FFFFFF', // Branco absoluto
            },
          })
          
          console.log('✅ [Instance Manager] QR Code convertido com sucesso!')
          console.log('   - Tamanho da imagem:', qrCodeBase64.length)
        } catch (e: any) {
          console.error('❌ [Instance Manager] Erro ao converter QR Code:', e.message)
          console.error('   - Stack:', e.stack)
          throw new Error(`Erro ao gerar imagem do QR Code: ${e.message}`)
        }
      } else {
        console.log('✅ [Instance Manager] QR Code já está em formato de imagem!')
      }
      
      // CRÍTICO: Validar QR Code APÓS conversão
      // Agora sim, deve ser uma imagem base64 válida com pelo menos 5000 caracteres
      let base64Only = qrCodeBase64
      if (qrCodeBase64.startsWith('data:image')) {
        base64Only = qrCodeBase64.includes(',') ? qrCodeBase64.split(',')[1] : qrCodeBase64.replace(/^data:image\/[^;]+;base64,?/, '')
      }
      const base64Limpo = base64Only.trim().replace(/\s/g, '').replace(/[^A-Za-z0-9+\/=]/g, '')
      const TAMANHO_MINIMO = 5000
      
      console.log('🔍 [Instance Manager] Validando QR Code convertido...')
      console.log('   - Tamanho do base64:', base64Limpo.length)
      console.log('   - Tamanho mínimo:', TAMANHO_MINIMO)
      
      if (!qrCodeBase64 || base64Limpo.length < TAMANHO_MINIMO) {
        console.error(`❌ [Instance Manager] QR Code INVÁLIDO ou TRUNCADO após conversão!`)
        console.error(`   - Tamanho do base64: ${base64Limpo.length} caracteres`)
        console.error(`   - Tamanho mínimo esperado: ${TAMANHO_MINIMO} caracteres`)
        console.error(`   - Preview base64 (primeiros 100):`, base64Limpo.substring(0, 100))
        throw new Error(`QR Code inválido ou truncado após conversão (${base64Limpo.length} chars, mínimo ${TAMANHO_MINIMO})`)
      }
      
      console.log('✅ [Instance Manager] QR Code válido após conversão!')
      console.log('🔄 [Instance Manager] ==========================================')
      
      // CRÍTICO: Garantir que QR Code sempre começa com data:image/png;base64,
      if (!qrCodeBase64.startsWith('data:image/png;base64,')) {
        console.warn('⚠️ [Instance Manager] QR Code não tem prefixo correto, corrigindo...')
        // Remover espaços e quebras de linha
        let qrLimpo = qrCodeBase64.trim().replace(/\s/g, '')
        
        // Se já começa com data: mas não é png, tentar corrigir
        if (qrLimpo.startsWith('data:image')) {
          // Extrair apenas o base64 (depois da vírgula)
          const base64Part = qrLimpo.includes(',') ? qrLimpo.split(',')[1] : qrLimpo.replace(/^data:image\/[^;]+;base64,?/, '')
          qrLimpo = base64Part
        }
        
        // CRÍTICO: Validar e limpar o base64
        // Remover caracteres inválidos do base64 (apenas A-Z, a-z, 0-9, +, /, =)
        const base64Limpo = qrLimpo.replace(/[^A-Za-z0-9+\/=]/g, '')
        
        // Verificar se o base64 está válido
        if (base64Limpo.length < 100) {
          throw new Error(`Base64 muito curto após limpeza: ${base64Limpo.length} caracteres`)
        }
        
        // Verificar se começa com caracteres válidos de base64
        if (!/^[A-Za-z0-9+\/]/.test(base64Limpo)) {
          console.error('❌ [Instance Manager] Base64 começa com caractere inválido!')
          console.error('   - Primeiros 10 chars:', base64Limpo.substring(0, 10))
          throw new Error('Base64 inválido: começa com caractere não-base64')
        }
        
        qrCodeBase64 = `data:image/png;base64,${base64Limpo}`
        console.log('✅ [Instance Manager] QR Code corrigido e validado')
        console.log('   - Base64 length após limpeza:', base64Limpo.length)
      } else {
        // Mesmo se já começa com data:image/png;base64,, validar o base64
        const base64Part = qrCodeBase64.split(',')[1]
        if (base64Part) {
          // Validar que o base64 não tem caracteres inválidos
          const base64Limpo = base64Part.replace(/[^A-Za-z0-9+\/=]/g, '')
          if (base64Limpo !== base64Part) {
            console.warn('⚠️ [Instance Manager] Base64 tinha caracteres inválidos, limpando...')
            qrCodeBase64 = `data:image/png;base64,${base64Limpo}`
          }
          
          // Verificar se começa com caracteres válidos
          if (!/^[A-Za-z0-9+\/]/.test(base64Limpo)) {
            console.error('❌ [Instance Manager] Base64 inválido mesmo após limpeza!')
            throw new Error('Base64 inválido: contém caracteres não-base64')
          }
        }
      }

      // Salvar QR Code no banco IMEDIATAMENTE
      console.log('💾 [Instance Manager] Salvando QR Code no banco...')
      console.log('   - QR Code formatado corretamente:', qrCodeBase64.startsWith('data:image/png;base64,'))
      console.log('   - QR Code length:', qrCodeBase64.length)
      const { error: updateError } = await supabase
        .from('whatsapp_instances')
        .update({
          qr_code: qrCodeBase64,
          status: 'connecting',
          updated_at: new Date().toISOString(),
        })
        .eq('instance_name', instanceName)
      
      if (updateError) {
        console.error('❌ [Instance Manager] Erro ao salvar QR Code no banco:', updateError)
      } else {
        console.log('✅ [Instance Manager] QR Code salvo no banco com sucesso!')
      }

      return {
        success: true,
        qrCode: qrCodeBase64,
      }
    }

    if (connectionResult.success && connectionResult.connected) {
      // Já está conectado
      const status = getWhatsAppStatus()
      await supabase
        .from('whatsapp_instances')
        .update({
          status: 'connected',
          phone_number: status.phoneNumber || null,
          connected_at: new Date().toISOString(),
          qr_code: null,
          updated_at: new Date().toISOString(),
        })
        .eq('instance_name', instanceName)

      return {
        success: true,
        // Removido: connected não existe no tipo de retorno
      }
    }

    // Se chegou aqui, houve um erro
    console.error('❌ [Instance Manager] ==========================================')
    console.error('❌ [Instance Manager] ERRO ao conectar instância:')
    console.error('   - connectionResult:', connectionResult)
    console.error('   - hasQR:', !!connectionResult.qrCode)
    console.error('   - connected:', connectionResult.connected)
    console.error('   - error:', connectionResult.error)
    console.error('❌ [Instance Manager] ==========================================')
    
    return {
      success: false,
      error: connectionResult.error || 'Erro ao conectar. Verifique os logs do servidor para mais detalhes.',
    }
  } catch (error: any) {
    console.error('❌ [Instance Manager] ==========================================')
    console.error('❌ [Instance Manager] EXCEÇÃO ao conectar instância:')
    console.error('   - Message:', error.message)
    console.error('   - Stack:', error.stack)
    console.error('   - Full Error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2))
    console.error('❌ [Instance Manager] ==========================================')
    
    return {
      success: false,
      error: error.message || 'Erro ao conectar instância. Verifique os logs do servidor para mais detalhes.',
    }
  }
}

/**
 * Verificar status da instância
 */
export async function verificarStatusInstancia(instanceName: string = 'plenipay'): Promise<{ connected: boolean; status: string; phoneNumber: string | null; qrCode: string | null; error?: string }> {
  try {
    const supabase = await createClient()

    // Buscar instância no banco
    const { data: instance, error } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('instance_name', instanceName)
      .single()

    if (error || !instance) {
      // Verificar status direto do Baileys
      const status = getWhatsAppStatus()
      return {
        connected: status.connected,
        status: status.connected ? 'connected' : 'disconnected',
        phoneNumber: status.phoneNumber || null,
        qrCode: status.qrCode || null,
      }
    }

    // Verificar status real do Baileys
    const baileysStatus = getWhatsAppStatus()
    
    console.log('🔍 [Instance Manager] Status do Baileys:', {
      connected: baileysStatus.connected,
      hasUser: !!baileysStatus.user,
      phoneNumber: baileysStatus.phoneNumber,
      hasQR: !!baileysStatus.qrCode
    })
    
    // CRÍTICO: Se o Baileys está conectado mas o banco não reflete isso, atualizar imediatamente
    if (baileysStatus.connected && instance.status !== 'connected') {
      console.log('🔄 [Instance Manager] ==========================================')
      console.log('🔄 [Instance Manager] Baileys conectado mas banco não reflete!')
      console.log('   - Baileys connected:', baileysStatus.connected)
      console.log('   - Baileys phoneNumber:', baileysStatus.phoneNumber)
      console.log('   - Instance status:', instance.status)
      console.log('🔄 [Instance Manager] Atualizando banco...')
      console.log('🔄 [Instance Manager] ==========================================')
      
      const phoneNumber = baileysStatus.phoneNumber || instance.phone_number || null
      if (phoneNumber) {
        const { error: updateError } = await supabase
          .from('whatsapp_instances')
          .update({
            status: 'connected',
            phone_number: phoneNumber,
            connected_at: new Date().toISOString(),
            qr_code: null,
            updated_at: new Date().toISOString(),
          })
          .eq('instance_name', instanceName)
        
        if (updateError) {
          console.error('❌ [Instance Manager] Erro ao atualizar status:', updateError)
        } else {
          console.log('✅ [Instance Manager] Status sincronizado com Baileys!')
        }
      } else {
        console.warn('⚠️ [Instance Manager] Phone number não disponível, mas Baileys está conectado')
        // Atualizar mesmo sem phone number (pode aparecer depois)
        await supabase
          .from('whatsapp_instances')
          .update({
            status: 'connected',
            qr_code: null,
            updated_at: new Date().toISOString(),
          })
          .eq('instance_name', instanceName)
      }
    }

    // Usar status do Baileys como fonte da verdade
    // CRÍTICO: Priorizar QR Code do Baileys (mais atualizado)
    // IMPORTANTE: Se há QR Code no banco mas não no Baileys, pode estar expirado
    // QR Codes do WhatsApp expiram em ~60 segundos
    let currentQrCode: string | null = null
    
    console.log('🔍 [Instance Manager] Verificando QR Code disponível...')
    console.log('   - Baileys hasQR:', !!baileysStatus.qrCode)
    console.log('   - Banco hasQR:', !!instance.qr_code)
    console.log('   - Baileys QR tipo:', typeof baileysStatus.qrCode)
    console.log('   - Baileys QR length:', baileysStatus.qrCode?.length || 0)
    
    // Função auxiliar para normalizar QR Code (garantir formato data:image)
    const normalizarQRCode = (qrCode: string | null): string | null => {
      if (!qrCode || typeof qrCode !== 'string') return null
      
      // CRÍTICO: Validar tamanho mínimo - QR Code base64 deve ter pelo menos 5000 caracteres
      // Um QR Code válido em base64 geralmente tem 8000-15000 caracteres
      const tamanhoMinimo = 5000
      
      // Se já começa com data:image, extrair apenas o base64 para validar tamanho
      let base64Part = qrCode
      if (qrCode.startsWith('data:image')) {
        base64Part = qrCode.includes(',') ? qrCode.split(',')[1] : qrCode.replace(/^data:image\/[^;]+;base64,?/, '')
      }
      
      // Remover espaços e quebras de linha
      const qrLimpo = base64Part.trim().replace(/\s/g, '')
      
      // CRÍTICO: Validar tamanho - QR Code truncado tem menos de 5000 caracteres
      if (qrLimpo.length < tamanhoMinimo) {
        console.error(`❌ [Instance Manager] QR Code TRUNCADO ou INVÁLIDO!`)
        console.error(`   - Tamanho atual: ${qrLimpo.length} caracteres`)
        console.error(`   - Tamanho mínimo esperado: ${tamanhoMinimo} caracteres`)
        console.error(`   - Preview (primeiros 100 chars): ${qrLimpo.substring(0, 100)}`)
        return null
      }
      
      // Verificar se é base64 válido
      if (!/^[A-Za-z0-9+\/]/.test(qrLimpo)) {
        console.error('❌ [Instance Manager] QR Code não é base64 válido')
        return null
      }
      
      // Se já começa com data:image, retornar como está (após validar)
      if (qrCode.startsWith('data:image')) {
        // Validar que o base64 não foi truncado
        const base64Only = qrCode.includes(',') ? qrCode.split(',')[1] : qrCode.replace(/^data:image\/[^;]+;base64,?/, '')
        if (base64Only.length < tamanhoMinimo) {
          console.error(`❌ [Instance Manager] QR Code com prefixo data:image mas base64 está truncado (${base64Only.length} chars)`)
          return null
        }
        return qrCode
      }
      
      // Adicionar prefixo se necessário
      return `data:image/png;base64,${qrLimpo}`
    }
    
    if (baileysStatus.qrCode) {
      // QR Code do Baileys é sempre válido (acabou de ser gerado)
      // Normalizar para garantir formato correto
      currentQrCode = normalizarQRCode(baileysStatus.qrCode)
      console.log('✅ [Instance Manager] Usando QR Code do Baileys (válido)')
      console.log('   - QR Code normalizado:', currentQrCode ? 'Sim' : 'Não')
    } else if (instance.qr_code) {
      // Verificar se o QR Code do banco não está muito antigo
      const updatedAt = new Date(instance.updated_at || instance.created_at)
      const agora = new Date()
      const diferencaSegundos = (agora.getTime() - updatedAt.getTime()) / 1000
      
      // QR Codes expiram em ~60 segundos, mas vamos dar uma margem de 120 segundos
      if (diferencaSegundos < 120) {
        // Normalizar QR Code do banco
        currentQrCode = normalizarQRCode(instance.qr_code)
        console.log(`✅ [Instance Manager] Usando QR Code do banco (${Math.round(diferencaSegundos)}s atrás - ainda pode ser válido)`)
        console.log('   - QR Code normalizado:', currentQrCode ? 'Sim' : 'Não')
      } else {
        console.warn(`⚠️ [Instance Manager] QR Code do banco muito antigo (${Math.round(diferencaSegundos)}s) - provavelmente expirado`)
        // Limpar QR Code expirado
        currentQrCode = null
      }
    }
    
    const currentStatus = baileysStatus.connected ? 'connected' : currentQrCode ? 'connecting' : 'disconnected'
    const currentPhoneNumber = baileysStatus.phoneNumber || instance.phone_number || null
    
    console.log('🔍 [Instance Manager] Status verificado:', {
      connected: baileysStatus.connected,
      hasQRBaileys: !!baileysStatus.qrCode,
      hasQRBanco: !!instance.qr_code,
      currentQrCode: !!currentQrCode,
      status: currentStatus
    })

    // Atualizar no banco se mudou
    if (
      baileysStatus.connected !== (instance.status === 'connected') ||
      currentPhoneNumber !== instance.phone_number ||
      currentQrCode !== instance.qr_code
    ) {
      await supabase
        .from('whatsapp_instances')
        .update({
          status: currentStatus,
          phone_number: currentPhoneNumber,
          connected_at: baileysStatus.connected ? new Date().toISOString() : instance.connected_at,
          qr_code: currentQrCode,
          updated_at: new Date().toISOString(),
        })
        .eq('instance_name', instanceName)
    }

    return {
      connected: baileysStatus.connected,
      status: currentStatus,
      phoneNumber: currentPhoneNumber,
      qrCode: currentQrCode,
    }
  } catch (error: any) {
    return {
      connected: false,
      status: 'error',
      phoneNumber: null,
      qrCode: null,
      error: error.message || 'Erro ao verificar status',
    }
  }
}

/**
 * Desconectar instância
 */
export async function desconectarInstancia(instanceName: string = 'plenipay'): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // Desconectar via Baileys
    await disconnectWhatsApp()

    // Atualizar no banco
    await supabase
      .from('whatsapp_instances')
      .update({
        status: 'disconnected',
        phone_number: null,
        qr_code: null,
        disconnected_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('instance_name', instanceName)

    return {
      success: true,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Erro ao desconectar',
    }
  }
}

/**
 * Atualizar status quando conectar (chamado pelo Baileys)
 */
export async function atualizarStatusInstanciaConectada(instanceName: string, phoneNumber: string) {
  try {
    console.log('🔄 [Instance Manager] ==========================================')
    console.log('🔄 [Instance Manager] Atualizando status para conectado...')
    console.log('   - instanceName:', instanceName)
    console.log('   - phoneNumber:', phoneNumber)
    console.log('🔄 [Instance Manager] ==========================================')
    
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('whatsapp_instances')
      .update({
        status: 'connected',
        phone_number: phoneNumber,
        connected_at: new Date().toISOString(),
        qr_code: null, // Limpar QR Code quando conectado
        updated_at: new Date().toISOString(),
      })
      .eq('instance_name', instanceName)
      .select()

    if (error) {
      console.error('❌ [Instance Manager] Erro ao atualizar status:', error)
      throw error
    }

    console.log('✅ [Instance Manager] ==========================================')
    console.log('✅ [Instance Manager] Status atualizado com sucesso!')
    console.log('   - Status: connected')
    console.log('   - Phone Number:', phoneNumber)
    console.log('   - Updated rows:', data?.length || 0)
    console.log('✅ [Instance Manager] ==========================================')
  } catch (error: any) {
    console.error('❌ [Instance Manager] ==========================================')
    console.error('❌ [Instance Manager] Erro ao atualizar status:')
    console.error('   - Message:', error.message)
    console.error('   - Stack:', error?.stack)
    console.error('❌ [Instance Manager] ==========================================')
    throw error // Re-throw para que o chamador saiba que falhou
  }
}

/**
 * Listar todas as instâncias
 */
export async function listarInstancias(): Promise<{ instances: any[]; error?: string }> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return {
        instances: [],
        error: error.message,
      }
    }

    return {
      instances: data || [],
    }
  } catch (error: any) {
    return {
      instances: [],
      error: error.message || 'Erro ao listar instâncias',
    }
  }
}

/**
 * Enviar mensagem via instância
 */
export async function enviarMensagemInstancia(instanceName: string, numero: string, mensagem: string): Promise<boolean> {
  try {
    // Verificar se instância está conectada
    const status = await verificarStatusInstancia(instanceName)
    
    if (!status.connected) {
      console.error(`❌ [Instance ${instanceName}] Não está conectada`)
      return false
    }

    // Enviar mensagem via Baileys
    return await enviarMensagemWhatsApp(numero, mensagem)
  } catch (error: any) {
    console.error(`❌ [Instance ${instanceName}] Erro ao enviar mensagem:`, error)
    return false
  }
}


