// api/all.js — orchestrate evaluate + match + cover (with safe fallbacks)
const { Readable } = require("stream");

function relay(fn, payload) {
  return new Promise((resolve) => {
    const req = new Readable();
    req.push(JSON.stringify(payload)); req.push(null);
    req.method = "POST";
    const res = {
      code: 200,
      status(c){ this.code = c; return this; },
      setHeader(){ return this; },
      json(obj){ resolve({ code: this.code || 200, body: obj }); }
    };
    fn(req, res);
  });
}

const MAX_BODY = 2 * 1024 * 1024;
function collectBody(req) {
  return new Promise((res, rej) => {
    let size = 0, data = "";
    req.on("data", c => { size += c.length; if (size > MAX_BODY) { rej(new Error("Body too large")); req.destroy(); } data += c.toString("utf8"); });
    req.on("end", () => res(data));
    req.on("error", rej);
  });
}

// Fallbacks if specific endpoints are absent
function fallbackEvaluate(text) {
  const lower = (text||"").toLowerCase();
  const strengths = [];
  if (/(sql|python|excel|power bi|tableau)/i.test(text)) strengths.push("Хорошая база по данным/инструментам.");
  if (/(fraud|antifraud|kyc|aml|osint|осинт|риск)/i.test(lower)) strengths.push("Релевантность antifraud/KYC/OSINT.");
  const weaknesses = [];
  if (!/достижен/i.test(lower)) weaknesses.push("Добавить достижения с цифрами (KPI, %/шт/₽).");
  if (!/англ|english/i.test(lower)) weaknesses.push("Указать уровень английского и подтверждение.");
  const ats_issues = ["Проверьте, что ключевые навыки вынесены в отдельный раздел."];
  const recommendations = ["Добавьте 1–3 проекта с измеримым результатом.", "Усилить ключевые слова по JD."];
  const grade = /lead|руководител|senior/i.test(lower) ? "Senior" : /middle|mid/i.test(lower) ? "Middle" : "Junior";
  return { summary: "Эвристический разбор (fallback).", grade, strengths, weaknesses, ats_issues, recommendations };
}

function tokenize(t){return t.toLowerCase().replace(/[^a-zа-я0-9+#./\s-]/gi," ").split(/\s+/).filter(Boolean);} 
function fallbackMatch(resume, vacancy){
  const r = new Set(tokenize(resume)); const v = tokenize(vacancy);
  const matched = v.filter(k=>r.has(k)).slice(0,80);
  const missing = v.filter(k=>!r.has(k)).slice(0,80);
  const score = Math.round(100 * matched.length / Math.max(v.length,1));
  const recommendations = [];
  if (score < 70) recommendations.push("Усилить раздел «Навыки» ключевыми словами из вакансии.");
  if (missing.length) recommendations.push("Добавить подтверждающий опыт по: " + missing.slice(0,12).join(", "));
  return { score, matched, missing, recommendations };
}

function fallbackCover(){
  return [
    "Здравствуйте!",
    "Меня заинтересовала ваша вакансия. У меня релевантный опыт и набор навыков, позволяющих быстро приносить пользу команде.",
    "Ключевые сильные стороны: SQL, аналитика данных, системное мышление.",
    "Буду рад обсудить детали и выполнить тестовое задание.",
    "С уважением, Кандидат"
  ].join("\n");
}

module.exports = async (req, res) => {
  if (req.method !== "POST") { res.setHeader("Allow","POST"); return res.status(405).json({ error:"Method not allowed" }); }
  try {
    const body = JSON.parse(await collectBody(req) || "{}");
    const resume = (body.resume || body.resumeText || "").toString();
    const vacancy = (body.vacancy || body.jobText || "").toString();
    if (!resume.trim()) return res.status(400).json({ error: "Need resume text" });

    let evaluateFn=null, matchFn=null, coverFn=null;
    try { evaluateFn = require("./analyze"); } catch(_) {}
    try { matchFn    = require("./vacancy/detailed-match"); } catch(_) {}
    try { coverFn    = require("./cover"); } catch(_) {}

    const [ev, mt, cv] = await Promise.all([
      evaluateFn ? relay(evaluateFn, { resumeText: resume }) : Promise.resolve({ code:200, body: { analysis: fallbackEvaluate(resume) } }),
      vacancy ? (matchFn ? relay(matchFn, { resumeText: resume, jobText: vacancy }) : Promise.resolve({ code:200, body: fallbackMatch(resume, vacancy) })) : Promise.resolve({ code:200, body: { score:null, matched:[], missing:[], recommendations:[] } }),
      coverFn ? relay(coverFn, { resumeText: resume, jobText: vacancy }) : Promise.resolve({ code:200, body: { letter: fallbackCover(resume, vacancy) } })
    ]);

    return res.status(200).json({ ok: true, evaluate: ev.body, match: mt.body, cover: cv.body });
  } catch (e) {
    console.error("all error:", e);
    return res.status(500).json({ error: "All failure", detail: e.message });
  }
};


