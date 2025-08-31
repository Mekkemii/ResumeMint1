# ResumeMint - Обзор проекта

## 📋 Описание проекта

ResumeMint - это AI ассистент для анализа резюме с Docker-оверлеем. Проект состоит из фронтенда (React приложение) и backend API (Node.js) с интеграцией OpenAI для анализа резюме.

## 🏗️ Архитектура

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Nginx Proxy   │    │   Backend API   │
│   (Static)      │◄──►│   (Port 8080)   │◄──►│   (Port 5000)   │
│   index.html    │    │   default.conf  │    │   server.js     │
│   globals.css   │    │                 │    │   OpenAI API    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📁 Структура документации

### 🎯 Основные компоненты
- **[Frontend](./frontend/README.md)** - Статическое React приложение
- **[Backend](./backend/README.md)** - Node.js API сервер
- **[Docker](./docker/README.md)** - Контейнеризация с Nginx

### ⚙️ Конфигурация
- **[Environment](./config/README.md)** - Переменные окружения
- **[API Endpoints](./api/README.md)** - Документация API
- **[Deployment](./deployment/README.md)** - Развертывание

### 🔧 Операции
- **[Setup](./setup/README.md)** - Настройка проекта
- **[Troubleshooting](./troubleshooting/README.md)** - Решение проблем

## 🚀 Быстрый старт

### 1. Требования
- Docker 20.10+
- Docker Compose 2.0+
- OpenAI API ключ

### 2. Установка
```bash
# Клонировать проект
git clone <repository-url>
cd ResumeMint1

# Настроить .env файл
cp backend/env.example backend/.env
# Отредактировать backend/.env с вашим OpenAI API ключом

# Запустить
docker compose up --build

# Открыть в браузере
http://localhost:8080
```

### 3. Проверка
```bash
# Статус контейнеров
docker compose ps

# Проверка API
curl http://localhost:8080/api/ping

# Логи
docker compose logs
```

## 📊 Статус проекта

| Компонент | Статус | Описание |
|-----------|--------|----------|
| Frontend | ✅ Готов | Статический HTML (82KB) |
| Backend | ✅ Готов | Node.js API (1402 строки) |
| Docker | ✅ Готов | Nginx + Node.js контейнеры |
| API Keys | ✅ Настроен | OpenAI API ключ |
| Документация | ✅ Полная | 8 MD файлов |

## 🔧 Основные файлы

### Frontend
- `index.html` (82KB) - Главная страница
- `globals.css` (555B) - Стили
- `package.json` - Зависимости

### Backend
- `server.js` (1402 строки) - Основной сервер
- `package.json` - Зависимости
- `.env` - Переменные окружения
- `Dockerfile` - Контейнер

### Docker
- `docker-compose.yml` - Оркестрация
- `docker/Dockerfile.web` - Nginx контейнер
- `docker/nginx/default.conf` - Nginx конфигурация

## 🌐 API Endpoints

| Endpoint | Метод | Описание |
|----------|-------|----------|
| `/api/ping` | GET | Проверка работоспособности |
| `/api/parse/docx` | POST | Парсинг DOCX файлов |
| `/api/analyze` | POST | Анализ резюме |
| `/api/premium/oneshot` | POST | Премиум анализ |
| `/api/combo/summary-match` | POST | Комбинированный анализ |
| `/api/vacancy/detailed-match` | POST | Детальный анализ соответствия вакансии |
| `/api/cover/generate` | POST | Генерация сопроводительного письма |

## 🔐 Безопасность

- API ключи в `.env` файле
- CORS настройки для Docker
- Валидация файлов (DOCX, DOC, TXT, PDF)
- Лимиты на размер файлов (10MB)

## 📈 Производительность

- **Frontend**: 82KB (оптимизирован)
- **Backend**: Node.js с Express
- **AI**: OpenAI GPT-3.5-turbo-0125
- **Прокси**: Nginx с кэшированием

## 🐳 Docker контейнеры

| Сервис | Образ | Порт | Описание |
|--------|-------|------|----------|
| api | node:20-alpine | 5000 | Backend API |
| web | nginx:alpine | 8080 | Frontend + прокси |

## 🔍 Мониторинг

### Логи
```bash
# Все логи
docker compose logs

# Конкретный сервис
docker compose logs api
docker compose logs web

# В реальном времени
docker compose logs -f
```

### Статус
```bash
# Контейнеры
docker compose ps

# Ресурсы
docker stats

# Сети
docker network ls
```

## 🛠️ Разработка

### Локальная разработка
```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
python -m http.server 8080
```

### Тестирование
```bash
# API тесты
curl http://localhost:8080/api/ping
curl -X POST http://localhost:8080/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"resumeText": "test"}'
```

## 🚨 Частые проблемы

1. **Docker не запускается** → [Решение](./troubleshooting/README.md#1-docker-не-запускается)
2. **API недоступен** → [Решение](./troubleshooting/README.md#3-api-недоступен)
3. **CORS ошибки** → [Решение](./troubleshooting/README.md#5-cors-ошибки)
4. **Файлы не загружаются** → [Решение](./troubleshooting/README.md#6-файлы-не-загружаются)

## 📞 Поддержка

- **Документация**: [docs/](./README.md)
- **Setup**: [Настройка](./setup/README.md)
- **Troubleshooting**: [Решение проблем](./troubleshooting/README.md)
- **API**: [Документация API](./api/README.md)

## 🔗 Полезные ссылки

- [Основной README](../README.md)
- [Docker README](../README.DOCKER.md)
- [API Setup](../API_SETUP.md)
- [GitHub Repository](https://github.com/your-repo)

---

**Версия**: 1.0.0  
**Последнее обновление**: 31.08.2025  
**Статус**: Готов к production
