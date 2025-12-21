#!/bin/bash

# Script para atualizar a pasta deploy-hostinger com os arquivos mais recentes

echo "🔄 Atualizando pasta deploy-hostinger..."
echo ""

cd "/Users/charllestabordas/Documents/SISTEMA DE CONTAS"

# Remover pasta antiga
if [ -d "deploy-hostinger" ]; then
    echo "🗑️  Removendo pasta antiga..."
    rm -rf deploy-hostinger
fi

# Criar nova pasta
echo "📁 Criando nova pasta..."
mkdir -p deploy-hostinger

# Copiar pastas principais
echo "📦 Copiando arquivos..."
cp -R app components lib hooks public deploy-hostinger/

# Copiar pastas opcionais
if [ -d "pages" ]; then cp -R pages deploy-hostinger/; fi
if [ -d "types" ]; then cp -R types deploy-hostinger/; fi
if [ -d "scripts" ]; then cp -R scripts deploy-hostinger/; fi

# Copiar arquivos de configuração
cp package.json package-lock.json next.config.js tailwind.config.js tsconfig.json .nvmrc deploy-hostinger/

# Copiar arquivos opcionais
if [ -f "postcss.config.js" ]; then cp postcss.config.js deploy-hostinger/; fi
if [ -f "server.js" ]; then cp server.js deploy-hostinger/; fi
if [ -f "vercel.json" ]; then cp vercel.json deploy-hostinger/; fi

# Criar README
cat > deploy-hostinger/README-DEPLOY.md << 'EOF'
# 🚀 ARQUIVOS PRONTOS PARA DEPLOY NA HOSTINGER

Esta pasta contém **TODOS os arquivos necessários** para fazer deploy na Hostinger.

## 📦 PRÓXIMOS PASSOS:

1. **Comprimir esta pasta** (botão direito → Comprimir)
2. **Fazer upload na Hostinger** (File Manager → Upload)
3. **Extrair o ZIP** (botão direito → Extract)
4. **Instalar dependências:** `npm install`
5. **Configurar variáveis:** Criar `.env.production`
6. **Fazer build:** `npm run build`
7. **Iniciar servidor:** PM2 ou Node.js App

Veja o guia completo em: `ARQUIVOS-PARA-ENVIAR-HOSTINGER.md`
EOF

echo ""
echo "✅ Pasta deploy-hostinger atualizada!"
echo ""
echo "📊 Estatísticas:"
echo "   - Arquivos: $(find deploy-hostinger -type f | wc -l | tr -d ' ')"
echo "   - Tamanho: $(du -sh deploy-hostinger | cut -f1)"
echo ""
echo "📁 Localização:"
echo "   $(pwd)/deploy-hostinger"
echo ""
echo "🚀 Próximo passo:"
echo "   1. Abra a pasta deploy-hostinger no Finder"
echo "   2. Clique com botão direito → Comprimir"
echo "   3. Faça upload do ZIP na Hostinger"
echo ""


