#!/bin/bash

# 🚀 Script para Preparar Deploy na Hostinger
# Este script prepara tudo que você precisa para fazer upload

echo "🚀 Preparando deploy para Hostinger..."
echo ""

# Verificar se está na pasta correta
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script na raiz do projeto!"
    exit 1
fi

# Criar pasta temporária
echo "📦 Criando pasta temporária..."
mkdir -p deploy-temp
cd deploy-temp

# Copiar arquivos necessários
echo "📋 Copiando arquivos..."
cd ..

# Lista de arquivos e pastas para copiar
cp -r .next deploy-temp/ 2>/dev/null || echo "⚠️  Pasta .next não encontrada (faça npm run build primeiro)"
cp -r public deploy-temp/ 2>/dev/null || echo "⚠️  Pasta public não encontrada"
cp -r app deploy-temp/ 2>/dev/null || echo "⚠️  Pasta app não encontrada"
cp -r components deploy-temp/ 2>/dev/null || echo "⚠️  Pasta components não encontrada"
cp -r lib deploy-temp/ 2>/dev/null || echo "⚠️  Pasta lib não encontrada"
cp -r hooks deploy-temp/ 2>/dev/null || echo "⚠️  Pasta hooks não encontrada"
cp -r types deploy-temp/ 2>/dev/null || echo "⚠️  Pasta types não encontrada"
cp -r scripts deploy-temp/ 2>/dev/null || echo "⚠️  Pasta scripts não encontrada"
cp middleware.ts deploy-temp/ 2>/dev/null || echo "⚠️  Arquivo middleware.ts não encontrado"
cp next.config.js deploy-temp/ 2>/dev/null || echo "⚠️  Arquivo next.config.js não encontrado"
cp package.json deploy-temp/ 2>/dev/null || echo "⚠️  Arquivo package.json não encontrado"
cp package-lock.json deploy-temp/ 2>/dev/null || echo "⚠️  Arquivo package-lock.json não encontrado"
cp tsconfig.json deploy-temp/ 2>/dev/null || echo "⚠️  Arquivo tsconfig.json não encontrado"
cp tailwind.config.ts deploy-temp/ 2>/dev/null || echo "⚠️  Arquivo tailwind.config.ts não encontrado"
cp postcss.config.js deploy-temp/ 2>/dev/null || echo "⚠️  Arquivo postcss.config.js não encontrado"
cp server.js deploy-temp/ 2>/dev/null || echo "⚠️  Arquivo server.js não encontrado"

# Copiar .env.production se existir
if [ -f ".env.production" ]; then
    cp .env.production deploy-temp/ 2>/dev/null
    echo "✅ Arquivo .env.production copiado"
else
    echo "⚠️  Arquivo .env.production não encontrado (crie antes de fazer upload)"
fi

# Voltar para a raiz
cd deploy-temp

# Compactar
echo ""
echo "📦 Compactando arquivos..."
zip -r ../plenipay-deploy.zip . -q

# Voltar para raiz
cd ..
rm -rf deploy-temp

echo ""
echo "✅ Arquivo criado: plenipay-deploy.zip"
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo "1. Acesse: https://hpanel.hostinger.com"
echo "2. Vá em File Manager → public_html"
echo "3. Faça upload do arquivo: plenipay-deploy.zip"
echo "4. Extraia o arquivo"
echo "5. Siga o guia: DEPLOY-SUPER-SIMPLES-HOSTINGER.md"
echo ""
echo "🎉 Pronto!"

