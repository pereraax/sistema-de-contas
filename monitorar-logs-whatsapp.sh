#!/bin/bash

echo "🔍 Monitorando logs do WhatsApp em tempo real..."
echo "📋 Pressione Ctrl+C para parar"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Encontrar o PID do processo next-server
NEXT_PID=$(pgrep -f "next-server" | head -1)

if [ -z "$NEXT_PID" ]; then
  echo "❌ Servidor Next.js não encontrado!"
  echo "💡 Execute 'npm run dev' primeiro"
  exit 1
fi

echo "✅ Servidor encontrado (PID: $NEXT_PID)"
echo "📊 Monitorando logs..."
echo ""

# Tentar ver logs do processo (pode não funcionar em todos os sistemas)
# No macOS, podemos tentar usar log stream
if command -v log &> /dev/null; then
  echo "📝 Usando log stream do macOS..."
  log stream --predicate 'process == "node" OR process == "next-server"' --level debug 2>/dev/null | grep -iE "whatsapp|plen|envio|limite|🚀|📝|✅|❌" || echo "Log stream não disponível"
else
  echo "⚠️  Não foi possível acessar logs do sistema"
  echo ""
  echo "💡 Para ver os logs:"
  echo "   1. Pare o servidor atual (Ctrl+C no terminal onde está rodando)"
  echo "   2. Execute 'npm run dev' em um terminal visível"
  echo "   3. Os logs aparecerão nesse terminal"
fi

