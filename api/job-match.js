// api/job-match.js — LLM-backed resume vs JD matching (CommonJS)
const { readJson, parseJsonFromText } = require('./_utils');
const { chatLLM } = require('./_llm');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow','POST'); return res.status(405).json({ error: 'Method Not Allowed' }); }
  try {
    const { resumeText = '', vacancyText = '', language = 'ru', messages } = await readJson(req);

    const finalMessages = Array.isArray(messages) && messages.length ? messages : [
      { role: 'system', content: 'You are an assistant that compares a resume with a job description. Return STRICT JSON only. Schema: {"match_score": number 0-100, "overlap_keywords": string[], "missing_keywords": string[], "summary": string}.' },
      { role: 'user', content: `Language: ${language}\nTask: Compare resume and job description; extract keywords and compute a rough match score. Output the JSON schema exactly.\n\nResume:\n${resumeText}\n\nJob Description:\n${vacancyText}\n\nConstraints:\n- Use only information provided.\n- "overlap_keywords" and "missing_keywords" should be deduplicated and concise.` }
    ];

    const { content } = await chatLLM({ messages: finalMessages, temperature: 0.2, maxTokens: 800 });
    const json = parseJsonFromText(content);

    const result = {
      match_score: Math.max(0, Math.min(100, Number(json.match_score) || 0)),
      overlap_keywords: Array.isArray(json.overlap_keywords) ? [...new Set(json.overlap_keywords)] : [],
      missing_keywords: Array.isArray(json.missing_keywords) ? [...new Set(json.missing_keywords)] : [],
      summary: typeof json.summary === 'string' ? json.summary : ''
    };

    return res.status(200).json({ ok: true, ...result });
  } catch (e) {
    return res.status(400).json({ ok: false, error: String(e?.message || e) });
  }
};


