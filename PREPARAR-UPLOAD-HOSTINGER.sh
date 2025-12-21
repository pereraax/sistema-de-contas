#!/bin/bash

# Script para preparar arquivos para upload na Hostinger

echo "📦 Preparando arquivos para upload na Hostinger..."
echo ""

# Diretório do projeto
PROJECT_DIR="/Users/charllestabordas/Documents/SISTEMA DE CONTAS"
UPLOAD_DIR="$HOME/Desktop/sistema-contas-upload"

# Criar pasta de upload
echo "📁 Criando pasta de upload..."
rm -rf "$UPLOAD_DIR"
mkdir -p "$UPLOAD_DIR"

cd "$PROJECT_DIR"

# Copiar arquivos (excluindo o que não deve ser enviado)
echo "📋 Copiando arquivos..."
rsync -av \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.git' \
  --exclude '.cache' \
  --exclude '.turbo' \
  --exclude 'deploy-essencial' \
  --exclude 'deploy-essencial-1' \
  --exclude 'whatsapp_auth_webjs' \
  --exclude '*.log' \
  --exclude '.DS_Store' \
  --exclude '.env.local' \
  --exclude '.env.development.local' \
  --exclude '*.md' \
  --exclude '*.sh' \
  --exclude '*.sql' \
  --exclude '*.txt' \
  --exclude 'cloudflare-tunnel.log' \
  --exclude '.tunnel-id.txt' \
  . "$UPLOAD_DIR/"

# Criar arquivo .env.production vazio (para o usuário preencher)
echo "📝 Criando .env.production template..."
cat > "$UPLOAD_DIR/.env.production" << 'EOF'
# Variáveis de Ambiente - Produção
# Preencha com seus valores reais

NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ASAAS_API_KEY=
APIFACIL_INSTANCE_ID=
APIFACIL_TOKEN=
NEXT_PUBLIC_SITE_URL=
EOF

echo ""
echo "✅ Arquivos preparados em: $UPLOAD_DIR"
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo ""
echo "1. Abra a pasta: $UPLOAD_DIR"
echo ""
echo "2. Edite o arquivo .env.production e adicione suas variáveis"
echo ""
echo "3. Faça upload de TODA a pasta para a Hostinger via File Manager"
echo ""
echo "4. No servidor, execute:"
echo "   cd public_html"
echo "   npm install"
echo "   npm run build"
echo "   npm install -g pm2"
echo "   pm2 start npm --name 'sistema-contas' -- start"
echo "   pm2 save"
echo ""
