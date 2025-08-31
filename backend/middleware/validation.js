/**
 * Middleware для валидации данных и проверки конфигурации
 * Обеспечивает проверку входных данных и API ключей
 */

const Joi = require('joi');

/**
 * Проверка наличия и валидности OpenAI API ключа
 * @param {Object} req - Express request объект
 * @param {Object} res - Express response объект
 * @param {Function} next - Express next функция
 */
const validateApiKey = (req, res, next) => {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    const error = new Error('OpenAI API ключ не настроен');
    error.name = 'ConfigurationError';
    return next(error);
  }

  // Проверка формата API ключа (должен начинаться с sk-)
  if (!apiKey.startsWith('sk-')) {
    const error = new Error('Неверный формат OpenAI API ключа');
    error.name = 'ConfigurationError';
    return next(error);
  }

  next();
};

/**
 * Схема валидации для загрузки резюме
 */
const resumeUploadSchema = Joi.object({
  // Валидация текстового резюме
  resumeText: Joi.string().min(50).max(50000).optional(),
  
  // Валидация файла резюме
  file: Joi.object({
    originalname: Joi.string().pattern(/\.(docx|doc|txt|pdf)$/i).required(),
    mimetype: Joi.string().valid(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
      'application/pdf'
    ).required(),
    size: Joi.number().max(10 * 1024 * 1024).required() // 10MB максимум
  }).optional()
}).or('resumeText', 'file');

/**
 * Схема валидации для анализа вакансии
 */
const vacancyAnalysisSchema = Joi.object({
  vacancyUrl: Joi.string().uri().optional(),
  vacancyText: Joi.string().min(50).max(10000).optional(),
  jobTitle: Joi.string().min(2).max(100).optional(),
  company: Joi.string().min(2).max(100).optional()
}).or('vacancyUrl', 'vacancyText');

/**
 * Схема валидации для сравнения резюме и вакансии
 */
const comparisonSchema = Joi.object({
  resumeData: Joi.object({
    text: Joi.string().required(),
    grade: Joi.string().valid('Junior', 'Middle', 'Senior', 'Lead/Expert').required(),
    skills: Joi.array().items(Joi.string()).required(),
    experience: Joi.array().items(Joi.object({
      position: Joi.string().required(),
      company: Joi.string().required(),
      duration: Joi.string().required(),
      description: Joi.string().required()
    })).required()
  }).required(),
  
  vacancyData: Joi.object({
    requirements: Joi.array().items(Joi.string()).required(),
    requiredGrade: Joi.string().valid('Junior', 'Middle', 'Senior', 'Lead/Expert').required(),
    responsibilities: Joi.array().items(Joi.string()).required()
  }).required()
});

/**
 * Middleware для валидации загрузки резюме
 * @param {Object} req - Express request объект
 * @param {Object} res - Express response объект
 * @param {Function} next - Express next функция
 */
const validateResumeUpload = (req, res, next) => {
  try {
    const dataToValidate = {
      resumeText: req.body.resumeText,
      file: req.file
    };

    const { error } = resumeUploadSchema.validate(dataToValidate);
    
    if (error) {
      const validationError = new Error(`Ошибка валидации: ${error.details[0].message}`);
      validationError.name = 'ValidationError';
      validationError.details = error.details;
      return next(validationError);
    }

    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Middleware для валидации анализа вакансии
 * @param {Object} req - Express request объект
 * @param {Object} res - Express response объект
 * @param {Function} next - Express next функция
 */
const validateVacancyAnalysis = (req, res, next) => {
  try {
    const { error } = vacancyAnalysisSchema.validate(req.body);
    
    if (error) {
      const validationError = new Error(`Ошибка валидации вакансии: ${error.details[0].message}`);
      validationError.name = 'ValidationError';
      validationError.details = error.details;
      return next(validationError);
    }

    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Middleware для валидации сравнения данных
 * @param {Object} req - Express request объект
 * @param {Object} res - Express response объект
 * @param {Function} next - Express next функция
 */
const validateComparison = (req, res, next) => {
  try {
    const { error } = comparisonSchema.validate(req.body);
    
    if (error) {
      const validationError = new Error(`Ошибка валидации сравнения: ${error.details[0].message}`);
      validationError.name = 'ValidationError';
      validationError.details = error.details;
      return next(validationError);
    }

    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Middleware для валидации запроса на редактирование резюме
 * @param {Object} req - Express request объект
 * @param {Object} res - Express response объект
 * @param {Function} next - Express next функция
 */
const validateResumeEdit = (req, res, next) => {
  try {
    const editSchema = Joi.object({
      originalResume: Joi.string().required(),
      targetVacancy: Joi.object({
        requirements: Joi.array().items(Joi.string()).required(),
        requiredGrade: Joi.string().valid('Junior', 'Middle', 'Senior', 'Lead/Expert').required()
      }).required(),
      focusAreas: Joi.array().items(Joi.string()).optional()
    });

    const { error } = editSchema.validate(req.body);
    
    if (error) {
      const validationError = new Error(`Ошибка валидации редактирования: ${error.details[0].message}`);
      validationError.name = 'ValidationError';
      validationError.details = error.details;
      return next(validationError);
    }

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  validateApiKey,
  validateResumeUpload,
  validateVacancyAnalysis,
  validateComparison,
  validateResumeEdit
};
