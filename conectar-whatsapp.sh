#!/bin/bash

echo "🚀 Conectando WhatsApp..."
echo ""
echo "📱 O QR Code aparecerá no terminal onde o servidor está rodando!"
echo ""

curl http://localhost:3000/api/whatsapp/connect

echo ""
echo ""
echo "✅ Se o servidor estiver rodando, o QR Code apareceu acima!"
echo "📱 Se não apareceu, verifique se o servidor está rodando: npm run dev"










