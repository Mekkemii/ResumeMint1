# Конфигурация - ResumeMint

## 📋 Описание

Документация по конфигурации проекта ResumeMint, включая переменные окружения, настройки API и параметры системы.

## 📁 Файлы конфигурации

```
backend/
├── .env                    # Переменные окружения (приватный)
├── env.example            # Пример конфигурации
└── package.json           # Зависимости и скрипты

/
├── docker-compose.yml     # Docker конфигурация
├── .dockerignore         # Исключения для Docker
└── package.json          # Корневые зависимости
```

## 🔧 Переменные окружения

### backend/.env
```bash
# OpenAI API Configuration
OPENAI_API_KEY=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

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

### Описание переменных

#### OpenAI API
- **OPENAI_API_KEY** - Ключ API для доступа к OpenAI
- **OPENAI_MODEL** - Модель для анализа (gpt-3.5-turbo-0125)
- **OPENAI_TEMPERATURE** - Креативность ответов (0.2 = консистентность)
- **MAX_TOKENS** - Максимальное количество токенов в ответе

#### Сервер
- **PORT** - Порт для backend API (5000)
- **NODE_ENV** - Окружение (production/development)

#### Обработка текста
- **DISABLE_CONDENSE** - Отключить сжатие контекста
- **CONTEXT_LIMIT_TOKENS** - Лимит токенов для контекста

#### Загрузка файлов
- **MAX_FILE_SIZE** - Максимальный размер файла (10MB)
- **UPLOAD_DIR** - Папка для загруженных файлов

#### CORS
- **CORS_ORIGIN** - Разрешенные домены для CORS

## 🐳 Docker конфигурация

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

### Переменные Docker
- **env_file** - Загрузка из backend/.env
- **environment** - Дополнительные переменные
- **ports** - Маппинг портов
- **restart** - Политика перезапуска

## 🔐 Безопасность

### Приватные файлы
- `.env` - Содержит API ключи
- `.gitignore` - Исключает .env из git
- `.dockerignore` - Исключает .env из образов

### API ключи
```bash
# Формат OpenAI API ключа
sk-proj-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Проверка ключа
if (!process.env.OPENAI_API_KEY || 
    process.env.OPENAI_API_KEY === 'your-openai-api-key-here') {
  throw new Error('Invalid OpenAI API key');
}
```

## 🌐 Сетевая конфигурация

### Порты
- **8080** - Публичный доступ (Nginx)
- **5000** - Backend API (внутренний)

### CORS настройки
```javascript
// Backend CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:8080',
  credentials: true
}));
```

### Проксирование
```nginx
# Nginx прокси
location /api/ {
  proxy_pass http://api:5000/api/;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
}
```

## 📊 Мониторинг

### Логирование
```javascript
// Уровни логирования
console.log('INFO:', message);
console.error('ERROR:', error);
console.warn('WARNING:', warning);
```

### Метрики
- Количество запросов
- Время ответа
- Использование токенов
- Размер файлов

## 🚀 Развертывание

### Production
```bash
# Переменные для production
NODE_ENV=production
PORT=5000
CORS_ORIGIN=https://yourdomain.com
```

### Development
```bash
# Переменные для development
NODE_ENV=development
PORT=5000
CORS_ORIGIN=http://localhost:3000
```

### Docker
```bash
# Запуск с переменными
docker compose up --build

# Проверка переменных
docker compose exec api env | grep OPENAI
```

## 🔍 Отладка

### Проверка конфигурации
```bash
# Проверка .env файла
cat backend/.env

# Проверка переменных в контейнере
docker compose exec api printenv

# Проверка API ключа
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  https://api.openai.com/v1/models
```

### Логи конфигурации
```javascript
// Логирование конфигурации
console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
console.log('OPENAI_API_KEY length:', process.env.OPENAI_API_KEY?.length);
console.log('PORT:', process.env.PORT);
console.log('CORS_ORIGIN:', process.env.CORS_ORIGIN);
```

## 🔗 Связанные файлы

- [Backend API](../backend/README.md)
- [Docker конфигурация](../docker/README.md)
- [Deployment](../deployment/README.md)
- [Troubleshooting](../troubleshooting/README.md)
