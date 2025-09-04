// api/_llm.js — OpenAI-compatible chat client (CommonJS)
const fetch = global.fetch || require('node-fetch');

module.exports.chatLLM = async function chatLLM({ messages, temperature = 0.3, maxTokens = 1200, model }) {
  // Support multiple env names to reduce misconfig headaches
  const apiKey =
    process.env.LLM_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.OPENROUTER_API_KEY ||
    process.env.ANTHROPIC_API_KEY;

  const baseUrl = (
    process.env.LLM_BASE_URL ||
    process.env.OPENAI_BASE_URL ||
    process.env.OPENROUTER_BASE_URL ||
    'https://api.openai.com/v1'
  ).replace(/\/$/, '');

  const resolvedModel = model || process.env.LLM_MODEL || process.env.OPENAI_MODEL || '3.5turbo';

  if (!apiKey) {
    throw new Error('Missing API key (checked: LLM_API_KEY, OPENAI_API_KEY, OPENROUTER_API_KEY, ANTHROPIC_API_KEY)');
  }
  // resolvedModel always has a fallback

  const url = `${baseUrl}/chat/completions`;

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ model: resolvedModel, temperature, max_tokens: maxTokens, messages })
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`LLM error ${resp.status}: ${text || resp.statusText}`);
  }

  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content ?? data?.choices?.[0]?.text ?? '';
  return { content, raw: data };
};


