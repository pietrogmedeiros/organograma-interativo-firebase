# ==================== DOCKERFILE OTIMIZADO ====================
# Estágio 1: Usar uma imagem oficial e leve do NGINX Alpine
# Alpine é uma versão mínima do Linux, resultando em uma imagem final muito pequena (~5MB)
FROM nginx:1.25-alpine

# Define variáveis de ambiente para melhor manutenção
ENV NGINX_CONF_DIR=/etc/nginx/conf.d
ENV NGINX_HTML_DIR=/usr/share/nginx/html

# Remove a configuração padrão do NGINX para evitar conflitos
RUN rm -f /etc/nginx/conf.d/default.conf

# Copia a nossa configuração personalizada do NGINX
COPY nginx.conf ${NGINX_CONF_DIR}/

# Copia todos os arquivos da aplicação para o diretório do NGINX
# Inclui: HTML, CSS, JS, imagens e outros assets
COPY . ${NGINX_HTML_DIR}/

# Define permissões corretas para segurança
RUN chown -R nginx:nginx ${NGINX_HTML_DIR} && \
    chmod -R 755 ${NGINX_HTML_DIR}

# Expõe a porta 80 do contêiner
EXPOSE 80

# Comando para iniciar o NGINX em modo foreground
# -g "daemon off" força o NGINX a rodar em primeiro plano
CMD ["nginx", "-g", "daemon off;"]