#!/bin/bash

# Script para testar o webhook do WhatsApp

echo "🧪 Testando webhook do WhatsApp..."
echo ""

# Teste 1: Webhook básico
echo "1. Testando webhook básico..."
curl -X POST http://localhost:3000/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "test"}' \
  -s | jq .

echo ""
echo "2. Aguardando logs aparecerem..."
sleep 2

echo ""
echo "3. Verificando logs..."
curl -s http://localhost:3000/api/logs/servidor | jq -r '.logs[]' | grep -i "webhook" | tail -5

echo ""
echo "✅ Teste concluído!"
echo ""
echo "💡 Se os logs aparecerem acima, o sistema está funcionando."
echo "   Se você enviar mensagem via WhatsApp e não aparecer logs,"
echo "   significa que o WhatsApp não está chamando o webhook."

