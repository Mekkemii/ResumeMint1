# Backend API - ResumeMint

## 📋 Описание

Backend ResumeMint - это Node.js API сервер, предоставляющий AI функционал для анализа резюме через OpenAI API.

## 📁 Файловая структура

```
backend/
├── server.js              # Основной сервер (1402 строки)
├── package.json           # Зависимости
├── Dockerfile             # Docker контейнер
├── .env                   # Переменные окружения
├── env.example            # Пример .env файла
├── routes/                # API маршруты
├── services/              # Бизнес-логика
├── middleware/            # Middleware функции
├── schemas/               # Схемы валидации
├── prompts/               # Промпты для AI
└── utils/                 # Утилиты
```

## 🔧 Основные файлы

### server.js
- **Размер**: 62KB
- **Строк**: 1402
- **Назначение**: Основной сервер Express.js
- **Функции**:
  - Настройка Express приложения
  - Middleware (CORS, JSON, файлы)
  - Статические файлы
  - API маршруты
  - Обработка ошибок

### package.json
```json
{
  "name": "resume-mint-backend",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "multer": "^1.4.5-lts.1",
    "openai": "^4.20.1",
    "dotenv": "^16.3.1",
    "mammoth": "^1.6.0"
  }
}
```

## 🌐 API Endpoints

### Основные маршруты

#### `/api/parse/docx`
- **Метод**: POST
- **Назначение**: Парсинг DOCX файлов
- **Вход**: FormData с файлом
- **Выход**: JSON с текстом

#### `/api/analyze`
- **Метод**: POST
- **Назначение**: Анализ резюме
- **Вход**: `{ resumeText: string, jobText?: string }`
- **Выход**: JSON с анализом

#### `/api/premium/oneshot`
- **Метод**: POST
- **Назначение**: Премиум анализ
- **Вход**: `{ resumeText: string, jobText: string }`
- **Выход**: Расширенный анализ

#### `/api/combo/summary-match`
- **Метод**: POST
- **Назначение**: Комбинированный анализ
- **Вход**: `{ resumeText: string, jobText: string }`
- **Выход**: Сводка и соответствие

## 🔧 Middleware

### CORS
```javascript
app.use(cors());
```
- Разрешает кросс-доменные запросы
- Настроен для работы с Docker

### JSON Parser
```javascript
app.use(express.json({ limit: '10mb' }));
```
- Парсинг JSON до 10MB
- Поддержка больших резюме

### File Upload
```javascript
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024, files: 1 }
});
```
- Поддержка DOCX, DOC, TXT, PDF
- Лимит 10MB на файл

## 🤖 AI интеграция

### OpenAI клиент
```javascript
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});
```

### Модели
- **Основная**: `gpt-3.5-turbo-0125`
- **Премиум**: `gpt-4o-mini`
- **Температура**: 0.2
- **Макс токены**: 2000

### Промпты
- Анализ резюме
- Сравнение с вакансией
- Структурированный вывод
- Рекомендации

## 🔐 Безопасность

### Валидация API ключа
```javascript
if (!process.env.OPENAI_API_KEY || 
    process.env.OPENAI_API_KEY === 'your-openai-api-key-here') {
  throw new Error('Invalid OpenAI API key');
}
```

### Обработка ошибок
- Централизованная обработка
- Логирование ошибок
- Безопасные сообщения

## 📊 Мониторинг

### Логирование
- Запросы к API
- Ошибки OpenAI
- Время выполнения
- Размер файлов

### Метрики
- Количество запросов
- Успешность обработки
- Время ответа
- Использование токенов

## 🐳 Docker интеграция

### Dockerfile
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

### Переменные окружения
- `PORT=5000`
- `NODE_ENV=production`
- `OPENAI_API_KEY` (из .env)
- `CORS_ORIGIN=http://localhost:8080`

## 🚀 Разработка

### Локальный запуск
```bash
cd backend
npm install
npm run dev
```

### Тестирование
```bash
# Проверка API
curl http://localhost:5000/api/ping

# Тест анализа
curl -X POST http://localhost:5000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"resumeText": "test"}'
```

## 🔗 Связанные файлы

- [Frontend](../frontend/README.md)
- [Docker конфигурация](../docker/README.md)
- [Environment настройки](../config/README.md)
- [API Endpoints](../api/README.md)
