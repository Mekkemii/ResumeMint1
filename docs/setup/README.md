# Настройка проекта - ResumeMint

## 📋 Описание

Пошаговое руководство по настройке проекта ResumeMint с Docker-оверлеем.

## 🎯 Требования

### Системные требования
- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **Операционная система**: Windows 10+, macOS 10.15+, Ubuntu 18.04+
- **Память**: 4GB RAM (минимум)
- **Дисковое пространство**: 2GB свободного места

### Программное обеспечение
- **Docker Desktop** (для Windows/macOS)
- **Docker Engine** (для Linux)
- **Git** (для клонирования репозитория)

## 🚀 Быстрая настройка

### 1. Установка Docker

#### Windows
```bash
# Скачать Docker Desktop
https://www.docker.com/products/docker-desktop/

# Установить и запустить
# Перезагрузить компьютер после установки
```

#### macOS
```bash
# Скачать Docker Desktop
https://www.docker.com/products/docker-desktop/

# Установить и запустить
# Docker автоматически запустится при старте системы
```

#### Ubuntu/Debian
```bash
# Обновить пакеты
sudo apt update

# Установить зависимости
sudo apt install apt-transport-https ca-certificates curl gnupg lsb-release

# Добавить GPG ключ Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Добавить репозиторий Docker
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Установить Docker
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io

# Добавить пользователя в группу docker
sudo usermod -aG docker $USER

# Запустить Docker
sudo systemctl start docker
sudo systemctl enable docker
```

### 2. Проверка установки Docker

```bash
# Проверить версию Docker
docker --version

# Проверить версию Docker Compose
docker compose version

# Проверить работу Docker
docker run hello-world
```

### 3. Клонирование проекта

```bash
# Клонировать репозиторий
git clone <repository-url>
cd ResumeMint1

# Проверить структуру проекта
ls -la
```

### 4. Настройка переменных окружения

```bash
# Перейти в папку backend
cd backend

# Скопировать пример конфигурации
cp env.example .env

# Отредактировать .env файл
# Добавить ваш OpenAI API ключ
nano .env
```

**Содержимое .env файла:**
```bash
# OpenAI API Configuration
OPENAI_API_KEY=sk-your-actual-api-key-here

# OpenAI Model Settings
OPENAI_MODEL=gpt-3.5-turbo-0125
OPENAI_TEMPERATURE=0.2
MAX_TOKENS=2000

# Server Configuration
PORT=5000

# Text Processing Configuration
DISABLE_CONDENSE=true
CONTEXT_LIMIT_TOKENS=100000

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_DIR=uploads

# CORS Configuration
CORS_ORIGIN=http://localhost:8080
```

### 5. Получение OpenAI API ключа

1. Зарегистрироваться на [OpenAI](https://platform.openai.com/)
2. Перейти в раздел [API Keys](https://platform.openai.com/api-keys)
3. Создать новый API ключ
4. Скопировать ключ в .env файл

### 6. Запуск проекта

```bash
# Вернуться в корневую папку
cd ..

# Собрать и запустить контейнеры
docker compose up --build

# Или запустить в фоновом режиме
docker compose up -d --build
```

### 7. Проверка работы

```bash
# Проверить статус контейнеров
docker compose ps

# Проверить логи
docker compose logs

# Открыть в браузере
http://localhost:8080
```

## 🔧 Детальная настройка

### Настройка портов

Если порты 8080 или 5000 заняты, измените их в `docker-compose.yml`:

```yaml
services:
  api:
    ports:
      - "5001:5000"  # Изменить 5000 на 5001
  
  web:
    ports:
      - "8081:80"    # Изменить 8080 на 8081
```

### Настройка CORS

Для production окружения измените CORS_ORIGIN:

```bash
# В backend/.env
CORS_ORIGIN=https://yourdomain.com

# В docker-compose.yml
environment:
  - CORS_ORIGIN=https://yourdomain.com
```

### Настройка лимитов

Измените лимиты в `backend/.env`:

```bash
# Размер файла (в байтах)
MAX_FILE_SIZE=20971520  # 20MB

# Лимит токенов
MAX_TOKENS=4000

# Лимит контекста
CONTEXT_LIMIT_TOKENS=200000
```

## 🧪 Тестирование

### Проверка API

```bash
# Проверка доступности API
curl http://localhost:8080/api/ping

# Проверка здоровья системы
curl http://localhost:8080/api/health

# Тест анализа резюме
curl -X POST http://localhost:8080/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"resumeText": "Тестовое резюме"}'
```

### Проверка фронтенда

1. Откройте `http://localhost:8080` в браузере
2. Проверьте загрузку страницы
3. Протестируйте загрузку файла
4. Проверьте анализ резюме

### Проверка логов

```bash
# Логи всех сервисов
docker compose logs

# Логи backend
docker compose logs api

# Логи nginx
docker compose logs web

# Логи в реальном времени
docker compose logs -f
```

## 🔍 Отладка

### Проблемы с Docker

```bash
# Проверить статус Docker
docker info

# Проверить доступные образы
docker images

# Проверить запущенные контейнеры
docker ps

# Проверить сети
docker network ls
```

### Проблемы с API

```bash
# Войти в backend контейнер
docker compose exec api sh

# Проверить переменные окружения
printenv | grep OPENAI

# Проверить логи приложения
tail -f /app/logs/app.log
```

### Проблемы с сетью

```bash
# Проверить порты
netstat -tulpn | grep :8080
netstat -tulpn | grep :5000

# Проверить доступность сервисов
curl http://localhost:8080
curl http://localhost:5000
```

## 🚀 Production настройка

### SSL сертификаты

```bash
# Создать папку для сертификатов
mkdir -p ssl

# Добавить сертификаты
cp your-cert.pem ssl/
cp your-key.pem ssl/
```

### Обновление nginx конфигурации

```nginx
server {
  listen 443 ssl;
  server_name yourdomain.com;
  
  ssl_certificate /etc/ssl/cert.pem;
  ssl_certificate_key /etc/ssl/key.pem;
  
  # ... остальная конфигурация
}
```

### Переменные окружения для production

```bash
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
OPENAI_MODEL=gpt-4o-mini
MAX_TOKENS=4000
```

## 🔗 Связанные файлы

- [Docker конфигурация](../docker/README.md)
- [Environment настройки](../config/README.md)
- [API документация](../api/README.md)
- [Troubleshooting](../troubleshooting/README.md)
