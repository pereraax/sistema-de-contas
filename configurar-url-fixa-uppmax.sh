#!/bin/bash

# Script para configurar URL fixa usando uppmax.store
# Uso: ./configurar-url-fixa-uppmax.sh

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Configurando URL Fixa: webhook.uppmax.store"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️ $1${NC}"; }

# Configurações
DOMAIN="uppmax.store"
SUBDOMAIN="webhook"
FULL_DOMAIN="${SUBDOMAIN}.${DOMAIN}"
TUNNEL_NAME="plen-webhook"

# 1. Verificar cloudflared
echo "🔍 Verificando cloudflared..."
if ! command -v cloudflared &> /dev/null; then
    print_error "cloudflared não encontrado. Instalando..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if command -v brew &> /dev/null; then
            brew install cloudflared
        else
            print_error "brew não encontrado. Instale cloudflared manualmente."
            exit 1
        fi
    fi
fi
print_success "cloudflared encontrado"
echo ""

# 2. Verificar login
echo "🔐 Verificando login no Cloudflare..."
if ! cloudflared tunnel list &> /dev/null; then
    print_warning "Não está logado. Fazendo login..."
    cloudflared tunnel login
fi
print_success "Login verificado"
echo ""

# 3. Verificar se servidor está rodando
echo "📡 Verificando servidor na porta 3000..."
if ! lsof -ti:3000 > /dev/null 2>&1; then
    print_warning "Servidor não está rodando. Iniciando..."
    npm run dev > /dev/null 2>&1 &
    sleep 5
    if ! lsof -ti:3000 > /dev/null 2>&1; then
        print_error "Erro ao iniciar servidor"
        exit 1
    fi
    print_success "Servidor iniciado"
else
    print_success "Servidor já está rodando"
fi
echo ""

# 4. Parar processos anteriores
echo "🛑 Parando processos anteriores..."
pkill -f "cloudflared tunnel" 2>/dev/null || true
sleep 2
print_success "Processos anteriores parados"
echo ""

# 5. Verificar/Criar tunnel
echo "🔍 Verificando tunnel '$TUNNEL_NAME'..."
EXISTING_TUNNEL=$(cloudflared tunnel list 2>/dev/null | grep "$TUNNEL_NAME" || true)

if [ -z "$EXISTING_TUNNEL" ]; then
    print_warning "Tunnel não encontrado. Criando..."
    TUNNEL_OUTPUT=$(cloudflared tunnel create "$TUNNEL_NAME" 2>&1)
    # Extrair ID do tunnel (compatível com macOS - sem -P)
    TUNNEL_ID=$(echo "$TUNNEL_OUTPUT" | grep -oE 'Created tunnel [^ ]+' | awk '{print $3}' || echo "")
    
    if [ -z "$TUNNEL_ID" ]; then
        TUNNEL_ID=$(echo "$TUNNEL_OUTPUT" | grep -oE '[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}' | head -1)
    fi
    
    if [ -z "$TUNNEL_ID" ]; then
        # Tentar extrair do arquivo de credenciais
        TUNNEL_ID=$(echo "$TUNNEL_OUTPUT" | grep -oE '/[^/]+\.json' | grep -oE '[a-f0-9-]+' | head -1)
    fi
    
    if [ -z "$TUNNEL_ID" ]; then
        print_error "Erro ao criar tunnel"
        echo "$TUNNEL_OUTPUT"
        exit 1
    fi
    
    print_success "Tunnel criado: $TUNNEL_ID"
else
    print_success "Tunnel '$TUNNEL_NAME' já existe"
    TUNNEL_ID=$(cloudflared tunnel list 2>/dev/null | grep "$TUNNEL_NAME" | awk '{print $1}' | head -1)
fi
echo ""

# 6. Criar diretório de configuração
mkdir -p ~/.cloudflared
mkdir -p logs

# 7. Criar arquivo de configuração
CONFIG_FILE="$HOME/.cloudflared/config.yml"
echo "📝 Criando arquivo de configuração..."

cat > "$CONFIG_FILE" << EOF
tunnel: $TUNNEL_ID
credentials-file: $HOME/.cloudflared/$TUNNEL_ID.json

ingress:
  - hostname: $FULL_DOMAIN
    service: http://localhost:3000
  - service: http_status:404
EOF

print_success "Arquivo de configuração criado: $CONFIG_FILE"
echo ""

# 8. Mostrar instruções de DNS
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 CONFIGURE O DNS NO CLOUDFLARE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
print_info "ID do Tunnel: $TUNNEL_ID"
echo ""
echo "Siga estes passos:"
echo ""
echo "1. Na página que você está (Domain Management), clique em: uppmax.store"
echo "2. No menu lateral, clique em: DNS"
echo "3. Clique em: Add record"
echo "4. Configure:"
echo "   - Type: CNAME"
echo "   - Name: $SUBDOMAIN"
echo "   - Target: $TUNNEL_ID.cfargotunnel.com"
echo "   - Proxy status: Desligado (nuvem cinza) ⚠️ IMPORTANTE!"
echo "   - TTL: Auto"
echo "5. Clique em: Save"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
read -p "Após configurar o DNS, pressione Enter para continuar..."
echo ""

# 9. Iniciar tunnel
echo "🚀 Iniciando Cloudflare Tunnel..."
cloudflared tunnel run "$TUNNEL_NAME" > logs/cloudflare-tunnel.log 2>&1 &
TUNNEL_PID=$!

sleep 3

if ! ps -p $TUNNEL_PID > /dev/null 2>&1; then
    print_error "Erro ao iniciar tunnel. Verifique logs/cloudflare-tunnel.log"
    tail -20 logs/cloudflare-tunnel.log
    exit 1
fi

print_success "Tunnel iniciado (PID: $TUNNEL_PID)"
echo ""

# 10. Salvar URLs
WEBHOOK_URL="https://${FULL_DOMAIN}/api/whatsapp/apifacil/webhook"
echo "https://${FULL_DOMAIN}" > .tunnel-url.txt
echo "$WEBHOOK_URL" > .webhook-url.txt

# 11. Mostrar resultado
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_success "CONFIGURAÇÃO CONCLUÍDA!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 URL do Tunnel:"
echo "   https://${FULL_DOMAIN}"
echo ""
echo "🔗 URL do Webhook (COPIE E COLE NO APIFACIL.DEV):"
echo "   $WEBHOOK_URL"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
print_info "IMPORTANTE:"
echo "   ✅ Esta URL é 100% FIXA e não mudará nunca!"
echo "   ✅ Configure o DNS no Cloudflare (passos acima)"
echo "   ✅ Aguarde alguns minutos para o DNS propagar"
echo "   ✅ Depois, use a URL no apifacil.dev"
echo ""
echo "📋 Próximos passos:"
echo "   1. Configure o DNS no Cloudflare (se ainda não fez)"
echo "   2. Aguarde 2-5 minutos para propagação do DNS"
echo "   3. Teste a URL: curl $WEBHOOK_URL"
echo "   4. Copie a URL do webhook e cole no apifacil.dev"
echo ""

