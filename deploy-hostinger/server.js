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
  })
})

