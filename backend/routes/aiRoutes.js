import { Router } from "express";
import { chatJson } from "../services/openaiService.js";
import { smartTrim } from "../services/fileService.js";
import {
  sysCondenseResume, userCondenseResume,
  sysResumeReview,  userResumeReview
} from "../services/promptTemplates.js";

const router = Router();

// Экстрактивная ужимка
router.post("/resume/condense", async (req, res) => {
  try {
    const resumeText = smartTrim(req.body.resumeText || "", 12000);
    const { json, usage } = await chatJson({
      messages: [
        { role: "system", content: sysCondenseResume },
        { role: "user",   content: userCondenseResume(resumeText) }
      ],
      max_tokens: 700,
      temperature: 0.1
    });
    res.json({ ...json, usage });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Объединённая оценка (HR + Grade + ATS).
// Принимает либо resumeText, либо condensed (JSON от /resume/condense).
router.post("/resume/review", async (req, res) => {
  try {
    const { resumeText, condensed } = req.body;

    let reviewInput;
    if (condensed) {
      const c = condensed;
      reviewInput = `
HEADLINE: ${c.headline || ""}
YEARS: ${c.years_total || 0}

SKILLS_HARD: ${Array.isArray(c.skills?.hard) ? c.skills.hard.join(", ") : ""}
SKILLS_SOFT: ${Array.isArray(c.skills?.soft) ? c.skills.soft.join(", ") : ""}

EXPERIENCE:
${(c.experience || []).map(e =>
  `- ${e.role} @ ${e.company} (${e.start}–${e.end}) [${(e.stack||[]).join(", ")}]
  ${ (e.highlights||[]).map(h=>"  • "+h).join("\n") }`
).join("\n")}

EDUCATION: ${(c.education||[]).map(x=>`${x.degree} ${x.org} (${x.year||""})`).join("; ")}
LANGUAGES: ${(c.languages||[]).join(", ")}
LINKS: ${(c.links||[]).join(", ")}
`.trim();
    } else {
      reviewInput = smartTrim(resumeText || "", 9000);
    }

    const { json, usage } = await chatJson({
      messages: [
        { role: "system", content: sysResumeReview },
        { role: "user",   content: userResumeReview(reviewInput) }
      ],
      max_tokens: 700,
      temperature: 0.2
    });
    res.json({ ...json, usage });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
