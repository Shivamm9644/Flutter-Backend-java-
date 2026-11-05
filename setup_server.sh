#!/usr/bin/env bash
set -e

echo "=== Configuring MySQL ==="
sudo mysql << 'EOSQL'
CREATE DATABASE IF NOT EXISTS dashcam_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER USER 'root'@'localhost' IDENTIFIED BY 'root';
CREATE USER IF NOT EXISTS 'root'@'%' IDENTIFIED BY 'root';
ALTER USER 'root'@'%' IDENTIFIED BY 'root';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION;
CREATE USER IF NOT EXISTS 'dashcam'@'%' IDENTIFIED BY 'root';
ALTER USER 'dashcam'@'%' IDENTIFIED BY 'root';
GRANT ALL PRIVILEGES ON *.* TO 'dashcam'@'%' WITH GRANT OPTION;
FLUSH PRIVILEGES;
EOSQL

# Enable bind-address = 0.0.0.0 so remote DB access works if needed
if grep -q "bind-address\s*=\s*127.0.0.1" /etc/mysql/mysql.conf.d/mysqld.cnf; then
    sudo sed -i 's/bind-address\s*=\s*127.0.0.1/bind-address = 0.0.0.0/' /etc/mysql/mysql.conf.d/mysqld.cnf
    sudo systemctl restart mysql
fi

echo "=== Importing initial schema-mysql.sql ==="
if [ -f /home/ubuntu/dashcam-backend/src/main/resources/schema-mysql.sql ]; then
    sudo mysql -u root -proot dashcam_db < /home/ubuntu/dashcam-backend/src/main/resources/schema-mysql.sql
    echo "Schema imported successfully!"
fi

echo "=== MySQL Configuration Done ==="
