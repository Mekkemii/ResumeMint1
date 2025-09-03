# PROJECT_MAP.md - Карта проекта ResumeMint

## 📋 Обзор проекта

**ResumeMint** - AI-ассистент для анализа резюме и вакансий с веб-интерфейсом и serverless backend на Vercel.

### 🎯 Основные функции
- **Оценка резюме**: HR + Грейд + ATS-совместимость
- **Матчинг вакансии**: анализ JD + сопоставление с профилем
- **Сопроводительное письмо**: генерация на основе резюме и вакансии
- **Premium анализ**: полный пакет всех функций

## 🏗️ Архитектура

### Frontend (Статический)
- **Файл**: `index.html`
- **Технологии**: HTML5 + CSS3 + Vanilla JavaScript
- **Стиль**: Dark Purple Theme с градиентами
- **Адаптивность**: Mobile-first подход

### Backend (Serverless Functions)
- **Платформа**: Vercel
- **Runtime**: Node.js 22.x
- **Функции**: `/api/*` endpoints

## 📁 Структура файлов

### Корневая структура (Профиль A - Рекомендуемый)
```
ResumeMint1/
├── index.html                 # Основной интерфейс
├── api/                       # Serverless функции
│   ├── parse.js              # Парсинг файлов (PDF/DOCX/TXT)
│   ├── analyze.js            # Анализ резюме
│   ├── vacancy/              # Анализ вакансий
│   │   └── detailed-match.js # Детальный матчинг
│   └── cover/                # Генерация документов
│       └── generate.js       # Сопроводительное письмо
├── package.json              # Зависимости
├── vercel.json              # Конфигурация Vercel
├── .vercelignore            # Исключения для сборки
└── PROJECT_MAP.md           # Этот файл
```

### Профиль B (Максимальное сокращение)
```
ResumeMint1/
├── index.html
├── api/
│   ├── parse.js              # Парсинг + анализ + матчинг
│   └── cover.js              # Генерация документов
├── package.json
├── vercel.json
└── PROJECT_MAP.md
```

## 🎨 UI/UX спецификация

### Цветовая схема
```css
:root {
  --bg: #0b0b10;              /* Основной фон */
  --bg-elev: #11111a;         /* Приподнятые элементы */
  --surface: #161622;          /* Поверхности карточек */
  --surface-2: #1e1e2b;       /* Вторичные поверхности */
  --border: #2a2a3c;          /* Границы */
  --text: #f1f0ff;            /* Основной текст */
  --text-2: #d8d6ea;          /* Вторичный текст */
  --text-3: #b2afc8;          /* Третичный текст */
  --primary: #8b5cf6;         /* Основной цвет */
  --primary-strong: #6e2ed6;  /* Акцент */
  --mint: #2dd4bf;            /* Акцентный цвет */
}
```

### Компоненты интерфейса
- **Навигация**: Черная с логотипом и ссылками
- **Hero секция**: Заголовок + описание + кнопки действий
- **Панели форм**: Переключение между функциями
- **Результаты**: Карточки с анализом
- **Модальные окна**: Описание сервиса, контакты, поддержка

### Адаптивность
- **Mobile-first**: Базовые стили для мобильных
- **Breakpoints**: 768px, 1024px
- **Grid система**: CSS Grid для результатов

## 🔌 API контракты

### `/api/parse` - Парсинг файлов
```javascript
// POST /api/parse
// Content-Type: multipart/form-data

// Request
{
  file: File // PDF, DOCX, TXT
}

// Response
{
  ok: boolean,
  text: string,
  meta: {
    filename: string,
    size: number,
    type: string
  }
}
```

### `/api/analyze` - Анализ резюме
```javascript
// POST /api/analyze
// Content-Type: application/json

// Request
{
  resumeText: string,
  jobText?: string // Опционально
}

// Response
{
  grade: {
    level: string,        // "Junior" | "Middle" | "Senior" | "Lead"
    rationale: string[]   // Обоснование
  },
  summary: string,        // Краткая сводка
  strengths: string[],    // Сильные стороны
  gaps: Array<{          // Недочёты
    issue: string,
    fix: string
  }>,
  ats_warnings: string[], // ATS предупреждения
  keywords: {
    hard_skills: string[],
    tools: string[],
    domains: string[]
  },
  questions: string[]     // Вопросы для уточнения
}
```

### `/api/vacancy/detailed-match` - Матчинг вакансии
```javascript
// POST /api/vacancy/detailed-match
// Content-Type: application/json

// Request
{
  resumeText: string,
  jobText: string
}

// Response
{
  job: {
    job_summary: string,
    job_grade: { level: string, rationale: string },
    requirements: string[],
    nice_to_have: string[]
  },
  candidate: {
    candidate_summary: string,
    candidate_grade: { level: string, rationale: string },
    key_skills: string[],
    experience_summary: string
  },
  match: {
    overall_match: number,        // Процент соответствия
    grade_fit: string,           // Соответствие уровню
    chances: string,             // Шансы на успех
    strengths: string[],         // Сильные стороны
    weaknesses: string[],        // Слабые стороны
    missing_requirements: string[], // Недостающие требования
    recommendations: string[]    // Рекомендации
  },
  detailed_analysis: Array<{     // Построчный анализ
    requirement: string,
    evidence: string,
    status: string,              // "полное соответствие" | "частичное" | "не соответствует"
    score: number,
    comment?: string
  }>
}
```

### `/api/cover/generate` - Генерация сопроводительного
```javascript
// POST /api/cover/generate
// Content-Type: application/json

// Request
{
  resumeText: string,
  jobText: string
}

// Response
{
  cover_letter: string
}
```

## 📦 Зависимости

### Основные (production)
```json
{
  "formidable": "2.1.2",        // Парсинг multipart форм
  "mammoth": "^1.6.0",          // Парсинг DOCX
  "pdf-parse": "^1.1.1"         // Парсинг PDF
}
```

### Конфигурация
```json
{
  "type": "commonjs",           // Формат модулей
  "engines": { "node": "22.x" } // Версия Node.js
}
```

## 🔧 Конфигурация Vercel

### vercel.json
```json
{
  "functions": {
    "api/parse.js": { 
      "maxDuration": 10, 
      "memory": 1024 
    }
  }
}
```

### .vercelignore
```
backend/              # Исключаем старый backend
docker/              # Docker файлы
pages/               # Next.js папки
*.md                 # Документация (кроме PROJECT_MAP.md)
node_modules/        # Зависимости
.vercel/            # Временные файлы Vercel
```

## 🌍 Переменные окружения

### Обязательные
```bash
# OpenAI API ключ для AI анализа
OPENAI_API_KEY=sk-...

# Версия API OpenAI
OPENAI_API_VERSION=2024-02-15
```

### Опциональные
```bash
# Максимальный размер файла (в байтах)
MAX_FILE_SIZE=20971520  # 20MB

# Таймаут для AI запросов (в секундах)
AI_TIMEOUT=30
```

## 📝 План сокращения файлов

### Этап 1: Базовая очистка ✅
- [x] Удалить `backend/` папку
- [x] Удалить `pages/` папку
- [x] Удалить `vercel.json` (если есть)
- [x] Создать `api/parse.js`

### Этап 2: Создание API endpoints
- [ ] Создать `api/analyze.js` (анализ резюме)
- [ ] Создать `api/vacancy/detailed-match.js` (матчинг)
- [ ] Создать `api/cover/generate.js` (сопроводительное)

### Этап 3: Оптимизация (Профиль B)
- [ ] Объединить все LLM функции в один файл
- [ ] Создать единый endpoint для всех операций
- [ ] Упростить структуру API

## 🚀 Развертывание

### Локальная разработка
```bash
# Установка зависимостей
npm install

# Проверка JSON
npm run check:json

# Локальный тест (если нужен)
npm start
```

### Vercel деплой
1. Push в `main` ветку
2. Автоматический деплой через GitHub integration
3. Проверка функций в Vercel Dashboard

## 🔍 Отладка

### Логи Vercel
- **Function Logs**: `/api/*` endpoints
- **Build Logs**: Процесс сборки
- **Runtime Errors**: Ошибки выполнения

### Локальная отладка
```javascript
// В API функциях
console.log('Debug info:', { data, timestamp: Date.now() });

// В frontend
console.log('Using endpoint:', endpoint, 'for file:', file.name);
```

## 📚 Документация

### Ссылки
- **GitHub**: [Repository](https://github.com/Mekkemii/ResumeMint1)
- **Vercel**: [Dashboard](https://vercel.com/dashboard)
- **OpenAI**: [API Documentation](https://platform.openai.com/docs)

### Обновления
- **Версия**: 1.0.0
- **Последнее обновление**: 2024-12-19
- **Статус**: В разработке

---

## 💡 Как использовать эту карту

1. **Для изменений UI**: Ищите секцию "UI/UX спецификация" → редактируйте `index.html`
2. **Для изменения API**: Ищите "API контракты" → редактируйте соответствующий файл в `api/`
3. **Для добавления функций**: Следуйте структуре "Профиль A" или "Профиль B"
4. **Для отладки**: Используйте секцию "Отладка" и "Логи Vercel"

**Пример**: "Изменить цвет кнопки на зеленый" → Секция "UI/UX" → `index.html` → CSS переменные или классы кнопок.
