#!/bin/bash

# ==================== SCRIPT DE BUILD DOCKER V3 ====================
# Script para atualizar o Docker com as novas funcionalidades

echo "🚀 Iniciando build Docker v3..."

# Define nomes
IMAGE_NAME="organograma-webcontinental-v3"
CONTAINER_NAME="organograma-app-v3"
PORT="8082"

echo "📦 Parando e removendo container anterior..."
docker stop $CONTAINER_NAME 2>/dev/null || true
docker rm $CONTAINER_NAME 2>/dev/null || true

echo "🗑️ Removendo imagem anterior..."
docker rmi $IMAGE_NAME 2>/dev/null || true

echo "🔨 Construindo nova imagem..."
docker build --no-cache -t $IMAGE_NAME .

if [ $? -eq 0 ]; then
    echo "✅ Imagem construída com sucesso!"
    
    echo "🚀 Iniciando novo container..."
    docker run -d --name $CONTAINER_NAME -p $PORT:80 $IMAGE_NAME
    
    if [ $? -eq 0 ]; then
        echo "✅ Container iniciado com sucesso!"
        echo ""
        echo "🎉 APLICAÇÃO ATUALIZADA!"
        echo "📱 Acesse: http://localhost:$PORT"
        echo ""
        echo "📋 Comandos úteis:"
        echo "   docker logs $CONTAINER_NAME    # Ver logs"
        echo "   docker stop $CONTAINER_NAME    # Parar container"
        echo "   docker start $CONTAINER_NAME   # Iniciar container"
        echo "   docker exec -it $CONTAINER_NAME sh  # Acessar container"
    else
        echo "❌ Erro ao iniciar container"
        exit 1
    fi
else
    echo "❌ Erro ao construir imagem"
    exit 1
fi 