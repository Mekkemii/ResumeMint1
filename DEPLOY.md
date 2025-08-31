# Инструкция по деплою на Vercel

## Быстрый деплой

### Вариант 1: Через Vercel CLI
```bash
# Установите Vercel CLI
npm i -g vercel

# Войдите в аккаунт Vercel
vercel login

# Деплой
vercel --prod
```

### Вариант 2: Через GitHub (рекомендуется)
1. Загрузите код на GitHub
2. Перейдите на [vercel.com](https://vercel.com)
3. Нажмите "New Project"
4. Выберите ваш репозиторий
5. Настройте:
   - **Framework Preset**: Create React App
   - **Root Directory**: `./` (корень проекта)
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Output Directory**: `frontend/build`
   - **Install Command**: `npm install`

### Вариант 3: Drag & Drop
1. Выполните локальную сборку:
```bash
cd frontend
npm install
npm run build
```
2. Перетащите папку `frontend/build` на [vercel.com](https://vercel.com)

## Настройка переменных окружения

В Vercel Dashboard → Project Settings → Environment Variables добавьте:
- `REACT_APP_API_URL` - URL вашего backend API

## Возможные проблемы

### Ошибка 404
- Убедитесь, что в `vercel.json` правильно настроены rewrites
- Проверьте, что build проходит успешно

### Ошибка сборки
- Проверьте, что все зависимости установлены
- Убедитесь, что Node.js версия >= 16

### Проблемы с роутингом
- Добавьте в `vercel.json`:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

## Структура для деплоя

```
/
├── frontend/          # React приложение
├── backend/           # Backend (не деплоится на Vercel)
├── vercel.json        # Конфигурация Vercel
├── package.json       # Корневой package.json
└── .vercelignore      # Исключения для Vercel
```
