// Script para criar o primeiro administrador
// Execute: node scripts/criar-admin.js

const crypto = require('crypto')

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex')
  return `${salt}:${hash}`
}

// CONFIGURE AQUI
const email = 'admin@plenipay.com' // ALTERE O EMAIL
const password = 'Admin123!@#' // ALTERE A SENHA
const nome = 'Administrador'

const passwordHash = hashPassword(password)

console.log('\n=== DADOS DO ADMINISTRADOR ===\n')
console.log('Email:', email)
console.log('Nome:', nome)
console.log('\n=== SQL PARA EXECUTAR NO SUPABASE ===\n')
console.log(`INSERT INTO admin_users (email, password_hash, nome, is_active)
VALUES (
  '${email}',
  '${passwordHash}',
  '${nome}',
  true
);\n`)
console.log('=== FIM ===\n')
console.log('Copie o SQL acima e execute no SQL Editor do Supabase\n')





