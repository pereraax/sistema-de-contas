#!/bin/bash

# Script para instalar Node.js 20 via NVM

echo "📦 Instalando Node.js 20..."
echo ""

# Verificar se NVM está instalado
if [ ! -d "$HOME/.nvm" ]; then
    echo "🔧 NVM não encontrado. Instalando NVM..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.2/install.sh | bash
    
    # Carregar NVM
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    
    echo "✅ NVM instalado!"
    echo ""
    echo "⚠️ IMPORTANTE: Feche e abra o terminal novamente, ou execute:"
    echo "   source ~/.zshrc"
    echo ""
    echo "Depois execute este script novamente."
    exit 0
fi

# Carregar NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Instalar Node.js 20
echo "📥 Instalando Node.js 20..."
nvm install 20

# Usar Node.js 20
echo "🔄 Ativando Node.js 20..."
nvm use 20

# Definir como padrão
echo "⭐ Definindo Node.js 20 como padrão..."
nvm alias default 20

# Verificar
echo ""
echo "✅ Instalação concluída!"
echo ""
echo "📊 Versões instaladas:"
node -v
npm -v
echo ""
echo "✅ Node.js 20 está ativo!"


