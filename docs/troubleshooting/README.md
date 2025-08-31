# Troubleshooting - Решение проблем ResumeMint

## 📋 Описание

Данный документ содержит решения для наиболее частых проблем, возникающих при работе с проектом ResumeMint. Включает диагностику, пошаговые инструкции по устранению и профилактические меры.

## 🚨 Частые проблемы

### 1. Docker не запускается

#### Симптомы
- Ошибка `docker: command not found`
- `Docker Desktop is not running`
- `Cannot connect to the Docker daemon`

#### Решения

**Windows:**
```bash
# Проверить установку Docker Desktop
docker --version

# Запустить Docker Desktop
# Пуск → Docker Desktop

# Проверить службу
sc query "com.docker.service"

# Перезапустить службу
net stop "com.docker.service"
net start "com.docker.service"
```

**macOS:**
```bash
# Проверить установку
docker --version

# Запустить Docker Desktop
open /Applications/Docker.app

# Или через командную строку
osascript -e 'tell application "Docker Desktop" to activate'
```

**Linux:**
```bash
# Проверить статус службы
sudo systemctl status docker

# Запустить службу
sudo systemctl start docker
sudo systemctl enable docker

# Проверить права пользователя
sudo usermod -aG docker $USER
newgrp docker
```

#### Профилактика
- Убедиться, что Docker Desktop установлен и запущен
- Проверить системные требования
- Перезагрузить компьютер после установки

### 2. Контейнеры не собираются

#### Симптомы
- Ошибка `failed to build`
- `no such file or directory`
- `permission denied`

#### Решения

**Очистка кэша:**
```bash
# Остановить контейнеры
docker compose down

# Очистить все неиспользуемые ресурсы
docker system prune -a

# Пересобрать с нуля
docker compose build --no-cache
docker compose up
```

**Проверка файлов:**
```bash
# Проверить наличие всех файлов
ls -la
ls -la backend/
ls -la docker/

# Проверить права доступа
chmod +x docker/Dockerfile.web
chmod 644 backend/.env
```

**Проблемы с .env файлом:**
```bash
# Проверить существование файла
ls -la backend/.env

# Создать файл если отсутствует
cp backend/env.example backend/.env

# Проверить содержимое
cat backend/.env
```

#### Профилактика
- Всегда использовать `--no-cache` при проблемах со сборкой
- Проверять наличие всех необходимых файлов
- Убедиться в правильности путей

### 3. API недоступен

#### Симптомы
- Ошибка `Connection refused`
- `502 Bad Gateway`
- `Cannot connect to localhost:5000`

#### Решения

**Проверка контейнеров:**
```bash
# Статус контейнеров
docker compose ps

# Логи backend
docker compose logs api

# Проверка портов
netstat -tulpn | grep :5000
netstat -tulpn | grep :8080
```

**Перезапуск сервисов:**
```bash
# Перезапуск backend
docker compose restart api

# Полная перезагрузка
docker compose down
docker compose up -d
```

**Проверка переменных окружения:**
```bash
# Проверить переменные в контейнере
docker compose exec api env | grep OPENAI

# Проверить .env файл
cat backend/.env
```

**Тестирование API:**
```bash
# Прямое обращение к backend
curl http://localhost:5000/api/ping

# Через nginx прокси
curl http://localhost:8080/api/ping

# Проверка изнутри контейнера
docker compose exec api curl localhost:5000/api/ping
```

#### Профилактика
- Регулярно проверять логи контейнеров
- Мониторить использование ресурсов
- Настроить health checks

### 4. CORS ошибки

#### Симптомы
- `Access to fetch at 'http://localhost:5000/api/...' from origin 'http://localhost:8080' has been blocked by CORS policy`
- `No 'Access-Control-Allow-Origin' header is present`

#### Решения

**Проверка CORS настроек:**
```bash
# Проверить переменную в контейнере
docker compose exec api env | grep CORS

# Проверить .env файл
grep CORS backend/.env
```

**Обновление конфигурации:**
```bash
# В backend/.env
CORS_ORIGIN=http://localhost:8080

# В docker-compose.yml
environment:
  - CORS_ORIGIN=http://localhost:8080
```

**Перезапуск с новыми настройками:**
```bash
docker compose down
docker compose up --build
```

**Проверка через curl:**
```bash
# Тест CORS заголовков
curl -H "Origin: http://localhost:8080" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -X OPTIONS http://localhost:8080/api/ping
```

#### Профилактика
- Всегда настраивать CORS для production
- Использовать переменные окружения
- Тестировать с разных доменов

### 5. Файлы не загружаются

#### Симптомы
- `File upload failed`
- `File too large`
- `Unsupported file type`

#### Решения

**Проверка лимитов:**
```bash
# Проверить настройки в .env
grep MAX_FILE backend/.env

# Проверить в контейнере
docker compose exec api env | grep MAX_FILE
```

**Обновление лимитов:**
```bash
# В backend/.env
MAX_FILE_SIZE=20971520  # 20MB
MAX_JSON_SIZE=20971520  # 20MB

# Перезапуск
docker compose restart api
```

**Проверка типов файлов:**
```bash
# Проверить поддерживаемые форматы
# В коде: .docx, .pdf, .txt, .md

# Тест загрузки
curl -X POST http://localhost:8080/api/parse/docx \
  -F "file=@test.docx"
```

**Проблемы с правами доступа:**
```bash
# Проверить права на папки
ls -la backend/
ls -la docker/

# Исправить права
chmod 755 backend/
chmod 644 backend/.env
```

#### Профилактика
- Регулярно проверять лимиты файлов
- Валидировать типы файлов на frontend
- Настраивать правильные MIME типы

### 6. OpenAI API ошибки

#### Симптомы
- `Invalid API key`
- `Rate limit exceeded`
- `Insufficient credits`

#### Решения

**Проверка API ключа:**
```bash
# Проверить ключ в контейнере
docker compose exec api env | grep OPENAI

# Проверить .env файл
grep OPENAI backend/.env
```

**Обновление API ключа:**
```bash
# В backend/.env
OPENAI_API_KEY=your-new-api-key

# Перезапуск
docker compose restart api
```

**Проверка кредитов:**
```bash
# Проверить баланс на OpenAI
# https://platform.openai.com/account/billing

# Проверить использование
# https://platform.openai.com/usage
```

**Rate limiting:**
```bash
# Добавить задержки в код
# Или использовать более дорогие модели
OPENAI_MODEL=gpt-4o-mini
```

#### Профилактика
- Регулярно проверять баланс API
- Использовать кэширование
- Мониторить использование токенов

### 7. Проблемы с памятью

#### Симптомы
- `Out of memory`
- Медленная работа
- Контейнеры падают

#### Решения

**Проверка использования ресурсов:**
```bash
# Мониторинг ресурсов
docker stats

# Информация о системе
docker system df
docker system info
```

**Очистка ресурсов:**
```bash
# Остановить неиспользуемые контейнеры
docker container prune

# Очистить образы
docker image prune -a

# Очистить volumes
docker volume prune

# Полная очистка
docker system prune -a
```

**Ограничение ресурсов:**
```bash
# В docker-compose.yml
services:
  api:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
  web:
    deploy:
      resources:
        limits:
          memory: 256M
          cpus: '0.25'
```

**Оптимизация образов:**
```bash
# Использовать Alpine образы
FROM node:20-alpine
FROM nginx:alpine

# Многоэтапная сборка
# Удаление dev зависимостей
```

#### Профилактика
- Регулярно мониторить использование ресурсов
- Настраивать лимиты для production
- Использовать оптимизированные образы

### 8. Проблемы с сетью

#### Симптомы
- `Network unreachable`
- `Connection timeout`
- Контейнеры не могут связаться друг с другом

#### Решения

**Проверка сетей:**
```bash
# Список сетей
docker network ls

# Информация о сети
docker network inspect resumemint-network

# Проверка подключения между контейнерами
docker compose exec web ping api
```

**Пересоздание сети:**
```bash
# Остановить контейнеры
docker compose down

# Удалить сеть
docker network rm resumemint-network

# Пересоздать
docker compose up
```

**Проверка DNS:**
```bash
# Проверить DNS в контейнере
docker compose exec api nslookup api

# Проверить hosts файл
docker compose exec api cat /etc/hosts
```

**Проблемы с портами:**
```bash
# Проверить занятые порты
netstat -tulpn | grep :8080
netstat -tulpn | grep :5000

# Освободить порты
sudo lsof -ti:8080 | xargs kill -9
sudo lsof -ti:5000 | xargs kill -9
```

#### Профилактика
- Использовать изолированные сети
- Проверять конфликты портов
- Настраивать правильные DNS

## 🔍 Диагностика

### Команды диагностики

**Общая информация:**
```bash
# Версии компонентов
docker --version
docker compose version
node --version
npm --version

# Информация о системе
docker info
docker system info
```

**Проверка контейнеров:**
```bash
# Статус всех контейнеров
docker compose ps

# Детальная информация
docker compose top

# Логи всех сервисов
docker compose logs
```

**Проверка сети:**
```bash
# Список сетей
docker network ls

# Информация о сети
docker network inspect resumemint-network

# Тест подключения
docker compose exec web curl api:5000/api/ping
```

**Проверка файлов:**
```bash
# Структура проекта
tree -L 3

# Проверка конфигурации
docker compose config

# Проверка .env файла
cat backend/.env
```

### Логи и отладка

**Сбор логов:**
```bash
# Все логи в файл
docker compose logs > logs.txt 2>&1

# Логи конкретного сервиса
docker compose logs api > api-logs.txt 2>&1

# Логи с временными метками
docker compose logs -t > logs-with-timestamps.txt 2>&1
```

**Анализ логов:**
```bash
# Поиск ошибок
grep -i error logs.txt

# Поиск предупреждений
grep -i warn logs.txt

# Последние 100 строк
tail -100 logs.txt
```

**Отладка в реальном времени:**
```bash
# Мониторинг логов
docker compose logs -f

# Мониторинг ресурсов
docker stats

# Мониторинг процессов
docker compose top
```

## 🛠️ Инструменты

### Полезные скрипты

**Скрипт диагностики:**
```bash
#!/bin/bash
echo "=== ResumeMint Diagnostics ==="
echo "Docker version: $(docker --version)"
echo "Docker Compose version: $(docker compose version)"
echo "Containers status:"
docker compose ps
echo "Network info:"
docker network ls
echo "Resource usage:"
docker stats --no-stream
```

**Скрипт очистки:**
```bash
#!/bin/bash
echo "Cleaning up Docker resources..."
docker compose down
docker system prune -a -f
docker volume prune -f
echo "Cleanup completed"
```

**Скрипт перезапуска:**
```bash
#!/bin/bash
echo "Restarting ResumeMint..."
docker compose down
docker compose up --build -d
echo "Restart completed"
sleep 10
echo "Checking status..."
docker compose ps
curl http://localhost:8080/api/ping
```

### Мониторинг

**Health check скрипт:**
```bash
#!/bin/bash
# Проверка здоровья сервисов
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/ping)
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080)

if [ "$API_STATUS" = "200" ]; then
    echo "✅ API is healthy"
else
    echo "❌ API is down (HTTP $API_STATUS)"
fi

if [ "$FRONTEND_STATUS" = "200" ]; then
    echo "✅ Frontend is healthy"
else
    echo "❌ Frontend is down (HTTP $FRONTEND_STATUS)"
fi
```

## 📞 Поддержка

### Полезные команды

**Экстренная перезагрузка:**
```bash
# Полная перезагрузка системы
docker compose down
docker system prune -a -f
docker compose up --build -d
```

**Резервное копирование:**
```bash
# Сохранение конфигурации
cp backend/.env backend/.env.backup
cp docker-compose.yml docker-compose.yml.backup

# Восстановление
cp backend/.env.backup backend/.env
cp docker-compose.yml.backup docker-compose.yml
```

**Обновление системы:**
```bash
# Обновление образов
docker compose pull

# Пересборка с обновлениями
docker compose build --no-cache
docker compose up -d
```

### Контакты и ресурсы

- **Документация**: [docs/](../README.md)
- **GitHub Issues**: [Создать issue](https://github.com/your-repo/issues)
- **Telegram**: [Канал поддержки](https://t.me/+Ui2Jg52lDCM0ZjUy)

---

**Версия**: 1.0.0  
**Последнее обновление**: 31.08.2025  
**Статус**: Актуально
