/**
 * Основной файл сервера ResumeMint.ru
 * Настройка Express сервера с middleware и маршрутами
 */

// Обработка необработанных ошибок
process.on('uncaughtException', (error) => {
  console.error('Необработанная ошибка:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Необработанное отклонение промиса:', reason);
  process.exit(1);
});

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const mammoth = require('mammoth');
const path = require('path');
const fs = require('fs').promises;
const OpenAI = require('openai');
const { prepareText } = require('./services/preprocess');
const { detectExperience, injectExperienceMarkers } = require('./utils/experience');
const { safeExtractJson } = require('./utils/safeJson');
const { toReviewDTO } = require('./utils/reviewMapper');
const { evaluateResumeStructured } = require('./services/openaiStructured');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Инициализация OpenAI
console.log('=== INITIALIZATION DEBUG ===');
console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
console.log('OPENAI_API_KEY length:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0);
console.log('===========================');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here'
});

// ===== Безопасная обработка ошибок OpenAI (маскировка ключей) =====
function maskApiKeys(text) {
  if (!text) return '';
  try {
    return String(text).replace(/sk-[A-Za-z0-9_\-]{10,}/g, 'sk-****');
  } catch (_) {
    return 'Ошибка';
  }
}

function sanitizeOpenAIError(error) {
  const status = error?.status || error?.response?.status || 500;
  let message = error?.message || 'Ошибка внешнего AI сервиса';
  message = maskApiKeys(message);

  if (status === 401) {
    message = 'Неверный или отсутствует OpenAI API ключ. Проверьте backend/.env.';
  } else if (status === 429) {
    message = 'Превышен лимит OpenAI API (429). Попробуйте позже.';
  } else if (status === 400) {
    message = 'Некорректный запрос к AI модели (400).';
  } else if (status >= 500) {
    message = 'Внешний AI сервис временно недоступен. Попробуйте позже.';
  }

  return { status: status || 500, message };
}

function respondModelError(res, error) {
  const { status, message } = sanitizeOpenAIError(error);
  return res.status(status).json({ error: message });
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from the parent directory
app.use(express.static(path.join(__dirname, '..')));

// Serve index.html for the root route
app.get('/', (req, res) => {
    console.log('Запрос к корневой странице');
    const indexPath = path.join(__dirname, '..', 'index.html');
    console.log('Путь к index.html:', indexPath);
    res.sendFile(indexPath, (err) => {
        if (err) {
            console.error('Ошибка отправки index.html:', err);
            res.status(500).send('Ошибка загрузки страницы');
        } else {
            console.log('index.html отправлен успешно');
        }
    });
});

// Mount unified analyzer route
try {
  const analyzeRouter = require('./routes/analyze');
  app.use('/api', analyzeRouter);
} catch (e) {
  console.warn('Analyze route not mounted:', e?.message);
}

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `resume-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
    'application/pdf'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Неподдерживаемый тип файла. Разрешены: .docx, .doc, .txt, .pdf'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1
  }
});

// Memory upload for quick .docx parsing
const uploadMemory = multer({ storage: multer.memoryStorage(), limits: { fileSize: 4 * 1024 * 1024, files: 1 } });

// Простая функция для извлечения текста из файла
async function extractTextFromFile(file) {
  const filePath = file.path;
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (ext === '.txt') {
    return await fs.readFile(filePath, 'utf8');
  } else if (ext === '.pdf') {
    // Для PDF возвращаем заглушку, так как нужна библиотека pdf-parse
    return `[PDF файл: ${file.originalname}] Содержимое PDF файла будет извлечено при полной настройке.`;
  } else if (ext === '.docx' || ext === '.doc') {
    // Для Word файлов возвращаем заглушку
    return `[Word файл: ${file.originalname}] Содержимое Word файла будет извлечено при полной настройке.`;
  }
  
  return 'Неизвестный формат файла';
}

// ===== Helper: compact JSON chat =====
async function chatJson(messages, options = {}) {
  // Валидация входных данных
  if (!Array.isArray(messages) || messages.length === 0) {
    console.error('chatJson: invalid messages array:', messages);
    throw new Error('Invalid messages array');
  }
  
  // Проверяем, что все сообщения имеют content
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (!msg || typeof msg !== 'object' || !msg.content || typeof msg.content !== 'string') {
      console.error(`chatJson: invalid message at index ${i}:`, msg);
      throw new Error(`Invalid message at index ${i}: content must be a string`);
    }
  }
  
  const model = options.model || 'gpt-3.5-turbo';
  const maxTokens = options.max_tokens || 800;
  const temperature = options.temperature ?? 0.2;
  
  console.log('chatJson: sending request with', messages.length, 'messages');
  
  const completion = await openai.chat.completions.create({
    model,
    messages,
    temperature,
    max_tokens: maxTokens
  });
  const raw = completion.choices?.[0]?.message?.content || '{}';
  // Try fenced JSON first
  let candidate = raw;
  const fence = raw.match(/```json[\s\S]*?```/i);
  if (fence) candidate = fence[0].replace(/```json/i, '').replace(/```/, '').trim();
  // Fallback to first { .. }
  if (!fence) {
    const m = raw.match(/\{[\s\S]*\}/);
    if (m) candidate = m[0];
  }
  try {
    return { json: JSON.parse(candidate), usage: completion.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 } };
  } catch (_) {
    return { json: { _raw: raw }, usage: completion.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 } };
  }
}

// ===== Prompt templates (short, token-friendly) =====
function sysResumeAnalyze() {
  return 'Ты — эксперт по резюме/ATS/IT-грейдам. Отвечай ТОЛЬКО JSON.';
}
function userResumeAnalyze(resumeText) {
  return `ЗАДАЧА:\n1) Краткая структурная проверка.\n2) ATS-дружелюбность.\n3) Грейд (Junior/Middle/Senior/Lead).\n4) Дай короткое summary резюме (<=1200 символов).\nФОРМАТ:\n{\n  "ats_score": 0,\n  "issues": [],\n  "grade": "Junior|Middle|Senior|Lead",\n  "resume_summary": "",\n  "hard_skills": [],\n  "soft_skills": []\n}\nРЕЗЮМЕ:\n${resumeText}`;
}

function sysJobAnalyze() { return 'Ты — консультант по анализу вакансий. ТОЛЬКО JSON.'; }
function userJobAnalyze(jobText) {
  return `ЗАДАЧА: выдели требования/обязанности (5-12), оцени грейд.\nФОРМАТ:\n{\n  "job_grade": "Junior|Middle|Senior|Lead",\n  "requirements": [],\n  "nice_to_have": [],\n  "job_summary": ""\n}\nВАКАНСИЯ:\n${jobText}`;
}

function sysMatch() { return 'Ты — эксперт по найму. Сопоставляешь skills и требования. ТОЛЬКО JSON.'; }
function userMatch(resumeSummary, jobSummary, resumeSkills, jobReqs) {
  return `ФОРМАТ:\n{\n  "match_percent": 0,\n  "gaps": [],\n  "highlights": [],\n  "explanation": ""\n}\nДАНО:\n- РЕЗЮМЕ: ${resumeSummary}\n- НАВЫКИ: ${JSON.stringify(resumeSkills)}\n- ВАКАНСИЯ summary: ${jobSummary}\n- ВАКАНСИЯ requirements: ${JSON.stringify(jobReqs)}`;
}

function sysCover() { 
  return `Всегда отвечай на русском языке. 
Возвращай только текст сопроводительного письма без служебных пояснений.
Ты — генератор сопроводительных писем. ТОЛЬКО JSON.`; 
}
function userCover(resumeSummary, jobSummary, tone) {
  return `Сформируй короткое сопроводительное (110-160 слов), тон: ${tone || 'профессиональный'}.\nФОРМАТ: { "cover_letter": "..." }\nДАНО:\n- РЕЗЮМЕ: ${resumeSummary}\n- ВАКАНСИЯ: ${jobSummary}`;
}

function sysPremium() { return 'Ты — эксперт по резюме/ATS/матчингу. ТОЛЬКО ОДИН JSON.'; }
function userPremium(resumeText, jobText) {
  return `Сделай: (1) резюме {ats_score, issues, grade, resume_summary, hard_skills, soft_skills}; (2) вакансия {job_grade, requirements, nice_to_have, job_summary}; (3) match {match_percent, gaps, highlights, explanation}; (4) cover_letter (110-160 слов). Верни один JSON по схеме.\nРЕЗЮМЕ:\n${resumeText}\nВАКАНСИЯ:\n${jobText}`;
}

// Combo (summary + job analyze + match) minimal prompt
function sysCombo() { return 'Ты — карьерный ассистент. Отвечай ТОЛЬКО валидным JSON.'; }
function userCombo(resumeText, jobText) {
  return `ЗАДАЧА:\n1) Выжимка резюме: кратко (<=800 символов) и до 12 hard_skills.\n2) Разбор вакансии: requirements (5–12 пунктов) и job_summary (<=600).\n3) Сопоставление: match_percent (0–100), highlights, gaps, explanation (<=300).\nФОРМАТ:\n{\n  "resume": { "resume_summary": "<=800", "hard_skills": [] },\n  "job": { "requirements": [], "job_summary": "<=600" },\n  "match": { "match_percent": 0, "highlights": [], "gaps": [], "explanation": "" }\n}\n\nРЕЗЮМЕ:\n${resumeText}\n\nВАКАНСИЯ:\n${jobText}`;
}

// Детальный матчинг вакансии с подробной обратной связью
function sysDetailedMatch() { 
  return `Ты — опытный HR-специалист и карьерный консультант. 
Анализируй соответствие резюме требованиям вакансии максимально детально.
Всегда отвечай на русском языке. Строго возвращай данные только в указанном JSON-формате.
Ключи JSON — на английском, содержимое — на русском.`; 
}

function userDetailedMatch(resumeText, jobText) {
  return `ЗАДАЧА: Детальный анализ соответствия резюме требованиям вакансии

1) АНАЛИЗ ВАКАНСИИ:
   - job_summary: краткое описание позиции (<=400 символов)
   - requirements: основные требования (5-15 пунктов)
   - nice_to_have: желательные навыки (0-8 пунктов)
   - job_grade: требуемый уровень (Junior|Middle|Senior|Lead) + обоснование

2) АНАЛИЗ РЕЗЮМЕ:
   - candidate_summary: краткое описание кандидата (<=400 символов)
   - candidate_grade: уровень кандидата + обоснование
   - key_skills: ключевые навыки из резюме
   - experience_summary: краткое описание опыта

3) ДЕТАЛЬНОЕ СОПОСТАВЛЕНИЕ:
   - overall_match: общий процент соответствия (0-100)
   - grade_fit: "ниже требуемого" | "соответствует" | "выше требуемого"
   - chances: "Высокие" | "Средние" | "Низкие"
   - strengths: сильные стороны кандидата для этой позиции
   - weaknesses: слабые стороны и недостатки
   - missing_requirements: чего не хватает кандидату
   - recommendations: конкретные рекомендации для улучшения

4) ПОСТРОЧНЫЙ АНАЛИЗ ТРЕБОВАНИЙ:
   - requirement: требование из вакансии
   - evidence: доказательства из резюме (или "не найдено")
   - status: "полное соответствие" | "частичное соответствие" | "не соответствует"
   - score: оценка 0-100 для каждого требования
   - comment: подробный комментарий с объяснением

ФОРМАТ (строго JSON):
{
  "job": {
    "job_summary": "<=400",
    "requirements": ["..."],
    "nice_to_have": ["..."],
    "job_grade": { "level": "Junior|Middle|Senior|Lead", "rationale": "<=200" }
  },
  "candidate": {
    "candidate_summary": "<=400",
    "candidate_grade": { "level": "Junior|Middle|Senior|Lead", "rationale": "<=200" },
    "key_skills": ["..."],
    "experience_summary": "<=300"
  },
  "match": {
    "overall_match": 0,
    "grade_fit": "ниже требуемого|соответствует|выше требуемого",
    "chances": "Высокие|Средние|Низкие",
    "strengths": ["..."],
    "weaknesses": ["..."],
    "missing_requirements": ["..."],
    "recommendations": ["..."]
  },
  "detailed_analysis": [
    {
      "requirement": "...",
      "evidence": "...",
      "status": "полное соответствие|частичное соответствие|не соответствует",
      "score": 0,
      "comment": "<=200"
    }
  ]
}

РЕЗЮМЕ:
${resumeText}

ВАКАНСИЯ:
${jobText}`;
}

// ===== МАТЧИНГ ВАКАНСИИ (JD-анализ + требуемый грейд + сопоставление) =====
function sysJobCompare() { 
  return `Всегда отвечай на русском языке. 
Строго возвращай данные только в указанном JSON-формате (ключи схемы на английском, содержимое по-русски).
Ты — карьерный ассистент и рекрутер. Отвечай ТОЛЬКО валидным JSON.`; 
}
function userJobCompare(resumeText, jobText) {
  return `ЗАДАЧА:
1) Разбери вакансию (JD): краткое summary, "requirements" (5–12), "nice_to_have" (0–8).
2) Определи требуемый грейд по JD: job_grade.level (Junior|Middle|Senior|Lead) + краткое rationale (<=300).
3) Сопоставь JD и резюме:
   - match_percent (0–100),
   - grade_fit: "ниже" | "соответствие" | "выше" (уровень кандидата относительно требуемого),
   - chances: "High" | "Medium" | "Low",
   - highlights[], gaps[],
   - mapping[] — построчный мэппинг требований JD на факты из резюме:
     [{ "requirement":"...", "evidence":"...", "status":"full|partial|miss", "comment":"кратко" }].

ФОРМАТ (строго JSON):
{
  "job": {
    "job_summary": "<=600",
    "requirements": ["..."],
    "nice_to_have": ["..."],
    "job_grade": { "level": "Junior|Middle|Senior|Lead", "rationale": "<=300" }
  },
  "match": {
    "match_percent": 0,
    "grade_fit": "ниже|соответствие|выше",
    "chances": "High|Medium|Low",
    "highlights": ["..."],
    "gaps": ["..."],
    "mapping": [
      { "requirement":"...", "evidence":"...", "status":"full|partial|miss", "comment":"..." }
    ]
  }
}

РЕЗЮМЕ (сырой текст или краткая выжимка):
${resumeText}

ВАКАНСИЯ (JD):
${jobText}`;
}

// ===== ATS / Grade short prompts =====
function sysAts() { return 'Ты — эксперт по ATS. Верни только JSON.'; }
function userAts(resumeText) {
  return `Проверь резюме под ATS. ФОРМАТ: { "ats_score": 0-100, "issues": ["..."] }\nРЕЗЮМЕ:\n${resumeText}`;
}
function sysGrade() { return 'Ты — эксперт по грейдам. Верни только JSON.'; }
function userGrade(resumeText) {
  return `Определи грейд кандидата (Junior|Middle|Senior|Lead) по опыту/навыкам/самостоятельности. ФОРМАТ: { "grade": "Junior|Middle|Senior|Lead" }\nРЕЗЮМЕ:\n${resumeText}`;
}

// ===== CONDENSE RESUME (экстрактивная ужимка) =====
function sysCondenseResume() { return 'Ты — парсер резюме. Извлекай факты без интерпретаций. Возвращай ТОЛЬКО валидный JSON.'; }
function userCondenseResume(resumeText) {
  return `Нормализуй резюме. НЕ придумывай — используй точные слова из резюме
(тех стэк, аббревиатуры, названия компаний, цифры, метрики).

ФОРМАТ:
{
  "headline": "позиционирование (<=120)",
  "years_total": number,
  "experience": [
    {
      "company": "…",
      "role": "…",
      "start": "YYYY-MM",
      "end": "YYYY-MM|Present",
      "domain": "fintech|ecom|…",
      "stack": ["Python","SQL","KYC","AML", "..."],
      "highlights": ["достижения с цифрами (экстрактивно)"]
    }
  ],
  "skills": { "hard": ["SQL","Python"], "soft": ["Коммуникация"] },
  "education": [{ "degree":"…", "org":"…", "year": 2020 }],
  "languages": ["EN B2","RU C2"],
  "links": ["github.com/...","linkedin.com/in/..."]
}

РЕЗЮМЕ:
${resumeText}`;
}

// ===== ОЦЕНКА РЕЗЮМЕ (HR + Grade + ATS) =====
function sysResumeReview() {
  return `Всегда отвечай на русском языке СОДЕРЖИМОМ, НО ключи JSON — строго на английском.
Строго возвращай данные только в указанном JSON-формате.

Политика доказательств:
- Делай выводы только по фактам из текста.
- Никогда не пиши «нет опыта работы», если это явно не сказано. Если раздел/описание опыта не найдено, пиши: «в тексте не найдено описание опыта/ролей».
- Если есть хотя бы косвенные признаки опыта (должности, компании, годы, проекты, стажировки, подработки) — перечисли и используй в оценке.
- Если факт не подтверждён текстом — помечай «не указано», а не делай догадок.

Верни РОВНО такой JSON (без текста вокруг):

{
  "grade": { "level": "Junior|Middle|Senior|Lead", "rationale": "..." },
  "scores": { "text": 0-100, "structure": 0-100, "overall": 0-100 },
  "strengths": ["..."],
  "gaps": ["..."],
  "add": ["..."],
  "ats": { "score": 0-100, "notes": "..." },
  "questions": ["..."]
}

Ты — эксперт по резюме, ATS и грейдам. Отвечай ТОЛЬКО валидным JSON.`;
}
function userResumeReview(reviewInput, evidence) {
  if (!reviewInput || typeof reviewInput !== 'string') {
    console.error('userResumeReview: invalid input:', reviewInput);
    return 'Ошибка: неверные входные данные для анализа резюме';
  }
  
  // Добавляем инструкции по распознаванию HH-структуры и маркеров опыта
  const hhInstructions = `
ВАЖНО: Это резюме кандидата (возможны маркеры [EXPERIENCE]...[/EXPERIENCE] вокруг блоков опыта и структура HH):
- Сначала определи явные блоки опыта: 'Опыт работы/Карьера/Проекты/Практика/Фриланс/Консалтинг/Подработка' и т.п.
- Если видишь маркеры [EXPERIENCE]...[/EXPERIENCE], считай эти части опытом.
- Заголовок 'Специализации' — это не опыт.
- Даты вида 'ММ.ГГГГ — н.в.' интерпретируй как период работы.
- Ищи опыт даже в нестандартных форматах: проекты, кейсы, фриланс, стажировки.

`;
  
  const ev = evidence?.found
    ? `\n\nНайденные признаки опыта (не вставлять в ответ дословно, использовать как ориентиры):\n- ${evidence.lines.join("\n- ")}\n`
    : `\n\nВ тексте не найдено явного описания опыта: оцени аккуратно и пиши «не указано», если фактов нет.\n`;
  
  return `${hhInstructions}ЗАДАЧА:
1) Оцени качество и структуру резюме (кратко).
2) Определи грейд кандидата и обоснуй.
3) Дай ATS-срез: общий балл и главные проблемы (3–7).
4) Сформируй списки: strengths (сильные), gaps (недочёты), add (что добавить).
5) Дай 3–6 уточняющих вопросов.

ФОРМАТ (строго JSON):
{
  "grade": { "level": "Junior|Middle|Senior|Lead", "rationale": "<=300" },
  "scores": { "text": 0-100, "structure": 0-100, "overall": 0-100 },
  "ats": { "score": 0-100, "notes": "..." },
  "strengths": ["..."],
  "gaps": ["..."],
  "add": ["..."],
  "questions": ["..."]
}

ВХОДНЫЕ ДАННЫЕ (компактное резюме или сырой текст):
${reviewInput}${ev}`;
}

// ===== Helpers: smart trim and simple cache (15m) =====
function smartTrim(text, limit = 8000) {
  if (!text) return '';
  let s = String(text)
    .replace(/\r/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
  if (s.length > limit) s = s.slice(0, limit) + '…';
  return s;
}
const _cache = new Map();
const TTL_MS = 15 * 60 * 1000;
function setCached(key, payload) { _cache.set(key, { payload, exp: Date.now() + TTL_MS }); }
function getCached(key) {
  const rec = _cache.get(key);
  if (rec && rec.exp > Date.now()) return rec.payload;
  if (rec) _cache.delete(key);
  return null;
}

// Функция AI анализа с использованием OpenAI
async function analyzeResumeWithAI(resumeText, questions = {}) {
  try {
    // Проверяем, есть ли API ключ
    console.log('=== API KEY DEBUG ===');
    console.log('API Key exists:', !!process.env.OPENAI_API_KEY);
    console.log('API Key length:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0);
    console.log('API Key start:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 15) + '...' : 'none');
    console.log('====================');
    
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key-here' || process.env.OPENAI_API_KEY.length < 20) {
      console.log('❌ OpenAI API ключ не настроен или неверный');
      console.log('🔄 Используем локальный анализ...');
      return performLocalAnalysis(resumeText, questions);
    }
    
    console.log('✅ OpenAI API ключ найден, используем API');
    console.log('🚀 Отправляем запрос к OpenAI API...');

    const systemPrompt = `Ты — эксперт по резюме, ATS-системам и карьерному развитию в IT-сфере.

Твоя задача — провести детальный анализ резюме и дать профессиональную оценку кандидата.

Алгоритм анализа:

1. АНАЛИЗ СТРУКТУРЫ РЕЗЮМЕ
- Контактные данные (телефон, email, LinkedIn)
- Цель/желаемая должность
- Опыт работы (хронология, достижения, технологии)
- Образование и сертификации
- Навыки (технические и soft skills)
- Дополнительная информация

2. ОПРЕДЕЛЕНИЕ УРОВНЯ КАНДИДАТА
- Junior (0-2 года): базовые навыки, выполнение задач под контролем
- Middle (2-5 лет): уверенная работа, оптимизация решений, помощь коллегам
- Senior (5-8 лет): проектирование архитектуры, сложные задачи, наставничество
- Lead/Expert (8+ лет): руководство командами, стратегические решения

3. ATS-СОВМЕСТИМОСТЬ
- Проверка ключевых слов
- Структура документа
- Форматирование

4. HR-СТАНДАРТЫ 2024
- Конкретные достижения с цифрами
- Уровень английского языка
- Релевантный опыт
- Soft skills

Анализируй резюме на русском языке и давай ответ в следующем формате:

# Анализ резюме

## 1. Структура и содержание
[Оценка каждого раздела резюме]

## 2. Совместимость с ATS
[Оценка оптимизации под системы автоматического отбора]

## 3. Анализ по HR-стандартам
[Соответствие современным требованиям HR]

## 4. Определение уровня кандидата
[Детальное обоснование уровня с указанием ключевых факторов]

## Итоговый отчет
- ✅ Сильные стороны
- ⚠️ Недочеты  
- 🔧 Рекомендации по улучшению

В конце обязательно дай JSON с краткой оценкой:
{
  "grade": "Junior/Middle/Senior/Lead/Expert",
  "atsScore": число от 0 до 100,
  "skills": ["найденные технические навыки"],
  "recommendations": ["конкретные рекомендации"],
  "strongPoints": ["сильные стороны"],
  "weakPoints": ["слабые стороны"]
}`;

    // Формируем дополнительную информацию из вопросов
    let additionalInfo = '';
    if (questions && Object.keys(questions).length > 0) {
      additionalInfo = '\n\nДополнительная информация от кандидата:\n';
      if (questions.desiredPosition) additionalInfo += `- Желаемая должность: ${questions.desiredPosition}\n`;
      if (questions.experienceYears) additionalInfo += `- Опыт работы: ${questions.experienceYears}\n`;
      if (questions.englishLevel) additionalInfo += `- Уровень английского: ${questions.englishLevel}\n`;
      if (questions.desiredSalary) additionalInfo += `- Желаемая зарплата: ${questions.desiredSalary} руб/мес\n`;
      if (questions.relocation) additionalInfo += `- Готовность к переезду: ${questions.relocation}\n`;
    }

    const userPrompt = `Проанализируй следующее резюме:

${resumeText}${additionalInfo}

Дай детальный анализ в указанном формате и JSON с оценкой. Учитывай дополнительную информацию при определении грейда и рекомендаций.`;

    const completion = await openai.chat.completions.create({
              model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 3000
    });

    const response = completion.choices[0].message.content;

    // Пытаемся извлечь JSON из ответа (удаляем и ограждающие ```)
    let cleanedResponse = response;
    let jsonData = null;

    // Сначала ищем fenced-блок ```json ... ```
    const codeBlockMatch = response.match(/```json[\s\S]*?```/i);
    if (codeBlockMatch) {
      const jsonInside = codeBlockMatch[0]
        .replace(/```json/i, '')
        .replace(/```/, '')
        .trim();
      try {
        jsonData = JSON.parse(jsonInside);
        cleanedResponse = response.replace(codeBlockMatch[0], '').trim();
      } catch (e) {
        console.error('Ошибка парсинга JSON из fenced-блока:', e);
      }
    }

    if (!jsonData) {
      // Фолбек: ищем первую JSON-структуру по фигурным скобкам
      const braceMatch = response.match(/\{[\s\S]*\}/);
      if (braceMatch) {
        try {
          jsonData = JSON.parse(braceMatch[0]);
          cleanedResponse = response.replace(braceMatch[0], '').trim();
        } catch (e) {
          console.error('Ошибка парсинга JSON:', e);
        }
      }
    }

    if (jsonData) {
      return {
        ...jsonData,
        detailedAnalysis: cleanedResponse
      };
    }
    
    // Если JSON не найден, возвращаем базовый анализ
    return {
      grade: 'Не определен',
      atsScore: 60,
      skills: [],
      recommendations: ['Ошибка анализа'],
      strongPoints: [],
      weakPoints: [],
      detailedAnalysis: response
    };
    
  } catch (error) {
    console.error('❌ Ошибка OpenAI API:', maskApiKeys(error?.message || error));
    console.error('Статус:', error?.status || error?.response?.status || 'n/a');
    // Возвращаем локальный анализ при ошибке API
    console.log('🔄 Используем локальный анализ из-за ошибки API');
    return performLocalAnalysis(resumeText, questions);
  }
}

// Локальный анализ резюме (без OpenAI)
function performLocalAnalysis(resumeText, questions = {}) {
  const text = resumeText.toLowerCase();
  
  let level = 'Junior';
  let score = 60;
  const skills = [];
  const recommendations = [];
  const strongPoints = [];
  const weakPoints = [];
  
  // Определение уровня по новым критериям (с учетом вопросов)
  if (questions.experienceYears) {
    if (questions.experienceYears === '8+') {
      level = 'Lead/Expert';
      score += 25;
    } else if (questions.experienceYears === '5-8') {
      level = 'Senior';
      score += 20;
    } else if (questions.experienceYears === '3-5' || questions.experienceYears === '2-3') {
      level = 'Middle';
      score += 15;
    } else {
      level = 'Junior';
      score += 10;
    }
  } else {
    // Определение по тексту резюме
    if (text.includes('8 лет') || text.includes('более 8') || text.includes('expert') || text.includes('руководитель') || text.includes('team lead') || text.includes('директор')) {
      level = 'Lead/Expert';
      score += 25;
    } else if (text.includes('5 лет') || text.includes('более 5') || text.includes('senior') || text.includes('архитектор') || text.includes('проектирование') || text.includes('ведущий')) {
      level = 'Senior';
      score += 20;
    } else if (text.includes('3 года') || text.includes('4 года') || text.includes('middle') || text.includes('опыт 3') || text.includes('опыт 4')) {
      level = 'Middle';
      score += 15;
    } else if (text.includes('1 год') || text.includes('2 года') || text.includes('junior') || text.includes('опыт 1') || text.includes('опыт 2')) {
      level = 'Junior';
      score += 10;
    }
  }
  
  // Поиск навыков (универсальные)
  const skillKeywords = [
    // IT навыки
    'react', 'javascript', 'typescript', 'node.js', 'python', 'java', 'c++', 'c#',
    'html', 'css', 'sql', 'mongodb', 'postgresql', 'docker', 'kubernetes', 'aws',
    'git', 'agile', 'scrum', 'figma', 'photoshop', 'illustrator',
    // Бизнес навыки
    'excel', 'powerpoint', 'word', 'power bi', 'tableau', 'salesforce', 'crm',
    'маркетинг', 'продажи', 'аналитика', 'финансы', 'бухгалтерия', 'hr',
    // Языки
    'английский', 'english', 'немецкий', 'французский', 'китайский',
    // Другие
    'osint', 'kyc', 'aml', 'проект', 'менеджмент', 'лидерство'
  ];
  
  skillKeywords.forEach(skill => {
    if (text.includes(skill)) {
      skills.push(skill.charAt(0).toUpperCase() + skill.slice(1));
    }
  });
  
  // Анализ структуры
  if (text.includes('телефон') || text.includes('email') || text.includes('контакт')) {
    strongPoints.push('Контактные данные указаны');
  } else {
    weakPoints.push('Отсутствуют контактные данные');
  }
  
  if (text.includes('опыт работы') || text.includes('место работы')) {
    strongPoints.push('Опыт работы структурирован');
  } else {
    weakPoints.push('Опыт работы не структурирован');
  }
  
  if (text.includes('образование')) {
    strongPoints.push('Образование указано');
  } else {
    weakPoints.push('Информация об образовании отсутствует');
  }
  
  if (text.includes('навыки') || text.includes('skills')) {
    strongPoints.push('Навыки выделены отдельным блоком');
  } else {
    weakPoints.push('Навыки не структурированы');
  }
  
  // Анализ достижений
  if (text.includes('%') || text.includes('процент') || text.includes('увеличил') || text.includes('снизил')) {
    strongPoints.push('Есть конкретные достижения с цифрами');
  } else {
    weakPoints.push('Отсутствуют конкретные достижения с цифрами');
  }
  
  // Анализ языков (с учетом вопросов)
  if (questions.englishLevel) {
    strongPoints.push(`Указан уровень английского языка: ${questions.englishLevel}`);
    if (questions.englishLevel === 'C1' || questions.englishLevel === 'C2') {
      score += 15;
    } else if (questions.englishLevel === 'B2') {
      score += 10;
    } else if (questions.englishLevel === 'B1') {
      score += 5;
    }
  } else if (text.includes('английский') || text.includes('english')) {
    strongPoints.push('Указан уровень английского языка');
  } else {
    weakPoints.push('Не указан уровень английского языка');
  }
  
  // Рекомендации (с учетом вопросов)
  if (questions.desiredPosition) {
    strongPoints.push(`Указана желаемая должность: ${questions.desiredPosition}`);
    score += 5;
  }
  
  if (questions.desiredSalary) {
    strongPoints.push(`Указана желаемая зарплата: ${questions.desiredSalary} руб/мес`);
    score += 5;
  }
  
  if (questions.relocation) {
    const relocationText = questions.relocation === 'yes' ? 'готов к переезду' : 
                          questions.relocation === 'no' ? 'не готов к переезду' : 
                          'рассматривает предложения по переезду';
    strongPoints.push(`Готовность к переезду: ${relocationText}`);
  }
  
  if (text.length < 200) {
    recommendations.push('Добавьте больше деталей о вашем опыте работы');
  }
  if (!text.includes('опыт')) {
    recommendations.push('Укажите ваш опыт работы');
  }
  if (!text.includes('образование')) {
    recommendations.push('Добавьте информацию об образовании');
  }
  if (skills.length < 3) {
    recommendations.push('Добавьте больше технических навыков');
  }
  if (!text.includes('достижения')) {
    recommendations.push('Добавьте конкретные достижения с цифрами');
  }
  
  // Увеличиваем оценку за наличие ключевых элементов
  if (text.includes('опыт работы')) score += 10;
  if (text.includes('образование')) score += 10;
  if (text.includes('навыки')) score += 10;
  if (text.includes('проект')) score += 5;
  if (text.includes('достижения')) score += 10;
  
  // Для очень коротких текстов снижаем оценку
  if (text.length < 50) {
    score = Math.max(score - 30, 10); // Минимум 10%
  } else if (text.length < 100) {
    score = Math.max(score - 20, 20); // Минимум 20%
  }
  
  score = Math.min(score, 100);
  
  // Генерируем детальный анализ
  const detailedAnalysis = generateDetailedAnalysis(resumeText, level, score, skills, strongPoints, weakPoints, recommendations);
  
  return {
    grade: level,
    atsScore: score,
    skills: skills,
    recommendations: recommendations,
    strongPoints: strongPoints,
    weakPoints: weakPoints,
    detailedAnalysis: detailedAnalysis
  };
}

function generateDetailedAnalysis(resumeText, level, score, skills, strongPoints, weakPoints, recommendations) {
  const text = resumeText.toLowerCase();
  
  let analysis = `# Анализ резюме\n\n`;
  
  // 1. Структура и содержание
  analysis += `## 1. Структура и содержание\n`;
  
  if (text.includes('телефон') || text.includes('email')) {
    analysis += `Контактные данные: ${text.includes('телефон') && text.includes('email') ? 'Полные' : 'Частично указаны'}, включают ${text.includes('телефон') ? 'телефон' : ''}${text.includes('телефон') && text.includes('email') ? ', ' : ''}${text.includes('email') ? 'email' : ''} — ${text.includes('телефон') && text.includes('email') ? 'отлично' : 'требует дополнения'}.\n\n`;
  } else {
    analysis += `Контактные данные: Отсутствуют — критично для HR.\n\n`;
  }
  
  if (text.includes('цель') || text.includes('должность')) {
    analysis += `Цель / Желаемая должность: ${text.includes('цель') ? 'Указана' : 'Не указана'} — ${text.includes('цель') ? 'хорошо' : 'нужно добавить'}.\n\n`;
  } else {
    analysis += `Цель / Желаемая должность: Не указана — рекомендуется добавить.\n\n`;
  }
  
  if (text.includes('опыт работы')) {
    analysis += `Опыт работы: ${text.includes('опыт работы') ? 'Приведен' : 'Не структурирован'}. ${text.includes('достижения') ? 'Есть описание достижений' : 'Нет конкретных достижений'}.\n\n`;
  } else {
    analysis += `Опыт работы: Не структурирован — критично для оценки кандидата.\n\n`;
  }
  
  if (text.includes('образование')) {
    analysis += `Образование: Указано — хорошо для HR-оценки.\n\n`;
  } else {
    analysis += `Образование: Не указано — может снизить шансы.\n\n`;
  }
  
  if (skills.length > 0) {
    analysis += `Навыки: Выделены отдельным блоком (${skills.join(', ')}).\n\n`;
  } else {
    analysis += `Навыки: Не структурированы — рекомендуется выделить отдельным блоком.\n\n`;
  }
  
  // 2. Совместимость с ATS
  analysis += `## 2. Совместимость с ATS\n`;
  analysis += `Формат резюме: ${text.includes('pdf') ? 'PDF формат' : 'Текстовый формат'} — ${text.includes('pdf') ? 'хорошо для ATS' : 'подходит для ATS'}.\n\n`;
  
  if (text.includes('таблица') || text.includes('график')) {
    analysis += `Внимание: Использование таблиц или графиков может затруднить сканирование ATS.\n\n`;
  } else {
    analysis += `Отсутствуют сложные графические элементы — отлично для ATS.\n\n`;
  }
  
  if (skills.length > 0) {
    analysis += `Ключевые слова: ${skills.length} технических навыков обнаружено — ${skills.length >= 5 ? 'хорошо' : 'можно добавить больше'}.\n\n`;
  } else {
    analysis += `Ключевые слова: Недостаточно технических терминов — критично для ATS.\n\n`;
  }
  
  // 3. Анализ по HR-стандартам
  analysis += `## 3. Анализ по современным HR-стандартам (2024-2025)\n`;
  
  if (text.includes('%') || text.includes('процент')) {
    analysis += `Достижения с цифрами: Есть — отлично для HR.\n\n`;
  } else {
    analysis += `Достижения с цифрами: Отсутствуют — рекомендуется добавить.\n\n`;
  }
  
  if (text.includes('английский') || text.includes('english')) {
    analysis += `Уровень английского: Указан — соответствует стандартам.\n\n`;
  } else {
    analysis += `Уровень английского: Не указан — может снизить шансы.\n\n`;
  }
  
  if (text.includes('опыт') && (text.includes('3') || text.includes('4') || text.includes('5'))) {
    analysis += `Релевантный опыт: Есть — соответствует требованиям рынка.\n\n`;
  } else {
    analysis += `Релевантный опыт: Недостаточно детализирован.\n\n`;
  }
  
  // 4. Определение уровня
  analysis += `## 4. Определение уровня кандидата\n`;
  
  let experienceYears = 0;
  if (text.includes('5 лет') || text.includes('более 5')) experienceYears = 5;
  else if (text.includes('4 года') || text.includes('4 лет')) experienceYears = 4;
  else if (text.includes('3 года') || text.includes('3 лет')) experienceYears = 3;
  else if (text.includes('2 года') || text.includes('2 лет')) experienceYears = 2;
  else if (text.includes('1 год') || text.includes('1 лет')) experienceYears = 1;
  
  analysis += `Опыт: ${experienceYears > 0 ? experienceYears + ' лет' : 'Не указан'}\n`;
  analysis += `Навыки: ${skills.length} профессиональных навыков\n`;
  analysis += `Самостоятельность: ${text.includes('проект') ? 'Есть собственные проекты' : 'Не указано'}\n`;
  analysis += `Сложность задач: ${text.includes('руководитель') ? 'Высокая' : text.includes('middle') ? 'Средняя' : 'Базовая'}\n`;
  analysis += `Уровень ответственности: ${text.includes('руководитель') ? 'Высокий' : text.includes('проект') ? 'Средний' : 'Базовый'}\n\n`;
  
  analysis += `Оценка:\n`;
  analysis += `[${level}] — ${level === 'Lead/Expert' ? '8+ лет опыта, руководство командами, стратегические решения' : level === 'Senior' ? '5-8 лет опыта, проектирование решений, наставничество' : level === 'Middle' ? '2-5 лет опыта, самостоятельная работа, оптимизация решений' : '0-2 года опыта, базовые знания, наставничество'}.\n\n`;
  
  // Итоговый отчет
  analysis += `## Итоговый отчет\n`;
  
  if (strongPoints.length > 0) {
    analysis += `Сильные стороны ✅\n`;
    strongPoints.forEach(point => {
      analysis += `${point}\n`;
    });
    analysis += `\n`;
  }
  
  if (weakPoints.length > 0) {
    analysis += `Недочеты ⚠️\n`;
    weakPoints.forEach(point => {
      analysis += `${point}\n`;
    });
    analysis += `\n`;
  }
  
  if (recommendations.length > 0) {
    analysis += `Что добавить 🔧\n`;
    recommendations.forEach(rec => {
      analysis += `${rec}\n`;
    });
    analysis += `\n`;
  }
  
  analysis += `Итоговая оценка:\n`;
  analysis += `[${level}] — обоснование: ${level === 'Lead/Expert' ? '8+ лет опыта, руководство командами, стратегические решения' : level === 'Senior' ? '5-8 лет опыта, проектирование решений, наставничество' : level === 'Middle' ? '2-5 лет опыта, самостоятельная работа, оптимизация решений' : '0-2 года опыта, базовые знания, наставничество'}.\n\n`;
  
  analysis += `ATS-оценка: ${score}/100 — ${score >= 80 ? 'Отлично' : score >= 60 ? 'Хорошо' : 'Требует доработки'}.\n`;
  
  return analysis;
}


// API endpoints
app.post('/api/resume/upload', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { message: 'Файл не загружен' }
      });
    }
    
    console.log('Обработка файла:', req.file.originalname);
    
    // Извлекаем текст из файла
    const resumeText = await extractTextFromFile(req.file);
    
    // Анализируем резюме
    const analysisResult = await analyzeResumeWithAI(resumeText);
    
    res.json({
      success: true,
      message: 'Резюме успешно проанализировано',
      data: analysisResult
    });
    
  } catch (error) {
    console.error('Ошибка при обработке файла:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Ошибка при обработке файла' }
    });
  }
});

app.post('/api/resume/analyze-text', async (req, res) => {
  try {
    const { resumeText, questions } = req.body;
    
    console.log('Получен запрос на анализ текста, длина:', resumeText ? resumeText.length : 0);
    console.log('Данные вопросов:', questions);
    
    if (!resumeText || resumeText.trim().length < 10) {
      console.log('Текст слишком короткий:', resumeText);
      return res.status(400).json({
        success: false,
        error: { message: 'Текст резюме слишком короткий. Минимум 10 символов.' }
      });
    }
    
    console.log('Анализ текстового резюме, длина:', resumeText.trim().length);
    
    // Анализируем резюме с учетом вопросов
    const analysisResult = await analyzeResumeWithAI(resumeText.trim(), questions);
    
    res.json({
      success: true,
      message: 'Резюме успешно проанализировано',
      data: analysisResult
    });
    
  } catch (error) {
    console.error('Ошибка при анализе текста:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Ошибка при анализе резюме' }
    });
  }
});

// === New compact endpoints ===
app.post('/api/resume/analyze', async (req, res) => {
  try {
    const { resumeText } = req.body;
    if (!resumeText || resumeText.trim().length < 10) {
      return res.status(400).json({ error: 'Нужно передать текст резюме' });
    }
    const text = smartTrim(resumeText.trim());
    const cacheKey = `resume_full:${text}`;
    const hit = getCached(cacheKey);
    if (hit) return res.json(hit);

    const { json, usage } = await chatJson([
      { role: 'system', content: sysResumeAnalyze() },
      { role: 'user', content: userResumeAnalyze(text) }
    ], { max_tokens: 900, temperature: 0.2 });
    const out = { ...json, usage };
    setCached(cacheKey, out);
    res.json(out);
  } catch (e) {
    respondModelError(res, e);
  }
});

app.post('/api/job/analyze', async (req, res) => {
  try {
    const { jobText } = req.body;
    if (!jobText || jobText.trim().length < 10) {
      return res.status(400).json({ error: 'Нужно передать текст вакансии' });
    }
    const text = smartTrim(jobText.trim(), 6000);
    const cacheKey = `job:${text}`;
    const hit = getCached(cacheKey);
    if (hit) return res.json(hit);

    const { json, usage } = await chatJson([
      { role: 'system', content: sysJobAnalyze() },
      { role: 'user', content: userJobAnalyze(text) }
    ], { max_tokens: 800, temperature: 0.2 });
    const out = { ...json, usage };
    setCached(cacheKey, out);
    res.json(out);
  } catch (e) {
    respondModelError(res, e);
  }
});

app.post('/api/job/compare', async (req, res) => {
  try {
    const { resumeText, jobText } = req.body;
    if (!resumeText || !jobText) return res.status(400).json({ error: 'Нужны resumeText и jobText' });
    
    // Автоматическая предобработка резюме и вакансии
    const [rPrep, jPrep] = await Promise.all([
      prepareText(resumeText, 'resume', chatJson),
      prepareText(jobText, 'jd', chatJson)
    ]);
    
    const cacheKey = `compare:${rPrep.text}:${jPrep.text}`;
    const hit = getCached(cacheKey);
    if (hit) return res.json(hit);

    const { json, usage } = await chatJson([
      { role: 'system', content: sysJobCompare() },
      { role: 'user', content: userJobCompare(rPrep.text, jPrep.text) }
    ], { max_tokens: 1100, temperature: 0.2 });
    
    // Логируем для отладки
    console.log('Preprocessing info:', { resume: rPrep, jd: jPrep });
    
    // Пользователю отправляем только полезные данные
    res.json(json);
  } catch (e) { respondModelError(res, e); }
});

app.post('/api/match', async (req, res) => {
  try {
    const { resume_summary, job_summary, hard_skills = [], requirements = [] } = req.body;
    if (!resume_summary || !job_summary) return res.status(400).json({ error: 'Нужны summaries резюме и вакансии' });
    const cacheKey = `match:${resume_summary}:${job_summary}:${JSON.stringify(hard_skills)}:${JSON.stringify(requirements)}`;
    const hit = getCached(cacheKey);
    if (hit) return res.json(hit);

    const { json, usage } = await chatJson([
      { role: 'system', content: sysMatch() },
      { role: 'user', content: userMatch(resume_summary, job_summary, hard_skills, requirements) }
    ], { max_tokens: 500, temperature: 0.2 });
    
    // Пользователю отправляем только полезные данные
    res.json(json);
  } catch (e) { respondModelError(res, e); }
});

app.post('/api/cover-letter', async (req, res) => {
  try {
    const { resume_summary, job_summary, tone } = req.body;
    if (!resume_summary || !job_summary) return res.status(400).json({ error: 'Нужны summaries резюме и вакансии' });
    const cacheKey = `cover:${resume_summary}:${job_summary}:${tone || ''}`;
    const hit = getCached(cacheKey);
    if (hit) return res.json(hit);

    const { json, usage } = await chatJson([
      { role: 'system', content: sysCover() },
      { role: 'user', content: userCover(resume_summary, job_summary, tone) }
    ], { max_tokens: 420, temperature: 0.25 });
    
    // Пользователю отправляем только полезные данные
    res.json(json);
  } catch (e) { respondModelError(res, e); }
});

app.post('/api/premium/oneshot', async (req, res) => {
  try {
    const { resumeText, jobText } = req.body;
    if (!resumeText || !jobText) return res.status(400).json({ error: 'Нужны resumeText и jobText' });
    
    // Автоматическая предобработка резюме и вакансии
    const [rPrep, jPrep] = await Promise.all([
      prepareText(resumeText, 'resume', chatJson),
      prepareText(jobText, 'jd', chatJson)
    ]);
    
    const cacheKey = `oneshot:${rPrep.text}:${jPrep.text}`;
    const hit = getCached(cacheKey);
    if (hit) return res.json(hit);

    const { json, usage } = await chatJson([
      { role: 'system', content: sysPremium() },
      { role: 'user', content: userPremium(rPrep.text, jPrep.text) }
    ], { max_tokens: 1600, temperature: 0.25 });
    
    // Логируем для отладки
    console.log('Preprocessing info:', { resume: rPrep, jd: jPrep });
    
    // Пользователю отправляем только полезные данные
    res.json(json);
  } catch (e) { respondModelError(res, e); }
});

// Parse .docx to text (for accordion uploads)
app.post('/api/parse/docx', uploadMemory.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'no file' });
    const { value } = await mammoth.extractRawText({ buffer: req.file.buffer });
    res.json({ text: (value || '').trim() });
  } catch (e) { respondModelError(res, e); }
});

// Short & cheap: ATS only
app.post('/api/resume/ats', async (req, res) => {
  try {
    const { resumeText } = req.body;
    const text = smartTrim(resumeText || '');
    if (!text) return res.status(400).json({ error: 'Нужно передать текст резюме' });
    const cacheKey = `ats:${text}`;
    const hit = getCached(cacheKey);
    if (hit) return res.json(hit);
    const { json, usage } = await chatJson([
      { role: 'system', content: sysAts() },
      { role: 'user', content: userAts(text) }
    ], { max_tokens: 220, temperature: 0.2 });
    const out = { ...json, usage };
    setCached(cacheKey, out);
    res.json(out);
  } catch (e) { respondModelError(res, e); }
});

// Short & cheap: Grade only
app.post('/api/resume/grade', async (req, res) => {
  try {
    const { resumeText } = req.body;
    const text = smartTrim(resumeText || '');
    if (!text) return res.status(400).json({ error: 'Нужно передать текст резюме' });
    const cacheKey = `grade:${text}`;
    const hit = getCached(cacheKey);
    if (hit) return res.json(hit);
    const { json, usage } = await chatJson([
      { role: 'system', content: sysGrade() },
      { role: 'user', content: userGrade(text) }
    ], { max_tokens: 140, temperature: 0.2 });
    const out = { ...json, usage };
    setCached(cacheKey, out);
    res.json(out);
  } catch (e) { respondModelError(res, e); }
});

// Combo endpoint: summary + job + match (без ATS/grade/cover)
app.post('/api/combo/summary-match', async (req, res) => {
  try {
    const { resumeText, jobText } = req.body;
    if (!resumeText || !jobText) return res.status(400).json({ error: 'Нужны resumeText и jobText' });
    const resumeT = smartTrim(resumeText, 8000);
    const jobT = smartTrim(jobText, 8000);
    const cacheKey = `combo:${resumeT}:${jobT}`;
    const hit = getCached(cacheKey);
    if (hit) return res.json(hit);
    const { json, usage } = await chatJson([
      { role: 'system', content: sysCombo() },
      { role: 'user', content: userCombo(resumeT, jobT) }
    ], { max_tokens: 900, temperature: 0.2 });
    const out = { ...json, usage };
    setCached(cacheKey, out);
    res.json(out);
  } catch (e) { respondModelError(res, e); }
});

// Улучшенный endpoint для детального матчинга вакансии
app.post('/api/vacancy/detailed-match', async (req, res) => {
  try {
    const { resumeText, jobText } = req.body;
    if (!resumeText || !jobText) {
      return res.status(400).json({ error: 'Нужны resumeText и jobText' });
    }
    
    const resumeT = smartTrim(resumeText, 8000);
    const jobT = smartTrim(jobText, 8000);
    const cacheKey = `detailed-match:${resumeT}:${jobT}`;
    const hit = getCached(cacheKey);
    if (hit) return res.json(hit);
    
    const { json, usage } = await chatJson([
      { role: 'system', content: sysDetailedMatch() },
      { role: 'user', content: userDetailedMatch(resumeT, jobT) }
    ], { max_tokens: 1500, temperature: 0.2 });
    
    const out = { ...json, usage };
    setCached(cacheKey, out);
    res.json(out);
  } catch (e) { respondModelError(res, e); }
});

// Экстрактивная ужимка резюме
app.post('/api/resume/condense', async (req, res) => {
  try {
    const { resumeText } = req.body;
    const text = smartTrim(resumeText || '', 12000);
    if (!text) return res.status(400).json({ error: 'Нужно передать текст резюме' });
    
    const cacheKey = `condense:${text}`;
    const hit = getCached(cacheKey);
    if (hit) return res.json(hit);
    
    const { json, usage } = await chatJson([
      { role: 'system', content: sysCondenseResume() },
      { role: 'user', content: userCondenseResume(text) }
    ], { max_tokens: 700, temperature: 0.1 });
    
    const out = { ...json, usage };
    setCached(cacheKey, out);
    res.json(out);
  } catch (e) { respondModelError(res, e); }
});

// Объединённая оценка резюме (HR + Grade + ATS)
app.post('/api/resume/review', async (req, res) => {
  try {
    console.log('=== REVIEW DEBUG ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const { resumeText, condensed } = req.body;
    
    // Валидация входных данных
    if (!resumeText && !condensed) {
      return res.status(400).json({ 
        error: 'Нужно передать resumeText или condensed',
        received: { resumeText: !!resumeText, condensed: !!condensed }
      });
    }
    
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
      // Автоматическая предобработка резюме с маркировкой опыта
      const prep = await prepareText(resumeText || '', 'resume');
      reviewInput = prep.text;
      console.log('Preprocessing info:', prep);
    }
    
    console.log('Review input length:', reviewInput ? reviewInput.length : 0);
    console.log('Review input preview:', reviewInput ? reviewInput.substring(0, 100) + '...' : 'null');
    
    if (!reviewInput || reviewInput.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Нужно передать resumeText или condensed',
        reviewInputLength: reviewInput ? reviewInput.length : 0
      });
    }
    
    // Детекция опыта работы и маркировка
    const evidence = detectExperience(reviewInput);
    console.log('Experience evidence:', evidence);
    
    // Добавляем маркеры опыта в текст для лучшего распознавания моделью
    if (evidence.found && evidence.spans.length > 0) {
      reviewInput = injectExperienceMarkers(reviewInput, evidence.spans);
      console.log('Added experience markers to text');
    }
    
    const cacheKey = `review:${reviewInput}`;
    const hit = getCached(cacheKey);
    if (hit) return res.json(hit);
    
    // Используем новый сервис с Structured Outputs
    const result = await evaluateResumeStructured(reviewInput, evidence);
    
    // Логируем для диагностики
    console.log('=== REVIEW RESULT ===');
    console.log('Model:', result.model);
    console.log('System fingerprint:', result.system_fingerprint);
    console.log('Usage:', result.usage);
    if (result.error) {
      console.log('Error:', result.error);
    }
    
    // Кэшируем результат
    setCached(cacheKey, result.evaluation);
    
    // Пользователю отправляем полную информацию для отладки
    res.json({
      data: result.evaluation,
      meta: result.meta,
      raw_model_output: result.raw_model_output,
      usage: result.usage,
      system_fingerprint: result.system_fingerprint
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// API root endpoint
app.get('/api', (req, res) => {
  res.json({
    status: 'OK',
    message: 'ResumeMint API работает',
    timestamp: new Date().toISOString(),
    service: 'ResumeMint API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      parse: '/api/parse/docx',
      resume: {
        ats: '/api/resume/ats',
        grade: '/api/resume/grade',
        analyze: '/api/resume/analyze',
        condense: '/api/resume/condense',
        review: '/api/resume/review'
      },
      job: {
        analyze: '/api/job/analyze'
      },
      match: '/api/match',
      cover: '/api/cover-letter',
      premium: '/api/premium/oneshot',
      combo: '/api/combo/summary-match'
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'ResumeMint API',
    version: '1.0.0'
  });
});

// Strict evaluation endpoint (structured JSON + debug meta/raw)
app.post('/api/evaluate', async (req, res) => {
  try {
    const resumeText = (req.body?.resume || '').trim();

    if (!resumeText || resumeText.length < 40) {
      return res.status(400).json({
        error: 'EMPTY_RESUME',
        message: "Не получен текст резюме. Отправьте поле 'resume' с непустым текстом."
      });
    }

    // Детекция опыта и мягкая маркировка
    const evidence = detectExperience(resumeText);
    let reviewInput = resumeText;
    if (evidence?.found && Array.isArray(evidence.spans) && evidence.spans.length > 0) {
      reviewInput = injectExperienceMarkers(resumeText, evidence.spans);
    }

    const result = await evaluateResumeStructured(reviewInput, evidence);
    const raw = result.raw_model_output || '{}';
    const data = result.evaluation || {};

    // Проверяем ключевые поля scores; если нет — явно сообщаем об ошибке модели
    if (
      !data?.scores ||
      typeof data.scores.text !== 'number' ||
      typeof data.scores.structure !== 'number'
    ) {
      return res.status(502).json({
        error: 'BAD_MODEL_OUTPUT',
        message: 'Модель вернула неожиданный формат. См. raw_model_output.',
        raw_model_output: raw,
        meta: result.meta || { model: result.model || null, system_fingerprint: result.system_fingerprint || null }
      });
    }

    // Досчитываем overall при необходимости
    if (typeof data.scores.overall !== 'number') {
      const t = Math.max(0, Math.min(100, Number(data.scores.text)));
      const s = Math.max(0, Math.min(100, Number(data.scores.structure)));
      data.scores.overall = Math.round(0.5 * t + 0.5 * s);
    }

    return res.json({
      meta: result.meta || { model: result.model || null, system_fingerprint: result.system_fingerprint || null, temperature: 0.2, seed: 42, ts: new Date().toISOString() },
      raw_model_output: raw,
      data
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      error: 'SERVER_ERROR',
      message: e?.message || 'Unknown error'
    });
  }
});

// Генерация сопроводительного письма (должна быть ДО 404 handler)
app.post('/api/cover/generate', async (req, res) => {
  try {
    const { resumeText, jobText } = req.body;
    if (!resumeText || !jobText) {
      return res.status(400).json({ error: 'Нужны resumeText и jobText' });
    }
    
    const resumeT = smartTrim(resumeText, 8000);
    const jobT = smartTrim(jobText, 8000);
    const cacheKey = `cover:${resumeT}:${jobT}`;
    const hit = getCached(cacheKey);
    if (hit) return res.json(hit);
    
    const { json, usage } = await chatJson([
      { role: 'system', content: 'Ты — опытный HR-специалист и карьерный консультант. Создавай персонализированные сопроводительные письма на русском языке. Письмо должно быть профессиональным, конкретным и показывать соответствие кандидата требованиям вакансии.' },
      { role: 'user', content: `Создай сопроводительное письмо (110-160 слов) для кандидата на основе его резюме и требований вакансии. Письмо должно включать:
1. Обращение к работодателю
2. Краткое представление кандидата
3. Соответствие требованиям вакансии
4. Конкретные достижения и опыт
5. Мотивацию работать в компании
6. Вежливое завершение

ФОРМАТ: {"cover_letter": "текст письма"}

РЕЗЮМЕ:
${resumeT}

ВАКАНСИЯ:
${jobT}` }
    ], { max_tokens: 800, temperature: 0.3 });
    
    const out = { ...json, usage };
    setCached(cacheKey, out);
    res.json(out);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Маршрут не найден',
    code: 'ROUTE_NOT_FOUND',
    path: req.originalUrl
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Ошибка сервера:', error);
  res.status(500).json({
    success: false,
    error: { message: error.message || 'Внутренняя ошибка сервера' }
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 ResumeMint API сервер запущен на порту ${PORT}`);
  console.log(`🔗 API доступен по адресу: http://localhost:${PORT}/api`);
});

module.exports = app;
