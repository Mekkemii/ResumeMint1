# promptTemplates.js — сводка форматов

Каждый блок имеет **system** и **user**, и **строгий формат JSON**, чтобы фронт знал контракт.

- ATS: `{ ats_score: 0-100, issues: string[] }`
- Grade: `{ grade: "Junior|Middle|Senior|Lead" }`
- Resume Analyze: `{ ats_score, issues[], grade, resume_summary, hard_skills[], soft_skills[] }`
- Job Analyze: `{ job_grade, requirements[], nice_to_have[], job_summary }`
- Match: `{ match_percent, gaps[], highlights[], explanation }`
- Cover: `{ cover_letter }`
- Combo: см. `/api/combo/summary-match`

> Меняя форматы здесь — не забудьте синхронизировать типы в `RequestButtons.tsx`.
