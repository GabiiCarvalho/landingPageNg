FROM php:8.2-cli

RUN docker-php-ext-install pdo pdo_mysql

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

WORKDIR /var/www/html

COPY . /var/www/html/

RUN chown -R www-data:www-data /var/www/html && \
    chmod -R 755 /var/www/html

RUN printf '#!/bin/bash\necho "Iniciando servidor PHP N&G Express..."\necho "Porta: ${PORT:-8080}"\nphp -S 0.0.0.0:${PORT:-8080} -t /var/www/html /var/www/html/router.php\n' > /start.sh && \
    chmod +x /start.sh

EXPOSE 8080

CMD ["/start.sh"]