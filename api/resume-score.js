// api/resume-score.js — LLM-backed resume evaluation (CommonJS)
const { readJson, parseJsonFromText } = require('./_utils');
const { chatLLM } = require('./_llm');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow','POST'); return res.status(405).json({ error: 'Method Not Allowed' }); }
  try {
    const { resumeText = '', language = 'ru', messages, model } = await readJson(req);

    const finalMessages = Array.isArray(messages) && messages.length ? messages : [
      { role: 'system', content: 'You are an ATS resume reviewer. Return STRICT JSON only. Schema: {"score": number 0-100, "issues": string[], "suggestions": string[], "highlights": string[]}. No markdown, no commentary, no extra fields.' },
      { role: 'user', content: `Language: ${language}\nTask: Evaluate the resume for ATS/HR quality and completeness. Output the JSON schema exactly.\n\nResume:\n${resumeText}` }
    ];

    const { content } = await chatLLM({ messages: finalMessages, temperature: 0.2, maxTokens: 700, model });
    const json = parseJsonFromText(content);

    const result = {
      score: Math.max(0, Math.min(100, Number(json.score) || 0)),
      issues: Array.isArray(json.issues) ? json.issues : [],
      suggestions: Array.isArray(json.suggestions) ? json.suggestions : [],
      highlights: Array.isArray(json.highlights) ? json.highlights : []
    };

    return res.status(200).json({ ok: true, ...result });
  } catch (e) {
    return res.status(400).json({ ok: false, error: String(e?.message || e) });
  }
};


