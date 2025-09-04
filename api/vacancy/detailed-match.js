// api/vacancy/detailed-match.js — phrase-based JD extraction + matching
const MAX_BODY = 2 * 1024 * 1024;

function collectBody(req) {
  return new Promise((res, rej) => {
    let size = 0, data = "";
    req.on("data", c => { size += c.length; if (size > MAX_BODY) { rej(new Error("Body too large")); req.destroy(); } data += c.toString("utf8"); });
    req.on("end", () => res(data));
    req.on("error", rej);
  });
}

function norm(t) {
  return (t||"")
    .replace(/\r\n/g, "\n")
    .replace(/[\u2022\u2023\u25E6\u2043·•]/g, "•")
    .replace(/\t/g, "  ");
}

function splitBulletLines(block) {
  const lines = block.split("\n").map(s => s.trim()).filter(Boolean);
  const out = [];
  for (const line of lines) {
    const m = line.match(/^(?:•|[-—*]|\d+[.)])\s*(.+)/);
    if (m) {
      out.push(m[1].trim());
    } else {
      if (/[;•]/.test(line)) out.push(...line.split(/[;•]/).map(s=>s.trim()).filter(Boolean));
      else if (/\.\s/.test(line)) out.push(...line.split(/\.\s+/).map(s=>s.trim()).filter(Boolean));
      else out.push(line);
    }
  }
  return out
    .map(s => s.replace(/\s{2,}/g, " ").replace(/^[—\-*]\s*/, "").trim())
    .filter(s => s.length >= 3)
    .filter(s => !/^\d{1,3}\s?\d{3}\s?(?:₽|р|руб)/i.test(s));
}

function captureSection(txt, headRe, stopRe) {
  const m = txt.match(headRe);
  if (!m) return [];
  const start = m.index + m[0].length;
  const tail = txt.slice(start);
  const stop = tail.search(stopRe);
  const chunk = stop === -1 ? tail : tail.slice(0, stop);
  return splitBulletLines(chunk);
}

function extractJD(raw) {
  const t = norm(raw);
  const headReq = /(?:^|\n)\s*(требования|что требуется|мы ожидаем)\s*:?\s*\n/i;
  const headNice= /(?:^|\n)\s*(будет плюсом|преимуществом|плюсом)\s*:?\s*\n/i;
  const headResp= /(?:^|\n)\s*(обязанности|что делать|задачи)\s*:?\s*\n/i;
  const stopHead = /(?:^|\n)\s*(будет плюсом|преимуществом|плюсом|обязанности|задачи|условия|о вас|мы предлагаем|компания|описание)\s*:?\s*\n/i;

  const requirements = captureSection(t, headReq, stopHead);
  const nice_to_have = captureSection(t, headNice, stopHead);
  const responsibilities = captureSection(t, headResp, stopHead);

  let fallback = [];
  if (!requirements.length && !nice_to_have.length && !responsibilities.length) {
    fallback = splitBulletLines(t);
  }

  const level =
    /(?:3|\b3\+|\b4|\b5)\s*год/i.test(t) || /senior|lead/i.test(t) ? "Senior" :
    /(?:2|\b2\+)\s*год/i.test(t) || /middle/i.test(t) ? "Middle" : "Junior";

  const firstStop = t.search(stopHead);
  const description = (firstStop > 0 ? t.slice(0, firstStop) : t)
    .split("\n").map(s=>s.trim()).filter(Boolean).slice(0,2).join(" ");

  return { description, level, requirements, nice_to_have, responsibilities, fallback };
}

function toWords(s) { return s.toLowerCase().replace(/[^a-zа-я0-9+\/#. ]/gi, " ").split(/\s+/).filter(Boolean); }
function phraseMatch(resumeLower, phrase) {
  if (resumeLower.includes(phrase.toLowerCase())) return true;
  const words = toWords(phrase).filter(w => w.length > 2);
  return words.length && words.every(w => resumeLower.includes(w));
}

function buildMatch(resume, jd) {
  const resumeLower = (resume||"").toLowerCase();
  const universe = [...jd.requirements, ...jd.nice_to_have, ...jd.responsibilities];
  const source = universe.length ? universe : jd.fallback;
  const matched = [], missing = [];
  for (const p of source) (phraseMatch(resumeLower, p) ? matched : missing).push(p);
  const score = Math.round(100 * matched.length / Math.max(source.length, 1));
  const recommendations = [];
  if (score < 70) recommendations.push("Подсветить в резюме фразы из JD (точные формулировки).");
  if (missing.length) recommendations.push("Добавить опыт/примеры по пунктам: " + missing.slice(0,8).join("; "));
  return { score, matched, missing, recommendations };
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
    if (!resumeText.trim() || !jobText.trim()) return res.status(400).json({ error: "Need resumeText and jobText" });

    const jd = extractJD(jobText);
    const m = buildMatch(resumeText, jd);
    return res.status(200).json({
      job: {
        job_summary: jd.description,
        job_grade: { level: jd.level, rationale: "Эвристика по формулировкам и стажу" },
        requirements: jd.requirements,
        nice_to_have: jd.nice_to_have,
        responsibilities: jd.responsibilities
      },
      candidate: { candidate_summary: null, candidate_grade: null, key_skills: [], experience_summary: null },
      match: {
        overall_match: m.score,
        grade_fit: m.score >= 70 ? "соответствует" : m.score >= 40 ? "частично соответствует" : "не соответствует",
        chances: m.score >= 70 ? "высокие" : m.score >= 40 ? "средние" : "низкие",
        strengths: m.matched.slice(0,12),
        weaknesses: m.missing.slice(0,12).map(x=>`Нет подтверждения: ${x}`),
        missing_requirements: m.missing,
        recommendations: m.recommendations
      },
      detailed_analysis: (jd.requirements.length ? jd.requirements : jd.fallback).slice(0,25).map(req => ({
        requirement: req,
        evidence: phraseMatch((resumeText||"").toLowerCase(), req) ? `Найдено упоминание «${req}»` : null,
        status: phraseMatch((resumeText||"").toLowerCase(), req) ? "полное соответствие" : "несоответствие",
        score: phraseMatch((resumeText||"").toLowerCase(), req) ? 100 : 0,
        comment: phraseMatch((resumeText||"").toLowerCase(), req) ? null : "Добавьте формулировку/пример в опыт"
      }))
    });
  } catch (e) {
    console.error("detailed-match error:", e);
    return res.status(500).json({ error: "Detailed match failure", detail: e.message });
  }
};


