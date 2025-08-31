/**
 * Маршруты для работы с резюме
 * Обеспечивает API endpoints для загрузки, анализа и редактирования резюме
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Импорт сервисов
const { analyzeResume, editResumeForVacancy } = require('../services/openaiService');
const { processResumeFile, getSampleResume } = require('../services/fileService');

// Импорт middleware
const { validateResumeUpload, validateResumeEdit } = require('../middleware/validation');

const router = express.Router();

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    
    try {
      // Создаем папку uploads, если она не существует
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    // Генерируем уникальное имя файла
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `resume-${uniqueSuffix}${ext}`);
  }
});

// Фильтр файлов
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/msword', // .doc
    'text/plain', // .txt
    'application/pdf' // .pdf
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Неподдерживаемый тип файла. Разрешены: .docx, .doc, .txt, .pdf'), false);
  }
};

// Настройка multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1 // только один файл
  }
});

/**
 * POST /api/resume/upload
 * Загрузка и анализ резюме
 */
router.post('/upload', upload.single('resume'), validateResumeUpload, async (req, res, next) => {
  try {
    let resumeText = '';
    
    // Обработка загруженного файла или текста
    if (req.file) {
      console.log('Обработка загруженного файла:', req.file.originalname);
      resumeText = await processResumeFile(req.file);
    } else if (req.body.resumeText) {
      console.log('Обработка текстового резюме');
      resumeText = req.body.resumeText.trim();
      
      if (resumeText.length < 50) {
        throw new Error('Текст резюме слишком короткий. Минимум 50 символов.');
      }
    } else {
      throw new Error('Необходимо загрузить файл или ввести текст резюме');
    }
    
    console.log('Начинаем AI-анализ резюме...');
    
    // AI-анализ резюме
    const analysisResult = await analyzeResume(resumeText);
    
    // Формирование ответа
    const response = {
      success: true,
      message: 'Резюме успешно проанализировано',
      data: {
        originalText: resumeText,
        analysis: analysisResult,
        timestamp: new Date().toISOString()
      }
    };
    
    console.log('Анализ резюме завершен успешно');
    res.json(response);
    
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/resume/analyze-text
 * Анализ текстового резюме без загрузки файла
 */
router.post('/analyze-text', async (req, res, next) => {
  try {
    const { resumeText } = req.body;
    
    if (!resumeText || resumeText.trim().length < 50) {
      throw new Error('Текст резюме слишком короткий. Минимум 50 символов.');
    }
    
    console.log('Анализ текстового резюме...');
    
    // AI-анализ резюме
    const analysisResult = await analyzeResume(resumeText.trim());
    
    const response = {
      success: true,
      message: 'Текстовое резюме успешно проанализировано',
      data: {
        originalText: resumeText.trim(),
        analysis: analysisResult,
        timestamp: new Date().toISOString()
      }
    };
    
    res.json(response);
    
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/resume/edit
 * Редактирование резюме под конкретную вакансию
 */
router.post('/edit', validateResumeEdit, async (req, res, next) => {
  try {
    const { originalResume, targetVacancy, focusAreas } = req.body;
    
    console.log('Начинаем редактирование резюме...');
    
    // AI-редактирование резюме
    const editResult = await editResumeForVacancy(originalResume, targetVacancy, focusAreas);
    
    const response = {
      success: true,
      message: 'Резюме успешно отредактировано',
      data: {
        originalResume,
        targetVacancy,
        editedResume: editResult,
        timestamp: new Date().toISOString()
      }
    };
    
    console.log('Редактирование резюме завершено успешно');
    res.json(response);
    
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/resume/sample
 * Получение примера резюме для демонстрации
 */
router.get('/sample', (req, res) => {
  try {
    const sampleResume = getSampleResume();
    
    const response = {
      success: true,
      message: 'Пример резюме загружен',
      data: {
        resumeText: sampleResume,
        description: 'Это пример резюме для демонстрации функциональности системы',
        timestamp: new Date().toISOString()
      }
    };
    
    res.json(response);
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Ошибка загрузки примера резюме',
      message: error.message
    });
  }
});

/**
 * POST /api/resume/validate
 * Валидация резюме без полного анализа
 */
router.post('/validate', async (req, res, next) => {
  try {
    const { resumeText } = req.body;
    
    if (!resumeText) {
      throw new Error('Текст резюме не предоставлен');
    }
    
    // Базовая валидация
    const validation = {
      length: resumeText.length,
      hasContacts: /(email|телефон|phone|@)/i.test(resumeText),
      hasExperience: /(опыт|experience|работал|работаю)/i.test(resumeText),
      hasSkills: /(навыки|skills|технологии|технологий)/i.test(resumeText),
      hasEducation: /(образование|education|университет|институт)/i.test(resumeText),
      isValid: resumeText.length >= 50
    };
    
    const response = {
      success: true,
      message: 'Валидация резюме завершена',
      data: {
        validation,
        recommendations: []
      }
    };
    
    // Добавляем рекомендации на основе валидации
    if (!validation.hasContacts) {
      response.data.recommendations.push('Добавьте контактную информацию');
    }
    if (!validation.hasExperience) {
      response.data.recommendations.push('Добавьте раздел с опытом работы');
    }
    if (!validation.hasSkills) {
      response.data.recommendations.push('Добавьте раздел с навыками');
    }
    if (!validation.hasEducation) {
      response.data.recommendations.push('Добавьте информацию об образовании');
    }
    
    res.json(response);
    
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/resume/formats
 * Получение информации о поддерживаемых форматах
 */
router.get('/formats', (req, res) => {
  const formats = {
    supportedFormats: [
      {
        extension: '.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        description: 'Microsoft Word Document (рекомендуется)'
      },
      {
        extension: '.doc',
        mimeType: 'application/msword',
        description: 'Microsoft Word Document (старый формат)'
      },
      {
        extension: '.txt',
        mimeType: 'text/plain',
        description: 'Текстовый файл'
      },
      {
        extension: '.pdf',
        mimeType: 'application/pdf',
        description: 'PDF документ (с извлекаемым текстом)'
      }
    ],
    maxFileSize: '10MB',
    recommendations: [
      'Используйте формат .docx для лучшей совместимости',
      'Убедитесь, что текст в PDF можно выделить и скопировать',
      'Избегайте использования таблиц и сложного форматирования',
      'Проверьте, что все символы корректно отображаются'
    ]
  };
  
  res.json({
    success: true,
    data: formats
  });
});

module.exports = router;
