#!/bin/bash

# Script para fazer deploy direto no Vercel sem git
# Uso: ./deploy-vercel.sh

echo "🚀 Iniciando deploy direto no Vercel..."
echo ""

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: package.json não encontrado!"
    echo "   Execute este script na pasta raiz do projeto"
    exit 1
fi

# Verificar se vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
    echo "📦 Vercel CLI não encontrado. Instalando..."
    npm install -g vercel
    echo ""
fi

# Verificar se está logado
echo "🔐 Verificando login no Vercel..."
if ! vercel whoami &> /dev/null; then
    echo "⚠️  Não está logado. Fazendo login..."
    vercel login
    echo ""
fi

# Limpar cache local (opcional, mas recomendado)
echo "🧹 Limpando cache local..."
rm -rf .next
echo "✅ Cache limpo"
echo ""

# Fazer deploy
echo "🚀 Fazendo deploy de PRODUÇÃO..."
echo "   (Isso pode levar alguns minutos...)"
echo ""

vercel --prod --yes

echo ""
echo "✅ Deploy concluído!"
echo ""
echo "📝 Para ver o status: vercel ls"
echo "📝 Para ver logs: vercel logs"
echo ""
