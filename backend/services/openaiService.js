/**
 * Сервис для работы с OpenAI GPT API
 * Обеспечивает AI-анализ резюме, вакансий и генерацию рекомендаций
 */

const OpenAI = require('openai');

// Инициализация OpenAI клиента
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Системный промт для анализа резюме и карьерного консультирования
 */
const SYSTEM_PROMPT = `Ты — эксперт по резюме, ATS-системам, карьерному развитию и системе IT-грейдов.

Стиль общения: Детальный, структурированный, понятный. Даёшь рекомендации в формате чек-листов и описаний.

Алгоритм работы:
1. Анализ структуры резюме: цель, опыт, образование, навыки, курсы, «О себе», контакты
2. Проверка формата для ATS: файл .docx/.pdf, отсутствие таблиц и картинок, корректные ключевые слова
3. Сравнение с HR-стандартами 2022–2025: достижения с цифрами, уровень английского, релевантность опыта, наличие soft skills, отсутствие лишнего
4. Определение грейда кандидата по критериям:
   - Junior (0-2 года): базовое владение технологиями, выполнение типовых задач под контролем лида
   - Middle (2-5 лет): уверенная работа с продуктом, умение оптимизировать решения
   - Senior (5-8 лет): проектирование архитектуры, решение сложных технических задач
   - Lead/Expert (8+ лет): глубокие технические знания и руководство командами

Всегда отвечай на русском языке. Структурируй ответы в JSON формате.`;

/**
 * Анализ резюме и определение грейда кандидата
 * @param {string} resumeText - Текст резюме
 * @returns {Object} Результат анализа резюме
 */
async function analyzeResume(resumeText) {
  try {
    const prompt = `
Проанализируй следующее резюме и определи грейд кандидата:

${resumeText}

Выполни полный анализ по следующим пунктам:

1. Структурный анализ:
   - Наличие всех необходимых разделов
   - Качество заполнения каждого раздела
   - Соответствие современным стандартам

2. ATS-совместимость:
   - Формат и структура
   - Ключевые слова
   - Отсутствие проблемных элементов

3. Определение грейда:
   - Опыт работы
   - Технические навыки
   - Уровень самостоятельности
   - Сложность выполняемых задач

4. Рекомендации:
   - Сильные стороны
   - Области для улучшения
   - Конкретные советы по развитию

Ответь в следующем JSON формате:
{
  "grade": "Junior|Middle|Senior|Lead/Expert",
  "gradeReasoning": "Обоснование грейда",
  "atsCompatibility": {
    "score": 85,
    "issues": ["список проблем"],
    "strengths": ["список преимуществ"]
  },
  "structure": {
    "objective": "оценка",
    "experience": "оценка", 
    "education": "оценка",
    "skills": "оценка",
    "courses": "оценка",
    "about": "оценка",
    "contacts": "оценка"
  },
  "strengths": ["список сильных сторон"],
  "weaknesses": ["список слабых сторон"],
  "recommendations": ["список рекомендаций"],
  "keywords": ["ключевые слова для ATS"]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });

    const result = JSON.parse(response.choices[0].message.content);
    return result;

  } catch (error) {
    console.error('Ошибка анализа резюме:', error);
    throw new Error('Ошибка AI-анализа резюме: ' + error.message);
  }
}

/**
 * Анализ вакансии и определение требуемого грейда
 * @param {string} vacancyText - Текст вакансии
 * @returns {Object} Результат анализа вакансии
 */
async function analyzeVacancy(vacancyText) {
  try {
    const prompt = `
Проанализируй следующую вакансию и определи требуемый грейд:

${vacancyText}

Выполни анализ по следующим пунктам:

1. Требования к опыту работы
2. Технические требования и их сложность
3. Уровень самостоятельности и ответственности
4. Сложность описываемых задач
5. Требования к управлению и лидерству

Определи требуемый грейд на основе:
- Указанного опыта работы
- Сложности технических требований
- Уровня ответственности
- Требований к управлению командой

Ответь в следующем JSON формате:
{
  "requiredGrade": "Junior|Middle|Senior|Lead/Expert",
  "gradeReasoning": "Обоснование требуемого грейда",
  "requirements": {
    "experience": "требования к опыту",
    "technical": ["технические требования"],
    "soft": ["soft skills требования"],
    "responsibilities": ["обязанности"]
  },
  "keySkills": ["ключевые навыки"],
  "difficulty": "сложность позиции",
  "responsibility": "уровень ответственности"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 1500
    });

    const result = JSON.parse(response.choices[0].message.content);
    return result;

  } catch (error) {
    console.error('Ошибка анализа вакансии:', error);
    throw new Error('Ошибка AI-анализа вакансии: ' + error.message);
  }
}

/**
 * Сравнение резюме с вакансией и генерация рекомендаций
 * @param {Object} resumeData - Данные резюме
 * @param {Object} vacancyData - Данные вакансии
 * @returns {Object} Результат сравнения
 */
async function compareResumeWithVacancy(resumeData, vacancyData) {
  try {
    const prompt = `
Сравни резюме кандидата с требованиями вакансии:

РЕЗЮМЕ КАНДИДАТА:
Грейд: ${resumeData.grade}
Навыки: ${resumeData.skills.join(', ')}
Опыт: ${JSON.stringify(resumeData.experience, null, 2)}

ВАКАНСИЯ:
Требуемый грейд: ${vacancyData.requiredGrade}
Требования: ${vacancyData.requirements.join(', ')}
Обязанности: ${vacancyData.responsibilities.join(', ')}

Выполни детальное сравнение:

1. Соответствие грейдов
2. Покрытие требований
3. Оценка шансов
4. Рекомендации по развитию

Ответь в следующем JSON формате:
{
  "gradeComparison": {
    "candidateGrade": "${resumeData.grade}",
    "requiredGrade": "${vacancyData.requiredGrade}",
    "match": "Соответствует|Выше|Ниже",
    "gap": "описание разрыва в грейдах"
  },
  "requirementsMatch": {
    "covered": ["покрытые требования"],
    "missing": ["непокрытые требования"],
    "coverage": 85
  },
  "chances": "Высокие|Средние|Низкие",
  "chancesReasoning": "обоснование оценки шансов",
  "developmentAreas": ["области для развития"],
  "recommendations": ["конкретные рекомендации"],
  "strengths": ["сильные стороны для данной вакансии"]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });

    const result = JSON.parse(response.choices[0].message.content);
    return result;

  } catch (error) {
    console.error('Ошибка сравнения резюме с вакансией:', error);
    throw new Error('Ошибка AI-сравнения: ' + error.message);
  }
}

/**
 * Редактирование резюме под конкретную вакансию
 * @param {string} originalResume - Исходное резюме
 * @param {Object} targetVacancy - Целевая вакансия
 * @param {Array} focusAreas - Области для фокусировки
 * @returns {Object} Отредактированное резюме
 */
async function editResumeForVacancy(originalResume, targetVacancy, focusAreas = []) {
  try {
    const prompt = `
Отредактируй резюме под конкретную вакансию:

ИСХОДНОЕ РЕЗЮМЕ:
${originalResume}

ЦЕЛЕВАЯ ВАКАНСИЯ:
Требуемый грейд: ${targetVacancy.requiredGrade}
Требования: ${targetVacancy.requirements.join(', ')}

ОБЛАСТИ ФОКУСИРОВКИ: ${focusAreas.join(', ')}

Задачи:
1. Адаптируй опыт под требуемый грейд
2. Подчеркни релевантные навыки и достижения
3. Добавь ключевые слова для ATS
4. Структурируй информацию для максимальной привлекательности
5. Сохрани честность и достоверность

Ответь в следующем JSON формате:
{
  "editedResume": "полный текст отредактированного резюме",
  "changes": {
    "experience": "изменения в опыте",
    "skills": "изменения в навыках",
    "keywords": "добавленные ключевые слова"
  },
  "atsOptimization": "оптимизация для ATS",
  "gradeAdaptation": "адаптация под грейд"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt }
      ],
      temperature: 0.4,
      max_tokens: 3000
    });

    const result = JSON.parse(response.choices[0].message.content);
    return result;

  } catch (error) {
    console.error('Ошибка редактирования резюме:', error);
    throw new Error('Ошибка AI-редактирования резюме: ' + error.message);
  }
}

/**
 * Генерация сопроводительного письма
 * @param {Object} resumeData - Данные резюме
 * @param {Object} vacancyData - Данные вакансии
 * @returns {Object} Сопроводительное письмо
 */
async function generateCoverLetter(resumeData, vacancyData) {
  try {
    const prompt = `
Создай персонализированное сопроводительное письмо:

ДАННЫЕ КАНДИДАТА:
Грейд: ${resumeData.grade}
Ключевые навыки: ${resumeData.skills.join(', ')}
Опыт: ${resumeData.experience.length} позиций

ВАКАНСИЯ:
Должность: ${vacancyData.jobTitle || 'Не указана'}
Компания: ${vacancyData.company || 'Не указана'}
Требования: ${vacancyData.requirements.join(', ')}

Требования к письму:
1. Персонализированное обращение
2. Подчеркивание релевантного опыта
3. Обоснование интереса к позиции
4. Профессиональный и дружелюбный тон
5. Конкретные примеры достижений
6. Готовность к собеседованию

Ответь в следующем JSON формате:
{
  "coverLetter": "полный текст сопроводительного письма",
  "keyPoints": ["ключевые моменты письма"],
  "tone": "профессиональный и дружелюбный",
  "length": "оптимальная длина"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt }
      ],
      temperature: 0.5,
      max_tokens: 1500
    });

    const result = JSON.parse(response.choices[0].message.content);
    return result;

  } catch (error) {
    console.error('Ошибка генерации сопроводительного письма:', error);
    throw new Error('Ошибка AI-генерации письма: ' + error.message);
  }
}

/**
 * Генерация уточняющих вопросов
 * @param {Object} resumeData - Данные резюме
 * @param {Object} vacancyData - Данные вакансии
 * @returns {Object} Список уточняющих вопросов
 */
async function generateClarificationQuestions(resumeData, vacancyData) {
  try {
    const prompt = `
Сгенерируй уточняющие вопросы для кандидата:

ДАННЫЕ КАНДИДАТА:
Грейд: ${resumeData.grade}
Опыт: ${resumeData.experience.length} позиций

ВАКАНСИЯ:
Требуемый грейд: ${vacancyData.requiredGrade}
Требования: ${vacancyData.requirements.join(', ')}

Создай вопросы для уточнения:
1. Достижения, не попавшие в резюме
2. Важные проекты для данной вакансии
3. Конкретные цифры и метрики
4. Навыки и курсы для выделения
5. Планы карьерного развития

Ответь в следующем JSON формате:
{
  "questions": [
    {
      "category": "достижения",
      "question": "текст вопроса",
      "purpose": "цель вопроса"
    }
  ],
  "priority": ["приоритетные вопросы"],
  "expectedAnswers": "тип ожидаемых ответов"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt }
      ],
      temperature: 0.4,
      max_tokens: 1000
    });

    const result = JSON.parse(response.choices[0].message.content);
    return result;

  } catch (error) {
    console.error('Ошибка генерации вопросов:', error);
    throw new Error('Ошибка AI-генерации вопросов: ' + error.message);
  }
}

module.exports = {
  analyzeResume,
  analyzeVacancy,
  compareResumeWithVacancy,
  editResumeForVacancy,
  generateCoverLetter,
  generateClarificationQuestions
};
