// api/_utils.js — small helpers (CommonJS)
module.exports.readJson = async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  return await new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end',  () => { try { resolve(data ? JSON.parse(data) : {}); } catch (e) { reject(e); } });
    req.on('error', reject);
  });
};

// Attempts to parse valid JSON from LLM text responses, handling fenced code blocks
module.exports.parseJsonFromText = function parseJsonFromText(txt) {
  if (!txt || typeof txt !== 'string') throw new Error('Empty LLM content');
  const direct = txt.trim();
  try { return JSON.parse(direct); } catch (e) {}

  const fence = /```json\s*([\s\S]*?)```/i.exec(txt);
  if (fence && fence[1]) {
    try { return JSON.parse(fence[1].trim()); } catch (e) {}
  }

  const first = txt.indexOf('{');
  const last  = txt.lastIndexOf('}');
  if (first !== -1 && last !== -1 && last > first) {
    const cut = txt.slice(first, last + 1);
    try { return JSON.parse(cut); } catch (e) {}
  }

  throw new Error('LLM returned non-JSON content');
};


