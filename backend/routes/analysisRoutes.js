/**
 * Маршруты для комплексного анализа
 * Обеспечивает API endpoints для сравнения резюме с вакансией и генерации рекомендаций
 */

const express = require('express');

// Импорт сервисов
const { 
  compareResumeWithVacancy, 
  generateCoverLetter, 
  generateClarificationQuestions 
} = require('../services/openaiService');

// Импорт middleware
const { validateComparison } = require('../middleware/validation');

const router = express.Router();

/**
 * POST /api/analysis/compare
 * Сравнение резюме с вакансией и генерация рекомендаций
 */
router.post('/compare', validateComparison, async (req, res, next) => {
  try {
    const { resumeData, vacancyData } = req.body;
    
    console.log('Начинаем сравнение резюме с вакансией...');
    
    // AI-сравнение резюме с вакансией
    const comparisonResult = await compareResumeWithVacancy(resumeData, vacancyData);
    
    const response = {
      success: true,
      message: 'Сравнение резюме с вакансией завершено',
      data: {
        resumeData,
        vacancyData,
        comparison: comparisonResult,
        timestamp: new Date().toISOString()
      }
    };
    
    console.log('Сравнение завершено успешно');
    res.json(response);
    
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/analysis/cover-letter
 * Генерация сопроводительного письма
 */
router.post('/cover-letter', async (req, res, next) => {
  try {
    const { resumeData, vacancyData } = req.body;
    
    if (!resumeData || !vacancyData) {
      throw new Error('Необходимо предоставить данные резюме и вакансии');
    }
    
    console.log('Генерация сопроводительного письма...');
    
    // AI-генерация сопроводительного письма
    const coverLetterResult = await generateCoverLetter(resumeData, vacancyData);
    
    const response = {
      success: true,
      message: 'Сопроводительное письмо успешно сгенерировано',
      data: {
        resumeData,
        vacancyData,
        coverLetter: coverLetterResult,
        timestamp: new Date().toISOString()
      }
    };
    
    console.log('Сопроводительное письмо сгенерировано успешно');
    res.json(response);
    
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/analysis/questions
 * Генерация уточняющих вопросов
 */
router.post('/questions', async (req, res, next) => {
  try {
    const { resumeData, vacancyData } = req.body;
    
    if (!resumeData || !vacancyData) {
      throw new Error('Необходимо предоставить данные резюме и вакансии');
    }
    
    console.log('Генерация уточняющих вопросов...');
    
    // AI-генерация уточняющих вопросов
    const questionsResult = await generateClarificationQuestions(resumeData, vacancyData);
    
    const response = {
      success: true,
      message: 'Уточняющие вопросы сгенерированы',
      data: {
        resumeData,
        vacancyData,
        questions: questionsResult,
        timestamp: new Date().toISOString()
      }
    };
    
    console.log('Уточняющие вопросы сгенерированы успешно');
    res.json(response);
    
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/analysis/full-analysis
 * Полный анализ: резюме + вакансия + сравнение + рекомендации
 */
router.post('/full-analysis', async (req, res, next) => {
  try {
    const { resumeText, vacancyText, jobTitle, company } = req.body;
    
    if (!resumeText || !vacancyText) {
      throw new Error('Необходимо предоставить текст резюме и вакансии');
    }
    
    console.log('Начинаем полный анализ...');
    
    // Импортируем сервисы для анализа
    const { analyzeResume, analyzeVacancy, compareResumeWithVacancy } = require('../services/openaiService');
    
    // 1. Анализ резюме
    console.log('Шаг 1: Анализ резюме...');
    const resumeAnalysis = await analyzeResume(resumeText);
    
    // 2. Анализ вакансии
    console.log('Шаг 2: Анализ вакансии...');
    let vacancyContent = vacancyText;
    if (jobTitle) {
      vacancyContent = `Должность: ${jobTitle}\n\n${vacancyContent}`;
    }
    if (company) {
      vacancyContent = `Компания: ${company}\n\n${vacancyContent}`;
    }
    const vacancyAnalysis = await analyzeVacancy(vacancyContent);
    
    // 3. Сравнение
    console.log('Шаг 3: Сравнение резюме с вакансией...');
    const resumeData = {
      grade: resumeAnalysis.grade,
      skills: resumeAnalysis.keywords || [],
      experience: [], // Здесь можно добавить парсинг опыта из резюме
      text: resumeText
    };
    
    const vacancyData = {
      requiredGrade: vacancyAnalysis.requiredGrade,
      requirements: vacancyAnalysis.requirements?.technical || [],
      responsibilities: vacancyAnalysis.requirements?.responsibilities || [],
      jobTitle,
      company
    };
    
    const comparisonResult = await compareResumeWithVacancy(resumeData, vacancyData);
    
    // 4. Генерация сопроводительного письма
    console.log('Шаг 4: Генерация сопроводительного письма...');
    const { generateCoverLetter } = require('../services/openaiService');
    const coverLetterResult = await generateCoverLetter(resumeData, vacancyData);
    
    // 5. Генерация уточняющих вопросов
    console.log('Шаг 5: Генерация уточняющих вопросов...');
    const { generateClarificationQuestions } = require('../services/openaiService');
    const questionsResult = await generateClarificationQuestions(resumeData, vacancyData);
    
    const response = {
      success: true,
      message: 'Полный анализ завершен успешно',
      data: {
        resume: {
          originalText: resumeText,
          analysis: resumeAnalysis
        },
        vacancy: {
          originalText: vacancyText,
          analysis: vacancyAnalysis,
          metadata: { jobTitle, company }
        },
        comparison: comparisonResult,
        coverLetter: coverLetterResult,
        questions: questionsResult,
        summary: {
          candidateGrade: resumeAnalysis.grade,
          requiredGrade: vacancyAnalysis.requiredGrade,
          matchLevel: comparisonResult.gradeComparison?.match || 'Не определено',
          chances: comparisonResult.chances || 'Не определено',
          keyRecommendations: comparisonResult.recommendations?.slice(0, 3) || []
        },
        timestamp: new Date().toISOString()
      }
    };
    
    console.log('Полный анализ завершен успешно');
    res.json(response);
    
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/analysis/sample-comparison
 * Получение примера сравнения для демонстрации
 */
router.get('/sample-comparison', (req, res) => {
  try {
    const sampleComparison = {
      gradeComparison: {
        candidateGrade: "Middle",
        requiredGrade: "Senior",
        match: "Ниже",
        gap: "Кандидат имеет опыт Middle разработчика, но вакансия требует Senior уровня с опытом архитектурных решений"
      },
      requirementsMatch: {
        covered: [
          "JavaScript/TypeScript",
          "React.js",
          "Git",
          "REST API"
        ],
        missing: [
          "Архитектурные решения",
          "Управление командой",
          "Системы мониторинга",
          "CI/CD"
        ],
        coverage: 65
      },
      chances: "Средние",
      chancesReasoning: "Кандидат имеет хорошую техническую базу, но не хватает опыта в архитектурных решениях и управлении командой",
      developmentAreas: [
        "Архитектура приложений",
        "Управление командой",
        "Системы мониторинга",
        "CI/CD процессы"
      ],
      recommendations: [
        "Получить опыт в проектировании архитектуры приложений",
        "Практиковать наставничество junior разработчиков",
        "Изучить современные инструменты мониторинга",
        "Получить опыт работы с CI/CD"
      ],
      strengths: [
        "Хорошее знание React.js и TypeScript",
        "Опыт работы с REST API",
        "Умение работать в команде"
      ]
    };
    
    const response = {
      success: true,
      message: 'Пример сравнения загружен',
      data: {
        comparison: sampleComparison,
        description: 'Это пример сравнения резюме Middle разработчика с вакансией Senior позиции',
        timestamp: new Date().toISOString()
      }
    };
    
    res.json(response);
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Ошибка загрузки примера сравнения',
      message: error.message
    });
  }
});

/**
 * POST /api/analysis/ats-score
 * Расчет ATS-совместимости резюме
 */
router.post('/ats-score', async (req, res, next) => {
  try {
    const { resumeText, targetKeywords } = req.body;
    
    if (!resumeText) {
      throw new Error('Текст резюме не предоставлен');
    }
    
    // Простой алгоритм расчета ATS-совместимости
    const atsAnalysis = calculateATSScore(resumeText, targetKeywords);
    
    const response = {
      success: true,
      message: 'ATS-анализ завершен',
      data: {
        atsScore: atsAnalysis.score,
        analysis: atsAnalysis,
        recommendations: atsAnalysis.recommendations,
        timestamp: new Date().toISOString()
      }
    };
    
    res.json(response);
    
  } catch (error) {
    next(error);
  }
});

/**
 * Функция для расчета ATS-совместимости
 * @param {string} resumeText - Текст резюме
 * @param {Array} targetKeywords - Целевые ключевые слова
 * @returns {Object} Результат ATS-анализа
 */
function calculateATSScore(resumeText, targetKeywords = []) {
  const text = resumeText.toLowerCase();
  
  // Базовые проверки ATS
  const checks = {
    hasContactInfo: /(email|телефон|phone|@)/i.test(text),
    hasExperience: /(опыт|experience|работал|работаю)/i.test(text),
    hasSkills: /(навыки|skills|технологии|технологий)/i.test(text),
    hasEducation: /(образование|education|университет|институт)/i.test(text),
    noTables: !/(таблица|table|grid)/i.test(text),
    noImages: !/(изображение|image|картинка|picture)/i.test(text),
    properFormatting: /(\n|\r)/.test(text), // Есть переносы строк
    reasonableLength: text.length >= 500 && text.length <= 5000
  };
  
  // Подсчет совпадений ключевых слов
  let keywordMatches = 0;
  let matchedKeywords = [];
  
  if (targetKeywords && targetKeywords.length > 0) {
    targetKeywords.forEach(keyword => {
      if (text.includes(keyword.toLowerCase())) {
        keywordMatches++;
        matchedKeywords.push(keyword);
      }
    });
  }
  
  // Расчет общего балла
  const baseScore = Object.values(checks).filter(Boolean).length / Object.keys(checks).length * 100;
  const keywordScore = targetKeywords.length > 0 ? (keywordMatches / targetKeywords.length) * 100 : 100;
  const totalScore = Math.round((baseScore * 0.7) + (keywordScore * 0.3));
  
  // Формирование рекомендаций
  const recommendations = [];
  
  if (!checks.hasContactInfo) {
    recommendations.push('Добавьте контактную информацию');
  }
  if (!checks.hasExperience) {
    recommendations.push('Добавьте раздел с опытом работы');
  }
  if (!checks.hasSkills) {
    recommendations.push('Добавьте раздел с навыками');
  }
  if (!checks.hasEducation) {
    recommendations.push('Добавьте информацию об образовании');
  }
  if (!checks.noTables) {
    recommendations.push('Избегайте использования таблиц');
  }
  if (!checks.noImages) {
    recommendations.push('Не используйте изображения в резюме');
  }
  if (!checks.reasonableLength) {
    recommendations.push('Оптимизируйте длину резюме (500-5000 символов)');
  }
  
  if (targetKeywords.length > 0 && keywordMatches < targetKeywords.length * 0.5) {
    recommendations.push('Добавьте больше ключевых слов из описания вакансии');
  }
  
  return {
    score: totalScore,
    checks,
    keywordAnalysis: {
      totalKeywords: targetKeywords.length,
      matchedKeywords: keywordMatches,
      matchedKeywordsList: matchedKeywords,
      keywordScore: Math.round(keywordScore)
    },
    recommendations,
    grade: totalScore >= 80 ? 'Отлично' : totalScore >= 60 ? 'Хорошо' : totalScore >= 40 ? 'Удовлетворительно' : 'Требует доработки'
  };
}

module.exports = router;
