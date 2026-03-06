'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/crm/ui/Card'
import { Input } from '@/components/crm/ui/Input'
import { Copy, Check, AlertCircle, RefreshCw } from 'lucide-react'

const WEBHOOK_ZAPI = '/api/whatsapp/zapi/webhook'
const WEBHOOK_EVOLUTION = '/api/webhooks/evolution'

export default function CrmConfiguracoesPage() {
  const [webhookLogs, setWebhookLogs] = useState<Array<{ received_at: string; status: string; detail: string | null }>>([])
  const [copied, setCopied] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const siteUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const isLocalhost = typeof window !== 'undefined' && /^https?:\/\/localhost(:\d+)?$/i.test(siteUrl)
  const urlEvolutionProducao = siteUrl ? `${siteUrl}${WEBHOOK_EVOLUTION}` : ''
  const urlEvolutionTunel = `https://SEU-TUNEL.ngrok.io${WEBHOOK_EVOLUTION}`
  const urlZapiProducao = siteUrl ? `${siteUrl}${WEBHOOK_ZAPI}` : ''
  const urlZapiTunel = `https://SEU-TUNEL.ngrok.io${WEBHOOK_ZAPI}`

  useEffect(() => {
    fetch('/api/admin/crm/webhook-logs')
      .then((res) => res.json())
      .then((data) => setWebhookLogs(data.logs ?? []))
      .catch(() => setWebhookLogs([]))
      .finally(() => setLoading(false))
  }, [])

  const copyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const formatTime = (s: string) => new Date(s).toLocaleString('pt-BR')

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Configurações</h1>
        <p className="text-zinc-500 text-sm mt-1">Ajustes do CRM WhatsApp</p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-white">Integração Evolution API – Webhook</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-zinc-400">
            Na Evolution API, configure o webhook da instância com a URL abaixo. Use o evento <strong>MESSAGES_UPSERT</strong>. A mesma rota funciona em produção e em localhost (com túnel).
          </p>

          {isLocalhost && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-200 text-sm">
              <AlertCircle className="flex-shrink-0 mt-0.5" size={18} />
              <div>
                <strong>Você está em localhost.</strong> A Evolution API (Docker) não consegue acessar <code className="bg-black/20 px-1 rounded">localhost:3000</code>. Use a <strong>URL do túnel (ngrok)</strong> abaixo e coloque no webhook da Evolution.
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs text-zinc-500 mb-1">URL em produção (este domínio)</label>
            <div className="flex items-center gap-2">
              <Input readOnly value={urlEvolutionProducao || '...'} className="font-mono text-sm" />
              <button
                type="button"
                onClick={() => copyUrl(urlEvolutionProducao, 'evo-prod')}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-300"
                title="Copiar"
              >
                {copied === 'evo-prod' ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs text-zinc-500 mb-1">URL para localhost (túnel: ngrok, Cloudflare)</label>
            <p className="text-sm text-zinc-500 mb-2">
              Rode um túnel (ex: <code className="bg-white/10 px-1 rounded">ngrok http 3000</code>) e use a URL pública + <code className="bg-white/10 px-1 rounded">{WEBHOOK_EVOLUTION}</code> no webhook da Evolution.
            </p>
            <div className="flex items-center gap-2">
              <Input readOnly value={urlEvolutionTunel} className="font-mono text-sm text-zinc-500" />
              <button
                type="button"
                onClick={() => copyUrl(urlEvolutionTunel, 'evo-local')}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-300"
                title="Copiar"
              >
                {copied === 'evo-local' ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
          </div>

          <p className="text-xs text-zinc-500">
            Envio de mensagens: configure no .env <code>EVOLUTION_API_URL</code>, <code>EVOLUTION_INSTANCE</code> e <code>EVOLUTION_API_KEY</code>. Se estiverem preenchidos, o CRM usa Evolution; caso contrário, usa Z-API.
          </p>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <h2 className="text-lg font-semibold text-white">Integração Z-API (alternativa)</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-zinc-400">
            Na Z-API, em <strong>Webhooks</strong>, configure <strong>« Ao receber »</strong> com uma das URLs abaixo.
          </p>

          <div>
            <label className="block text-xs text-zinc-500 mb-1">URL em produção</label>
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
            <label className="block text-xs text-zinc-500 mb-1">URL para localhost (túnel)</label>
            <div className="flex items-center gap-2">
              <Input readOnly value={urlZapiTunel} className="font-mono text-sm text-zinc-500" />
              <button
                type="button"
                onClick={() => copyUrl(urlZapiTunel, 'zapi-local')}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-300"
                title="Copiar"
              >
                {copied === 'zapi-local' ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
          </div>

          <p className="text-xs text-zinc-500">
            Envio via Z-API: configure no .env <code>Z_API_INSTANCE_ID</code> e <code>Z_API_TOKEN</code> (usado só se Evolution não estiver configurada).
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
              Nenhum evento ainda. Envie uma mensagem para o número conectado (Evolution ou Z-API) e confira se a URL do webhook está correta.
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
  )
}
