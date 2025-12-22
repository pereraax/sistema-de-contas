const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
// IMPORTANTE: Escutar em 0.0.0.0 para aceitar conexões externas (Render)
const hostname = process.env.RENDER ? '0.0.0.0' : 'localhost'
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
    
    // Iniciar keep-alive do apifacil.dev automaticamente (opcional, não bloqueia se falhar)
    try {
      const { startKeepAlive, isApifacilConfigured } = require('./lib/whatsapp-apifacil')
      
      if (isApifacilConfigured()) {
        // Verificar status a cada 5 minutos para manter sempre online
        startKeepAlive(5)
        console.log('✅ [Apifacil] Keep-alive iniciado automaticamente (verificando a cada 5 minutos)')
      } else {
        console.log('ℹ️ [Apifacil] Keep-alive não iniciado - configure APIFACIL_INSTANCE_ID e APIFACIL_TOKEN')
      }
    } catch (error) {
      // Não bloquear o servidor se houver erro - apenas logar
      console.log('ℹ️ [Apifacil] Keep-alive não disponível:', error.message)
    }
  })
})

