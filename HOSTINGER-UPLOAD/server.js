const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = process.env.PORT || 3000

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
  }).listen(port, async (err) => {
    if (err) throw err
    console.log(`> Ready on http://${hostname}:${port}`)
    
    // Iniciar keep-alive do apifacil.dev automaticamente
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
      console.error('⚠️ [Apifacil] Erro ao iniciar keep-alive:', error.message)
      // Não bloquear o servidor se houver erro
    }
  })
})

