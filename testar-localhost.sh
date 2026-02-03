#!/bin/bash

# Script para testar a aplicação localmente antes de fazer deploy

echo "🔍 Testando aplicação localmente..."
echo ""

# Verificar se node_modules existe
if [ ! -d "node_modules" ]; then
  echo "📦 Instalando dependências..."
  npm install
fi

# Verificar se .next existe (build)
if [ ! -d ".next" ]; then
  echo "🏗️  Fazendo build da aplicação..."
  npm run build
fi

# Iniciar servidor
echo "🚀 Iniciando servidor local..."
echo "📍 Acesse: http://localhost:3000"
echo "📍 Teste a rota: http://localhost:3000/auth/callback?token_hash=test&type=magiclink&next=/home"
echo ""
echo "⚠️  Para parar o servidor, pressione Ctrl+C"
echo ""

npm start
