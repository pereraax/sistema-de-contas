const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
// Escutar em 0.0.0.0 em produção (Render, Coolify, VPS, Docker) para aceitar conexões externas
const hostname = dev ? 'localhost' : '0.0.0.0'
const port = parseInt(process.env.PORT || '3000', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  }).listen(port, hostname, async (err) => {
    if (err) throw err
    console.log(`> Ready on http://${hostname}:${port}`)
    console.log(`> Environment: ${process.env.NODE_ENV || 'development'}`)
    console.log(`> PORT: ${port}`)
    
    // Iniciar keep-alive automático para manter a aplicação acordada no Render
    if (process.env.RENDER) {
      const keepAliveInterval = setInterval(async () => {
        try {
          const http = require('http')
          const options = {
            hostname: hostname === '0.0.0.0' ? 'localhost' : hostname,
            port: port,
            path: '/api/health',
            method: 'GET',
            timeout: 5000,
          }
          
          const req = http.request(options, (res) => {
            if (res.statusCode === 200) {
              console.log('✅ [Keep-Alive] Aplicação mantida acordada')
            }
          })
          
          req.on('error', (err) => {
            // Ignorar erros silenciosamente
          })
          
          req.on('timeout', () => {
            req.destroy()
          })
          
          req.end()
        } catch (error) {
          // Ignorar erros silenciosamente
        }
      }, 2 * 60 * 1000) // A cada 2 minutos (reduzido para evitar spin down)
      
      console.log('✅ [Keep-Alive] Sistema de keep-alive iniciado (ping a cada 2 minutos)')
      
      // Fazer primeiro ping imediatamente
      setTimeout(() => {
        const http = require('http')
        const options = {
          hostname: hostname === '0.0.0.0' ? 'localhost' : hostname,
          port: port,
          path: '/api/health',
          method: 'GET',
          timeout: 5000,
        }
        
        const req = http.request(options, () => {
          console.log('✅ [Keep-Alive] Primeiro ping realizado')
        })
        
        req.on('error', () => {})
        req.on('timeout', () => req.destroy())
        req.end()
      }, 5000) // Após 5 segundos do servidor iniciar (mais rápido)
    }
    
    // Iniciar keep-alive do apifacil.dev automaticamente (opcional, não bloqueia se falhar)
    // NOTA: Módulo TypeScript não pode ser importado diretamente com require() em runtime
    // O keep-alive do apifacil é opcional e não é crítico para o funcionamento da aplicação
    console.log('ℹ️ [Apifacil] Keep-alive desabilitado em produção (módulo TypeScript)')

    // Automação: boas-vindas + recovery a cada 15 min; follow-up 10min + smart a cada 30 min (intervalos longos para evitar banimento WhatsApp)
    const cronSecret = process.env.CRON_SECRET?.trim()
    const baseUrl = `http://${hostname === '0.0.0.0' ? '127.0.0.1' : hostname}:${port}`
    if (cronSecret && !dev) {
      const cronBoasVindasUrl = `${baseUrl}/api/whatsapp/cron-boas-vindas-pendentes?secret=${encodeURIComponent(cronSecret)}`
      const runBoasVindas = () => {
        const http = require('http')
        const url = new URL(cronBoasVindasUrl)
        const options = {
          hostname: url.hostname,
          port: url.port,
          path: url.pathname + url.search,
          method: 'GET',
          timeout: 120000,
        }
        const req = http.request(options, (res) => {
          let body = ''
          res.on('data', (chunk) => { body += chunk })
          res.on('end', () => {
            try {
              const data = JSON.parse(body || '{}')
              if (data.ok && (data.processed > 0 || data.total > 0)) {
                console.log('[Cron boas-vindas]', data.processed, 'de', data.total, 'pendentes enviados')
              }
              if (data.leadRecovery && (data.leadRecovery.sent > 0 || data.leadRecovery.total > 0)) {
                console.log('[Cron lead-recovery]', data.leadRecovery.sent, 'de', data.leadRecovery.total, 'mensagens de vácuo enviadas')
              }
            } catch (_) {}
          })
        })
        req.on('error', () => {})
        req.on('timeout', () => req.destroy())
        req.end()
      }
      setInterval(runBoasVindas, 15 * 60 * 1000) // a cada 15 minutos
      setTimeout(runBoasVindas, 2 * 60 * 1000)   // primeira execução após 2 minutos
      console.log('✅ [Cron] Boas-vindas + lead recovery: a cada 15 minutos (defina WHATSAPP_CRON_VACUUM_DISABLED=true para desativar recovery)')

      const cronSmartUrl = `${baseUrl}/api/cron/plen-smart-messages?secret=${encodeURIComponent(cronSecret)}`
      const runPlenSmart = () => {
        const http = require('http')
        const url = new URL(cronSmartUrl)
        const options = {
          hostname: url.hostname,
          port: url.port,
          path: url.pathname + url.search,
          method: 'GET',
          timeout: 180000,
          headers: { Authorization: `Bearer ${cronSecret}` },
        }
        const req = http.request(options, (res) => {
          let body = ''
          res.on('data', (chunk) => { body += chunk })
          res.on('end', () => {
            try {
              const data = JSON.parse(body || '{}')
              if (data.ok && data.sent > 0) {
                console.log('[Cron plen-smart]', data.sent, 'mensagens enviadas (follow-up 10min + recovery + smart)')
              }
              if (data.leadRecovery?.listError) {
                console.error('[Cron plen-smart] leadRecovery.listError:', data.leadRecovery.listError)
              }
              if (!data.ok && (data.error || body)) {
                console.error('[Cron plen-smart] falha:', data.error || res.statusCode, body?.slice(0, 200))
              }
            } catch (_) {}
          })
        })
        req.on('error', (err) => { console.error('[Cron plen-smart] request error:', err?.message || err) })
        req.on('timeout', () => req.destroy())
        req.end()
      }
      setInterval(runPlenSmart, 30 * 60 * 1000) // a cada 30 minutos
      setTimeout(runPlenSmart, 5 * 60 * 1000)   // primeira execução após 5 minutos
      console.log('✅ [Cron] Follow-up 10min + smart messages: a cada 30 min (máx. 2+2+2 envios/run; WHATSAPP_CRON_VACUUM_DISABLED=true desativa)')

      // Lembretes Plen: envia "Não esqueça de pagar X hoje! Já pagou? sim/não" no dia e hora do lembrete
      const cronLembretesUrl = `${baseUrl}/api/plen/lembretes-cron?secret=${encodeURIComponent(cronSecret)}`
      const runLembretes = () => {
        const http = require('http')
        const url = new URL(cronLembretesUrl)
        const options = {
          hostname: url.hostname,
          port: url.port,
          path: url.pathname + url.search,
          method: 'GET',
          timeout: 60000,
        }
        const req = http.request(options, (res) => {
          let body = ''
          res.on('data', (chunk) => { body += chunk })
          res.on('end', () => {
            try {
              const data = JSON.parse(body || '{}')
              if (data.ok && data.sent > 0) {
                console.log('[Cron lembretes]', data.sent, 'lembretes enviados')
              }
              if (!data.ok && data.error) {
                console.error('[Cron lembretes]', data.error)
              }
            } catch (_) {}
          })
        })
        req.on('error', (err) => { console.error('[Cron lembretes] request error:', err?.message || err) })
        req.on('timeout', () => req.destroy())
        req.end()
      }
      setInterval(runLembretes, 5 * 60 * 1000) // a cada 5 minutos (para respeitar horário ex.: 00:09)
      setTimeout(runLembretes, 3 * 60 * 1000)   // primeira execução após 3 minutos
      console.log('✅ [Cron] Lembretes Plen: a cada 5 min (envia no dia e hora combinados, America/Sao_Paulo)')
    } else if (!cronSecret && !dev) {
      console.log('ℹ️ [Cron] CRON_SECRET não definido: configure para ativar envio automático de boas-vindas e mensagens de vácuo')
    }
  })
})

