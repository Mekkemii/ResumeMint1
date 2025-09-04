// api/cover.js — cover letter generation (LLM if available; safe fallback)
let chat = null;
try { ({ chat } = require("../lib/llm")); } catch (_) {}

const MAX_BODY = 2 * 1024 * 1024;
function collectBody(req) {
  return new Promise((res, rej) => {
    let size = 0, data = "";
    req.on("data", c => { size += c.length; if (size > MAX_BODY) { rej(new Error("Body too large")); req.destroy(); } data += c.toString("utf8"); });
    req.on("end", () => res(data));
    req.on("error", rej);
  });
}

function templateLetter(resumeText, vacancyText) {
  const points = [];
  if (/sql/i.test(resumeText)) points.push("SQL");
  if (/python/i.test(resumeText)) points.push("Python");
  if (/(fraud|antifraud|kyc|aml|osint|осинт)/i.test(resumeText)) points.push("antifraud/KYC/OSINT");
  if (/excel|power bi|tableau/i.test(resumeText)) points.push("визуализация и отчётность");
  return [
    "Здравствуйте!",
    "Меня заинтересовала ваша вакансия. На основании моего опыта считаю, что могу быстро приносить пользу команде.",
    "",
    "Ключевые сильные стороны:",
    "— " + (points.length ? points.join("; ") : "быстрое обучение, ответственность, системное мышление"),
    "",
    "Буду рад обсудить детали и выполнить тестовое задание.",
    "С уважением, Кандидат"
  ].join("\n");
}

module.exports = async (req, res) => {
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ error: "Method not allowed" }); }
  try {
    const body = JSON.parse(await collectBody(req) || "{}");
    const resume = (body.resume || body.resumeText || "").toString();
    const vacancy = (body.vacancy || body.jobText || "").toString();

    if (chat && process.env.OPENAI_API_KEY) {
      try {
        const prompt = [
          { role: "system", content: "Ты карьерный консультант. Напиши краткое, структурированное сопроводительное письмо на русском (130–200 слов), без воды, по фактам из резюме. Стиль — профессиональный, дружелюбный. Верни ТОЛЬКО текст письма." },
          { role: "user", content: `Резюме:\n${resume}\n\nВакансия (если есть):\n${vacancy}` }
        ];
        const out = await chat(prompt, { max_tokens: 450, temperature: 0.5 });
        if (out && out.trim()) return res.status(200).json({ letter: out.trim() });
      } catch (_) { /* fallback below */ }
    }

    return res.status(200).json({ letter: templateLetter(resume, vacancy) });
  } catch (e) {
    console.error("cover error:", e);
    return res.status(500).json({ error: "Cover failure", detail: e.message });
  }
};


