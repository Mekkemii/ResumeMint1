# utils/text.js

- `smartTrim(text, limit=8000)` — удаляет HTML/лишние переносы/знаки, режет до лимита.
- `makeKey(kind, payload)` — SHA-256 ключ для кэша.

**Где менять лимиты:** в каждом роуте, где вызывается `smartTrim(…, limit)`.
