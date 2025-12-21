#!/bin/bash

echo "==========================================="
echo "CORRIGINDO SERVIDOR LOCAL - NEXT.JS"
echo "==========================================="
echo ""

# Ir para o diretório do projeto
cd "/Users/charllestabordas/Documents/SISTEMA DE CONTAS"

echo "1. Parando processos Node.js na porta 3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || echo "Nenhum processo na porta 3000"

echo ""
echo "2. Limpando build anterior..."
rm -rf .next
rm -rf .next/cache 2>/dev/null
rm -rf node_modules/.cache 2>/dev/null

echo ""
echo "3. Fazendo build completo..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ ERRO: Build falhou!"
    exit 1
fi

echo ""
echo "4. Verificando se arquivos estáticos foram gerados..."
if [ -d ".next/static/chunks" ] && [ -d ".next/static/css" ]; then
    echo "✅ Arquivos estáticos gerados com sucesso!"
    echo "   - Chunks: $(ls -1 .next/static/chunks | wc -l) arquivos"
    echo "   - CSS: $(ls -1 .next/static/css | wc -l) arquivos"
else
    echo "❌ ERRO: Arquivos estáticos não foram gerados!"
    exit 1
fi

echo ""
echo "5. Iniciando servidor de desenvolvimento..."
echo "   Acesse: http://localhost:3000"
echo "   Pressione Ctrl+C para parar"
echo ""

npm run dev

