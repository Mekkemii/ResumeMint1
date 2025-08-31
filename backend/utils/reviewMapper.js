/**
 * Маппер для приведения ответа модели к структурированному DTO
 * Безопасно парсит оценки и массивы, возвращает null вместо 0
 */

const { parseScore } = require('./score');

function toReviewDTO(model) {
  const s = model?.scores || model || {};
  const ats = model?.ats || {};

  // Берём значения по разным синонимам, но НЕ ставим 0 — только null
  const text = parseScore(s.text ?? s.text_score ?? s.content ?? s["текст"]);
  const structure = parseScore(s.structure ?? s.structure_score ?? s["структура"]);
  
  // Если overall нет — среднее из имеющихся
  let overall = parseScore(s.overall ?? s.total ?? s["общая"]);
  if (overall == null) {
    const arr = [text, structure].filter((x) => x != null);
    if (arr.length) overall = Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
  }

  const atsScore = parseScore(ats.score ?? ats.compatibility ?? ats.match ?? ats["оценка"]);
  const strengths = arr(model?.strengths || model?.pluses || [], 7);
  const gaps = arr(model?.gaps || model?.minuses || model?.issues || [], 7);
  const add = arr(model?.add || model?.todo || model?.improve || [], 7);
  const questions = arr(model?.questions || model?.followups || [], 6);

  return {
    grade: {
      level: String(model?.grade?.level || model?.grade || "Unknown"),
      rationale: model?.grade?.rationale ?? model?.rationale ?? null
    },
    scores: { text, structure, overall },
    strengths, 
    gaps, 
    add,
    ats: { score: atsScore, notes: ats?.notes ?? null },
    questions
  };
}

function arr(v, max) {
  if (Array.isArray(v)) return v.map(String).filter(Boolean).slice(0, max);
  if (typeof v === "string" && v.trim()) {
    return v.split(/\n|;|·|•/).map(s => s.trim()).filter(Boolean).slice(0, max);
  }
  return [];
}

module.exports = { toReviewDTO };
