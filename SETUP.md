# Инструкции по установке и запуску ResumeMint.ru

## Предварительные требования

- Node.js 18+ 
- npm или yarn
- OpenAI API ключ

## Быстрая установка

### 1. Клонирование репозитория

```bash
git clone <repository-url>
cd resume-mint
```

### 2. Настройка Backend

```bash
cd backend

# Установка зависимостей
npm install

# Создание файла конфигурации
cp env.example .env

# Редактирование .env файла
# Добавьте ваш OpenAI API ключ:
# OPENAI_API_KEY=sk-your-openai-api-key-here
```

### 3. Настройка Frontend

```bash
cd ../frontend

# Установка зависимостей
npm install
```

### 4. Запуск приложения

#### Запуск Backend (в отдельном терминале)
```bash
cd backend
npm run dev
```

Backend будет доступен по адресу: http://localhost:5000

#### Запуск Frontend (в отдельном терминале)
```bash
cd frontend
npm start
```

Frontend будет доступен по адресу: http://localhost:3000

## Подробная настройка

### Настройка переменных окружения

#### Backend (.env файл)

```env
# OpenAI API Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here

# Server Configuration
PORT=5000
NODE_ENV=development

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

#### Frontend (.env файл, если нужен)

```env
REACT_APP_API_URL=http://localhost:5000/api
```

### Получение OpenAI API ключа

1. Зарегистрируйтесь на [OpenAI](https://platform.openai.com/)
2. Перейдите в раздел API Keys
3. Создайте новый API ключ
4. Скопируйте ключ в файл .env

### Проверка установки

1. Откройте http://localhost:3000 в браузере
2. Перейдите на страницу "Анализ резюме"
3. Загрузите тестовое резюме или используйте пример
4. Проверьте, что анализ работает корректно

## Структура проекта

```
resume-mint/
├── backend/                 # Node.js API сервер
│   ├── routes/             # API маршруты
│   ├── services/           # Бизнес-логика
│   ├── middleware/         # Middleware функции
│   ├── uploads/            # Загруженные файлы
│   └── server.js           # Основной файл сервера
├── frontend/               # React приложение
│   ├── src/
│   │   ├── components/     # React компоненты
│   │   ├── pages/          # Страницы приложения
│   │   ├── services/       # API сервисы
│   │   ├── context/        # React Context
│   │   └── types/          # TypeScript типы
│   └── public/             # Статические файлы
└── README.md               # Основная документация
```

## API Endpoints

### Резюме
- `POST /api/resume/upload` - Загрузка и анализ резюме
- `POST /api/resume/analyze-text` - Анализ текстового резюме
- `POST /api/resume/edit` - Редактирование резюме
- `GET /api/resume/sample` - Получение примера резюме

### Вакансии
- `POST /api/vacancy/analyze` - Анализ вакансии
- `POST /api/vacancy/parse-url` - Парсинг вакансии по URL
- `GET /api/vacancy/sample` - Получение примера вакансии

### Анализ
- `POST /api/analysis/compare` - Сравнение резюме с вакансией
- `POST /api/analysis/cover-letter` - Генерация сопроводительного письма
- `POST /api/analysis/full-analysis` - Полный анализ

## Возможные проблемы и решения

### Ошибка "OpenAI API ключ не настроен"
- Проверьте, что файл .env создан в папке backend
- Убедитесь, что OPENAI_API_KEY указан корректно
- Перезапустите backend сервер

### Ошибка CORS
- Проверьте настройки CORS_ORIGIN в .env файле
- Убедитесь, что frontend запущен на правильном порту

### Ошибка загрузки файлов
- Проверьте, что папка uploads существует в backend
- Убедитесь, что у процесса есть права на запись

### Проблемы с зависимостями
```bash
# Очистка кэша npm
npm cache clean --force

# Удаление node_modules и переустановка
rm -rf node_modules package-lock.json
npm install
```

## Разработка

### Запуск в режиме разработки

Backend:
```bash
cd backend
npm run dev  # Запуск с nodemon для автоматической перезагрузки
```

Frontend:
```bash
cd frontend
npm start    # Запуск с hot reload
```

### Тестирование

Backend:
```bash
cd backend
npm test
```

Frontend:
```bash
cd frontend
npm test
```

### Сборка для продакшена

Backend:
```bash
cd backend
npm run build
npm start
```

Frontend:
```bash
cd frontend
npm run build
```

## Безопасность

- Никогда не коммитьте .env файлы в git
- Используйте HTTPS в продакшене
- Настройте rate limiting для API
- Валидируйте все входные данные

## Поддержка

При возникновении проблем:
1. Проверьте логи в консоли браузера и терминале
2. Убедитесь, что все зависимости установлены
3. Проверьте настройки переменных окружения
4. Создайте issue в репозитории проекта
