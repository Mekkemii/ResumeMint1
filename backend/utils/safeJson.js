function safeExtractJson(raw) {
  if (!raw) throw new Error('empty_model_output');

  const trimmed = String(raw).trim();

  // 1) JSON как строка в кавычках — распарсим дважды
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    const once = JSON.parse(trimmed);
    return typeof once === 'string' ? JSON.parse(once) : once;
  }

  // 2) убрать кодфенсы ```json ... ```
  const noFences = trimmed
    .replace(/^```json/i, '')
    .replace(/^```/i, '')
    .replace(/```$/i, '')
    .trim();

  // 3) прямая попытка
  try { return JSON.parse(noFences); } catch (_) {}

  // 4) вырезать первую { ... последнюю }
  const start = noFences.indexOf('{');
  const end = noFences.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    const sliced = noFences.slice(start, end + 1);
    return JSON.parse(sliced);
  }

  throw new Error('non_json_output');
}

module.exports = { safeExtractJson };

/**
 * Безопасный экстрактор JSON из текста ответа модели
 * Если модель вернула текст с JSON внутри, извлекает его
 */

function safeExtractJson(txt) {
  if (!txt || typeof txt !== 'string') return null;
  
  // Вытаскиваем первый JSON-блок
  const m = txt.match(/\{[\s\S]*\}$/m) || txt.match(/\{[\s\S]*?\}/m);
  if (!m) return null;
  
  try { 
    return JSON.parse(m[0]); 
  } catch (e) { 
    console.warn('Failed to parse extracted JSON:', e.message);
    return null; 
  }
}

module.exports = { safeExtractJson };
