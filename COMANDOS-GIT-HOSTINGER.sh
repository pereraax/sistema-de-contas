#!/bin/bash

# Script para preparar projeto para Hostinger
# Uso: ./COMANDOS-GIT-HOSTINGER.sh

echo "🚀 Preparando projeto para Hostinger..."
echo ""

cd "/Users/charllestabordas/Documents/SISTEMA DE CONTAS"

# 1. Verificar se Git está inicializado
if [ ! -d ".git" ]; then
    echo "📦 Inicializando Git..."
    git init
    git branch -M main
    echo "✅ Git inicializado"
    echo ""
fi

# 2. Adicionar arquivos
echo "📝 Adicionando arquivos ao Git..."
git add .
echo "✅ Arquivos adicionados"
echo ""

# 3. Fazer commit
echo "💾 Fazendo commit..."
git commit -m "Initial commit - Sistema de Contas PLENIPAY" || echo "⚠️ Nenhuma mudança para commitar"
echo "✅ Commit feito"
echo ""

# 4. Mostrar status
echo "📊 Status do repositório:"
git status --short | head -10
echo ""

echo "✅ Pronto!"
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo ""
echo "1. Crie um repositório no GitHub:"
echo "   https://github.com/new"
echo ""
echo "2. Depois de criar, execute:"
echo "   git remote add origin https://github.com/SEU-USUARIO/sistema-de-contas.git"
echo "   git push -u origin main"
echo ""
echo "3. Ou faça upload manual na Hostinger via File Manager"
echo ""


