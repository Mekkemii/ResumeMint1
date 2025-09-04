// api/cover-letter.js — server-side LLM-backed cover letter endpoint (CommonJS)
const { readJson } = require('./_utils');
const { chatLLM } = require('./_llm');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { resumeText = '', vacancyText = '', language = 'ru', prompt, messages } = await readJson(req);

    const finalMessages = Array.isArray(messages) && messages.length
      ? messages
      : [
          {
            role: 'system',
            content: 'You are a helpful assistant that writes concise, ATS-friendly cover letters. Return plain text only, no markdown.'
          },
          {
            role: 'user',
            content:
`Language: ${language}
Task: Write a short (6–9 sentences) cover letter tailored to the vacancy.
Input — Resume:
${resumeText}

Input — Vacancy:
${vacancyText}

Constraints:
- No personal data leaks (phone/email/links) unless present in resumeText.
- Keep it professional, specific, and easy to paste into hh.ru/website.
- Avoid hallucinations; use only provided facts.`
          },
          ...(prompt ? [{ role: 'user', content: String(prompt) }] : [])
        ];

    const { content } = await chatLLM({ messages: finalMessages, temperature: 0.4, maxTokens: 800 });
    return res.status(200).json({ ok: true, coverLetter: content });
  } catch (e) {
    return res.status(400).json({ ok: false, error: String(e?.message || e) });
  }
};


