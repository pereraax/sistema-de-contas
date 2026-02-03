#!/bin/bash

# Script para iniciar o Cloudflare Tunnel com URL fixa
# Uso: ./iniciar-tunnel-fixo.sh

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Iniciando Cloudflare Tunnel com URL Fixa"
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

TUNNEL_NAME="plen-webhook"
WEBHOOK_URL="https://webhook.uppmax.store/api/whatsapp/apifacil/webhook"

# 1. Verificar se servidor está rodando
echo "📡 Verificando servidor na porta 3000..."
if ! lsof -ti:3000 > /dev/null 2>&1; then
    print_error "Servidor não está rodando na porta 3000"
    print_info "Execute primeiro: npm run dev"
    exit 1
fi
print_success "Servidor está rodando"
echo ""

# 2. Parar processos anteriores
echo "🛑 Parando processos anteriores do Cloudflare Tunnel..."
pkill -f "cloudflared tunnel" 2>/dev/null || true
sleep 2
print_success "Processos anteriores parados"
echo ""

# 3. Verificar se tunnel existe
echo "🔍 Verificando tunnel '$TUNNEL_NAME'..."
if ! cloudflared tunnel list 2>/dev/null | grep -q "$TUNNEL_NAME"; then
    print_error "Tunnel '$TUNNEL_NAME' não encontrado"
    print_info "Execute primeiro: ./configurar-url-fixa-uppmax.sh"
    exit 1
fi
print_success "Tunnel '$TUNNEL_NAME' encontrado"
echo ""

# 4. Criar diretório de logs
mkdir -p logs

# 5. Iniciar tunnel
echo "🚀 Iniciando Cloudflare Tunnel..."
cloudflared tunnel run "$TUNNEL_NAME" > logs/cloudflare-tunnel-fixo.log 2>&1 &
TUNNEL_PID=$!

sleep 5

# 6. Verificar se iniciou
if ! ps -p $TUNNEL_PID > /dev/null 2>&1; then
    print_error "Erro ao iniciar tunnel. Verifique logs/cloudflare-tunnel-fixo.log"
    tail -20 logs/cloudflare-tunnel-fixo.log
    exit 1
fi

print_success "Tunnel iniciado (PID: $TUNNEL_PID)"
echo ""

# 7. Aguardar conexão
echo "⏳ Aguardando conexão do tunnel..."
sleep 5

# 8. Testar URL
echo "🧪 Testando URL do webhook..."
TEST_RESULT=$(curl -s -o /dev/null -w "%{http_code}" "$WEBHOOK_URL" 2>/dev/null || echo "000")

if [ "$TEST_RESULT" = "200" ]; then
    print_success "URL está funcionando! (HTTP $TEST_RESULT)"
else
    print_warning "URL retornou HTTP $TEST_RESULT"
    print_info "Aguarde alguns segundos e teste novamente"
fi
echo ""

# 9. Salvar URLs
echo "https://webhook.uppmax.store" > .tunnel-url.txt
echo "$WEBHOOK_URL" > .webhook-url.txt

# 10. Mostrar resultado
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_success "TUNNEL INICIADO COM SUCESSO!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 URL do Tunnel:"
echo "   https://webhook.uppmax.store"
echo ""
echo "🔗 URL do Webhook (COPIE E COLE NO APIFACIL.DEV):"
echo "   $WEBHOOK_URL"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
print_info "IMPORTANTE:"
echo "   ✅ Esta URL é 100% FIXA e não mudará nunca!"
echo "   ✅ O tunnel está rodando em background (PID: $TUNNEL_PID)"
echo "   ✅ Para ver os logs: tail -f logs/cloudflare-tunnel-fixo.log"
echo "   ✅ Para parar: pkill -f 'cloudflared tunnel'"
echo ""
echo "📋 Próximos passos:"
echo "   1. Copie a URL do webhook acima"
echo "   2. Cole no apifacil.dev em 'Config. Webhook'"
echo "   3. Salve a configuração"
echo "   4. Envie 'oi' pelo WhatsApp para testar"
echo ""
