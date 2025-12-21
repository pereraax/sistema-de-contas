#!/bin/bash

# Script para corrigir erros de build nas páginas admin

echo "🔧 Corrigindo erros de build..."
echo ""

# Diretório do projeto
PROJECT_DIR="/Users/charllestabordas/Downloads/sistema-de-contas-main"

# Verificar se o diretório existe
if [ ! -d "$PROJECT_DIR" ]; then
    echo "❌ Diretório não encontrado: $PROJECT_DIR"
    echo ""
    echo "💡 Dica: Execute este script da pasta do projeto"
    exit 1
fi

cd "$PROJECT_DIR"

# Arquivo 1: usuarios/page.tsx
USUARIOS_FILE="app/administracaosecr/usuarios/page.tsx"
if [ -f "$USUARIOS_FILE" ]; then
    echo "📝 Corrigindo: $USUARIOS_FILE"
    
    # Verificar se já tem force-dynamic
    if ! grep -q "export const dynamic" "$USUARIOS_FILE"; then
        # Adicionar após os imports
        sed -i '' '5a\
export const dynamic = '\''force-dynamic'\''
' "$USUARIOS_FILE"
        echo "✅ Corrigido: $USUARIOS_FILE"
    else
        echo "✅ Já corrigido: $USUARIOS_FILE"
    fi
else
    echo "⚠️ Arquivo não encontrado: $USUARIOS_FILE"
fi

# Arquivo 2: assinantes/page.tsx
ASSINANTES_FILE="app/administracaosecr/assinantes/page.tsx"
if [ -f "$ASSINANTES_FILE" ]; then
    echo "📝 Corrigindo: $ASSINANTES_FILE"
    
    # Verificar se já tem force-dynamic
    if ! grep -q "export const dynamic" "$ASSINANTES_FILE"; then
        # Adicionar após os imports
        sed -i '' '5a\
export const dynamic = '\''force-dynamic'\''
' "$ASSINANTES_FILE"
        echo "✅ Corrigido: $ASSINANTES_FILE"
    else
        echo "✅ Já corrigido: $ASSINANTES_FILE"
    fi
else
    echo "⚠️ Arquivo não encontrado: $ASSINANTES_FILE"
fi

echo ""
echo "✅ Correções aplicadas!"
echo ""
echo "📋 Próximo passo:"
echo "   cd \"$PROJECT_DIR\""
echo "   npm run build"
echo ""


