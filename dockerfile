FROM php:8.3-apache

WORKDIR /var/www/html/

COPY . .

RUN apt-get update && \
    apt-get install -y \
    libzip-dev

RUN docker-php-ext-install pdo pdo_mysql zip

RUN a2enmod rewrite

COPY --from=composer /usr/bin/composer /usr/bin/composer

RUN composer install

# Paquets utiles (ajout de libssl-dev et pkg-config pour l'extension mongodb)
# RUN apt-get update && apt-get install -y \
#     libzip-dev libpng-dev libjpeg62-turbo-dev libfreetype6-dev \
#     libssl-dev pkg-config \
#     zip unzip git \
#  && rm -rf /var/lib/apt/lists/*

# # Extensions PHP existantes
# RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
#  && docker-php-ext-install pdo pdo_mysql mysqli zip gd

# # --- Extension MongoDB (PECL) ---
# RUN pecl install mongodb \
#  && docker-php-ext-enable mongodb

# # Apache
# RUN a2enmod rewrite
# # Autoriser .htaccess
# RUN sed -ri 's/AllowOverride None/AllowOverride All/' /etc/apache2/apache2.conf

# # Config PHP
# COPY php.ini /usr/local/etc/php/conf.d/custom.ini

# # Composer (pour installer mongodb/mongodb)
# COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# WORKDIR /var/www/html
