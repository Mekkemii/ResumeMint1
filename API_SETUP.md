# Настройка OpenAI API для ResumeMint

## 🚀 Быстрая настройка

### 1. Получение API ключа OpenAI

1. Перейдите на [OpenAI Platform](https://platform.openai.com/)
2. Войдите в аккаунт или создайте новый
3. Перейдите в раздел "API Keys"
4. Нажмите "Create new secret key"
5. Скопируйте полученный ключ (начинается с `sk-`)

### 2. Настройка проекта

1. Перейдите в папку `backend/`
2. Создайте файл `.env` (если его нет)
3. Добавьте ваш API ключ:

```env
OPENAI_API_KEY=sk-your-actual-api-key-here
PORT=5000
NODE_ENV=development
```

### 3. Запуск сервера

```bash
cd backend
npm install
npm start
```

## 🔧 Детальная настройка

### Переменные окружения

Создайте файл `backend/.env` со следующими параметрами:

```env
# OpenAI API Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here

# Server Configuration
PORT=5000
NODE_ENV=development

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_DIR=uploads

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Проверка работы API

После настройки API ключа:

1. Запустите backend сервер
2. В консоли должно появиться: `✅ OpenAI API ключ найден, используем API`
3. При анализе резюме должно появиться: `🚀 Отправляем запрос к OpenAI API...`

## 💰 Стоимость API

- **GPT-4**: ~$0.03 за 1K токенов
- **Средний анализ резюме**: ~1000-2000 токенов
- **Стоимость одного анализа**: ~$0.03-0.06

## 🛠 Устранение проблем

### Ошибка "API ключ не настроен"
- Проверьте, что файл `.env` создан в папке `backend/`
- Убедитесь, что API ключ начинается с `sk-`
- Перезапустите сервер

### Ошибка "API не работает"
- Проверьте баланс на OpenAI Platform
- Убедитесь, что API ключ активен
- Проверьте интернет-соединение

### Ошибка CORS
- Проверьте настройки CORS_ORIGIN в `.env`
- Убедитесь, что frontend запущен на правильном порту

## 🔒 Безопасность

- **Никогда не коммитьте** файл `.env` в git
- Добавьте `.env` в `.gitignore`
- Используйте разные API ключи для разработки и продакшена

## 📊 Мониторинг использования

Отслеживайте использование API на [OpenAI Platform](https://platform.openai.com/usage)

---

**Готово!** Теперь ResumeMint будет использовать реальный AI для анализа резюме вместо локального анализа.
