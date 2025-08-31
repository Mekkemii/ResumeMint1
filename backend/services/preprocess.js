const { estimateTokens } = require('../utils/tokens');

/**
 * Подготавливает текст для анализа с только нормализацией (без ужатия)
 * @param {string} text - исходный текст
 * @param {string} kind - тип текста ("resume" или "jd")
 * @returns {Object} информация о предобработке
 */
function normalizeOnly(text) {
  return (text || "").replace(/\r/g, "\n").trim();
}

async function prepareText(text, kind) {
  const originalTokens = estimateTokens(text || "");
  const normalized = normalizeOnly(text);

  // защита от переполнения контекста — лучше честно сказать пользователю
  const limit = Number(process.env.CONTEXT_LIMIT_TOKENS || 100000);
  if (estimateTokens(normalized) > limit) {
    const err = new Error("Слишком большой текст: сократите резюме/вакансию или отправьте частями.");
    err.status = 413;
    throw err;
  }

  return {
    originalTokens,
    finalTokens: estimateTokens(normalized),
    condensed: false,
    method: "none",
    text: normalized,
  };
}

module.exports = { prepareText };
