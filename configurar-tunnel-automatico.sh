#!/bin/bash

# Script para configurar Cloudflare Tunnel automaticamente
# Uso: ./configurar-tunnel-automatico.sh

set -e  # Parar em caso de erro

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Configuração Automática do Cloudflare Tunnel"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Função para imprimir mensagens
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 1. Verificar se servidor está rodando
echo "📡 Verificando se o servidor está rodando na porta 3000..."
if ! lsof -ti:3000 > /dev/null 2>&1; then
    print_warning "Servidor não está rodando. Iniciando..."
    npm run dev > /dev/null 2>&1 &
    SERVER_PID=$!
    echo "⏳ Aguardando servidor iniciar (5 segundos)..."
    sleep 5
    
    if ! lsof -ti:3000 > /dev/null 2>&1; then
        print_error "Erro ao iniciar servidor"
        exit 1
    fi
    print_success "Servidor iniciado (PID: $SERVER_PID)"
else
    print_success "Servidor já está rodando"
fi
echo ""

# 2. Verificar/Instalar cloudflared
echo "🔍 Verificando cloudflared..."
if ! command -v cloudflared &> /dev/null; then
    print_warning "cloudflared não encontrado. Instalando..."
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if command -v brew &> /dev/null; then
            brew install cloudflared
        else
            print_error "brew não encontrado. Instalando cloudflared manualmente..."
            curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-amd64 -o /tmp/cloudflared
            chmod +x /tmp/cloudflared
            sudo mv /tmp/cloudflared /usr/local/bin/cloudflared
        fi
    else
        print_error "Sistema operacional não suportado. Instale cloudflared manualmente."
        exit 1
    fi
    
    print_success "cloudflared instalado"
else
    print_success "cloudflared já está instalado"
fi
echo ""

# 3. Parar processos anteriores
echo "🛑 Parando processos anteriores do Cloudflare Tunnel..."
pkill -f "cloudflared tunnel" 2>/dev/null || true
sleep 2
print_success "Processos anteriores parados"
echo ""

# 4. Verificar/Criar diretório de logs
mkdir -p logs
print_success "Diretório de logs criado"
echo ""

# 5. Verificar se está logado no Cloudflare
echo "🔐 Verificando login no Cloudflare..."
if ! cloudflared tunnel list &> /dev/null; then
    print_warning "Não está logado. Fazendo login..."
    echo ""
    echo "📱 Isso abrirá o navegador para você fazer login no Cloudflare"
    echo "   Após fazer login, volte aqui e pressione Enter"
    echo ""
    read -p "Pressione Enter quando estiver pronto..."
    
    cloudflared tunnel login
    print_success "Login realizado"
else
    print_success "Já está logado no Cloudflare"
fi
echo ""

# 6. Verificar se já existe um tunnel
TUNNEL_NAME="plen-webhook"
echo "🔍 Verificando se já existe um tunnel chamado '$TUNNEL_NAME'..."
EXISTING_TUNNEL=$(cloudflared tunnel list 2>/dev/null | grep "$TUNNEL_NAME" || true)

if [ -z "$EXISTING_TUNNEL" ]; then
    print_warning "Tunnel não encontrado. Criando novo tunnel..."
    TUNNEL_OUTPUT=$(cloudflared tunnel create "$TUNNEL_NAME" 2>&1)
    TUNNEL_ID=$(echo "$TUNNEL_OUTPUT" | grep -oP 'Created tunnel \K[^ ]+' || echo "")
    
    if [ -z "$TUNNEL_ID" ]; then
        # Tentar outro padrão
        TUNNEL_ID=$(echo "$TUNNEL_OUTPUT" | grep -oP '[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}' | head -1)
    fi
    
    if [ -z "$TUNNEL_ID" ]; then
        print_error "Erro ao criar tunnel. Verifique a saída:"
        echo "$TUNNEL_OUTPUT"
        exit 1
    fi
    
    print_success "Tunnel criado: $TUNNEL_ID"
else
    print_success "Tunnel '$TUNNEL_NAME' já existe"
    # Tentar obter o ID do tunnel existente
    TUNNEL_ID=$(cloudflared tunnel list 2>/dev/null | grep "$TUNNEL_NAME" | awk '{print $1}' | head -1)
fi
echo ""

# 7. Iniciar tunnel
echo "🚀 Iniciando Cloudflare Tunnel..."
cloudflared tunnel --url http://localhost:3000 > logs/cloudflare-tunnel.log 2>&1 &
TUNNEL_PID=$!

echo "⏳ Aguardando tunnel gerar URL (8 segundos)..."
sleep 8

# Verificar se iniciou
if ! ps -p $TUNNEL_PID > /dev/null 2>&1; then
    print_error "Erro ao iniciar tunnel. Verifique logs/cloudflare-tunnel.log"
    tail -20 logs/cloudflare-tunnel.log
    exit 1
fi

print_success "Tunnel iniciado (PID: $TUNNEL_PID)"
echo ""

# 8. Extrair URL do log
echo "🔍 Extraindo URL do tunnel..."
sleep 3

# Tentar múltiplos padrões
TUNNEL_URL=$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' logs/cloudflare-tunnel.log 2>/dev/null | head -1)

if [ -z "$TUNNEL_URL" ]; then
    TUNNEL_URL=$(grep -oE 'https://[^ ]+\.trycloudflare\.com' logs/cloudflare-tunnel.log 2>/dev/null | head -1)
fi

if [ -z "$TUNNEL_URL" ]; then
    TUNNEL_URL=$(tail -50 logs/cloudflare-tunnel.log | grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' | head -1)
fi

if [ -z "$TUNNEL_URL" ]; then
    print_warning "Não foi possível extrair URL automaticamente"
    echo ""
    echo "📊 Últimas linhas do log:"
    tail -30 logs/cloudflare-tunnel.log
    echo ""
    echo "💡 Procure por uma URL que comece com 'https://' no log acima"
    echo "   Ou execute: tail -f logs/cloudflare-tunnel.log"
else
    # Salvar URLs
    echo "$TUNNEL_URL" > .tunnel-url.txt
    WEBHOOK_URL="$TUNNEL_URL/api/whatsapp/apifacil/webhook"
    echo "$WEBHOOK_URL" > .webhook-url.txt
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    print_success "CONFIGURAÇÃO CONCLUÍDA!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "🌐 URL do Tunnel:"
    echo "   $TUNNEL_URL"
    echo ""
    echo "🔗 URL do Webhook (COPIE E COLE NO APIFACIL.DEV):"
    echo "   $WEBHOOK_URL"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "💡 IMPORTANTE:"
    echo "   ✅ Esta URL é FIXA enquanto o processo estiver rodando"
    echo "   ✅ Não precisa trocar no apifacil.dev enquanto não parar o tunnel"
    echo "   ✅ URLs salvas em: .webhook-url.txt"
    echo ""
    echo "📋 Próximos passos:"
    echo "   1. Copie a URL do webhook acima"
    echo "   2. Acesse: https://apifacil.dev"
    echo "   3. Vá nas configurações da sua instância"
    echo "   4. Cole a URL do webhook"
    echo "   5. Salve"
    echo ""
    echo "📊 Comandos úteis:"
    echo "   - Ver URL: npm run url:tunnel"
    echo "   - Ver logs: tail -f logs/cloudflare-tunnel.log"
    echo "   - Parar tunnel: pkill -f 'cloudflared tunnel'"
    echo ""
fi






