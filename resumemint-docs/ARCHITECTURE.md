# Архитектура (высокий уровень)

```
UI (React/Tailwind)
  ├─ RequestButtons (панель действий)
  ├─ Модалки (Match, OneShot)
  ├─ Секции Support/Contacts
  └─ fetch -> /api/*

Backend (Express)
  ├─ routes/aiRoutes.js
  │   ├─ POST /api/resume/ats
  │   ├─ POST /api/resume/grade
  │   ├─ POST /api/resume/analyze
  │   ├─ POST /api/job/analyze
  │   ├─ POST /api/match
  │   ├─ POST /api/cover-letter
  │   ├─ POST /api/premium/oneshot
  │   └─ POST /api/combo/summary-match   (выжимка + JD + сопоставление)
  ├─ promptTemplates.js   (тексты системных/пользовательских промптов)
  ├─ llmClient.js         (вызов OpenAI, строгий JSON, usage)
  ├─ utils/text.js        (smartTrim, makeKey)
  └─ (опц.) кэш in-memory на 15 мин

OpenAI
  └─ chat.completions (response_format=json_object)
```

## Поток «Комбо»
1) UI: `POST /api/combo/summary-match` (resumeText, jobText)
2) Backend: собирает `sysCombo + userCombo`, `max_tokens≈900`, `temperature 0.2`
3) Ответ: `{ resume:{...}, job:{...}, match:{...}, usage }`
4) UI: кладёт в `summary`, `job`, `match` — без дубликатов.
