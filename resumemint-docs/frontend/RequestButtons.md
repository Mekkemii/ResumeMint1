# RequestButtons.tsx — панель действий

## Назначение
- Заменяет кнопку «Анализировать резюме» на **набор отдельных кнопок**.
- Исключает «накопление карточек»: результат каждого чека хранится **по ключу**.

## Важные стейты
- `resumeText`, `jobText` — вводы пользователя.
- `ats`, `grade`, `summary`, `job`, `match`, `cover` — результаты по ключам.
- `busy` — какой запрос сейчас выполняется.
- `matchModal`, `oneModal` — открыты модальные окна или нет.

## Внешние вызовы
- `/api/resume/ats` — `runATS()`
- `/api/resume/grade` — `runGrade()`
- `/api/resume/analyze` — `runSummary()`
- `/api/job/analyze` — `runJob()`
- `/api/match` — `doMatch()` (только из модалки «Оценка соответствия»)
- `/api/cover-letter` — `runCover()`
- `/api/combo/summary-match` — `runCombo()`
- `/api/premium/oneshot` — `doOneShot()` (только из модалки «Всё сразу»)

## Где менять тексты/цвета
- Ищите Tailwind-классы `bg-*-600` и подписи кнопок в JSX.

## Типы ответов
Синхронизируйте поля с `backend/src/promptTemplates.js`.
- `ResumeSummary`, `JobAnalyze`, `MatchResp` и т.п.

## Антишум
- Никогда не пушим результаты в массивы — только `setState` по ключу.
- Модалки гарантируют запуск **ровно одного** запроса.
