# Backend (Express)

Главный роутер: `routes/aiRoutes.js`. Все вызовы возвращают JSON и, где возможно, `usage` токенов (`prompt_tokens`, `completion_tokens`, `total_tokens`).

## Кэш
- По желанию — in-memory Map с TTL 15 мин, ключ: SHA-256 от входов.
- Экономит повторы и бережёт бюджет.

## Ошибки
- Любая ошибка отдаётся как `{ error }` с `status 500`.
- На фронте блокируйте кнопки `busy`-состоянием.
