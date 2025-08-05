#!/bin/bash

# ==================== SCRIPT DE BUILD DO DOCKER ====================
# Script para facilitar o build e execução do container Docker

echo "🐳 Iniciando build do Docker para Organograma Webcontinental..."

# Nome da imagem
IMAGE_NAME="organograma-webcontinental"
CONTAINER_NAME="organograma-app"

# Parar e remover container existente (se houver)
echo "🛑 Parando container existente..."
docker stop $CONTAINER_NAME 2>/dev/null || true
docker rm $CONTAINER_NAME 2>/dev/null || true

# Remover imagem existente (se houver)
echo "🗑️ Removendo imagem existente..."
docker rmi $IMAGE_NAME 2>/dev/null || true

# Build da nova imagem
echo "🔨 Fazendo build da imagem..."
docker build -t $IMAGE_NAME .

# Verificar se o build foi bem-sucedido
if [ $? -eq 0 ]; then
    echo "✅ Build realizado com sucesso!"
    
    # Executar o container
    echo "🚀 Iniciando container..."
    docker run -d \
        --name $CONTAINER_NAME \
        -p 8080:80 \
        $IMAGE_NAME
    
    # Verificar se o container está rodando
    if [ $? -eq 0 ]; then
        echo "✅ Container iniciado com sucesso!"
        echo "🌐 Aplicação disponível em: http://localhost:8080"
        echo "📊 Status do container:"
        docker ps | grep $CONTAINER_NAME
    else
        echo "❌ Erro ao iniciar container"
        exit 1
    fi
else
    echo "❌ Erro no build da imagem"
    exit 1
fi

echo ""
echo "📋 Comandos úteis:"
echo "  - Ver logs: docker logs $CONTAINER_NAME"
echo "  - Parar: docker stop $CONTAINER_NAME"
echo "  - Reiniciar: docker restart $CONTAINER_NAME"
echo "  - Remover: docker rm -f $CONTAINER_NAME" 