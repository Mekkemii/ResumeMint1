// ===== CONDENSE RESUME (экстрактивная ужимка) =====
export const sysCondenseResume = `Ты — парсер резюме. Извлекай факты без интерпретаций. Возвращай ТОЛЬКО валидный JSON.`;

export const userCondenseResume = (resumeText) => `
Нормализуй резюме. НЕ придумывай — используй точные слова из резюме
(тех стэк, аббревиатуры, названия компаний, цифры, метрики).

ФОРМАТ:
{
  "headline": "позиционирование (<=120)",
  "years_total": number,
  "experience": [
    {
      "company": "…",
      "role": "…",
      "start": "YYYY-MM",
      "end": "YYYY-MM|Present",
      "domain": "fintech|ecom|…",
      "stack": ["Python","SQL","KYC","AML", "..."],
      "highlights": ["достижения с цифрами (экстрактивно)"]
    }
  ],
  "skills": { "hard": ["SQL","Python"], "soft": ["Коммуникация"] },
  "education": [{ "degree":"…", "org":"…", "year": 2020 }],
  "languages": ["EN B2","RU C2"],
  "links": ["github.com/...","linkedin.com/in/..."]
}

РЕЗЮМЕ:
${resumeText}
`;

// ===== ОЦЕНКА РЕЗЮМЕ (HR + Grade + ATS) =====
export const sysResumeReview = `Ты — эксперт по резюме, ATS и грейдам. Отвечай ТОЛЬКО валидным JSON.`;

export const userResumeReview = (reviewInput) => `
ЗАДАЧА:
1) Оцени качество и структуру резюме (кратко).
2) Определи грейд кандидата и обоснуй.
3) Дай ATS-срез: общий балл и главные проблемы (3–7).
4) Сформируй списки: strengths (сильные), issues (недочёты), add (что добавить).
5) Дай 3–6 уточняющих вопросов.

ФОРМАТ (строго JSON):
{
  "grade": { "level": "Junior|Middle|Senior|Lead", "rationale": "<=300" },
  "scores": { "writing": 0-100, "structure": 0-100, "overall": 0-100 },
  "ats": { "ats_score": 0-100, "issues": ["..."] },
  "strengths": ["..."],
  "issues": ["..."],
  "add": ["..."],
  "questions": ["..."]
}

ВХОДНЫЕ ДАННЫЕ (компактное резюме или сырой текст):
${reviewInput}
`;
