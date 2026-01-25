#!/bin/bash

# Script para testar o Dockerfile localmente (simula Railway)

echo "🐳 Testando Dockerfile localmente..."
echo ""

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
  echo "❌ Docker não está instalado!"
  echo "📥 Instale Docker: https://www.docker.com/get-started"
  exit 1
fi

# Nome da imagem
IMAGE_NAME="sistema-de-contas-test"
CONTAINER_NAME="sistema-de-contas-test"

# Parar e remover container existente (se houver)
echo "🧹 Limpando containers anteriores..."
docker stop $CONTAINER_NAME 2>/dev/null || true
docker rm $CONTAINER_NAME 2>/dev/null || true

# Construir imagem
echo "🏗️  Construindo imagem Docker..."
docker build -t $IMAGE_NAME .

if [ $? -ne 0 ]; then
  echo "❌ Erro ao construir imagem Docker!"
  exit 1
fi

echo "✅ Imagem construída com sucesso!"
echo ""

# Executar container
echo "🚀 Iniciando container..."
docker run -d \
  --name $CONTAINER_NAME \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  $IMAGE_NAME

if [ $? -ne 0 ]; then
  echo "❌ Erro ao iniciar container!"
  exit 1
fi

echo "✅ Container iniciado!"
echo ""
echo "📍 Acesse: http://localhost:3000"
echo "📍 Teste a rota: http://localhost:3000/auth/callback?token_hash=test&type=magiclink&next=/home"
echo ""
echo "📋 Ver logs do container:"
echo "   docker logs -f $CONTAINER_NAME"
echo ""
echo "🛑 Para parar o container:"
echo "   docker stop $CONTAINER_NAME"
echo "   docker rm $CONTAINER_NAME"
echo ""

# Aguardar um pouco e mostrar logs
sleep 2
echo "📋 Últimas linhas dos logs:"
docker logs --tail 20 $CONTAINER_NAME
