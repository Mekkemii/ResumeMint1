// api/_llm.js — OpenAI-compatible chat client (CommonJS)
const fetch = global.fetch || require('node-fetch');
const PROVIDER = (process.env.LLM_PROVIDER || 'openai').toLowerCase();

const MODEL_ALIASES = {
  '3.5turbo':      { openai: 'gpt-3.5-turbo',    openrouter: 'openai/gpt-3.5-turbo' },
  'gpt-3.5-turbo': { openai: 'gpt-3.5-turbo',    openrouter: 'openai/gpt-3.5-turbo' },
  '4o-mini':       { openai: 'gpt-4o-mini',      openrouter: 'openai/gpt-4o-mini' },
  'gpt-4o-mini':   { openai: 'gpt-4o-mini',      openrouter: 'openai/gpt-4o-mini' },
  '4o':            { openai: 'gpt-4o',           openrouter: 'openai/gpt-4o' },
  'gpt-4o':        { openai: 'gpt-4o',           openrouter: 'openai/gpt-4o' }
};

function mapModel(input) {
  const key = String(input || '').toLowerCase().replace(/[\s_]/g, '');
  const alias = MODEL_ALIASES[key];
  if (alias && alias[PROVIDER]) return alias[PROVIDER];
  return input;
}

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

  const requestedModel = model || process.env.LLM_MODEL || process.env.OPENAI_MODEL || '3.5turbo';
  const resolvedModel = mapModel(requestedModel);

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
    throw new Error(`LLM error ${resp.status} (model="${resolvedModel}", provider="${PROVIDER}"): ${text || resp.statusText}`);
  }

  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content ?? data?.choices?.[0]?.text ?? '';
  return { content, raw: data };
};


