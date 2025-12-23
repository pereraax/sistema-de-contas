#!/usr/bin/env node

/**
 * Servidor customizado para Render
 * Funciona com Next.js standalone mode
 */

const { createServer } = require('http')
const { parse } = require('url')

// Tentar carregar o servidor standalone do Next.js
let nextServer
let handle

try {
  // Tentar usar o servidor standalone
  const standalonePath = require('path').join(process.cwd(), '.next', 'standalone', 'server.js')
  const fs = require('fs')
  
  if (fs.existsSync(standalonePath)) {
    console.log('✅ Usando servidor standalone do Next.js')
    // O servidor standalone já está configurado, vamos apenas executá-lo
    require(standalonePath)
    process.exit(0)
  } else {
    // Se não tiver standalone, usar Next.js normal
    console.log('⚠️ Servidor standalone não encontrado, usando Next.js normal')
    const next = require('next')
    
    const dev = process.env.NODE_ENV !== 'production'
    const port = parseInt(process.env.PORT || '10000', 10)
    const hostname = '0.0.0.0'
    
    const app = next({ dev, hostname, port })
    handle = app.getRequestHandler()
    
    app.prepare().then(() => {
      createServer(async (req, res) => {
        try {
          const parsedUrl = parse(req.url, true)
          await handle(req, res, parsedUrl)
        } catch (err) {
          console.error('❌ Error handling request:', err)
          res.statusCode = 500
          res.end('Internal Server Error')
        }
      }).listen(port, hostname, (err) => {
        if (err) {
          console.error('❌ Erro ao iniciar servidor:', err)
          process.exit(1)
        }
        console.log(`✅ Servidor iniciado em http://${hostname}:${port}`)
      })
    }).catch((err) => {
      console.error('❌ Erro ao preparar Next.js:', err)
      process.exit(1)
    })
  }
} catch (error) {
  console.error('❌ Erro crítico:', error)
  process.exit(1)
}
