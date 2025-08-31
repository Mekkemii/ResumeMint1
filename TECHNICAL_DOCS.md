# ResumeMint - Техническая документация

## 📋 Описание

Полное техническое описание всех компонентов проекта ResumeMint, включая архитектуру, детали реализации, API endpoints и конфигурацию.

## 🏗️ Архитектура системы

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Nginx Proxy   │    │   Backend API   │
│   (HTML/CSS/JS) │◄──►│   (Port 8080)   │◄──►│   (Node.js)     │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   OpenAI API    │
                       │   (GPT-4o-mini) │
                       │                 │
                       └─────────────────┘
```

### Компоненты системы

#### Frontend (index.html + globals.css)
- **Технологии**: HTML5, CSS3, JavaScript (ES6+)
- **Функции**: Пользовательский интерфейс, API интеграция
- **Особенности**: Адаптивный дизайн, современный UI/UX
- **Размер**: ~100KB (оптимизирован)

#### Backend (Node.js + Express)
- **Технологии**: Node.js, Express.js, OpenAI API
- **Функции**: API endpoints, бизнес-логика, кэширование
- **Особенности**: Асинхронная обработка, rate limiting
- **Размер**: ~68KB, 1550 строк кода

#### Nginx Proxy
- **Функции**: Статические файлы, API проксирование
- **Особенности**: Gzip сжатие, кэширование, безопасность

#### Docker Infrastructure
- **Контейнеризация**: Изолированные сервисы
- **Оркестрация**: Docker Compose
- **Масштабируемость**: Легкое развертывание

## 📁 Структура проекта

```
ResumeMint1/
├── backend/                 # Backend API
│   ├── server.js           # Основной сервер (1550 строк)
│   ├── package.json        # Зависимости Node.js
│   ├── .env               # Переменные окружения
│   └── Dockerfile         # Docker образ backend
├── docker/                 # Docker конфигурация
│   ├── docker-compose.yml # Основная конфигурация
│   ├── Dockerfile.web     # Frontend образ
│   └── nginx/             # Nginx конфигурация
│       └── default.conf   # Прокси настройки
├── docs/                   # Документация
│   ├── api/               # API документация
│   ├── frontend/          # Frontend документация
│   ├── backend/           # Backend документация
│   ├── docker/            # Docker документация
│   ├── setup/             # Инструкции по установке
│   ├── config/            # Конфигурация
│   ├── deployment/        # Развертывание
│   └── troubleshooting/   # Решение проблем
├── index.html             # Frontend приложение (2281 строка)
├── globals.css            # Стили приложения
├── README.md              # Основная документация
├── TECHNICAL_DOCS.md      # Техническая документация
└── .gitignore             # Исключения Git
```

## 🔧 API Endpoints

### Основные endpoints

| Endpoint | Метод | Описание | Параметры | Ответ |
|----------|-------|----------|-----------|-------|
| `/api/ping` | GET | Проверка работоспособности | - | `{"status": "ok"}` |
| `/api/analyze` | POST | Анализ резюме | `resumeText` | Структурированный анализ |
| `/api/vacancy/detailed-match` | POST | Детальное сопоставление | `resumeText`, `jobText` | Детальный матчинг |
| `/api/cover/generate` | POST | Генерация сопроводительного письма | `resumeText`, `jobText` | Персонализированное письмо |

### Детальное описание endpoints

#### `/api/analyze` - Анализ резюме
**Назначение**: Структурированный анализ резюме с выявлением сильных и слабых сторон

**Параметры**:
```json
{
  "resumeText": "текст резюме"
}
```

**Ответ**:
```json
{
  "analysis": {
    "summary": "Краткая сводка",
    "strengths": ["сильная сторона 1", "сильная сторона 2"],
    "weaknesses": ["область для улучшения 1"],
    "recommendations": ["рекомендация 1", "рекомендация 2"]
  },
  "usage": {
    "prompt_tokens": 1234,
    "completion_tokens": 567,
    "total_tokens": 1801
  }
}
```

#### `/api/vacancy/detailed-match` - Детальное сопоставление
**Назначение**: Построчное сравнение резюме с требованиями вакансии

**Параметры**:
```json
{
  "resumeText": "текст резюме",
  "jobText": "описание вакансии"
}
```

**Ответ**:
```json
{
  "vacancy_analysis": {
    "summary": "Анализ вакансии",
    "key_requirements": ["требование 1", "требование 2"]
  },
  "candidate_analysis": {
    "summary": "Анализ кандидата",
    "strengths": ["сильная сторона 1"],
    "weaknesses": ["слабая сторона 1"]
  },
  "detailed_matching": {
    "overall_score": 85,
    "requirements_analysis": [
      {
        "requirement": "требование",
        "match_score": 90,
        "candidate_evidence": "доказательство",
        "missing_skills": ["отсутствующий навык"]
      }
    ]
  },
  "line_by_line_analysis": [
    {
      "line": "строка требования",
      "match": true,
      "explanation": "объяснение"
    }
  ]
}
```

#### `/api/cover/generate` - Генерация сопроводительного письма
**Назначение**: Создание персонализированного сопроводительного письма

**Параметры**:
```json
{
  "resumeText": "текст резюме",
  "jobText": "описание вакансии"
}
```

**Ответ**:
```json
{
  "cover_letter": "Полный текст сопроводительного письма...",
  "usage": {
    "prompt_tokens": 1234,
    "completion_tokens": 567,
    "total_tokens": 1801
  }
}
```

## 🎨 Frontend компоненты

### index.html - Основной файл приложения

**Размер**: 2281 строка, ~100KB
**Функции**:
- Пользовательский интерфейс
- API интеграция
- Обработка файлов
- Отображение результатов

**Основные секции**:
1. **Навигация** - Переключение между функциями
2. **Анализ резюме** - Загрузка и анализ резюме
3. **Матчинг вакансии** - Сопоставление с требованиями
4. **Сопроводительное письмо** - Генерация писем
5. **Всё сразу** - Комплексный анализ

**JavaScript функции**:
- `runAnalysis()` - Анализ резюме
- `runCompareFromPanel()` - Детальное сопоставление
- `runCoverFromPanel()` - Генерация письма
- `runPremiumFromPanel()` - Комплексный анализ
- `postJSON()` - API запросы
- `setBlock()` - Обновление UI

### globals.css - Стили приложения

**Особенности**:
- Адаптивный дизайн
- Темная тема
- Современные CSS переменные
- Flexbox/Grid layout
- Анимации и переходы

**Цветовая схема**:
- Primary: `#8b5cf6` (фиолетовый)
- Secondary: `#10b981` (зеленый)
- Accent: `#f59e0b` (оранжевый)
- Error: `#ef4444` (красный)

**Типографика**:
- Основной текст: 14px
- Заголовки: 16px
- Шрифт: Inter, system fonts

## ⚙️ Backend компоненты

### server.js - Основной сервер

**Размер**: 1550 строк, ~68KB
**Технологии**: Node.js, Express.js, OpenAI API

**Основные функции**:
- REST API endpoints
- Интеграция с OpenAI
- Кэширование результатов
- Обработка ошибок
- Валидация данных
- Rate limiting

**Middleware**:
- CORS настройки
- Body parsing
- Error handling
- Request logging

**AI промпты**:
- `sysResumeReview()` - Анализ резюме
- `sysDetailedMatch()` - Детальное сопоставление
- `sysCoverLetter()` - Генерация писем

### package.json - Зависимости

**Основные зависимости**:
```json
{
  "express": "^4.18.2",
  "cors": "^2.8.5",
  "helmet": "^7.0.0",
  "rate-limiter-flexible": "^2.4.2",
  "openai": "^4.20.1",
  "dotenv": "^16.3.1"
}
```

**Dev зависимости**:
```json
{
  "nodemon": "^3.0.1",
  "jest": "^29.7.0",
  "eslint": "^8.52.0"
}
```

## 🐳 Docker конфигурация

### docker-compose.yml

**Сервисы**:
- **api**: Node.js backend (порт 5000)
- **web**: Nginx frontend (порт 8080)

**Особенности**:
- Изолированные сети
- Volume монтирование
- Health checks
- Restart policies

### Dockerfile.web

**Основа**: nginx:alpine
**Функции**:
- Статические файлы
- Проксирование API
- Gzip сжатие
- Кэширование

### nginx/default.conf

**Конфигурация**:
- Проксирование `/api/` на backend
- Статические файлы
- SPA routing
- Безопасность headers

## 🔒 Безопасность

### Меры безопасности

1. **API ключи**: Хранение в `.env` файлах
2. **CORS**: Настроенные разрешенные источники
3. **Rate limiting**: Ограничение запросов
4. **Input validation**: Валидация данных
5. **Secure headers**: Безопасные HTTP заголовки
6. **File upload limits**: Ограничения на файлы

### Переменные окружения

```env
# Обязательные
OPENAI_API_KEY=your-openai-api-key

# Опциональные
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
RATE_LIMIT_MAX_REQUESTS=100
MAX_FILE_SIZE=20971520
OPENAI_MODEL=gpt-4o-mini
```

## 📊 Производительность

### Оптимизации

1. **Кэширование**: Redis для быстрого доступа
2. **Gzip сжатие**: Уменьшение размера данных
3. **Статические файлы**: Кэширование CSS/JS
4. **Асинхронная обработка**: Неблокирующие операции
5. **Docker оптимизация**: Alpine Linux образы

### Мониторинг

```bash
# Проверка ресурсов
docker stats

# Мониторинг логов
docker compose logs -f

# Health checks
curl http://localhost:8080/api/ping
```

## 🛠️ Разработка

### Команды разработки

```bash
# Backend разработка
cd backend
npm run dev          # Запуск в режиме разработки
npm test            # Запуск тестов
npm run lint        # Проверка кода

# Docker разработка
docker compose -f docker-compose.dev.yml up -d
docker compose logs -f api

# Production сборка
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
```

### Тестирование

```bash
# API тесты
curl http://localhost:8080/api/ping
curl -X POST http://localhost:8080/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"resumeText": "test"}'
```

## 📈 Статус проекта

| Компонент | Статус | Размер | Описание |
|-----------|--------|--------|----------|
| **Frontend** | ✅ Готов | 100KB | Статический HTML/CSS/JS |
| **Backend** | ✅ Готов | 68KB | Node.js API (1550 строк) |
| **Docker** | ✅ Готов | - | Nginx + Node.js контейнеры |
| **API Keys** | ✅ Настроен | - | OpenAI API интеграция |
| **Документация** | ✅ Полная | - | 10+ MD файлов |

## 🔄 Версионирование

### Текущая версия: 1.0.0

**Изменения в v1.0.0**:
- ✅ Базовая функциональность
- ✅ Docker контейнеризация
- ✅ OpenAI API интеграция
- ✅ Адаптивный дизайн
- ✅ Полная документация

**Планы на v1.1.0**:
- 🔄 Улучшенный UI/UX
- 🔄 Дополнительные AI модели
- 🔄 Расширенная аналитика
- 🔄 Многоязычная поддержка

## 📞 Поддержка

### Полезные команды

```bash
# Проверка статуса
docker compose ps

# Перезапуск
docker compose restart

# Логи
docker compose logs -f

# Очистка
docker system prune -f
```

### Troubleshooting

См. [docs/troubleshooting/README.md](docs/troubleshooting/README.md) для решения типичных проблем.

---

**Версия**: 1.0.0  
**Последнее обновление**: 31.08.2025  
**Статус**: Готов к production
