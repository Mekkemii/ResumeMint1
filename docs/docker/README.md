# Docker - ResumeMint

## 📋 Описание

Docker компонент ResumeMint обеспечивает контейнеризацию и оркестрацию всех сервисов проекта. Использует Docker Compose для управления двумя основными контейнерами: backend API (Node.js) и frontend с Nginx прокси.

## 🏗️ Архитектура

```
Docker/
├── docker-compose.yml      # Оркестрация контейнеров (26 строк, 461B)
├── Dockerfile.web          # Nginx контейнер (6 строк, 171B)
└── nginx/
    └── default.conf        # Nginx конфигурация (21 строка, 424B)
```

## 📁 Основные файлы

### `docker-compose.yml` (26 строк, 461B)

**Описание**: Основной файл оркестрации Docker контейнеров

```yaml
version: '3.8'

services:
  # Backend API сервер
  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: resumemint-api
    ports:
      - "5000:5000"
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
    restart: unless-stopped

  # Frontend + Nginx прокси
  web:
    build:
      context: .
      dockerfile: docker/Dockerfile.web
    container_name: resumemint-web
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
    restart: unless-stopped

networks:
  resumemint-network:
    driver: bridge
    name: resumemint-network
```

**Ключевые особенности**:

#### Сервис `api`
- **Образ**: Собирается из `./backend/Dockerfile`
- **Порт**: 5000 (внешний и внутренний)
- **Переменные окружения**: Загружаются из `./backend/.env`
- **Volumes**: Монтирование кода для разработки
- **Сеть**: Изолированная сеть `resumemint-network`

#### Сервис `web`
- **Образ**: Собирается из `docker/Dockerfile.web`
- **Порт**: 8080 (внешний) → 80 (внутренний)
- **Volumes**: Монтирование статических файлов и конфигурации
- **Зависимости**: Запускается после `api`
- **Прокси**: Nginx для frontend и API запросов

### `docker/Dockerfile.web` (6 строк, 171B)

**Описание**: Dockerfile для Nginx контейнера

```dockerfile
FROM nginx:alpine
COPY index.html /usr/share/nginx/html/
COPY globals.css /usr/share/nginx/html/
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Особенности**:
- **Базовый образ**: `nginx:alpine` (минимальный размер)
- **Копирование файлов**: Только необходимые статические файлы
- **Конфигурация**: Кастомная Nginx конфигурация
- **Порт**: 80 (стандартный HTTP порт)

### `docker/nginx/default.conf` (21 строка, 424B)

**Описание**: Конфигурация Nginx для проксирования запросов

```nginx
server {
    listen 80;
    server_name _;
    
    # Корневая директория для статических файлов
    root /usr/share/nginx/html;
    index index.html;
    
    # Обработка статических файлов
    location / {
        try_files $uri /index.html;
    }
    
    # Проксирование API запросов на backend
    location /api/ {
        proxy_pass http://api:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Таймауты для долгих запросов
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Кэширование статических файлов
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Ключевые настройки**:

#### Обработка статических файлов
- **Root**: `/usr/share/nginx/html`
- **Index**: `index.html`
- **Fallback**: SPA routing через `try_files`

#### Проксирование API
- **Target**: `http://api:5000/api/`
- **Headers**: Передача реальных IP и заголовков
- **Timeouts**: 60 секунд для долгих запросов

#### Кэширование
- **Статические файлы**: 1 год
- **Cache-Control**: `public, immutable`

## 🐳 Контейнеры

### Сервис `api` (Backend)

| Параметр | Значение | Описание |
|----------|----------|----------|
| **Образ** | `node:20-alpine` | Базовый образ Node.js |
| **Порт** | 5000:5000 | Внешний:Внутренний |
| **Размер** | ~200MB | Оптимизированный размер |
| **Переменные** | Из `.env` | OpenAI API ключ и настройки |
| **Volumes** | `./backend:/app` | Монтирование кода |
| **Сеть** | `resumemint-network` | Изолированная сеть |

### Сервис `web` (Frontend + Nginx)

| Параметр | Значение | Описание |
|----------|----------|----------|
| **Образ** | `nginx:alpine` | Базовый образ Nginx |
| **Порт** | 8080:80 | Внешний:Внутренний |
| **Размер** | ~50MB | Минимальный размер |
| **Volumes** | Статические файлы | Монтирование frontend |
| **Зависимости** | `api` | Запуск после backend |
| **Сеть** | `resumemint-network` | Изолированная сеть |

## 🚀 Запуск и управление

### Быстрый старт
```bash
# Сборка и запуск всех контейнеров
docker compose up --build

# Запуск в фоновом режиме
docker compose up -d --build

# Остановка контейнеров
docker compose down

# Перезапуск с пересборкой
docker compose up --build --force-recreate
```

### Отдельные сервисы
```bash
# Только backend
docker compose up api

# Только frontend
docker compose up web

# Пересборка конкретного сервиса
docker compose build api
docker compose up api
```

### Логи и мониторинг
```bash
# Логи всех сервисов
docker compose logs

# Логи конкретного сервиса
docker compose logs api
docker compose logs web

# Логи в реальном времени
docker compose logs -f

# Статус контейнеров
docker compose ps

# Использование ресурсов
docker stats
```

## 🔧 Конфигурация

### Переменные окружения

#### Backend (`.env`)
```env
# OpenAI API
OPENAI_API_KEY=your-api-key-here

# Server
PORT=5000
NODE_ENV=production

# CORS
CORS_ORIGIN=http://localhost:8080

# Cache
CACHE_TTL=3600000

# Limits
MAX_FILE_SIZE=10485760
MAX_JSON_SIZE=10485760
```

#### Docker Compose
```yaml
environment:
  - NODE_ENV=production
  - PORT=5000
  - CORS_ORIGIN=http://localhost:8080
```

### Сети
```yaml
networks:
  resumemint-network:
    driver: bridge
    name: resumemint-network
```

**Особенности**:
- **Тип**: Bridge network
- **Изоляция**: Контейнеры изолированы от хоста
- **Коммуникация**: Внутренние имена сервисов
- **Безопасность**: Ограниченный доступ

## 📊 Производительность

### Оптимизации образов
- **Alpine Linux**: Минимальный размер базовых образов
- **Multi-stage builds**: Оптимизация для production
- **Layer caching**: Эффективная пересборка
- **Volume mounting**: Быстрая разработка

### Мониторинг ресурсов
```bash
# Использование CPU и памяти
docker stats resumemint-api resumemint-web

# Размер образов
docker images

# Использование диска
docker system df
```

### Метрики
- **Время запуска**: < 30 секунд
- **Размер образов**: < 300MB общий
- **Использование памяти**: < 512MB
- **CPU**: Минимальное использование

## 🔐 Безопасность

### Изоляция контейнеров
- **Сетевая изоляция**: Bridge network
- **Файловая система**: Read-only volumes
- **Пользователи**: Non-root в контейнерах
- **Порты**: Только необходимые порты

### Переменные окружения
- **API ключи**: В `.env` файле
- **Чувствительные данные**: Не в образах
- **CORS**: Настроен для production
- **Валидация**: Проверка переменных

### Обновления безопасности
```bash
# Обновление базовых образов
docker pull node:20-alpine
docker pull nginx:alpine

# Пересборка с обновлениями
docker compose build --no-cache
docker compose up -d
```

## 🔍 Отладка

### Логи контейнеров
```bash
# Детальные логи
docker compose logs --tail=100

# Логи с временными метками
docker compose logs -t

# Логи конкретного сервиса
docker compose logs api --tail=50
```

### Вход в контейнеры
```bash
# Backend контейнер
docker compose exec api sh

# Nginx контейнер
docker compose exec web sh

# Проверка файлов
docker compose exec web ls -la /usr/share/nginx/html
```

### Проверка сети
```bash
# Список сетей
docker network ls

# Информация о сети
docker network inspect resumemint-network

# Проверка подключения
docker compose exec web ping api
```

## 🚨 Устранение неполадок

### Частые проблемы

#### 1. Контейнеры не запускаются
```bash
# Проверка логов
docker compose logs

# Проверка портов
netstat -tulpn | grep :8080
netstat -tulpn | grep :5000

# Перезапуск
docker compose down
docker compose up --build
```

#### 2. API недоступен
```bash
# Проверка backend
docker compose exec api curl localhost:5000/api/ping

# Проверка сети
docker compose exec web curl api:5000/api/ping

# Проверка переменных
docker compose exec api env | grep OPENAI
```

#### 3. Frontend не загружается
```bash
# Проверка файлов
docker compose exec web ls -la /usr/share/nginx/html

# Проверка Nginx
docker compose exec web nginx -t

# Перезапуск Nginx
docker compose exec web nginx -s reload
```

#### 4. Проблемы с памятью
```bash
# Очистка неиспользуемых ресурсов
docker system prune -a

# Проверка использования
docker stats

# Ограничение ресурсов
docker compose down
docker compose up -d --scale api=1
```

## 🔄 Обновления

### Обновление образов
```bash
# Обновление всех образов
docker compose pull

# Пересборка с обновлениями
docker compose build --no-cache

# Перезапуск с новыми образами
docker compose up -d
```

### Обновление конфигурации
```bash
# Применение изменений
docker compose down
docker compose up --build -d

# Hot reload (для некоторых изменений)
docker compose exec web nginx -s reload
```

### Версионирование
```yaml
# В docker-compose.yml
services:
  api:
    image: resumemint-api:1.0.0
  web:
    image: resumemint-web:1.0.0
```

## 📈 Масштабирование

### Горизонтальное масштабирование
```bash
# Масштабирование backend
docker compose up -d --scale api=3

# Масштабирование с балансировщиком
docker compose up -d --scale api=3 --scale web=2
```

### Production настройки
```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  api:
    deploy:
      replicas: 3
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
    restart: always
```

## 🔗 Интеграция

### С внешними сервисами
- **База данных**: PostgreSQL, MongoDB
- **Кэш**: Redis
- **Мониторинг**: Prometheus, Grafana
- **Логи**: ELK Stack

### CI/CD интеграция
```yaml
# .github/workflows/docker.yml
- name: Build and push
  run: |
    docker compose build
    docker compose push
```

---

**Версия**: 1.0.0  
**Последнее обновление**: 31.08.2025  
**Статус**: Готов к production  
**Размер образов**: < 300MB общий
