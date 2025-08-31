# Развертывание - ResumeMint

## 📋 Описание

Руководство по развертыванию проекта ResumeMint в различных окружениях: локальном, staging и production.

## 🏗️ Архитектура развертывания

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Nginx Proxy   │    │   Backend API   │
│   (Static)      │◄──►│   (Port 8080)   │◄──►│   (Port 5000)   │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Локальное развертывание

### Docker Compose (рекомендуется)

```bash
# Клонировать проект
git clone <repository-url>
cd ResumeMint1

# Настроить переменные окружения
cp backend/env.example backend/.env
# Отредактировать backend/.env

# Запустить
docker compose up --build

# Проверить
http://localhost:8080
```

### Локальная разработка

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (в другом терминале)
python -m http.server 8080
# или
npx serve -s . -l 8080
```

## 🌐 Staging развертывание

### Подготовка

```bash
# Создать staging ветку
git checkout -b staging

# Обновить переменные окружения
# backend/.env
NODE_ENV=staging
CORS_ORIGIN=https://staging.resumemint.com
OPENAI_MODEL=gpt-3.5-turbo-0125
```

### Docker развертывание

```bash
# Собрать образы
docker compose -f docker-compose.staging.yml build

# Запустить
docker compose -f docker-compose.staging.yml up -d

# Проверить
docker compose -f docker-compose.staging.yml ps
```

### docker-compose.staging.yml

```yaml
version: "3.9"
services:
  api:
    build: ./backend
    env_file: ./backend/.env
    environment:
      - NODE_ENV=staging
      - CORS_ORIGIN=https://staging.resumemint.com
    ports: ["5000:5000"]
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs

  web:
    build: .
    dockerfile: ./docker/Dockerfile.web
    depends_on: [api]
    ports: ["8080:80"]
    restart: unless-stopped
    volumes:
      - ./logs/nginx:/var/log/nginx
```

## 🏭 Production развертывание

### Подготовка сервера

```bash
# Обновить систему
sudo apt update && sudo apt upgrade -y

# Установить Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Добавить пользователя в группу docker
sudo usermod -aG docker $USER

# Установить Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### SSL сертификаты

```bash
# Установить Certbot
sudo apt install certbot python3-certbot-nginx

# Получить сертификат
sudo certbot --nginx -d resumemint.com -d www.resumemint.com

# Автоматическое обновление
sudo crontab -e
# Добавить: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Production конфигурация

#### docker-compose.prod.yml

```yaml
version: "3.9"
services:
  api:
    build: ./backend
    env_file: ./backend/.env
    environment:
      - NODE_ENV=production
      - CORS_ORIGIN=https://resumemint.com
    ports: ["127.0.0.1:5000:5000"]
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs
      - ./uploads:/app/uploads
    networks:
      - internal

  web:
    build: .
    dockerfile: ./docker/Dockerfile.web
    depends_on: [api]
    ports: ["80:80", "443:443"]
    restart: unless-stopped
    volumes:
      - ./logs/nginx:/var/log/nginx
      - /etc/letsencrypt:/etc/letsencrypt:ro
      - ./ssl:/etc/ssl
    networks:
      - internal
      - external

networks:
  internal:
    driver: bridge
  external:
    driver: bridge
```

#### Production .env

```bash
# OpenAI API Configuration
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4o-mini
OPENAI_TEMPERATURE=0.2
MAX_TOKENS=4000

# Server Configuration
PORT=5000
NODE_ENV=production

# Security
CORS_ORIGIN=https://resumemint.com

# Performance
CONTEXT_LIMIT_TOKENS=200000
MAX_FILE_SIZE=20971520

# Monitoring
LOG_LEVEL=info
```

### Nginx Production конфигурация

#### docker/nginx/production.conf

```nginx
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name resumemint.com www.resumemint.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name resumemint.com www.resumemint.com;

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/resumemint.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/resumemint.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Root directory
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API proxy
    location /api/ {
        proxy_pass http://api:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

### Развертывание

```bash
# Клонировать проект
git clone <repository-url>
cd ResumeMint1

# Переключиться на production ветку
git checkout production

# Настроить переменные окружения
cp backend/env.example backend/.env
# Отредактировать backend/.env

# Создать необходимые папки
mkdir -p logs/nginx uploads ssl

# Запустить
docker compose -f docker-compose.prod.yml up -d --build

# Проверить статус
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs
```

## 📊 Мониторинг

### Логирование

```bash
# Настройка logrotate
sudo nano /etc/logrotate.d/resumemint

# Содержимое:
/var/log/resumemint/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 root root
}
```

### Метрики

```bash
# Установить Prometheus Node Exporter
docker run -d \
  --name node-exporter \
  --restart=unless-stopped \
  -p 9100:9100 \
  prom/node-exporter

# Установить Grafana
docker run -d \
  --name grafana \
  --restart=unless-stopped \
  -p 3000:3000 \
  grafana/grafana
```

### Алерты

```bash
# Создать скрипт мониторинга
nano /usr/local/bin/monitor-resumemint.sh

#!/bin/bash
# Проверка доступности API
if ! curl -f http://localhost:8080/api/health > /dev/null 2>&1; then
    echo "ResumeMint API недоступен!" | mail -s "ResumeMint Alert" admin@resumemint.com
fi

# Проверка дискового пространства
if [ $(df / | awk 'NR==2 {print $5}' | sed 's/%//') -gt 90 ]; then
    echo "Диск почти заполнен!" | mail -s "ResumeMint Alert" admin@resumemint.com
fi
```

## 🔄 CI/CD

### GitHub Actions

#### .github/workflows/deploy.yml

```yaml
name: Deploy to Production

on:
  push:
    branches: [production]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to server
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.KEY }}
        script: |
          cd /opt/resumemint
          git pull origin production
          docker compose -f docker-compose.prod.yml down
          docker compose -f docker-compose.prod.yml up -d --build
          docker system prune -f
```

### Автоматическое обновление

```bash
# Создать скрипт обновления
nano /usr/local/bin/update-resumemint.sh

#!/bin/bash
cd /opt/resumemint
git pull origin production
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --build
docker system prune -f

# Добавить в crontab
# 0 2 * * * /usr/local/bin/update-resumemint.sh
```

## 🔐 Безопасность

### Firewall

```bash
# Настроить UFW
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### Обновления

```bash
# Автоматические обновления безопасности
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

### Резервное копирование

```bash
# Скрипт резервного копирования
nano /usr/local/bin/backup-resumemint.sh

#!/bin/bash
BACKUP_DIR="/backup/resumemint"
DATE=$(date +%Y%m%d_%H%M%S)

# Создать резервную копию
mkdir -p $BACKUP_DIR
tar -czf $BACKUP_DIR/resumemint_$DATE.tar.gz \
  --exclude=node_modules \
  --exclude=.git \
  /opt/resumemint

# Удалить старые резервные копии (старше 30 дней)
find $BACKUP_DIR -name "resumemint_*.tar.gz" -mtime +30 -delete
```

## 🔗 Связанные файлы

- [Docker конфигурация](../docker/README.md)
- [Environment настройки](../config/README.md)
- [Setup руководство](../setup/README.md)
- [Troubleshooting](../troubleshooting/README.md)
