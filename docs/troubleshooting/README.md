# Решение проблем - ResumeMint

## 📋 Описание

Руководство по диагностике и решению проблем, возникающих при работе с проектом ResumeMint.

## 🔍 Диагностика

### Проверка статуса системы

```bash
# Статус Docker
docker info
docker version

# Статус контейнеров
docker compose ps
docker ps -a

# Статус сетей
docker network ls
docker network inspect resumemint1_default

# Использование ресурсов
docker stats
```

### Проверка логов

```bash
# Все логи
docker compose logs

# Логи конкретного сервиса
docker compose logs api
docker compose logs web

# Логи в реальном времени
docker compose logs -f

# Логи с временными метками
docker compose logs -t
```

## 🚨 Частые проблемы

### 1. Docker не запускается

**Симптомы:**
- Ошибка "docker: command not found"
- Ошибка "Cannot connect to the Docker daemon"

**Решение:**

#### Windows/macOS
```bash
# Проверить, запущен ли Docker Desktop
# Запустить Docker Desktop вручную

# Проверить статус
docker info
```

#### Linux
```bash
# Запустить Docker daemon
sudo systemctl start docker
sudo systemctl enable docker

# Проверить статус
sudo systemctl status docker

# Добавить пользователя в группу docker
sudo usermod -aG docker $USER
# Перезайти в систему
```

### 2. Порт уже занят

**Симптомы:**
- Ошибка "port is already allocated"
- Контейнер не может запуститься

**Решение:**

```bash
# Проверить, что использует порт
netstat -tulpn | grep :8080
netstat -tulpn | grep :5000

# Остановить процесс, использующий порт
sudo kill -9 <PID>

# Или изменить порты в docker-compose.yml
ports:
  - "8081:80"  # Вместо 8080:80
  - "5001:5000"  # Вместо 5000:5000
```

### 3. API недоступен

**Симптомы:**
- Ошибка "Connection refused"
- 502 Bad Gateway
- API не отвечает

**Решение:**

```bash
# Проверить статус backend контейнера
docker compose ps api

# Проверить логи backend
docker compose logs api

# Войти в контейнер
docker compose exec api sh

# Проверить переменные окружения
printenv | grep OPENAI

# Проверить, слушает ли порт
netstat -tulpn | grep :5000

# Проверить API напрямую
curl http://localhost:5000/api/ping
```

### 4. OpenAI API ошибки

**Симптомы:**
- Ошибка "Invalid API key"
- Ошибка "Rate limit exceeded"
- Ошибка "Insufficient quota"

**Решение:**

```bash
# Проверить API ключ
docker compose exec api printenv OPENAI_API_KEY

# Проверить формат ключа
# Должен начинаться с sk-proj- или sk-

# Проверить баланс на OpenAI
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  https://api.openai.com/v1/dashboard/billing/usage

# Обновить API ключ в .env файле
nano backend/.env
# Перезапустить контейнеры
docker compose restart api
```

### 5. CORS ошибки

**Симптомы:**
- Ошибка "CORS policy"
- Запросы блокируются браузером

**Решение:**

```bash
# Проверить CORS настройки
docker compose exec api printenv CORS_ORIGIN

# Обновить CORS в .env
CORS_ORIGIN=http://localhost:8080

# Обновить docker-compose.yml
environment:
  - CORS_ORIGIN=http://localhost:8080

# Перезапустить
docker compose restart api
```

### 6. Файлы не загружаются

**Симптомы:**
- Ошибка "File too large"
- Ошибка "Invalid file type"
- Файл не загружается

**Решение:**

```bash
# Проверить лимиты файлов
docker compose exec api printenv MAX_FILE_SIZE

# Увеличить лимит в .env
MAX_FILE_SIZE=20971520  # 20MB

# Проверить поддерживаемые типы файлов
# DOCX, DOC, TXT, PDF

# Проверить права доступа к папке uploads
docker compose exec api ls -la /app/uploads
```

### 7. Медленная работа

**Симптомы:**
- Долгие ответы API
- Таймауты
- Медленная загрузка страниц

**Решение:**

```bash
# Проверить использование ресурсов
docker stats

# Проверить логи на ошибки
docker compose logs api | grep -i error

# Оптимизировать настройки OpenAI
OPENAI_MODEL=gpt-3.5-turbo-0125  # Быстрее чем GPT-4
MAX_TOKENS=1000  # Уменьшить лимит

# Проверить сетевую задержку
ping api.openai.com
```

### 8. Nginx ошибки

**Симптомы:**
- 502 Bad Gateway
- 404 Not Found
- Статические файлы не загружаются

**Решение:**

```bash
# Проверить статус nginx контейнера
docker compose ps web

# Проверить логи nginx
docker compose logs web

# Войти в nginx контейнер
docker compose exec web sh

# Проверить конфигурацию
nginx -t

# Проверить файлы
ls -la /usr/share/nginx/html/

# Проверить права доступа
chmod 644 /usr/share/nginx/html/*
```

## 🔧 Ручная диагностика

### Проверка сети

```bash
# Проверить DNS
nslookup api.openai.com

# Проверить доступность OpenAI
curl -I https://api.openai.com

# Проверить локальные порты
telnet localhost 8080
telnet localhost 5000
```

### Проверка файловой системы

```bash
# Проверить свободное место
df -h

# Проверить права доступа
ls -la backend/
ls -la docker/

# Проверить .env файл
cat backend/.env
```

### Проверка переменных окружения

```bash
# В backend контейнере
docker compose exec api env

# Проверить конкретные переменные
docker compose exec api printenv OPENAI_API_KEY
docker compose exec api printenv PORT
docker compose exec api printenv NODE_ENV
```

## 🛠️ Восстановление

### Полная пересборка

```bash
# Остановить все контейнеры
docker compose down

# Удалить образы
docker rmi resumemint1-api resumemint1-web

# Очистить кэш
docker system prune -f

# Пересобрать
docker compose up --build
```

### Сброс к заводским настройкам

```bash
# Остановить и удалить все
docker compose down -v
docker system prune -af

# Удалить .env файл
rm backend/.env

# Создать заново
cp backend/env.example backend/.env
# Отредактировать .env

# Запустить заново
docker compose up --build
```

### Восстановление из резервной копии

```bash
# Остановить сервисы
docker compose down

# Восстановить файлы
tar -xzf backup/resumemint_backup.tar.gz

# Восстановить .env
cp backup/.env backend/.env

# Запустить
docker compose up -d
```

## 📊 Мониторинг

### Создание скрипта диагностики

```bash
nano /usr/local/bin/diagnose-resumemint.sh

#!/bin/bash
echo "=== ResumeMint Diagnostics ==="
echo "Date: $(date)"
echo ""

echo "=== Docker Status ==="
docker info > /dev/null 2>&1 && echo "Docker: OK" || echo "Docker: FAILED"
docker compose version > /dev/null 2>&1 && echo "Docker Compose: OK" || echo "Docker Compose: FAILED"
echo ""

echo "=== Container Status ==="
docker compose ps
echo ""

echo "=== Resource Usage ==="
docker stats --no-stream
echo ""

echo "=== Recent Logs ==="
docker compose logs --tail=20
echo ""

echo "=== Network Check ==="
curl -f http://localhost:8080/api/ping > /dev/null 2>&1 && echo "API: OK" || echo "API: FAILED"
curl -f http://localhost:8080 > /dev/null 2>&1 && echo "Frontend: OK" || echo "Frontend: FAILED"
echo ""

echo "=== Disk Usage ==="
df -h
echo ""

echo "=== Memory Usage ==="
free -h
echo ""
```

### Автоматическая диагностика

```bash
# Добавить в crontab
# */5 * * * * /usr/local/bin/diagnose-resumemint.sh >> /var/log/resumemint-diagnostics.log 2>&1
```

## 📞 Поддержка

### Информация для отчета о проблеме

```bash
# Создать отчет
nano /usr/local/bin/create-report.sh

#!/bin/bash
REPORT_FILE="/tmp/resumemint-report-$(date +%Y%m%d-%H%M%S).txt"

echo "=== ResumeMint Problem Report ===" > $REPORT_FILE
echo "Date: $(date)" >> $REPORT_FILE
echo "OS: $(uname -a)" >> $REPORT_FILE
echo "Docker: $(docker --version)" >> $REPORT_FILE
echo "Docker Compose: $(docker compose version)" >> $REPORT_FILE
echo "" >> $REPORT_FILE

echo "=== Container Status ===" >> $REPORT_FILE
docker compose ps >> $REPORT_FILE 2>&1
echo "" >> $REPORT_FILE

echo "=== Recent Logs ===" >> $REPORT_FILE
docker compose logs --tail=50 >> $REPORT_FILE 2>&1
echo "" >> $REPORT_FILE

echo "=== System Info ===" >> $REPORT_FILE
df -h >> $REPORT_FILE
free -h >> $REPORT_FILE
echo "" >> $REPORT_FILE

echo "Report saved to: $REPORT_FILE"
```

### Контакты для поддержки

- **GitHub Issues**: [Создать issue](https://github.com/your-repo/issues)
- **Email**: support@resumemint.com
- **Документация**: [docs/](../README.md)

## 🔗 Связанные файлы

- [Setup руководство](../setup/README.md)
- [Docker конфигурация](../docker/README.md)
- [API документация](../api/README.md)
- [Deployment руководство](../deployment/README.md)
