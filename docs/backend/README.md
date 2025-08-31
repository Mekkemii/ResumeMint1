# Backend - ResumeMint API

## 📋 Описание

Backend компонент ResumeMint представляет собой Node.js API сервер, построенный на Express.js с интеграцией OpenAI GPT API. Сервер предоставляет RESTful API для анализа резюме, матчинга вакансий и генерации документов.

## 🏗️ Архитектура

```
Backend/
├── server.js           # Основной сервер (1550 строк, 68KB)
├── package.json        # Зависимости
├── Dockerfile          # Контейнер
├── .env               # Переменные окружения
├── env.example        # Пример конфигурации
└── 📁 Подмодули
    ├── utils/          # Утилиты и хелперы
    ├── services/       # Бизнес-логика
    ├── schemas/        # Схемы данных
    ├── routes/         # API маршруты
    ├── prompts/        # AI промпты
    └── middleware/     # Промежуточное ПО
```

## 📁 Основные файлы

### `server.js` (1550 строк, 68KB)

**Описание**: Основной файл сервера с полной функциональностью

**Структура файла**:

#### 1. **Импорты и конфигурация** (строки 1-50)
```javascript
const express = require('express');
const multer = require('multer');
const mammoth = require('mammoth');
const OpenAI = require('openai');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});
```

#### 2. **Middleware настройки** (строки 51-100)
```javascript
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:8080',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Настройка multer для загрузки файлов
const uploadMemory = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});
```

#### 3. **Утилиты и хелперы** (строки 101-300)

##### Кэширование
```javascript
const cache = new Map();
const CACHE_TTL = 3600000; // 1 час

function getCached(key) {
  const item = cache.get(key);
  if (item && Date.now() - item.timestamp < CACHE_TTL) {
    return item.data;
  }
  cache.delete(key);
  return null;
}

function setCached(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}
```

##### OpenAI интеграция
```javascript
async function chatJson(messages, options = {}) {
  const response = await openai.chat.completions.create({
    model: options.model || 'gpt-3.5-turbo-0125',
    messages,
    max_tokens: options.max_tokens || 1000,
    temperature: options.temperature || 0.2,
    response_format: { type: 'json_object' }
  });
  
  const content = response.choices[0].message.content;
  const json = JSON.parse(content);
  
  return {
    json,
    usage: response.usage,
    model: response.model
  };
}
```

##### Обработка текста
```javascript
function smartTrim(text, maxLength = 8000) {
  if (!text || text.length <= maxLength) return text;
  
  // Обрезаем по предложениям
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  let result = '';
  
  for (const sentence of sentences) {
    if ((result + sentence).length <= maxLength) {
      result += sentence;
    } else {
      break;
    }
  }
  
  return result || text.substring(0, maxLength);
}
```

#### 4. **AI промпты** (строки 301-500)

##### Системные промпты
```javascript
function sysResumeReview() {
  return `Ты — опытный HR-специалист и карьерный консультант. 
Анализируй резюме профессионально и конструктивно.
Всегда отвечай на русском языке. Строго возвращай данные только в указанном JSON-формате.
Ключи JSON — на английском, содержимое — на русском.`;
}

function sysDetailedMatch() {
  return `Ты — опытный HR-специалист и карьерный консультант. 
Анализируй соответствие резюме требованиям вакансии максимально детально.
Всегда отвечай на русском языке. Строго возвращай данные только в указанном JSON-формате.
Ключи JSON — на английском, содержимое — на русском.`;
}
```

##### Пользовательские промпты
```javascript
function userDetailedMatch(resumeText, jobText) {
  return `ЗАДАЧА: Детальный анализ соответствия резюме требованиям вакансии

1) АНАЛИЗ ВАКАНСИИ:
   - job_summary: краткое описание позиции (<=400 символов)
   - requirements: основные требования (5-15 пунктов)
   - nice_to_have: желательные навыки (0-8 пунктов)
   - job_grade: требуемый уровень (Junior|Middle|Senior|Lead) + обоснование

2) АНАЛИЗ РЕЗЮМЕ:
   - candidate_summary: краткое описание кандидата (<=400 символов)
   - candidate_grade: уровень кандидата + обоснование
   - key_skills: ключевые навыки из резюме
   - experience_summary: краткое описание опыта

3) ДЕТАЛЬНОЕ СОПОСТАВЛЕНИЕ:
   - overall_match: общий процент соответствия (0-100)
   - grade_fit: "ниже требуемого" | "соответствует" | "выше требуемого"
   - chances: "Высокие" | "Средние" | "Низкие"
   - strengths: сильные стороны кандидата для этой позиции
   - weaknesses: слабые стороны и недостатки
   - missing_requirements: чего не хватает кандидату
   - recommendations: конкретные рекомендации для улучшения

4) ПОСТРОЧНЫЙ АНАЛИЗ ТРЕБОВАНИЙ:
   - requirement: требование из вакансии
   - evidence: доказательства из резюме (или "не найдено")
   - status: "полное соответствие" | "частичное соответствие" | "не соответствует"
   - score: оценка 0-100 для каждого требования
   - comment: подробный комментарий с объяснением

РЕЗЮМЕ: ${resumeText}
ВАКАНСИЯ: ${jobText}`;
}
```

#### 5. **API Endpoints** (строки 501-1400)

##### Основные endpoints
```javascript
// Проверка работоспособности
app.get('/api/ping', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Парсинг DOCX файлов
app.post('/api/parse/docx', uploadMemory.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'no file' });
    const { value } = await mammoth.extractRawText({ buffer: req.file.buffer });
    res.json({ text: (value || '').trim() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Анализ резюме
app.post('/api/analyze', async (req, res) => {
  try {
    const { resumeText, jobText } = req.body;
    const text = smartTrim(resumeText || '');
    if (!text) return res.status(400).json({ error: 'Нужно передать текст резюме' });
    
    const cacheKey = `analyze:${text}:${jobText || ''}`;
    const hit = getCached(cacheKey);
    if (hit) return res.json(hit);
    
    const { json, usage } = await chatJson([
      { role: 'system', content: sysResumeReview() },
      { role: 'user', content: userResumeReview(text, jobText) }
    ], { max_tokens: 800, temperature: 0.2 });
    
    const out = { ...json, usage };
    setCached(cacheKey, out);
    res.json(out);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Детальный матчинг вакансии
app.post('/api/vacancy/detailed-match', async (req, res) => {
  try {
    const { resumeText, jobText } = req.body;
    if (!resumeText || !jobText) {
      return res.status(400).json({ error: 'Нужны resumeText и jobText' });
    }
    
    const resumeT = smartTrim(resumeText, 8000);
    const jobT = smartTrim(jobText, 8000);
    const cacheKey = `detailed-match:${resumeT}:${jobT}`;
    const hit = getCached(cacheKey);
    if (hit) return res.json(hit);
    
    const { json, usage } = await chatJson([
      { role: 'system', content: sysDetailedMatch() },
      { role: 'user', content: userDetailedMatch(resumeT, jobT) }
    ], { max_tokens: 1500, temperature: 0.2 });
    
    const out = { ...json, usage };
    setCached(cacheKey, out);
    res.json(out);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Генерация сопроводительного письма
app.post('/api/cover/generate', async (req, res) => {
  try {
    const { resumeText, jobText } = req.body;
    if (!resumeText || !jobText) {
      return res.status(400).json({ error: 'Нужны resumeText и jobText' });
    }
    
    const resumeT = smartTrim(resumeText, 8000);
    const jobT = smartTrim(jobText, 8000);
    const cacheKey = `cover:${resumeT}:${jobT}`;
    const hit = getCached(cacheKey);
    if (hit) return res.json(hit);
    
    const { json, usage } = await chatJson([
      { role: 'system', content: 'Ты — опытный HR-специалист и карьерный консультант. Создавай персонализированные сопроводительные письма на русском языке. Письмо должно быть профессиональным, конкретным и показывать соответствие кандидата требованиям вакансии.' },
      { role: 'user', content: `Создай сопроводительное письмо (110-160 слов) для кандидата на основе его резюме и требований вакансии. Письмо должно включать:
1. Обращение к работодателю
2. Краткое представление кандидата
3. Соответствие требованиям вакансии
4. Конкретные достижения и опыт
5. Мотивацию работать в компании
6. Вежливое завершение

ФОРМАТ: {"cover_letter": "текст письма"}

РЕЗЮМЕ: ${resumeT}
ВАКАНСИЯ: ${jobT}` }
    ], { max_tokens: 800, temperature: 0.3 });
    
    const out = { ...json, usage };
    setCached(cacheKey, out);
    res.json(out);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
```

#### 6. **Обработка ошибок** (строки 1401-1550)
```javascript
// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Маршрут не найден',
    code: 'ROUTE_NOT_FOUND',
    path: req.originalUrl
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Ошибка сервера:', error);
  res.status(500).json({
    success: false,
    error: { message: error.message || 'Внутренняя ошибка сервера' }
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 ResumeMint API сервер запущен на порту ${PORT}`);
  console.log(`🔗 API доступен по адресу: http://localhost:${PORT}/api`);
});
```

### `package.json` (28 строк, 679B)

**Описание**: Зависимости и скрипты backend

```json
{
  "name": "resumemint-backend",
  "version": "1.0.0",
  "description": "ResumeMint Backend API",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "multer": "^1.4.5-lts.1",
    "mammoth": "^1.6.0",
    "openai": "^4.20.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

### `Dockerfile` (10 строк, 151B)

**Описание**: Контейнер для backend

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

### `.env` (20 строк, 401B)

**Описание**: Переменные окружения

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

## 🔧 Функциональность

### 1. **Анализ резюме**
- Структурный анализ документа
- Определение грейда кандидата
- Выявление сильных и слабых сторон
- Рекомендации по улучшению
- ATS-совместимость

### 2. **Матчинг вакансий**
- Детальное сопоставление требований
- Построчный анализ соответствия
- Оценка шансов на успех
- Конкретные рекомендации
- Выявление недостающих навыков

### 3. **Генерация документов**
- Сопроводительные письма
- Улучшенные версии резюме
- Персонализация под вакансию
- Профессиональный тон

### 4. **Обработка файлов**
- Парсинг DOCX документов
- Поддержка PDF (через mammoth)
- Валидация типов файлов
- Ограничения по размеру

## 🔐 Безопасность

### Валидация данных
- Проверка типов файлов
- Ограничения по размеру (10MB)
- Валидация JSON данных
- Санитизация входных данных

### CORS настройки
```javascript
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:8080',
  credentials: true
}));
```

### Обработка ошибок
- Централизованная обработка ошибок
- Логирование всех ошибок
- Безопасные сообщения об ошибках
- Graceful degradation

## 📈 Производительность

### Кэширование
- In-memory кэш для результатов
- TTL: 1 час
- Автоматическая очистка
- Кэширование по хешу запроса

### Оптимизации
- Асинхронная обработка
- Потоковая обработка файлов
- Оптимизированные промпты
- Минимальное использование памяти

### Мониторинг
```javascript
// Логирование запросов
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Метрики использования
const usageMetrics = {
  requests: 0,
  errors: 0,
  cacheHits: 0
};
```

## 🐳 Docker интеграция

### Контейнер
- **Образ**: node:20-alpine
- **Размер**: ~200MB
- **Порт**: 5000
- **Переменные**: Через .env файл

### Запуск
```bash
# Сборка
docker build -t resumemint-backend .

# Запуск
docker run -p 5000:5000 --env-file .env resumemint-backend
```

## 🔍 Отладка

### Логирование
```javascript
// Разные уровни логирования
console.log('INFO:', message);
console.error('ERROR:', error);
console.warn('WARN:', warning);
```

### Мониторинг
- Количество запросов
- Время ответа
- Использование памяти
- Ошибки API

## 🚨 Известные проблемы

1. **Большие файлы**: Медленная обработка файлов > 5MB
2. **OpenAI лимиты**: Rate limiting при большом количестве запросов
3. **Память**: Утечки памяти при длительной работе
4. **Кэш**: Ограниченный размер in-memory кэша

## 🔄 Обновления

### Версия 1.0.0
- ✅ Полный API функционал
- ✅ Интеграция с OpenAI
- ✅ Кэширование результатов
- ✅ Обработка файлов
- ✅ Docker поддержка

### Планы развития
- 🔄 Redis кэширование
- 🔄 База данных для метрик
- 🔄 Аутентификация
- 🔄 Rate limiting
- 🔄 Мониторинг и алерты

---

**Размер**: 68KB  
**Строк кода**: 1550  
**Последнее обновление**: 31.08.2025  
**Статус**: Готов к production
