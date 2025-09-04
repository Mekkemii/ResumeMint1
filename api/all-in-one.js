// api/all-in-one.js — LLM-backed combined evaluation (CommonJS)
const { readJson, parseJsonFromText } = require('./_utils');
const { chatLLM } = require('./_llm');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow','POST'); return res.status(405).json({ error: 'Method Not Allowed' }); }
  try {
    const { resumeText = '', vacancyText = '', language = 'ru', messages, model } = await readJson(req);

    const finalMessages = Array.isArray(messages) && messages.length ? messages : [
      { role: 'system', content: 'You are an ATS/HR assistant. Return STRICT JSON only. Schema: { "resume_score": number 0-100, "issues": string[], "suggestions": string[], "vacancy_match": number 0-100, "overlap_keywords": string[], "missing_keywords": string[], "cover_letter": string }. No markdown, no extra keys.' },
      { role: 'user', content: `Language: ${language}\nTask: (1) Score the resume for ATS/HR; (2) Compare with the vacancy; (3) Draft a short cover letter (6–9 sentences).\n\nResume:\n${resumeText}\n\nVacancy:\n${vacancyText}\n\nConstraints:\n- Use only provided information.\n- Keep arrays deduplicated and concise.\n- Return JSON EXACTLY in the schema above.` }
    ];

    const { content } = await chatLLM({ messages: finalMessages, temperature: 0.25, maxTokens: 1400, model });
    const json = parseJsonFromText(content);

    const result = {
      resume_score: Math.max(0, Math.min(100, Number(json.resume_score) || 0)),
      issues: Array.isArray(json.issues) ? json.issues : [],
      suggestions: Array.isArray(json.suggestions) ? json.suggestions : [],
      vacancy_match: Math.max(0, Math.min(100, Number(json.vacancy_match) || 0)),
      overlap_keywords: Array.isArray(json.overlap_keywords) ? [...new Set(json.overlap_keywords)] : [],
      missing_keywords: Array.isArray(json.missing_keywords) ? [...new Set(json.missing_keywords)] : [],
      cover_letter: typeof json.cover_letter === 'string' ? json.cover_letter : ''
    };

    return res.status(200).json({ ok: true, ...result });
  } catch (e) {
    return res.status(400).json({ ok: false, error: String(e?.message || e) });
  }
};


