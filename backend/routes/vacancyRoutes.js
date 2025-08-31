/**
 * Маршруты для работы с вакансиями
 * Обеспечивает API endpoints для анализа вакансий и определения требуемого грейда
 */

const express = require('express');

// Импорт сервисов
const { analyzeVacancy } = require('../services/openaiService');

// Импорт middleware
const { validateVacancyAnalysis } = require('../middleware/validation');

const router = express.Router();

/**
 * POST /api/vacancy/analyze
 * Анализ вакансии и определение требуемого грейда
 */
router.post('/analyze', validateVacancyAnalysis, async (req, res, next) => {
  try {
    const { vacancyUrl, vacancyText, jobTitle, company } = req.body;
    
    let vacancyContent = '';
    
    // Формирование контента вакансии
    if (vacancyText) {
      vacancyContent = vacancyText;
    } else if (vacancyUrl) {
      // В будущем здесь можно добавить парсинг с сайтов
      vacancyContent = `Вакансия по ссылке: ${vacancyUrl}`;
    } else {
      throw new Error('Необходимо предоставить текст вакансии или ссылку');
    }
    
    // Добавляем дополнительную информацию, если предоставлена
    if (jobTitle) {
      vacancyContent = `Должность: ${jobTitle}\n\n${vacancyContent}`;
    }
    
    if (company) {
      vacancyContent = `Компания: ${company}\n\n${vacancyContent}`;
    }
    
    console.log('Начинаем анализ вакансии...');
    
    // AI-анализ вакансии
    const analysisResult = await analyzeVacancy(vacancyContent);
    
    const response = {
      success: true,
      message: 'Вакансия успешно проанализирована',
      data: {
        originalContent: vacancyContent,
        analysis: analysisResult,
        metadata: {
          jobTitle,
          company,
          vacancyUrl,
          timestamp: new Date().toISOString()
        }
      }
    };
    
    console.log('Анализ вакансии завершен успешно');
    res.json(response);
    
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/vacancy/parse-url
 * Парсинг вакансии по URL (заглушка для будущей реализации)
 */
router.post('/parse-url', async (req, res, next) => {
  try {
    const { vacancyUrl } = req.body;
    
    if (!vacancyUrl) {
      throw new Error('URL вакансии не предоставлен');
    }
    
    // Проверка валидности URL
    try {
      new URL(vacancyUrl);
    } catch (error) {
      throw new Error('Некорректный URL');
    }
    
    // Заглушка для парсинга - в будущем здесь будет реальный парсинг
    const mockParsedContent = `
Должность: Frontend Developer
Компания: Технологическая компания

Требования:
• Опыт работы с React.js от 2 лет
• Знание TypeScript
• Опыт работы с REST API
• Умение работать в команде
• Английский язык B1+

Обязанности:
• Разработка пользовательских интерфейсов
• Оптимизация производительности приложений
• Работа с современными технологиями
• Участие в code review

Условия:
• Удаленная работа
• Конкурентная зарплата
• Профессиональное развитие
    `.trim();
    
    const response = {
      success: true,
      message: 'Вакансия успешно распарсена (демо-режим)',
      data: {
        originalUrl: vacancyUrl,
        parsedContent: mockParsedContent,
        note: 'Это демонстрационный контент. В реальной версии будет парсинг с сайта.',
        timestamp: new Date().toISOString()
      }
    };
    
    res.json(response);
    
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/vacancy/sample
 * Получение примера вакансии для демонстрации
 */
router.get('/sample', (req, res) => {
  try {
    const sampleVacancy = `
Frontend Developer

Компания: ООО "Инновационные технологии"

О нас:
Мы - быстрорастущая IT-компания, специализирующаяся на разработке современных веб-приложений. 
Наша команда создает продукты, которыми пользуются миллионы людей по всему миру.

Требования:
• Опыт разработки на JavaScript/TypeScript от 3 лет
• Глубокое знание React.js и экосистемы
• Опыт работы с современными инструментами сборки (Webpack, Vite)
• Знание принципов адаптивной верстки и UI/UX
• Опыт работы с Git и системами контроля версий
• Умение работать в команде и участвовать в code review
• Английский язык B2+ (чтение технической документации)

Обязанности:
• Разработка высоконагруженных пользовательских интерфейсов
• Оптимизация производительности веб-приложений
• Работа с REST API и GraphQL
• Участие в планировании архитектуры приложений
• Наставничество junior разработчиков
• Взаимодействие с дизайнерами и backend-разработчиками

Будет плюсом:
• Опыт работы с Next.js
• Знание Node.js и серверной разработки
• Опыт работы с Docker
• Понимание принципов CI/CD
• Опыт работы с системами мониторинга

Условия:
• Удаленная работа с возможностью офиса в Москве
• Конкурентная зарплата от 150 000 руб.
• Официальное трудоустройство
• Медицинская страховка
• Профессиональное развитие и обучение
• Современный стек технологий
• Гибкий график работы

Откликайтесь, если хотите работать над интересными проектами в дружной команде профессионалов!
    `.trim();
    
    const response = {
      success: true,
      message: 'Пример вакансии загружен',
      data: {
        vacancyText: sampleVacancy,
        description: 'Это пример вакансии для демонстрации функциональности системы',
        expectedGrade: 'Middle/Senior',
        timestamp: new Date().toISOString()
      }
    };
    
    res.json(response);
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Ошибка загрузки примера вакансии',
      message: error.message
    });
  }
});

/**
 * POST /api/vacancy/validate
 * Валидация текста вакансии
 */
router.post('/validate', async (req, res, next) => {
  try {
    const { vacancyText } = req.body;
    
    if (!vacancyText) {
      throw new Error('Текст вакансии не предоставлен');
    }
    
    // Базовая валидация
    const validation = {
      length: vacancyText.length,
      hasRequirements: /(требования|requirements|ожидаем|нужен)/i.test(vacancyText),
      hasResponsibilities: /(обязанности|responsibilities|задачи|будете)/i.test(vacancyText),
      hasExperience: /(опыт|experience|лет|год)/i.test(vacancyText),
      hasTechnologies: /(javascript|react|vue|angular|typescript|node|python|java)/i.test(vacancyText),
      hasSalary: /(зарплата|salary|руб|доллар|евро)/i.test(vacancyText),
      isValid: vacancyText.length >= 100
    };
    
    const response = {
      success: true,
      message: 'Валидация вакансии завершена',
      data: {
        validation,
        recommendations: []
      }
    };
    
    // Добавляем рекомендации на основе валидации
    if (!validation.hasRequirements) {
      response.data.recommendations.push('Добавьте раздел с требованиями к кандидату');
    }
    if (!validation.hasResponsibilities) {
      response.data.recommendations.push('Добавьте описание обязанностей');
    }
    if (!validation.hasExperience) {
      response.data.recommendations.push('Укажите требуемый опыт работы');
    }
    if (!validation.hasTechnologies) {
      response.data.recommendations.push('Перечислите требуемые технологии');
    }
    
    res.json(response);
    
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/vacancy/grade-info
 * Получение информации о грейдах
 */
router.get('/grade-info', (req, res) => {
  const gradeInfo = {
    grades: [
      {
        name: 'Junior',
        experience: '0-2 года',
        description: 'Базовое владение технологиями, выполнение типовых задач под контролем',
        characteristics: [
          'Базовые знания технологий',
          'Выполнение задач по плану',
          'Нуждается в наставничестве',
          'Изучение новых технологий'
        ]
      },
      {
        name: 'Middle',
        experience: '2-5 лет',
        description: 'Уверенная работа с продуктом, умение оптимизировать решения',
        characteristics: [
          'Самостоятельное выполнение задач',
          'Участие в планировании',
          'Помощь коллегам',
          'Ответственность за модули'
        ]
      },
      {
        name: 'Senior',
        experience: '5-8 лет',
        description: 'Проектирование архитектуры, решение сложных технических задач',
        characteristics: [
          'Проектирование архитектуры',
          'Решение сложных задач',
          'Управление процессами',
          'Наставничество команды'
        ]
      },
      {
        name: 'Lead/Expert',
        experience: '8+ лет',
        description: 'Глубокие технические знания и руководство командами',
        characteristics: [
          'Техническое лидерство',
          'Стратегические решения',
          'Управление командами',
          'Взаимодействие с клиентами'
        ]
      }
    ],
    note: 'Грейды могут варьироваться в зависимости от компании и проекта'
  };
  
  res.json({
    success: true,
    data: gradeInfo
  });
});

module.exports = router;
