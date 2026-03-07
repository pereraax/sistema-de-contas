'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/crm/ui/Card'
import { Input } from '@/components/crm/ui/Input'
import { Copy, Check, AlertCircle, RefreshCw, Save } from 'lucide-react'

const WEBHOOK_ZAPI = '/api/whatsapp/zapi/webhook'
const CRM_CONFIG_KEY_ZAPI_WEBHOOK = 'crm_zapi_webhook_url'
const PLACEHOLDER_ZAPI_TUNEL = `https://SEU-TUNEL.ngrok.io${WEBHOOK_ZAPI}`

export default function CrmConfiguracoesPage() {
  const [webhookLogs, setWebhookLogs] = useState<Array<{ received_at: string; status: string; detail: string | null }>>([])
  const [copied, setCopied] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [zapiWebhookUrl, setZapiWebhookUrl] = useState('')
  const [zapiWebhookLoaded, setZapiWebhookLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<'success' | 'error' | null>(null)

  const siteUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const isLocalhost = typeof window !== 'undefined' && /^https?:\/\/localhost(:\d+)?$/i.test(siteUrl)
  const urlZapiProducao = siteUrl ? `${siteUrl}${WEBHOOK_ZAPI}` : ''
  const urlZapiTunel = zapiWebhookUrl.trim() || PLACEHOLDER_ZAPI_TUNEL

  useEffect(() => {
    fetch('/api/admin/crm/webhook-logs')
      .then((res) => res.json())
      .then((data) => setWebhookLogs(data.logs ?? []))
      .catch(() => setWebhookLogs([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetch(`/api/admin/platform-config?key=${encodeURIComponent(CRM_CONFIG_KEY_ZAPI_WEBHOOK)}`)
      .then((res) => (res.ok ? res.json() : { value: '' }))
      .then((data) => {
        if (typeof data?.value === 'string' && data.value.trim()) {
          setZapiWebhookUrl(data.value.trim())
        }
        setZapiWebhookLoaded(true)
      })
      .catch(() => setZapiWebhookLoaded(true))
  }, [])

  const saveZapiWebhookUrl = () => {
    let value = zapiWebhookUrl.trim()
    if (value && !value.endsWith(WEBHOOK_ZAPI)) {
      value = value.replace(/\/+$/, '') + WEBHOOK_ZAPI
    }
    setSaving(true)
    setSaveMessage(null)
    fetch('/api/admin/platform-config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: CRM_CONFIG_KEY_ZAPI_WEBHOOK, value }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.ok) {
          setSaveMessage('success')
          setZapiWebhookUrl(value)
        } else {
          setSaveMessage('error')
        }
      })
      .catch(() => setSaveMessage('error'))
      .finally(() => setSaving(false))
  }

  useEffect(() => {
    if (saveMessage === null) return
    const t = setTimeout(() => setSaveMessage(null), 3000)
    return () => clearTimeout(t)
  }, [saveMessage])

  const copyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const formatTime = (s: string) => new Date(s).toLocaleString('pt-BR')

  return (
    <div className="h-full min-h-0 flex flex-col overflow-hidden">
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Configurações</h1>
        <p className="text-zinc-500 text-sm mt-1">Ajustes do CRM WhatsApp</p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-white">Integração Z-API – Webhook</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-zinc-400">
            No painel da Z-API (z-api.io), na instância conectada ao WhatsApp, configure <strong>Webhook → Ao receber</strong> com a URL abaixo. A mesma rota funciona em produção e em localhost (com túnel).
          </p>

          {isLocalhost && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-200 text-sm">
              <AlertCircle className="flex-shrink-0 mt-0.5" size={18} />
              <div>
                <strong>Você está em localhost.</strong> A Z-API não consegue acessar <code className="bg-black/20 px-1 rounded">localhost:3000</code>. Use a <strong>URL do túnel (ngrok / Cloudflare)</strong> abaixo em &quot;Ao receber&quot; na Z-API.
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs text-zinc-500 mb-1">URL em produção (este domínio)</label>
            <div className="flex items-center gap-2">
              <Input readOnly value={urlZapiProducao || '...'} className="font-mono text-sm" />
              <button
                type="button"
                onClick={() => copyUrl(urlZapiProducao, 'zapi-prod')}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-300"
                title="Copiar"
              >
                {copied === 'zapi-prod' ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs text-zinc-500 mb-1">URL para localhost (túnel: ngrok, Cloudflare)</label>
            <p className="text-sm text-zinc-500 mb-2">
              Rode um túnel (ex: <code className="bg-white/10 px-1 rounded">ngrok http 3000</code>). Coloque a URL completa (ex: <code className="bg-white/10 px-1 rounded">https://seu-tunel.ngrok.io/api/whatsapp/zapi/webhook</code>) ou só a base — ao salvar, o path <code className="bg-white/10 px-1 rounded">{WEBHOOK_ZAPI}</code> será adicionado. Use essa URL em Z-API → Webhook → Ao receber.
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <Input
                value={zapiWebhookLoaded ? zapiWebhookUrl : '...'}
                onChange={(e) => setZapiWebhookUrl(e.target.value)}
                placeholder={PLACEHOLDER_ZAPI_TUNEL}
                className="flex-1 min-w-[200px] font-mono text-sm"
                disabled={!zapiWebhookLoaded}
              />
              <button
                type="button"
                onClick={() => copyUrl(urlZapiTunel, 'zapi-local')}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-300"
                title="Copiar"
              >
                {copied === 'zapi-local' ? <Check size={18} /> : <Copy size={18} />}
              </button>
              <button
                type="button"
                onClick={saveZapiWebhookUrl}
                disabled={saving || !zapiWebhookLoaded}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#25D366] hover:bg-[#20BA5A] text-white font-medium text-sm disabled:opacity-50"
              >
                <Save size={16} />
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
            {saveMessage === 'success' && (
              <p className="text-xs text-green-400 mt-1.5">URL salva no CRM.</p>
            )}
            {saveMessage === 'error' && (
              <p className="text-xs text-red-400 mt-1.5">Erro ao salvar. Tente de novo.</p>
            )}
            <p className="text-[11px] text-zinc-500 mt-1.5">
              A URL na Z-API deve ser exatamente a que aparece aqui (com <code className="bg-white/10 px-0.5 rounded">{WEBHOOK_ZAPI}</code> no final).
            </p>
          </div>

          <p className="text-xs text-zinc-500">
            Envio de mensagens: configure no .env <code>ZAPI_INSTANCE_ID</code>, <code>ZAPI_TOKEN</code> e, se exigido, <code>ZAPI_CLIENT_TOKEN</code>.
          </p>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Últimos eventos do webhook</h2>
          <button
            type="button"
            onClick={() => {
              setLoading(true)
              fetch('/api/admin/crm/webhook-logs')
                .then((res) => res.json())
                .then((data) => setWebhookLogs(data.logs ?? []))
                .finally(() => setLoading(false))
            }}
            className="p-2 rounded-lg hover:bg-white/10 text-zinc-400"
            title="Atualizar"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </CardHeader>
        <CardContent>
          {webhookLogs.length === 0 && !loading ? (
            <p className="text-sm text-zinc-500 flex items-center gap-2">
              <AlertCircle size={16} />
              Nenhum evento ainda. Envie uma mensagem para o número conectado na Z-API e confira se a URL do webhook está correta.
            </p>
          ) : (
            <ul className="space-y-2 max-h-60 overflow-y-auto">
              {webhookLogs.map((log) => (
                <li
                  key={log.received_at + log.status}
                  className="flex items-center justify-between gap-2 py-2 border-b border-white/5 text-sm"
                >
                  <span className="text-zinc-400 shrink-0">{formatTime(log.received_at)}</span>
                  <span
                    className={
                      log.status === 'success'
                        ? 'text-green-400'
                        : log.status === 'error'
                        ? 'text-red-400'
                        : 'text-amber-400'
                    }
                  >
                    {log.status}
                  </span>
                  <span className="text-zinc-500 truncate">{log.detail || '—'}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <h2 className="text-lg font-semibold text-white">Geral</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Limite de envio por minuto (campanhas)</label>
            <Input type="number" defaultValue={10} className="max-w-[120px]" />
          </div>
        </CardContent>
      </Card>
        </div>
      </div>
    </div>
  )
}
