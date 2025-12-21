#!/bin/bash

# Script para criar repositório no GitHub automaticamente
# Uso: ./CRIAR-REPOSITORIO-GITHUB.sh

echo "🚀 Criando repositório no GitHub..."
echo ""

cd "/Users/charllestabordas/Documents/SISTEMA DE CONTAS"

# Verificar se GitHub CLI está instalado
if ! command -v gh &> /dev/null; then
    echo "📦 GitHub CLI não está instalado. Instalando..."
    echo ""
    
    # Detectar sistema operacional
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            echo "Instalando via Homebrew..."
            brew install gh
        else
            echo "❌ Homebrew não encontrado. Por favor, instale manualmente:"
            echo "   brew install gh"
            echo ""
            echo "Ou baixe em: https://cli.github.com/"
            exit 1
        fi
    else
        echo "❌ Por favor, instale GitHub CLI manualmente:"
        echo "   https://cli.github.com/"
        exit 1
    fi
fi

echo "✅ GitHub CLI encontrado"
echo ""

# Verificar se está autenticado
if ! gh auth status &> /dev/null; then
    echo "🔐 Você precisa autenticar no GitHub..."
    echo "   Execute: gh auth login"
    echo ""
    read -p "Deseja autenticar agora? (s/n): " resposta
    if [[ "$resposta" == "s" || "$resposta" == "S" ]]; then
        gh auth login
    else
        echo "❌ Autenticação necessária. Execute: gh auth login"
        exit 1
    fi
fi

echo "✅ Autenticado no GitHub"
echo ""

# Nome do repositório
REPO_NAME="sistema-de-contas"
echo "📝 Nome do repositório: $REPO_NAME"
echo ""

# Criar repositório
echo "🔄 Criando repositório no GitHub..."
gh repo create "$REPO_NAME" \
    --private \
    --description "Sistema de Controle Financeiro - PLENIPAY" \
    --source=. \
    --remote=origin \
    --push

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Repositório criado com sucesso!"
    echo ""
    echo "🔗 URL do repositório:"
    gh repo view --web
    echo ""
    echo "📋 Próximos passos:"
    echo "   1. Verifique o repositório no GitHub"
    echo "   2. Configure variáveis de ambiente se necessário"
    echo "   3. Faça upload na Hostinger"
else
    echo ""
    echo "❌ Erro ao criar repositório"
    echo ""
    echo "💡 Alternativa: Crie manualmente em:"
    echo "   https://github.com/new"
    echo ""
    echo "Depois execute:"
    echo "   git remote add origin https://github.com/SEU-USUARIO/$REPO_NAME.git"
    echo "   git push -u origin main"
fi


