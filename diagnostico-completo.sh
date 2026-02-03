#!/bin/bash

echo "==========================================="
echo "DIAGNÓSTICO COMPLETO - SISTEMA PLENIPAY"
echo "==========================================="
echo ""

echo "1. VERIFICANDO PM2..."
echo "-------------------------------------------"
pm2 status
pm2 list
echo ""

echo "2. TESTANDO APLICAÇÃO LOCAL (porta 3000)..."
echo "-------------------------------------------"
curl -I http://localhost:3000 2>&1 | head -10
echo ""

echo "3. VERIFICANDO CONFIGURAÇÃO NGINX..."
echo "-------------------------------------------"
if [ -f /etc/nginx/sites-available/plenipay ]; then
    echo "Arquivo existe. Verificando configuração..."
    cat /etc/nginx/sites-available/plenipay
else
    echo "ERRO: Arquivo /etc/nginx/sites-available/plenipay não existe!"
fi
echo ""

echo "4. VERIFICANDO STATUS NGINX..."
echo "-------------------------------------------"
systemctl status nginx --no-pager | head -10
echo ""

echo "5. VERIFICANDO LOGS NGINX (últimas 20 linhas)..."
echo "-------------------------------------------"
tail -20 /var/log/nginx/error.log 2>&1
echo ""

echo "6. VERIFICANDO LOGS APLICAÇÃO (últimas 20 linhas)..."
echo "-------------------------------------------"
pm2 logs sistema-contas --lines 20 --nostream 2>&1
echo ""

echo "7. VERIFICANDO ARQUIVOS ESTÁTICOS..."
echo "-------------------------------------------"
if [ -d /var/www/plenipay/.next/static ]; then
    echo "Pasta .next/static existe"
    ls -la /var/www/plenipay/.next/static | head -10
else
    echo "ERRO: Pasta .next/static não existe!"
fi
echo ""

echo "8. VERIFICANDO PORTA 3000..."
echo "-------------------------------------------"
netstat -tlnp | grep 3000 || echo "Porta 3000 não está escutando!"
echo ""

echo "9. VERIFICANDO DNS..."
echo "-------------------------------------------"
echo "nslookup plenipay.com:"
nslookup plenipay.com 2>&1 | head -10
echo ""
echo "dig plenipay.com:"
dig plenipay.com +short 2>&1
echo ""

echo "10. VERIFICANDO PROCESSOS NODE..."
echo "-------------------------------------------"
ps aux | grep node | grep -v grep
echo ""

echo "==========================================="
echo "DIAGNÓSTICO CONCLUÍDO"
echo "==========================================="


