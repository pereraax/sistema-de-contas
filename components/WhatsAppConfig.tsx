'use client'

import { useState, useEffect } from 'react'
import { MessageCircle, QrCode, CheckCircle, XCircle, Loader2, Settings, ExternalLink } from 'lucide-react'
import { createNotification } from './NotificationBell'

export default function WhatsAppConfig() {
  const [apiKey, setApiKey] = useState('')
  const [instanceId, setInstanceId] = useState('default')
  const [status, setStatus] = useState<{ connected: boolean; loading: boolean; qr: string | null }>({
    connected: false,
    loading: false,
    qr: null,
  })
  const [webhookUrl, setWebhookUrl] = useState('')

  useEffect(() => {
    // Carregar configurações salvas
    const savedApiKey = localStorage.getItem('whapi_api_key')
    const savedInstanceId = localStorage.getItem('whapi_instance_id')
    
    if (savedApiKey) setApiKey(savedApiKey)
    if (savedInstanceId) setInstanceId(savedInstanceId)
    
    // Gerar URL do webhook automaticamente
    // Em produção, usar a URL real do domínio
    // Em desenvolvimento, pode precisar de ngrok
    const baseUrl = window.location.origin
    const webhookPath = `${baseUrl}/api/whatsapp/webhook`
    setWebhookUrl(webhookPath)
    
    // Verificar status se já tem API Key
    if (savedApiKey) {
      verificarStatus()
    }
  }, [])

  const verificarStatus = async () => {
    setStatus({ ...status, loading: true })
    
    try {
      const response = await fetch('/api/whatsapp/whapi/connect', {
        method: 'GET',
      })
      
      const data = await response.json()
      
      if (data.error) {
        createNotification(`Erro: ${data.error}`, 'error')
        setStatus({ connected: false, loading: false, qr: null })
        return
      }
      
      setStatus({
        connected: data.connected,
        loading: false,
        qr: null,
      })
    } catch (error: any) {
      createNotification(`Erro ao verificar status: ${error.message}`, 'error')
      setStatus({ connected: false, loading: false, qr: null })
    }
  }

  const conectar = async () => {
    if (!apiKey.trim()) {
      createNotification('Por favor, insira sua API Key do Whapi.Cloud', 'warning')
      return
    }

    setStatus({ ...status, loading: true })

    try {
      // Salvar configurações
      localStorage.setItem('whapi_api_key', apiKey)
      localStorage.setItem('whapi_instance_id', instanceId)
      
      // Enviar API Key para o servidor (via header ou body)
      // Por enquanto, vamos usar variável de ambiente no servidor
      // O usuário precisa adicionar no .env.local
      
      const response = await fetch('/api/whatsapp/whapi/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey,
          instanceId,
        }),
      })

      const data = await response.json()

      if (data.error) {
        createNotification(`Erro: ${data.error}`, 'error')
        setStatus({ connected: false, loading: false, qr: null })
        return
      }

      if (data.qr) {
        setStatus({
          connected: false,
          loading: false,
          qr: data.qr,
        })
        createNotification('QR Code gerado! Escaneie com seu WhatsApp.', 'success')
      } else if (data.success) {
        setStatus({
          connected: true,
          loading: false,
          qr: null,
        })
        createNotification('WhatsApp conectado com sucesso!', 'success')
      }
    } catch (error: any) {
      createNotification(`Erro ao conectar: ${error.message}`, 'error')
      setStatus({ connected: false, loading: false, qr: null })
    }
  }

  const configurarWebhook = async () => {
    if (!apiKey.trim()) {
      createNotification('Por favor, configure a API Key primeiro', 'warning')
      return
    }

    if (!webhookUrl.trim()) {
      createNotification('Por favor, verifique a URL do webhook', 'warning')
      return
    }

    try {
      const response = await fetch('/api/whatsapp/whapi/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey,
          instanceId,
          webhookUrl,
        }),
      })

      const data = await response.json()

      if (data.error) {
        createNotification(`Erro: ${data.error}`, 'error')
        return
      }

      createNotification('✅ Webhook configurado com sucesso! As mensagens serão recebidas automaticamente.', 'success')
      
      // Atualizar status após configurar webhook
      setTimeout(() => {
        verificarStatus()
      }, 1000)
    } catch (error: any) {
      createNotification(`Erro ao configurar webhook: ${error.message}`, 'error')
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-brand-dark rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <MessageCircle className="w-6 h-6 text-brand-primary" />
          <h2 className="text-xl font-bold text-brand-midnight dark:text-brand-clean">
            Configuração WhatsApp (Whapi.Cloud)
          </h2>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Conecte seu WhatsApp ao PleniPay usando Whapi.Cloud. É simples, rápido e confiável!
        </p>

        {/* Status da Conexão */}
        <div className="mb-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {status.loading ? (
                <Loader2 className="w-5 h-5 animate-spin text-brand-primary" />
              ) : status.connected ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              <span className="font-medium text-brand-midnight dark:text-brand-clean">
                Status: {status.loading ? 'Verificando...' : status.connected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
            <button
              onClick={verificarStatus}
              disabled={status.loading}
              className="px-3 py-1.5 text-sm bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 disabled:opacity-50"
            >
              Atualizar
            </button>
          </div>
        </div>

        {/* API Key */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-brand-midnight dark:text-brand-clean mb-2">
            Token do Whapi.Cloud
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Cole seu Token aqui (ex: GBQGcNlxCagf7QFD6XPQrkQLwO9iR5+S)"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-brand-dark text-brand-midnight dark:text-brand-clean focus:ring-2 focus:ring-brand-primary focus:border-transparent"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Encontre seu Token no Dashboard do Whapi.Cloud → API URL and Token
          </p>
        </div>

        {/* API URL Info */}
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-800 dark:text-blue-200">
            <strong>API URL:</strong> <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">https://gate.whapi.cloud/</code>
            <br />
            <span className="text-blue-600 dark:text-blue-300">Esta URL já está configurada no código.</span>
          </p>
        </div>

        {/* Instance ID */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-brand-midnight dark:text-brand-clean mb-2">
            Instance ID (opcional)
          </label>
          <input
            type="text"
            value={instanceId}
            onChange={(e) => setInstanceId(e.target.value)}
            placeholder="default"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-brand-dark text-brand-midnight dark:text-brand-clean focus:ring-2 focus:ring-brand-primary focus:border-transparent"
          />
        </div>

        {/* Botão Conectar */}
        <button
          onClick={conectar}
          disabled={status.loading || !apiKey.trim()}
          className="w-full px-4 py-3 bg-brand-primary text-white rounded-lg font-medium hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {status.loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Conectando...
            </>
          ) : (
            <>
              <MessageCircle className="w-5 h-5" />
              Conectar WhatsApp
            </>
          )}
        </button>

        {/* QR Code */}
        {status.qr && (
          <div className="mt-6 p-4 bg-white dark:bg-brand-dark rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-brand-midnight dark:text-brand-clean mb-3 flex items-center gap-2">
              <QrCode className="w-4 h-4" />
              Escaneie o QR Code
            </h3>
            <div className="flex justify-center">
              <img
                src={`data:image/png;base64,${status.qr}`}
                alt="QR Code WhatsApp"
                className="w-64 h-64 border border-gray-200 dark:border-gray-700 rounded-lg"
              />
            </div>
            <p className="mt-3 text-xs text-center text-gray-600 dark:text-gray-400">
              Abra o WhatsApp no seu celular → Menu (3 pontos) → Aparelhos conectados → Conectar um aparelho
            </p>
          </div>
        )}

        {/* Webhook Configuration */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-brand-primary" />
            <h3 className="text-lg font-medium text-brand-midnight dark:text-brand-clean">
              Configuração de Webhook
            </h3>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-brand-midnight dark:text-brand-clean mb-2">
              URL do Webhook
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://seu-dominio.com/api/whatsapp/webhook"
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-brand-dark text-brand-midnight dark:text-brand-clean focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              />
              <button
                onClick={() => {
                  const url = `${window.location.origin}/api/whatsapp/webhook`
                  setWebhookUrl(url)
                  createNotification('URL do webhook atualizada!', 'success')
                }}
                className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-brand-midnight dark:text-brand-clean rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-sm font-medium"
                title="Usar URL atual"
              >
                Auto
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              ⚠️ <strong>Importante:</strong> Esta URL precisa ser acessível publicamente.
              <br />
              • Em produção: use seu domínio real
              <br />
              • Em desenvolvimento: use <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">ngrok http 3000</code> e cole a URL aqui
            </p>
          </div>

          <button
            onClick={configurarWebhook}
            disabled={!apiKey.trim() || !webhookUrl}
            className="w-full px-4 py-2 bg-brand-primary text-white rounded-lg font-medium hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Configurar Webhook no Whapi.Cloud
          </button>
          
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
            ⚠️ Importante: Configure o webhook no Whapi.Cloud para receber mensagens automaticamente.
            <br />
            A URL acima será enviada para o Whapi.Cloud quando você clicar no botão.
          </p>
        </div>
      </div>

      {/* Instruções */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
        <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">📋 Passo a Passo Completo:</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800 dark:text-blue-200">
          <li>
            <strong>Cole seu Token:</strong> Você já tem o Token do Whapi.Cloud (ex: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">GBQGcNlxCagf7QFD6XPQrkQLwO9iR5+S</code>)
          </li>
          <li>
            <strong>Configure o Webhook:</strong> 
            <br />
            • Se estiver em produção: a URL já está correta
            <br />
            • Se estiver em desenvolvimento local: use ngrok:
            <br />
            <code className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded block mt-1">ngrok http 3000</code>
            <br />
            Depois cole a URL do ngrok + <code>/api/whatsapp/webhook</code>
          </li>
          <li>
            <strong>Clique em "Configurar Webhook no Whapi.Cloud"</strong> para registrar a URL
          </li>
          <li>
            <strong>Conecte o WhatsApp:</strong> Clique em "Conectar WhatsApp" e escaneie o QR Code
          </li>
          <li>
            <strong>Pronto!</strong> Agora você pode receber e enviar mensagens via WhatsApp
          </li>
        </ol>
      </div>

      {/* Aviso sobre Webhook */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
        <h3 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2 flex items-center gap-2">
          ⚠️ Importante sobre Webhook
        </h3>
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          O webhook é <strong>essencial</strong> para receber mensagens. Sem ele, você só consegue <strong>enviar</strong> mensagens, mas não <strong>receber</strong>.
          <br />
          <br />
          <strong>Configure o webhook ANTES de conectar o WhatsApp</strong> para garantir que tudo funcione corretamente!
        </p>
      </div>
    </div>
  )
}













