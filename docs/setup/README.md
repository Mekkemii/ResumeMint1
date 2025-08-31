# Setup - Настройка ResumeMint

## 📋 Описание

Данный документ содержит подробные инструкции по настройке и развертыванию проекта ResumeMint. Включает установку зависимостей, конфигурацию переменных окружения и запуск всех компонентов.

## 🎯 Требования

### Системные требования
- **ОС**: Windows 10+, macOS 10.15+, Ubuntu 18.04+
- **RAM**: Минимум 4GB, рекомендуется 8GB+
- **Диск**: 2GB свободного места
- **Сеть**: Стабильное интернет-соединение

### Программное обеспечение
- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **Git**: 2.30+
- **Текстовый редактор**: VS Code, Sublime Text, или любой другой

### API ключи
- **OpenAI API**: Действующий API ключ с кредитами

## 🚀 Быстрая установка

### 1. Клонирование репозитория
```bash
# Клонировать проект
git clone <repository-url>
cd ResumeMint1

# Проверить структуру
ls -la
```

### 2. Настройка переменных окружения
```bash
# Скопировать пример конфигурации
cp backend/env.example backend/.env

# Отредактировать файл с вашим API ключом
# Windows
notepad backend\.env

# macOS/Linux
nano backend/.env
```

### 3. Запуск проекта
```bash
# Сборка и запуск всех контейнеров
docker compose up --build

# Или в фоновом режиме
docker compose up -d --build
```

### 4. Проверка работоспособности
```bash
# Открыть в браузере
http://localhost:8080

# Проверить API
curl http://localhost:8080/api/ping
```

## 📁 Структура проекта

```
ResumeMint1/
├── 📁 backend/              # Backend API
│   ├── server.js           # Основной сервер
│   ├── package.json        # Зависимости
│   ├── Dockerfile          # Контейнер
│   ├── .env               # Переменные окружения
│   └── env.example        # Пример конфигурации
├── 📁 docker/              # Docker конфигурация
│   ├── Dockerfile.web      # Nginx контейнер
│   └── nginx/
│       └── default.conf    # Nginx конфигурация
├── 📁 docs/               # Документация
├── index.html             # Frontend приложение
├── globals.css            # Стили
├── docker-compose.yml     # Оркестрация
└── README.md              # Основная документация
```

## ⚙️ Детальная настройка

### 1. Установка Docker

#### Windows
```bash
# Скачать Docker Desktop
# https://www.docker.com/products/docker-desktop

# Установить и запустить
# Перезагрузить компьютер при необходимости

# Проверить установку
docker --version
docker compose version
```

#### macOS
```bash
# Установить через Homebrew
brew install --cask docker

# Или скачать Docker Desktop
# https://www.docker.com/products/docker-desktop

# Запустить и проверить
docker --version
docker compose version
```

#### Ubuntu/Debian
```bash
# Обновить пакеты
sudo apt update

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

# Перезагрузить или перелогиниться
newgrp docker

# Проверить установку
docker --version
docker compose version
```

### 2. Настройка OpenAI API

#### Получение API ключа
1. Зарегистрироваться на [OpenAI Platform](https://platform.openai.com/)
2. Перейти в раздел [API Keys](https://platform.openai.com/api-keys)
3. Создать новый API ключ
4. Скопировать ключ (начинается с `sk-`)

#### Настройка переменных окружения
```bash
# Отредактировать backend/.env
OPENAI_API_KEY=sk-your-api-key-here
PORT=5000
NODE_ENV=production
CORS_ORIGIN=http://localhost:8080
CACHE_TTL=3600000
MAX_FILE_SIZE=10485760
MAX_JSON_SIZE=10485760
```

### 3. Конфигурация Docker

#### Проверка Docker Compose
```bash
# Проверить версию
docker compose version

# Проверить конфигурацию
docker compose config
```

#### Настройка ресурсов (опционально)
```bash
# Для Docker Desktop на Windows/macOS
# Открыть Docker Desktop → Settings → Resources
# Установить:
# - Memory: 4GB+
# - CPUs: 2+
# - Disk: 20GB+
```

### 4. Сборка и запуск

#### Первоначальная сборка
```bash
# Остановить существующие контейнеры
docker compose down

# Очистить кэш (если нужно)
docker system prune -a

# Сборка с пересозданием
docker compose up --build --force-recreate
```

#### Проверка контейнеров
```bash
# Статус контейнеров
docker compose ps

# Логи
docker compose logs

# Проверка сети
docker network ls
```

## 🔧 Конфигурация

### Переменные окружения

#### Обязательные переменные
```env
# OpenAI API (обязательно)
OPENAI_API_KEY=your-api-key-here

# Server (опционально, есть значения по умолчанию)
PORT=5000
NODE_ENV=production
CORS_ORIGIN=http://localhost:8080
```

#### Дополнительные настройки
```env
# Кэширование
CACHE_TTL=3600000          # 1 час в миллисекундах

# Лимиты
MAX_FILE_SIZE=10485760     # 10MB в байтах
MAX_JSON_SIZE=10485760     # 10MB в байтах

# OpenAI модели
OPENAI_MODEL=gpt-3.5-turbo-0125
OPENAI_TEMPERATURE=0.2
OPENAI_MAX_TOKENS=2000
```

### Docker Compose настройки

#### Портовая конфигурация
```yaml
services:
  api:
    ports:
      - "5000:5000"        # Backend API
  web:
    ports:
      - "8080:80"          # Frontend + Nginx
```

#### Изменение портов
```yaml
services:
  api:
    ports:
      - "3000:5000"        # Backend на порту 3000
  web:
    ports:
      - "9000:80"          # Frontend на порту 9000
```

### Nginx конфигурация

#### Основные настройки
```nginx
server {
    listen 80;
    server_name _;
    
    # Статические файлы
    root /usr/share/nginx/html;
    index index.html;
    
    # SPA routing
    location / {
        try_files $uri /index.html;
    }
    
    # API прокси
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

## 🧪 Тестирование

### Проверка API
```bash
# Проверка работоспособности
curl http://localhost:8080/api/ping

# Ожидаемый ответ
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00Z",
  "version": "1.0.0"
}
```

### Тест анализа резюме
```bash
# Тестовый запрос
curl -X POST http://localhost:8080/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "resumeText": "Иван Иванов\nPython разработчик с 3 годами опыта..."
  }'
```

### Проверка frontend
1. Открыть `http://localhost:8080` в браузере
2. Проверить загрузку всех элементов
3. Протестировать загрузку файлов
4. Проверить работу всех функций

## 🔍 Отладка

### Логи контейнеров
```bash
# Все логи
docker compose logs

# Логи конкретного сервиса
docker compose logs api
docker compose logs web

# Логи в реальном времени
docker compose logs -f

# Последние 100 строк
docker compose logs --tail=100
```

### Проверка состояния
```bash
# Статус контейнеров
docker compose ps

# Использование ресурсов
docker stats

# Информация о контейнерах
docker compose top
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

## 🚨 Устранение неполадок

### Частые проблемы

#### 1. Docker не установлен или не запущен
```bash
# Проверить статус Docker
docker --version
docker compose version

# Запустить Docker Desktop (Windows/macOS)
# Или запустить службу (Linux)
sudo systemctl start docker
sudo systemctl enable docker
```

#### 2. Порт уже занят
```bash
# Проверить занятые порты
netstat -tulpn | grep :8080
netstat -tulpn | grep :5000

# Остановить процессы или изменить порты
docker compose down
# Изменить порты в docker-compose.yml
```

#### 3. Неверный API ключ
```bash
# Проверить переменные окружения
docker compose exec api env | grep OPENAI

# Пересоздать контейнеры
docker compose down
docker compose up --build
```

#### 4. Проблемы с памятью
```bash
# Очистить неиспользуемые ресурсы
docker system prune -a

# Проверить использование
docker stats

# Увеличить лимиты в Docker Desktop
```

#### 5. Проблемы с сетью
```bash
# Проверить сети
docker network ls

# Пересоздать сеть
docker compose down
docker network prune
docker compose up
```

### Логи ошибок

#### Backend ошибки
```bash
# Проверить логи backend
docker compose logs api

# Типичные ошибки:
# - "Invalid OpenAI API key" → Проверить .env файл
# - "Port already in use" → Изменить порт
# - "ENOENT: no such file" → Проверить монтирование файлов
```

#### Nginx ошибки
```bash
# Проверить логи nginx
docker compose logs web

# Проверить конфигурацию
docker compose exec web nginx -t

# Перезапустить nginx
docker compose exec web nginx -s reload
```

## 🔄 Обновления

### Обновление проекта
```bash
# Получить последние изменения
git pull origin main

# Пересобрать контейнеры
docker compose down
docker compose up --build
```

### Обновление зависимостей
```bash
# Обновить базовые образы
docker compose pull

# Пересобрать с обновлениями
docker compose build --no-cache
docker compose up -d
```

### Обновление конфигурации
```bash
# Применить изменения конфигурации
docker compose down
docker compose up --build -d

# Hot reload (для некоторых изменений)
docker compose exec web nginx -s reload
```

## 📊 Мониторинг

### Метрики производительности
```bash
# Использование ресурсов
docker stats

# Размер образов
docker images

# Использование диска
docker system df
```

### Логирование
```bash
# Настройка логирования
docker compose logs --tail=1000 > logs.txt

# Мониторинг в реальном времени
docker compose logs -f | grep ERROR
```

## 🔐 Безопасность

### Рекомендации по безопасности
1. **API ключи**: Хранить в `.env` файле, не коммитить в git
2. **Порты**: Использовать нестандартные порты в production
3. **Обновления**: Регулярно обновлять базовые образы
4. **Доступ**: Ограничить доступ к Docker daemon

### Production настройки
```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  api:
    restart: always
    environment:
      - NODE_ENV=production
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
  web:
    restart: always
    deploy:
      resources:
        limits:
          memory: 256M
          cpus: '0.25'
```

## 📞 Поддержка

### Полезные команды
```bash
# Полная перезагрузка
docker compose down
docker system prune -a
docker compose up --build

# Проверка здоровья
curl http://localhost:8080/api/ping
curl http://localhost:8080/api/health

# Информация о системе
docker info
docker version
```

### Документация
- [Основной README](../README.md)
- [Docker документация](../docker/README.md)
- [API документация](../api/README.md)
- [Troubleshooting](../troubleshooting/README.md)

---

**Версия**: 1.0.0  
**Последнее обновление**: 31.08.2025  
**Статус**: Готов к production
