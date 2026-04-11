FROM php:8.2-apache

# Instalar extensões necessárias
RUN docker-php-ext-install pdo pdo_mysql

# Instalar curl para requisições HTTP
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Habilitar mod_rewrite do Apache
RUN a2enmod rewrite

# Configurar diretório de trabalho
WORKDIR /var/www/html

# Copiar todos os arquivos
COPY . /var/www/html/

# Configurar permissões
RUN chown -R www-data:www-data /var/www/html && \
    chmod -R 755 /var/www/html

# Expor porta 8080 (Railway usa essa porta)
EXPOSE 8080

# Configurar o Apache para usar a porta 8080
RUN sed -i 's/80/8080/g' /etc/apache2/ports.conf && \
    sed -i 's/80/8080/g' /etc/apache2/sites-enabled/000-default.conf

# Configurar .htaccess para permitir CORS e roteamento
RUN echo '<IfModule mod_headers.c>\n\
    Header set Access-Control-Allow-Origin "https://ng-express.netlify.app"\n\
    Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"\n\
    Header set Access-Control-Allow-Headers "Content-Type, Authorization"\n\
    Header set Access-Control-Allow-Credentials "true"\n\
</IfModule>\n\
\n\
RewriteEngine On\n\
RewriteCond %{REQUEST_FILENAME} !-f\n\
RewriteCond %{REQUEST_FILENAME} !-d\n\
RewriteRule ^(.*)$ index.php [QSA,L]' > /var/www/html/.htaccess

# Iniciar Apache
CMD ["apache2-foreground"]