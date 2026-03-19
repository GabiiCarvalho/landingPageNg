FROM php:8.2-apache

# Desabilita módulos conflitantes diretamente nos arquivos de conf
RUN rm -f /etc/apache2/mods-enabled/mpm_event.conf \
         /etc/apache2/mods-enabled/mpm_event.load \
         /etc/apache2/mods-enabled/mpm_worker.conf \
         /etc/apache2/mods-enabled/mpm_worker.load \
    && ln -sf /etc/apache2/mods-available/mpm_prefork.conf /etc/apache2/mods-enabled/mpm_prefork.conf \
    && ln -sf /etc/apache2/mods-available/mpm_prefork.load /etc/apache2/mods-enabled/mpm_prefork.load

RUN a2enmod rewrite headers

RUN docker-php-ext-install pdo pdo_mysql

COPY . /var/www/html/

RUN sed -i 's/AllowOverride None/AllowOverride All/g' /etc/apache2/apache2.conf

RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html

EXPOSE 80