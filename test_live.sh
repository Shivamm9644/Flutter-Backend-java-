#!/usr/bin/env bash
set -e

echo "=== 1. Checking Database Tables ==="
mysql -u dashcam -proot dashcam_db -e "SHOW TABLES; SELECT count(*) AS user_count FROM users;"

echo -e "\n=== 2. Testing /api/v1/assets ==="
curl -s http://127.0.0.1:8080/api/v1/assets

echo -e "\n\n=== 3. Testing /api/v1/auth/login ==="
curl -s -X POST http://127.0.0.1:8080/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@inurum.com","password":"admin123"}'

echo -e "\n\n=== 4. Systemd Service Status ==="
systemctl is-active dashcam-backend
systemctl is-active mysql
