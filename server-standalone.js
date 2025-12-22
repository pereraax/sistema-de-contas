#!/usr/bin/env node

/**
 * Script para iniciar o servidor Next.js standalone no Render
 * Usa o servidor standalone do Next.js que já está configurado corretamente
 */

const path = require('path')
const { spawn } = require('child_process')

// Caminho para o servidor standalone
const standaloneServerPath = path.join(__dirname, '.next', 'standalone', 'server.js')

console.log(`🚀 Iniciando servidor Next.js standalone...`)
console.log(`   - Path: ${standaloneServerPath}`)
console.log(`   - PORT: ${process.env.PORT || '10000'}`)
console.log(`   - NODE_ENV: ${process.env.NODE_ENV || 'production'}`)

// Verificar se o arquivo existe
const fs = require('fs')
if (!fs.existsSync(standaloneServerPath)) {
  console.error(`❌ Erro: Servidor standalone não encontrado em: ${standaloneServerPath}`)
  console.error(`   Execute 'npm run build' primeiro para gerar o servidor standalone.`)
  process.exit(1)
}

// Executar o servidor standalone
// O servidor standalone do Next.js já escuta em 0.0.0.0 automaticamente quando PORT está definido
const server = spawn('node', [standaloneServerPath], {
  stdio: 'inherit',
  env: {
    ...process.env,
    // Garantir que PORT está definido
    PORT: process.env.PORT || '10000',
    // Garantir que NODE_ENV está definido
    NODE_ENV: process.env.NODE_ENV || 'production',
  }
})

server.on('error', (err) => {
  console.error('❌ Erro ao iniciar servidor:', err)
  process.exit(1)
})

server.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ Servidor encerrado com código: ${code}`)
    process.exit(code)
  }
})

// Nota: O keep-alive do Apifacil deve ser iniciado dentro das rotas da API
// quando necessário, não aqui no servidor standalone
