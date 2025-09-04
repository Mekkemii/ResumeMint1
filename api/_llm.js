// api/_llm.js — OpenAI-compatible chat client (CommonJS)
const fetch = global.fetch || require('node-fetch');

module.exports.chatLLM = async function chatLLM({ messages, temperature = 0.3, maxTokens = 1200 }) {
  const provider = process.env.LLM_PROVIDER || 'openai';
  const apiKey   = process.env.LLM_API_KEY;
  const baseUrl  = (process.env.LLM_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
  const model    = process.env.LLM_MODEL;

  if (!apiKey)  throw new Error('Missing LLM_API_KEY');
  if (!model)   throw new Error('Missing LLM_MODEL');

  const url = `${baseUrl}/chat/completions`;

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ model, temperature, max_tokens: maxTokens, messages })
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`LLM error ${resp.status}: ${text || resp.statusText}`);
  }

  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content ?? data?.choices?.[0]?.text ?? '';
  return { content, raw: data, provider };
};


