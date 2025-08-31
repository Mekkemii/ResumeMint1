# Configuration - Конфигурация ResumeMint

## 📋 Описание

Данный документ содержит подробную информацию о всех конфигурационных файлах проекта ResumeMint, включая переменные окружения, настройки Docker, Nginx и других компонентов. Описывает параметры для различных сред развертывания.

## 🎯 Обзор конфигурации

### Структура конфигурационных файлов
```
ResumeMint1/
├── backend/
│   ├── .env                    # Переменные окружения backend
│   ├── package.json            # Зависимости Node.js
│   └── Dockerfile              # Docker образ backend
├── docker/
│   ├── docker-compose.yml      # Основная конфигурация Docker
│   ├── Dockerfile.web          # Docker образ frontend
│   └── nginx/
│       └── default.conf        # Конфигурация Nginx
├── index.html                  # Frontend приложение
├── globals.css                 # Стили приложения
└── docs/                       # Документация
```

### Среда конфигурации
- **Development**: Локальная разработка
- **Staging**: Тестовое окружение
- **Production**: Рабочее окружение

## 🔧 Backend конфигурация

### Переменные окружения (.env)

#### Основные настройки
```env
# OpenAI API Configuration
OPENAI_API_KEY=your-openai-api-key

# Server Configuration
PORT=5000
NODE_ENV=production

# CORS Configuration
CORS_ORIGIN=http://localhost:8080

# Cache Configuration
CACHE_TTL=3600000

# File Upload Limits
MAX_FILE_SIZE=20971520
MAX_JSON_SIZE=20971520

# OpenAI Model Settings
OPENAI_MODEL=gpt-4o-mini
OPENAI_TEMPERATURE=0.2
OPENAI_MAX_TOKENS=2000

# Security Settings
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE=app.log

# Performance
CONTEXT_LIMIT_TOKENS=200000
REQUEST_TIMEOUT=30000
```

#### Описание параметров

##### OpenAI API
- **OPENAI_API_KEY**: Ключ API для доступа к OpenAI сервисам
- **OPENAI_MODEL**: Модель GPT для генерации ответов
  - `gpt-3.5-turbo-0125`: Быстрая, экономичная
  - `gpt-4o-mini`: Баланс качества и скорости
  - `gpt-4o`: Максимальное качество
- **OPENAI_TEMPERATURE**: Креативность ответов (0.0-1.0)
- **OPENAI_MAX_TOKENS**: Максимальное количество токенов в ответе

##### Сервер
- **PORT**: Порт для запуска сервера
- **NODE_ENV**: Окружение выполнения
  - `development`: Режим разработки
  - `production`: Продакшн режим
- **CORS_ORIGIN**: Разрешенные источники для CORS

##### Производительность
- **CACHE_TTL**: Время жизни кэша в миллисекундах
- **CONTEXT_LIMIT_TOKENS**: Максимальное количество токенов в контексте
- **REQUEST_TIMEOUT**: Таймаут запросов в миллисекундах

##### Безопасность
- **RATE_LIMIT_WINDOW**: Окно для ограничения запросов (мс)
- **RATE_LIMIT_MAX_REQUESTS**: Максимальное количество запросов в окне
- **MAX_FILE_SIZE**: Максимальный размер загружаемых файлов
- **MAX_JSON_SIZE**: Максимальный размер JSON данных

### package.json

#### Основные зависимости
```json
{
  "name": "resumemint-backend",
  "version": "1.0.0",
  "description": "Backend API for ResumeMint application",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest",
    "lint": "eslint ."
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "rate-limiter-flexible": "^2.4.2",
    "openai": "^4.20.1",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "jest": "^29.7.0",
    "eslint": "^8.52.0"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=8.0.0"
  }
}
```

#### Скрипты
- **start**: Запуск в production режиме
- **dev**: Запуск с автоматической перезагрузкой
- **test**: Запуск тестов
- **lint**: Проверка кода

### Dockerfile

#### Конфигурация образа
```dockerfile
FROM node:20-alpine

# Установка рабочей директории
WORKDIR /app

# Копирование файлов зависимостей
COPY package*.json ./

# Установка зависимостей
RUN npm ci --omit=dev

# Копирование исходного кода
COPY . .

# Настройка переменных окружения
ENV NODE_ENV=production
ENV PORT=5000

# Открытие порта
EXPOSE 5000

# Запуск приложения
CMD ["npm", "run", "start"]
```

#### Оптимизации
- **Alpine Linux**: Минимальный размер образа
- **npm ci**: Быстрая установка зависимостей
- **--omit=dev**: Исключение dev зависимостей
- **NODE_ENV=production**: Оптимизация для production

## 🌐 Frontend конфигурация

### index.html

#### Основная структура
```html
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ResumeMint - Анализ резюме и вакансий</title>
    <link rel="stylesheet" href="globals.css">
</head>
<body>
    <!-- Структура приложения -->
    <div id="app">
        <!-- Навигация -->
        <nav class="navbar">
            <!-- Навигационные элементы -->
        </nav>
        
        <!-- Основной контент -->
        <main class="main-content">
            <!-- Секции приложения -->
        </main>
    </div>
    
    <!-- JavaScript -->
    <script>
        // Конфигурация API
        const API_BASE_URL = '/api';
        const API_ENDPOINTS = {
            analyze: '/analyze',
            compare: '/vacancy/detailed-match',
            cover: '/cover/generate',
            ping: '/ping'
        };
        
        // Настройки приложения
        const APP_CONFIG = {
            maxFileSize: 20 * 1024 * 1024, // 20MB
            supportedFormats: ['txt', 'doc', 'docx', 'pdf'],
            requestTimeout: 30000,
            retryAttempts: 3
        };
    </script>
</body>
</html>
```

#### API конфигурация
- **API_BASE_URL**: Базовый URL для API запросов
- **API_ENDPOINTS**: Эндпоинты для различных функций
- **APP_CONFIG**: Настройки клиентского приложения

### globals.css

#### Основные стили
```css
/* Глобальные переменные */
:root {
    /* Цветовая схема */
    --primary-color: #8b5cf6;
    --secondary-color: #10b981;
    --accent-color: #f59e0b;
    --error-color: #ef4444;
    --success-color: #10b981;
    --warning-color: #f59e0b;
    
    /* Типографика */
    --font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    --font-size-base: 14px;
    --font-size-heading: 16px;
    --line-height: 1.6;
    
    /* Размеры */
    --border-radius: 8px;
    --spacing-xs: 4px;
    --spacing-sm: 8px;
    --spacing-md: 16px;
    --spacing-lg: 24px;
    --spacing-xl: 32px;
    
    /* Тени */
    --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

/* Базовые стили */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: var(--font-family);
    font-size: var(--font-size-base);
    line-height: var(--line-height);
    color: #1f2937;
    background-color: #f9fafb;
}

/* Компоненты */
.btn {
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: var(--border-radius);
    border: none;
    cursor: pointer;
    font-size: var(--font-size-base);
    transition: all 0.2s ease;
}

.btn-primary {
    background-color: var(--primary-color);
    color: white;
}

.btn-primary:hover {
    background-color: #7c3aed;
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
}
```

#### Адаптивный дизайн
```css
/* Медиа запросы */
@media (max-width: 768px) {
    :root {
        --font-size-base: 13px;
        --font-size-heading: 15px;
        --spacing-md: 12px;
        --spacing-lg: 20px;
    }
    
    .container {
        padding: var(--spacing-sm);
    }
}

@media (max-width: 480px) {
    :root {
        --font-size-base: 12px;
        --font-size-heading: 14px;
    }
    
    .btn {
        padding: var(--spacing-xs) var(--spacing-sm);
    }
}
```

## 🐳 Docker конфигурация

### docker-compose.yml

#### Основная конфигурация
```yaml
version: '3.8'

services:
  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: resumemint-api
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PORT=5000
      - CORS_ORIGIN=http://localhost:8080
    env_file:
      - ./backend/.env
    volumes:
      - ./backend:/app
      - /app/node_modules
    networks:
      - resumemint-network
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
    container_name: resumemint-web
    restart: unless-stopped
    ports:
      - "8080:80"
    volumes:
      - ./index.html:/usr/share/nginx/html/index.html:ro
      - ./globals.css:/usr/share/nginx/html/globals.css:ro
      - ./docker/nginx/default.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      api:
        condition: service_healthy
    networks:
      - resumemint-network

networks:
  resumemint-network:
    driver: bridge
    name: resumemint-network
```

#### Описание сервисов

##### API сервис
- **build**: Сборка из Dockerfile в backend директории
- **environment**: Переменные окружения
- **env_file**: Файл с переменными окружения
- **volumes**: Монтирование директорий
- **healthcheck**: Проверка здоровья сервиса

##### Web сервис
- **build**: Сборка из Dockerfile.web
- **ports**: Проброс портов
- **volumes**: Монтирование статических файлов
- **depends_on**: Зависимость от API сервиса

### Dockerfile.web

#### Конфигурация Nginx
```dockerfile
FROM nginx:alpine

# Копирование статических файлов
COPY index.html /usr/share/nginx/html/
COPY globals.css /usr/share/nginx/html/

# Копирование конфигурации Nginx
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf

# Настройка прав доступа
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Открытие порта
EXPOSE 80

# Запуск Nginx
CMD ["nginx", "-g", "daemon off;"]
```

### nginx/default.conf

#### Конфигурация прокси
```nginx
server {
    listen 80;
    server_name _;
    
    # Корневая директория
    root /usr/share/nginx/html;
    index index.html;
    
    # Gzip сжатие
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss;
    
    # Статические файлы
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }
    
    # API проксирование
    location /api/ {
        proxy_pass http://api:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Таймауты
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
        
        # Буферизация
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
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
    
    # Безопасность
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
}
```

## 🔄 Конфигурация для разных сред

### Development

#### docker-compose.dev.yml
```yaml
version: '3.8'

services:
  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      - NODE_ENV=development
      - DEBUG=true
      - CORS_ORIGIN=http://localhost:8080
    volumes:
      - ./backend:/app
      - /app/node_modules
    ports:
      - "5000:5000"
    command: npm run dev

  web:
    build:
      context: .
      dockerfile: docker/Dockerfile.web
    volumes:
      - ./index.html:/usr/share/nginx/html/index.html
      - ./globals.css:/usr/share/nginx/html/globals.css
    ports:
      - "8080:80"
```

#### backend/.env.dev
```env
NODE_ENV=development
DEBUG=true
PORT=5000
CORS_ORIGIN=http://localhost:8080
OPENAI_API_KEY=your-dev-api-key
OPENAI_MODEL=gpt-3.5-turbo-0125
OPENAI_TEMPERATURE=0.3
CACHE_TTL=1800000
```

### Staging

#### docker-compose.staging.yml
```yaml
version: '3.8'

services:
  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: resumemint-api-staging
    restart: unless-stopped
    environment:
      - NODE_ENV=staging
      - PORT=5000
      - CORS_ORIGIN=https://staging.resumemint.com
    env_file:
      - ./backend/.env.staging
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

#### backend/.env.staging
```env
NODE_ENV=staging
PORT=5000
CORS_ORIGIN=https://staging.resumemint.com
OPENAI_API_KEY=your-staging-api-key
OPENAI_MODEL=gpt-4o-mini
OPENAI_TEMPERATURE=0.2
OPENAI_MAX_TOKENS=2000
CACHE_TTL=3600000
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX_REQUESTS=50
LOG_LEVEL=info
```

### Production

#### docker-compose.prod.yml
```yaml
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
      - ./backend/.env.prod
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

#### backend/.env.prod
```env
NODE_ENV=production
PORT=5000
CORS_ORIGIN=https://resumemint.com
OPENAI_API_KEY=your-production-api-key
OPENAI_MODEL=gpt-4o-mini
OPENAI_TEMPERATURE=0.2
OPENAI_MAX_TOKENS=2000
CACHE_TTL=3600000
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX_REQUESTS=100
MAX_FILE_SIZE=20971520
MAX_JSON_SIZE=20971520
CONTEXT_LIMIT_TOKENS=200000
REQUEST_TIMEOUT=30000
LOG_LEVEL=warn
LOG_FILE=/app/logs/app.log
```

## 🔐 Безопасность

### Переменные безопасности
```env
# CORS настройки
CORS_ORIGIN=https://resumemint.com
CORS_CREDENTIALS=true
CORS_METHODS=GET,POST,PUT,DELETE,OPTIONS
CORS_HEADERS=Content-Type,Authorization

# Rate Limiting
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_BLOCK_DURATION=3600000

# File Upload Security
MAX_FILE_SIZE=20971520
ALLOWED_FILE_TYPES=text/plain,application/pdf,application/msword
UPLOAD_PATH=/app/uploads

# API Security
API_KEY_HEADER=X-API-Key
API_KEY_VALUE=your-secure-api-key

# Session Security
SESSION_SECRET=your-super-secret-session-key
SESSION_COOKIE_SECURE=true
SESSION_COOKIE_HTTPONLY=true
```

### Nginx Security Headers
```nginx
# Безопасность
add_header X-Frame-Options DENY;
add_header X-Content-Type-Options nosniff;
add_header X-XSS-Protection "1; mode=block";
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';";
add_header Referrer-Policy "strict-origin-when-cross-origin";
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()";
```

## 📊 Мониторинг

### Логирование
```env
# Logging Configuration
LOG_LEVEL=info
LOG_FILE=/app/logs/app.log
LOG_FORMAT=json
LOG_ROTATION=daily
LOG_MAX_SIZE=100MB
LOG_MAX_FILES=30

# Error Reporting
ERROR_REPORTING_ENABLED=true
ERROR_REPORTING_SERVICE=sentry
SENTRY_DSN=your-sentry-dsn
```

### Метрики
```env
# Metrics Configuration
METRICS_ENABLED=true
METRICS_PORT=9090
METRICS_PATH=/metrics
PROMETHEUS_ENABLED=true

# Health Check
HEALTH_CHECK_ENABLED=true
HEALTH_CHECK_PATH=/health
HEALTH_CHECK_INTERVAL=30s
```

## 🔄 Обновление конфигурации

### Процесс обновления
```bash
# 1. Создать резервную копию
cp backend/.env backend/.env.backup

# 2. Обновить конфигурацию
nano backend/.env

# 3. Перезапустить сервисы
docker compose down
docker compose up -d

# 4. Проверить работоспособность
curl http://localhost:8080/api/ping
```

### Валидация конфигурации
```bash
# Проверка синтаксиса Docker Compose
docker compose config

# Проверка переменных окружения
node -e "require('dotenv').config(); console.log('Config loaded successfully')"

# Проверка Nginx конфигурации
docker exec resumemint-web nginx -t
```

## 📝 Шаблоны конфигурации

### env.example
```env
# Скопировать в .env и заполнить значения
OPENAI_API_KEY=your-openai-api-key
NODE_ENV=development
PORT=5000
CORS_ORIGIN=http://localhost:8080
OPENAI_MODEL=gpt-4o-mini
OPENAI_TEMPERATURE=0.2
CACHE_TTL=3600000
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### docker-compose.override.yml
```yaml
# Локальные переопределения (не коммитить в git)
version: '3.8'

services:
  api:
    environment:
      - DEBUG=true
    volumes:
      - ./backend:/app
      - /app/node_modules
    ports:
      - "5000:5000"
    command: npm run dev

  web:
    volumes:
      - ./index.html:/usr/share/nginx/html/index.html
      - ./globals.css:/usr/share/nginx/html/globals.css
```

---

**Версия**: 1.0.0  
**Последнее обновление**: 31.08.2025  
**Статус**: Актуально
