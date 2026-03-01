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

    // Automação interna: a cada 2 min chama a rota de boas-vindas pendentes (sem precisar de cron externo)
    const cronSecret = process.env.CRON_SECRET?.trim()
    if (cronSecret && !dev) {
      const cronUrl = `http://${hostname === '0.0.0.0' ? '127.0.0.1' : hostname}:${port}/api/whatsapp/cron-boas-vindas-pendentes?secret=${encodeURIComponent(cronSecret)}`
      const runCron = () => {
        const http = require('http')
        const url = new URL(cronUrl)
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
            } catch (_) {}
          })
        })
        req.on('error', () => {})
        req.on('timeout', () => req.destroy())
        req.end()
      }
      setInterval(runCron, 2 * 60 * 1000) // a cada 2 minutos
      setTimeout(runCron, 60 * 1000)      // primeira execução após 1 minuto
      console.log('✅ [Cron] Boas-vindas pendentes: verificação automática a cada 2 minutos (sem cron externo)')
    } else if (!cronSecret && !dev) {
      console.log('ℹ️ [Cron] CRON_SECRET não definido: configure para ativar envio automático de boas-vindas pendentes')
    }
  })
})

