# Estágio 1: Usar uma imagem oficial e leve do NGINX
# 'alpine' é uma versão mínima do Linux, resultando em uma imagem final muito pequena.
FROM nginx:1.25-alpine

# Remove a configuração padrão do NGINX
RUN rm /etc/nginx/conf.d/default.conf

# Copia a nossa configuração personalizada do NGINX para dentro do contêiner
COPY nginx.conf /etc/nginx/conf.d/

# Copia todos os arquivos da nossa aplicação (html, css, js) para o diretório raiz do NGINX
# O NGINX por padrão serve arquivos a partir de /usr/share/nginx/html
COPY . /usr/share/nginx/html

# Expõe a porta 80 do contêiner para o mundo exterior
# O NGINX escuta na porta 80 por padrão
EXPOSE 80

# Comando para iniciar o NGINX quando o contêiner for executado
CMD ["nginx", "-g", "daemon off;"]