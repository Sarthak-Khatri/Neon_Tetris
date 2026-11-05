
FROM php:8.3-apache

WORKDIR /var/www/html

COPY . .

RUN a2enmod rewrite

EXPOSE 80

