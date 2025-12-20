#!/bin/bash

# Script para configurar Cloudflare Tunnel com URL fixa permanente
# Uso: ./configurar-cloudflare-url-fixa.sh

echo "🚀 Configurando Cloudflare Tunnel com URL Fixa Permanente..."
echo ""

# Verificar se cloudflared está instalado
if ! command -v cloudflared &> /dev/null; then
    echo "📥 Instalando cloudflared..."
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if command -v brew &> /dev/null; then
            brew install cloudflared
        else
            echo "❌ brew não encontrado. Instale manualmente:"
            echo "   Acesse: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/"
            exit 1
        fi
    else
        echo "❌ Instale cloudflared manualmente:"
        echo "   Acesse: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/"
        exit 1
    fi
fi

echo "✅ cloudflared encontrado!"
echo ""

# Verificar se está logado
if ! cloudflared tunnel list &> /dev/null; then
    echo "🔐 Fazendo login no Cloudflare..."
    echo "   Isso abrirá o navegador para você fazer login"
    cloudflared tunnel login
    echo ""
fi

echo "📋 Escolha uma opção:"
echo ""
echo "1. Criar tunnel com domínio próprio (URL 100% fixa)"
echo "2. Criar tunnel com nome fixo (URL fixa enquanto usar o mesmo nome)"
echo "3. Usar tunnel existente"
echo ""
read -p "Escolha (1/2/3): " opcao

case $opcao in
    1)
        echo ""
        echo "🌐 Configuração com Domínio Próprio"
        echo ""
        read -p "Digite o nome do tunnel (ex: plen-webhook): " tunnel_name
        read -p "Digite o subdomínio (ex: webhook): " subdomain
        read -p "Digite seu domínio (ex: meudominio.com): " domain
        
        echo ""
        echo "🔨 Criando tunnel..."
        TUNNEL_OUTPUT=$(cloudflared tunnel create "$tunnel_name" 2>&1)
        TUNNEL_ID=$(echo "$TUNNEL_OUTPUT" | grep -oP 'Created tunnel \K[^ ]+' || echo "")
        
        if [ -z "$TUNNEL_ID" ]; then
            echo "❌ Erro ao criar tunnel"
            echo "$TUNNEL_OUTPUT"
            exit 1
        fi
        
        echo "✅ Tunnel criado: $TUNNEL_ID"
        echo ""
        
        # Criar diretório de configuração
        mkdir -p ~/.cloudflared
        
        # Criar arquivo de configuração
        CONFIG_FILE="$HOME/.cloudflared/config.yml"
        cat > "$CONFIG_FILE" << EOF
tunnel: $TUNNEL_ID
credentials-file: $HOME/.cloudflared/$TUNNEL_ID.json

ingress:
  - hostname: $subdomain.$domain
    service: http://localhost:3000
  - service: http_status:404
EOF
        
        echo "✅ Arquivo de configuração criado: $CONFIG_FILE"
        echo ""
        echo "📝 Próximos passos:"
        echo "   1. Acesse: https://dash.cloudflare.com"
        echo "   2. Selecione seu domínio: $domain"
        echo "   3. Vá em DNS > Records"
        echo "   4. Adicione um registro CNAME:"
        echo "      - Name: $subdomain"
        echo "      - Target: $TUNNEL_ID.cfargotunnel.com"
        echo "      - Proxy: Desligado (nuvem cinza)"
        echo "   5. Salve"
        echo ""
        echo "🔗 Sua URL será: https://$subdomain.$domain/api/whatsapp/apifacil/webhook"
        echo ""
        read -p "Após configurar o DNS, pressione Enter para iniciar o tunnel..."
        
        echo ""
        echo "🚀 Iniciando tunnel..."
        cloudflared tunnel run "$tunnel_name" > logs/cloudflare-tunnel.log 2>&1 &
        TUNNEL_PID=$!
        
        sleep 3
        
        if ps -p $TUNNEL_PID > /dev/null 2>&1; then
            echo "✅ Tunnel iniciado (PID: $TUNNEL_PID)"
            echo "🔗 URL: https://$subdomain.$domain/api/whatsapp/apifacil/webhook"
            echo "$subdomain.$domain" > .tunnel-url.txt
            echo "https://$subdomain.$domain/api/whatsapp/apifacil/webhook" > .webhook-url.txt
        else
            echo "❌ Erro ao iniciar tunnel. Verifique logs/cloudflare-tunnel.log"
        fi
        ;;
        
    2)
        echo ""
        echo "🌐 Configuração com Nome Fixo"
        echo ""
        read -p "Digite o nome do tunnel (ex: plen-webhook): " tunnel_name
        
        echo ""
        echo "🚀 Iniciando tunnel..."
        cloudflared tunnel --url http://localhost:3000 --name "$tunnel_name" > logs/cloudflare-tunnel.log 2>&1 &
        TUNNEL_PID=$!
        
        sleep 5
        
        # Tentar extrair URL do log
        TUNNEL_URL=$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' logs/cloudflare-tunnel.log 2>/dev/null | head -1)
        
        if [ ! -z "$TUNNEL_URL" ]; then
            echo "✅ Tunnel iniciado (PID: $TUNNEL_PID)"
            echo "🔗 URL: $TUNNEL_URL/api/whatsapp/apifacil/webhook"
            echo "$TUNNEL_URL" > .tunnel-url.txt
            echo "$TUNNEL_URL/api/whatsapp/apifacil/webhook" > .webhook-url.txt
        else
            echo "✅ Tunnel iniciado (PID: $TUNNEL_PID)"
            echo "⚠️ URL não encontrada automaticamente. Verifique logs/cloudflare-tunnel.log"
        fi
        ;;
        
    3)
        echo ""
        echo "📋 Tunnels existentes:"
        cloudflared tunnel list
        echo ""
        read -p "Digite o nome do tunnel que deseja usar: " tunnel_name
        
        echo ""
        echo "🚀 Iniciando tunnel..."
        cloudflared tunnel run "$tunnel_name" > logs/cloudflare-tunnel.log 2>&1 &
        TUNNEL_PID=$!
        
        sleep 3
        
        if ps -p $TUNNEL_PID > /dev/null 2>&1; then
            echo "✅ Tunnel iniciado (PID: $TUNNEL_PID)"
            echo "📊 Verifique logs/cloudflare-tunnel.log para ver a URL"
        else
            echo "❌ Erro ao iniciar tunnel. Verifique logs/cloudflare-tunnel.log"
        fi
        ;;
        
    *)
        echo "❌ Opção inválida"
        exit 1
        ;;
esac

echo ""
echo "📊 Para ver os logs: tail -f logs/cloudflare-tunnel.log"
echo "🛑 Para parar: pkill -f cloudflared"






