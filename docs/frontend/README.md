# Frontend - ResumeMint

## 📋 Описание

Frontend ResumeMint представляет собой статическое React приложение, упакованное в единый HTML файл с встроенными стилями.

## 📁 Файловая структура

```
/
├── index.html          # Главная страница приложения (82KB)
├── globals.css         # Глобальные стили
└── package.json        # Зависимости фронтенда
```

## 🔧 Основные файлы

### index.html
- **Размер**: 82KB
- **Строк**: 2023
- **Назначение**: Единый файл React приложения
- **Особенности**: 
  - Встроенные стили
  - Встроенный JavaScript
  - Все компоненты в одном файле

### globals.css
- **Размер**: 555B
- **Строк**: 15
- **Назначение**: Глобальные CSS стили
- **Содержание**: Базовые стили для приложения

## 🌐 API интеграция

### Endpoints
Frontend обращается к следующим API endpoints:

```javascript
// Основные endpoints
/api/parse/docx          # Парсинг DOCX файлов
/api/analyze             # Анализ резюме
/api/premium/oneshot     # Премиум анализ
/api/combo/summary-match # Комбинированный анализ
```

### Примеры запросов

```javascript
// Парсинг DOCX
const response = await fetch("/api/parse/docx", { 
  method: "POST", 
  body: formData 
});

// Анализ резюме
const data = await postJSON('/api/analyze', { 
  resumeText: resume 
});

// Анализ с описанием вакансии
const data = await postJSON('/api/analyze', { 
  resumeText: resume, 
  jobText: job 
});
```

## 🎨 UI компоненты

### Основные секции
1. **Загрузка файлов** - Drag & Drop для резюме
2. **Анализ резюме** - Основной функционал
3. **Сравнение с вакансией** - Анализ соответствия
4. **Результаты** - Отображение анализа

### Стилизация
- Современный дизайн
- Адаптивная верстка
- Material Design элементы
- Темная/светлая тема

## 🔗 Интеграция с Docker

### Nginx прокси
Frontend обслуживается через Nginx, который:
- Раздает статические файлы
- Проксирует `/api/*` запросы на backend
- Обрабатывает SPA routing

### Конфигурация
```nginx
location / {
  try_files $uri /index.html;
}

location /api/ {
  proxy_pass http://api:5000/api/;
}
```

## 🚀 Разработка

### Локальный запуск
```bash
# Простой HTTP сервер
python -m http.server 8080

# Или через Node.js
npx serve -s . -l 8080
```

### Сборка
Frontend уже собран в статический HTML файл, дополнительная сборка не требуется.

## 📊 Производительность

- **Размер**: 82KB (оптимизирован)
- **Загрузка**: < 2 секунд
- **API вызовы**: Асинхронные
- **Кэширование**: Браузерное кэширование

## 🔗 Связанные файлы

- [Backend API](../backend/README.md)
- [Docker конфигурация](../docker/README.md)
- [Environment настройки](../config/README.md)
