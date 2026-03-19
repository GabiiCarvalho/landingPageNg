FROM php:8.2-apache

RUN docker-php-ext-install pdo pdo_mysql

# Copiar arquivos do projeto
COPY . /var/www/html/

# Ajustar permissões
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html

# Porta que o Apache usa
EXPOSE 80