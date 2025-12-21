#!/bin/bash
# Script para verificar e corrigir problema de assets no IP

echo "=========================================="
echo "VERIFICANDO CONFIGURAÇÃO NGINX"
echo "=========================================="

# Verificar se Nginx tem suporte a assets
if grep -q "_next/static" /etc/nginx/sites-available/plenipay 2>/dev/null; then
    echo "✅ Nginx já tem suporte a assets estáticos"
else
    echo "❌ Nginx NÃO tem suporte a assets estáticos"
    echo "⚠️  Você precisa adicionar a configuração!"
    echo ""
    echo "Execute: nano /etc/nginx/sites-available/plenipay"
    echo "E adicione a configuração de assets"
fi

echo ""
echo "=========================================="
echo "VERIFICANDO ARQUIVOS ESTÁTICOS"
echo "=========================================="

# Procurar pasta .next
NEXT_PATH=$(find /home -name ".next" -type d 2>/dev/null | head -1)

if [ -z "$NEXT_PATH" ]; then
    echo "❌ Pasta .next NÃO encontrada!"
    echo "⚠️  Você precisa fazer build: npm run build"
else
    echo "✅ Pasta .next encontrada: $NEXT_PATH"
    
    # Verificar se tem arquivos estáticos
    if [ -d "$NEXT_PATH/static" ]; then
        echo "✅ Pasta static existe"
        echo "   Arquivos encontrados: $(ls -1 $NEXT_PATH/static/chunks 2>/dev/null | wc -l) chunks"
    else
        echo "❌ Pasta static NÃO existe!"
        echo "⚠️  Você precisa fazer build: npm run build"
    fi
fi

echo ""
echo "=========================================="
echo "VERIFICANDO PM2"
echo "=========================================="

if pm2 list | grep -q "sistema-contas"; then
    echo "✅ PM2 está rodando aplicação"
    pm2 status | grep sistema-contas
else
    echo "❌ PM2 NÃO está rodando aplicação"
    echo "⚠️  Execute: pm2 start npm --name sistema-contas -- start"
fi

echo ""
echo "=========================================="
echo "VERIFICANDO NGINX"
echo "=========================================="

if systemctl is-active --quiet nginx; then
    echo "✅ Nginx está rodando"
else
    echo "❌ Nginx NÃO está rodando"
    echo "⚠️  Execute: systemctl start nginx"
fi

echo ""
echo "=========================================="
echo "PRÓXIMOS PASSOS:"
echo "=========================================="
echo "1. Se Nginx não tem suporte a assets:"
echo "   nano /etc/nginx/sites-available/plenipay"
echo ""
echo "2. Se arquivos estáticos não existem:"
echo "   cd /var/www/plenipay  # ou caminho correto"
echo "   npm run build"
echo "   pm2 restart sistema-contas"
echo ""
echo "3. Reiniciar Nginx:"
echo "   nginx -t"
echo "   systemctl restart nginx"
echo ""
echo "4. Testar no navegador:"
echo "   http://31.97.27.20"
echo "   (Limpar cache ou usar janela anônima)"
echo "=========================================="
