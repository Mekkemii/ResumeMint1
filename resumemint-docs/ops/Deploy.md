# Деплой / запуск

## Локально
- backend: `npm i && npm run dev`
- frontend: `npm i && npm run dev`

## Vercel (frontend) + Render/Fly (backend)
- Прокиньте переменные окружения из `ops/ENV.md`.
- Не храните ключи в клиенте.

## Логи/ошибки
- Логируйте `usage` и status-коды endpoints (не логируйте PII).
