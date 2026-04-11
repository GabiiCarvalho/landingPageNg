FROM php:8.2-cli

# Instalar extensões necessárias
RUN docker-php-ext-install pdo pdo_mysql

# Instalar curl para requisições HTTP
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Configurar diretório de trabalho
WORKDIR /var/www/html

# Copiar todos os arquivos
COPY . /var/www/html/

# Configurar permissões
RUN chown -R www-data:www-data /var/www/html && \
    chmod -R 755 /var/www/html

# Criar script de inicialização
RUN echo '#!/bin/bash\n\
echo "🚀 Iniciando servidor PHP..."\n\
php -S 0.0.0.0:${PORT:-8080} -t /var/www/html /var/www/html/router.php' > /start.sh && \
    chmod +x /start.sh

EXPOSE 8080

CMD ["/start.sh"]