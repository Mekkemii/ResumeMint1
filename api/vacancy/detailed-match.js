// api/vacancy/detailed-match.js — heuristic detailed matching (serverless, no external deps)
const MAX_BODY = 2 * 1024 * 1024;

function collectBody(req) {
  return new Promise((res, rej) => {
    let size = 0, data = "";
    req.on("data", c => { size += c.length; if (size > MAX_BODY) { rej(new Error("Body too large")); req.destroy(); } data += c.toString("utf8"); });
    req.on("end", () => res(data));
    req.on("error", rej);
  });
}

function tokenize(t) {
  const stop = new Set(["и","в","во","на","с","со","по","о","об","от","до","за","к","из","у","для","это","что","the","a","an","of","to","in","on","with","или","но","же","не","да","—","-","/"]);
  return (t || "").toLowerCase()
    .replace(/[^a-zа-я0-9+#./\s-]/gi, " ")
    .split(/\s+/)
    .filter(w => w && !stop.has(w) && w.length > 2);
}

const unique = arr => Array.from(new Set(arr));

function summarizeText(text) {
  const lines = (text || "").trim().split(/\n+/).filter(Boolean);
  const s = lines.slice(0, 3).join(" ");
  return s.length > 300 ? s.slice(0, 297) + "…" : s || null;
}

function gradeHeuristic(text) {
  const lower = (text || "").toLowerCase();
  if (/(lead|руководител[ья]|team lead|lead[ -]?data)/i.test(lower)) return { level: "Lead", rationale: "Присутствуют маркеры руководства/лидерства" };
  if (/(senior|сеньор|старший)/i.test(lower)) return { level: "Senior", rationale: "Есть сигналы уровня Senior" };
  if (/(middle|mid|мидд?л)/i.test(lower)) return { level: "Middle", rationale: "Есть маркеры самостоятельности и опыта" };
  return { level: "Junior", rationale: "Маркетов старшего уровня не выявлено" };
}

function detailedMatch(resumeText, jobText) {
  const r = unique(tokenize(resumeText));
  const v = unique(tokenize(jobText));
  const rset = new Set(r);
  const matched = v.filter(k => rset.has(k));
  const missing = v.filter(k => !rset.has(k));
  const overall = Math.round(100 * matched.length / Math.max(v.length, 1));

  const strengths = matched.slice(0, 12).map(k => `Есть совпадение по ключу: ${k}`);
  const weaknesses = missing.slice(0, 12).map(k => `Слабое место/нет упоминания: ${k}`);
  const recommendations = [];
  if (overall < 70) recommendations.push("Усилить раздел «Навыки» ключевыми словами из вакансии.");
  if (missing.length) recommendations.push("Добавить подтверждающий опыт/проекты по: " + missing.slice(0, 12).join(", "));

  return {
    job: {
      job_summary: summarizeText(jobText),
      job_grade: gradeHeuristic(jobText),
      requirements: v.slice(0, 20)
    },
    candidate: {
      candidate_summary: summarizeText(resumeText),
      candidate_grade: gradeHeuristic(resumeText),
      key_skills: r.slice(0, 20),
      experience_summary: null
    },
    match: {
      overall_match: overall,
      grade_fit: overall >= 70 ? "соответствует" : overall >= 40 ? "частично соответствует" : "не соответствует",
      chances: overall >= 70 ? "высокие" : overall >= 40 ? "средние" : "низкие",
      strengths,
      weaknesses,
      missing_requirements: missing.slice(0, 20),
      recommendations
    },
    detailed_analysis: (v.slice(0, 25)).map(req => ({
      requirement: req,
      evidence: rset.has(req) ? `Найдено упоминание «${req}» в резюме` : null,
      status: rset.has(req) ? "полное соответствие" : "несоответствие",
      score: rset.has(req) ? 100 : 0,
      comment: rset.has(req) ? null : "Добавьте подтверждение в опыте/навыках"
    }))
  };
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const bodyRaw = await collectBody(req);
    const body = JSON.parse(bodyRaw || "{}");
    const resumeText = (body.resumeText || body.resume || "").toString();
    const jobText = (body.jobText || body.vacancy || "").toString();
    if (!resumeText.trim() || !jobText.trim()) {
      return res.status(400).json({ error: "Need resumeText and jobText" });
    }
    const result = detailedMatch(resumeText, jobText);
    return res.status(200).json(result);
  } catch (e) {
    console.error("detailed-match error:", e);
    return res.status(500).json({ error: "Detailed match failure", detail: e.message });
  }
};


