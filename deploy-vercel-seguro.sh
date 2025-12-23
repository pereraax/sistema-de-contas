#!/bin/bash

echo "🚀 Preparando deploy seguro no Vercel..."
echo ""

# 1. Parar servidor
echo "1️⃣ Parando servidor..."
pkill -9 -f "next" 2>/dev/null
sleep 2

# 2. Limpar cache completamente
echo "2️⃣ Limpando cache..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .turbo
echo "✅ Cache limpo"

# 3. Verificar build local
echo "3️⃣ Testando build local..."
if npm run build > /tmp/build-test.log 2>&1; then
    echo "✅ Build local OK"
else
    echo "❌ ERRO no build local! Verifique /tmp/build-test.log"
    exit 1
fi

# 4. Deploy no Vercel
echo "4️⃣ Fazendo deploy no Vercel..."
if vercel --prod --yes; then
    echo ""
    echo "✅ Deploy concluído com sucesso!"
    echo ""
    echo "📋 Próximos passos:"
    echo "   1. Acesse a URL de produção no Vercel"
    echo "   2. Teste as funcionalidades principais"
    echo "   3. Verifique o console do navegador"
else
    echo "❌ ERRO no deploy! Verifique os logs acima"
    exit 1
fi
















