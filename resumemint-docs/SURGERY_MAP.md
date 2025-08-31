# Карта точечных правок (surgery map)

Ниже — «куда идти/что искать», чтобы править нужное поведение.

## Модель/температура/макс. токены
- Файл: `backend/src/llmClient.js`
- Якорь: `[DOCS:LLM_CONFIG]`
- Что менять: `model`, `temperature`, `max_tokens` (передаётся из вызова).

## Лимиты обрезки входных текстов
- Файл: `backend/src/utils/text.js`
- Функция: `smartTrim(text, limit)`
- Где: аргументы `limit` в роуте (напр. `smartTrim(req.body.resumeText, 8000)`)

## Форматы JSON-ответов по чекам
- Файл: `backend/src/promptTemplates.js`
- Разделы: `// ATS ONLY`, `// GRADE ONLY`, `// Combo`, и т.п.
- Меняйте поля и **синхронизируйте** это с UI-типами в `RequestButtons.tsx`.

## Добавить новый чек
1) `promptTemplates.js`: `sysX`, `userX` (описать строгий JSON).
2) `aiRoutes.js`: `POST /api/x` — собрать messages, вызвать `chatJson`.
3) `RequestButtons.tsx`: добавить кнопку + тип ответа + обработчик `runX()` + вывод блока.
4) (опц.) `prompts/x.md`: документация формата.
5) Обновить `CONTRIBUTING.md` чек-листом.

## Premium-гейтинг (платный запуск)
- UI: только кнопка «Всё сразу (Premium)» — компонент `RequestButtons.tsx` (модалка).
- Backend: роут `/api/premium/oneshot` — можно повесить проверку токена/ключа.
- Якоря: `[DOCS:PREMIUM_UI]`, `[DOCS:PREMIUM_BACKEND]`.

## Стили кнопок/секций
- Файл: `RequestButtons.tsx`
- Ищите классы Tailwind `bg-*-600` — можно централизовать в `frontend/theme.ts`.
