# Deployment - Развертывание ResumeMint

## 📋 Описание

Данный документ содержит подробные инструкции по развертыванию проекта ResumeMint в различных средах: от локальной разработки до production серверов. Включает настройку серверов, конфигурацию безопасности и мониторинг.

## 🎯 Среда развертывания

### Локальная разработка
- **Цель**: Разработка и тестирование
- **Сервер**: Локальный компьютер
- **Трафик**: Низкий
- **Безопасность**: Базовая

### Staging/Testing
- **Цель**: Тестирование перед production
- **Сервер**: Тестовый сервер
- **Трафик**: Средний
- **Безопасность**: Production-подобная

### Production
- **Цель**: Рабочая среда
- **Сервер**: Production сервер
- **Трафик**: Высокий
- **Безопасность**: Максимальная

## 🚀 Локальное развертывание

### Требования
- Docker 20.10+
- Docker Compose 2.0+
- 4GB RAM
- 2GB свободного места

### Быстрый старт
```bash
# Клонировать проект
git clone <repository-url>
cd ResumeMint1

# Настроить переменные окружения
cp backend/env.example backend/.env
# Отредактировать backend/.env

# Запустить
docker compose up --build -d

# Проверить
curl http://localhost:8080/api/ping
```

### Конфигурация для разработки
```yaml
# docker-compose.dev.yml
version: '3.8'
services:
  api:
    environment:
      - NODE_ENV=development
      - DEBUG=true
    volumes:
      - ./backend:/app
      - /app/node_modules
    ports:
      - "5000:5000"
  
  web:
    volumes:
      - ./index.html:/usr/share/nginx/html/index.html
      - ./globals.css:/usr/share/nginx/html/globals.css
    ports:
      - "8080:80"
```

## 🌐 Staging развертывание

### Требования
- VPS или облачный сервер
- Ubuntu 20.04+ / CentOS 8+
- 2GB RAM
- 20GB дискового пространства

### Подготовка сервера

#### Установка Docker
```bash
# Обновить систему
sudo apt update && sudo apt upgrade -y

# Установить зависимости
sudo apt install apt-transport-https ca-certificates curl gnupg lsb-release

# Добавить GPG ключ Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Добавить репозиторий
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Установить Docker
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Добавить пользователя в группу docker
sudo usermod -aG docker $USER
newgrp docker

# Проверить установку
docker --version
docker compose version
```

#### Настройка файрвола
```bash
# Установить UFW
sudo apt install ufw

# Настроить правила
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 8080/tcp

# Включить файрвол
sudo ufw enable
sudo ufw status
```

### Развертывание приложения

#### Клонирование и настройка
```bash
# Клонировать проект
git clone <repository-url>
cd ResumeMint1

# Создать пользователя для приложения
sudo useradd -r -s /bin/false resumemint
sudo chown -R resumemint:resumemint /path/to/ResumeMint1

# Настроить переменные окружения
cp backend/env.example backend/.env
nano backend/.env
```

#### Production конфигурация
```yaml
# docker-compose.staging.yml
version: '3.8'
services:
  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: resumemint-api-staging
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PORT=5000
      - CORS_ORIGIN=https://staging.resumemint.com
    env_file:
      - ./backend/.env
    volumes:
      - ./backend:/app
      - /app/node_modules
    networks:
      - resumemint-network
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'

  web:
    build:
      context: .
      dockerfile: docker/Dockerfile.web
    container_name: resumemint-web-staging
    restart: unless-stopped
    ports:
      - "8080:80"
    volumes:
      - ./index.html:/usr/share/nginx/html/index.html:ro
      - ./globals.css:/usr/share/nginx/html/globals.css:ro
      - ./docker/nginx/default.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      - api
    networks:
      - resumemint-network
    deploy:
      resources:
        limits:
          memory: 256M
          cpus: '0.25'

networks:
  resumemint-network:
    driver: bridge
    name: resumemint-network-staging
```

#### Запуск и мониторинг
```bash
# Запустить приложение
docker compose -f docker-compose.staging.yml up -d

# Проверить статус
docker compose -f docker-compose.staging.yml ps

# Проверить логи
docker compose -f docker-compose.staging.yml logs -f

# Проверить работоспособность
curl http://localhost:8080/api/ping
```

## 🏭 Production развертывание

### Требования
- Выделенный сервер или VPS
- Ubuntu 22.04 LTS / CentOS 9
- 4GB RAM (минимум)
- 50GB SSD
- Доменное имя
- SSL сертификат

### Подготовка сервера

#### Системные требования
```bash
# Проверить системные ресурсы
free -h
df -h
nproc

# Обновить систему
sudo apt update && sudo apt upgrade -y

# Установить необходимые пакеты
sudo apt install -y curl wget git htop nginx certbot python3-certbot-nginx
```

#### Настройка безопасности
```bash
# Создать пользователя для приложения
sudo useradd -m -s /bin/bash resumemint
sudo usermod -aG sudo resumemint

# Настроить SSH
sudo nano /etc/ssh/sshd_config
# Отключить root логин
# PermitRootLogin no
# Изменить порт SSH
# Port 2222

# Перезапустить SSH
sudo systemctl restart sshd

# Настроить файрвол
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 2222/tcp  # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### Развертывание с Nginx

#### Установка и настройка Nginx
```bash
# Установить Nginx
sudo apt install nginx

# Создать конфигурацию
sudo nano /etc/nginx/sites-available/resumemint
```

#### Nginx конфигурация
```nginx
server {
    listen 80;
    server_name resumemint.com www.resumemint.com;
    
    # Редирект на HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name resumemint.com www.resumemint.com;
    
    # SSL конфигурация
    ssl_certificate /etc/letsencrypt/live/resumemint.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/resumemint.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Безопасность
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Проксирование на Docker контейнеры
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Статические файлы
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        proxy_pass http://localhost:8080;
    }
    
    # Gzip сжатие
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss;
}
```

#### SSL сертификат
```bash
# Получить SSL сертификат
sudo certbot --nginx -d resumemint.com -d www.resumemint.com

# Настроить автообновление
sudo crontab -e
# Добавить строку:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

### Docker конфигурация для production

#### Production compose файл
```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: resumemint-api-prod
    restart: always
    environment:
      - NODE_ENV=production
      - PORT=5000
      - CORS_ORIGIN=https://resumemint.com
    env_file:
      - ./backend/.env
    volumes:
      - ./backend:/app
      - /app/node_modules
      - resumemint-logs:/app/logs
    networks:
      - resumemint-network
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '1.0'
        reservations:
          memory: 512M
          cpus: '0.5'
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/api/ping"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  web:
    build:
      context: .
      dockerfile: docker/Dockerfile.web
    container_name: resumemint-web-prod
    restart: always
    ports:
      - "127.0.0.1:8080:80"
    volumes:
      - ./index.html:/usr/share/nginx/html/index.html:ro
      - ./globals.css:/usr/share/nginx/html/globals.css:ro
      - ./docker/nginx/default.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      api:
        condition: service_healthy
    networks:
      - resumemint-network
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.25'
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  resumemint-logs:
    driver: local

networks:
  resumemint-network:
    driver: bridge
    name: resumemint-network-prod
```

#### Переменные окружения для production
```env
# backend/.env.prod
OPENAI_API_KEY=your-production-api-key

# Server
PORT=5000
NODE_ENV=production

# CORS
CORS_ORIGIN=https://resumemint.com

# Cache
CACHE_TTL=3600000

# Limits
MAX_FILE_SIZE=20971520
MAX_JSON_SIZE=20971520

# OpenAI
OPENAI_MODEL=gpt-4o-mini
OPENAI_TEMPERATURE=0.2
OPENAI_MAX_TOKENS=2000

# Security
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Запуск и мониторинг

#### Системный сервис
```bash
# Создать systemd сервис
sudo nano /etc/systemd/system/resumemint.service
```

```ini
[Unit]
Description=ResumeMint Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/resumemint
ExecStart=/usr/local/bin/docker-compose -f docker-compose.prod.yml up -d
ExecStop=/usr/local/bin/docker-compose -f docker-compose.prod.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

#### Запуск сервиса
```bash
# Включить автозапуск
sudo systemctl enable resumemint

# Запустить сервис
sudo systemctl start resumemint

# Проверить статус
sudo systemctl status resumemint
```

## 📊 Мониторинг и логирование

### Логирование

#### Настройка логов
```bash
# Создать директорию для логов
sudo mkdir -p /var/log/resumemint
sudo chown resumemint:resumemint /var/log/resumemint

# Настроить logrotate
sudo nano /etc/logrotate.d/resumemint
```

```conf
/var/log/resumemint/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 resumemint resumemint
    postrotate
        systemctl reload resumemint
    endscript
}
```

#### Сбор логов
```bash
# Скрипт для сбора логов
sudo nano /usr/local/bin/collect-logs.sh
```

```bash
#!/bin/bash
LOG_DIR="/var/log/resumemint"
DATE=$(date +%Y%m%d_%H%M%S)

# Собрать логи контейнеров
docker compose -f /opt/resumemint/docker-compose.prod.yml logs > $LOG_DIR/containers_$DATE.log 2>&1

# Собрать системные логи
journalctl -u resumemint --since "1 hour ago" > $LOG_DIR/system_$DATE.log 2>&1

# Собрать nginx логи
sudo cp /var/log/nginx/access.log $LOG_DIR/nginx_access_$DATE.log
sudo cp /var/log/nginx/error.log $LOG_DIR/nginx_error_$DATE.log

# Очистить старые логов (старше 30 дней)
find $LOG_DIR -name "*.log" -mtime +30 -delete
```

### Мониторинг

#### Health checks
```bash
# Скрипт проверки здоровья
sudo nano /usr/local/bin/health-check.sh
```

```bash
#!/bin/bash
API_URL="https://resumemint.com/api/ping"
FRONTEND_URL="https://resumemint.com"
LOG_FILE="/var/log/resumemint/health.log"

# Проверка API
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $API_URL)
if [ "$API_STATUS" = "200" ]; then
    echo "$(date): ✅ API is healthy" >> $LOG_FILE
else
    echo "$(date): ❌ API is down (HTTP $API_STATUS)" >> $LOG_FILE
    # Отправить уведомление
    # curl -X POST "webhook_url" -d "API is down"
fi

# Проверка frontend
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $FRONTEND_URL)
if [ "$FRONTEND_STATUS" = "200" ]; then
    echo "$(date): ✅ Frontend is healthy" >> $LOG_FILE
else
    echo "$(date): ❌ Frontend is down (HTTP $FRONTEND_STATUS)" >> $LOG_FILE
fi
```

#### Cron задачи
```bash
# Настроить cron
sudo crontab -e

# Добавить задачи:
# Каждые 5 минут - проверка здоровья
*/5 * * * * /usr/local/bin/health-check.sh

# Каждый час - сбор логов
0 * * * * /usr/local/bin/collect-logs.sh

# Каждый день в 2:00 - очистка старых логов
0 2 * * * find /var/log/resumemint -name "*.log" -mtime +30 -delete
```

### Метрики

#### Prometheus + Grafana
```yaml
# docker-compose.monitoring.yml
version: '3.8'
services:
  prometheus:
    image: prom/prometheus
    container_name: prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
    networks:
      - monitoring

  grafana:
    image: grafana/grafana
    container_name: grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-data:/var/lib/grafana
    networks:
      - monitoring

volumes:
  grafana-data:

networks:
  monitoring:
    driver: bridge
```

## 🔐 Безопасность

### SSL/TLS
```bash
# Автоматическое обновление SSL
sudo certbot renew --dry-run

# Проверка SSL конфигурации
curl -I https://resumemint.com
```

### Файрвол
```bash
# Дополнительные правила безопасности
sudo ufw deny 22/tcp  # Блокировать стандартный SSH порт
sudo ufw allow 2222/tcp  # Разрешить кастомный SSH порт
sudo ufw deny 8080/tcp  # Блокировать прямой доступ к Docker
```

### Обновления
```bash
# Автоматические обновления безопасности
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades

# Обновление Docker образов
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

## 🔄 CI/CD

### GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [ main ]

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
          git pull origin main
          docker compose -f docker-compose.prod.yml pull
          docker compose -f docker-compose.prod.yml up -d
          docker system prune -f
```

### Автоматическое развертывание
```bash
# Webhook для автоматического деплоя
sudo nano /usr/local/bin/deploy-webhook.sh
```

```bash
#!/bin/bash
cd /opt/resumemint
git pull origin main
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
docker system prune -f
echo "Deployment completed at $(date)" >> /var/log/resumemint/deploy.log
```

## 📞 Поддержка

### Полезные команды
```bash
# Проверка статуса
sudo systemctl status resumemint
docker compose -f docker-compose.prod.yml ps

# Перезапуск
sudo systemctl restart resumemint

# Логи
docker compose -f docker-compose.prod.yml logs -f
sudo journalctl -u resumemint -f

# Мониторинг ресурсов
docker stats
htop
```

### Резервное копирование
```bash
# Скрипт резервного копирования
sudo nano /usr/local/bin/backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/backup/resumemint"
DATE=$(date +%Y%m%d_%H%M%S)

# Создать резервную копию
mkdir -p $BACKUP_DIR
tar -czf $BACKUP_DIR/resumemint_$DATE.tar.gz \
  /opt/resumemint \
  /var/log/resumemint \
  /etc/nginx/sites-available/resumemint

# Удалить старые резервные копии (старше 30 дней)
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
```

---

**Версия**: 1.0.0  
**Последнее обновление**: 31.08.2025  
**Статус**: Готов к production
