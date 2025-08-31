# Docker Overlay - ResumeMint

## 📋 Описание

Docker Overlay для ResumeMint обеспечивает контейнеризацию приложения с Nginx прокси-сервером для раздачи статического фронтенда и проксирования API запросов к backend.

## 📁 Файловая структура

```
/
├── docker-compose.yml           # Оркестрация сервисов
├── .dockerignore               # Исключения для Docker
├── docker/
│   ├── Dockerfile.web          # Nginx контейнер
│   └── nginx/
│       └── default.conf        # Nginx конфигурация
└── backend/
    └── Dockerfile              # Backend контейнер
```

## 🔧 Основные файлы

### docker-compose.yml
```yaml
version: "3.9"
services:
  api:
    build: ./backend
    env_file: ./backend/.env
    environment:
      - PORT=5000
      - NODE_ENV=production
      - CORS_ORIGIN=http://localhost:8080
    ports: ["5000:5000"]
    restart: unless-stopped

  web:
    build: .
    dockerfile: ./docker/Dockerfile.web
    depends_on: [api]
    ports: ["8080:80"]
    restart: unless-stopped
```

**Сервисы:**
- **api** - Node.js backend (порт 5000)
- **web** - Nginx frontend (порт 8080)

### docker/Dockerfile.web
```dockerfile
FROM nginx:alpine
COPY ./docker/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY index.html /usr/share/nginx/html/
COPY globals.css /usr/share/nginx/html/
EXPOSE 80
```

**Функции:**
- Базовый образ: nginx:alpine
- Копирование конфигурации Nginx
- Копирование статических файлов
- Экспорт порта 80

### docker/nginx/default.conf
```nginx
server {
  listen 80;
  server_name _;

  root /usr/share/nginx/html;
  index index.html;

  location / {
    try_files $uri /index.html;
  }

  location /api/ {
    proxy_pass http://api:5000/api/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

**Конфигурация:**
- Статические файлы из `/usr/share/nginx/html`
- SPA routing с fallback на index.html
- Проксирование `/api/*` на backend

### backend/Dockerfile
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
ENV NODE_ENV=production
EXPOSE 5000
CMD ["npm", "run", "start"]
```

**Функции:**
- Базовый образ: node:20-alpine
- Установка зависимостей
- Копирование кода
- Запуск в production режиме

## 🌐 Сетевая архитектура

### Порты
- **8080** - Публичный доступ (Nginx)
- **5000** - Backend API (внутренний)

### Проксирование
```
Клиент → Nginx:8080 → Backend:5000
```

### Маршрутизация
- `/` → Статические файлы (index.html)
- `/api/*` → Backend API
- `/*` → SPA fallback

## 🔧 Переменные окружения

### Backend (.env)
```bash
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-3.5-turbo-0125
OPENAI_TEMPERATURE=0.2
MAX_TOKENS=2000
PORT=5000
CORS_ORIGIN=http://localhost:8080
```

### Docker Compose
```yaml
environment:
  - PORT=5000
  - NODE_ENV=production
  - CORS_ORIGIN=http://localhost:8080
```

## 🚀 Запуск

### Сборка и запуск
```bash
# Полная сборка
docker compose up --build

# Запуск в фоне
docker compose up -d

# Только сборка
docker compose build
```

### Остановка
```bash
# Остановка сервисов
docker compose down

# Остановка с удалением volumes
docker compose down -v
```

### Логи
```bash
# Все логи
docker compose logs

# Логи конкретного сервиса
docker compose logs api
docker compose logs web

# Логи в реальном времени
docker compose logs -f
```

## 🔍 Отладка

### Проверка контейнеров
```bash
# Статус контейнеров
docker compose ps

# Информация о контейнерах
docker compose top
```

### Вход в контейнер
```bash
# Backend контейнер
docker compose exec api sh

# Nginx контейнер
docker compose exec web sh
```

### Проверка сетей
```bash
# Список сетей
docker network ls

# Информация о сети
docker network inspect resumemint1_default
```

## 📊 Мониторинг

### Метрики контейнеров
```bash
# Использование ресурсов
docker stats

# Информация о контейнерах
docker compose top
```

### Логирование
- Nginx access logs
- Backend application logs
- Docker system logs

## 🔐 Безопасность

### Изоляция
- Каждый сервис в отдельном контейнере
- Изолированные сети
- Минимальные базовые образы

### Переменные окружения
- API ключи в .env файле
- Не коммитятся в git
- Передаются через env_file

### Обновления
```bash
# Обновление образов
docker compose pull

# Пересборка с обновлениями
docker compose up --build --force-recreate
```

## 🔗 Связанные файлы

- [Frontend](../frontend/README.md)
- [Backend](../backend/README.md)
- [Environment настройки](../config/README.md)
- [Deployment](../deployment/README.md)
