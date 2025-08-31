/**
 * Сервис для обработки файлов резюме
 * Обеспечивает извлечение текста из различных форматов файлов
 */

const mammoth = require('mammoth');
const fs = require('fs').promises;
const path = require('path');

/**
 * Извлечение текста из файла резюме
 * @param {Object} file - Загруженный файл
 * @returns {string} Извлеченный текст
 */
async function extractTextFromFile(file) {
  try {
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    switch (fileExtension) {
      case '.docx':
        return await extractFromDocx(file);
      case '.doc':
        return await extractFromDoc(file);
      case '.txt':
        return await extractFromTxt(file);
      case '.pdf':
        return await extractFromPdf(file);
      default:
        throw new Error(`Неподдерживаемый формат файла: ${fileExtension}`);
    }
  } catch (error) {
    console.error('Ошибка извлечения текста из файла:', error);
    throw new Error('Ошибка обработки файла: ' + error.message);
  }
}

/**
 * Извлечение текста из DOCX файла
 * @param {Object} file - Загруженный файл
 * @returns {string} Извлеченный текст
 */
async function extractFromDocx(file) {
  try {
    const result = await mammoth.extractRawText({
      path: file.path
    });
    
    if (result.messages.length > 0) {
      console.warn('Предупреждения при обработке DOCX:', result.messages);
    }
    
    return result.value;
  } catch (error) {
    throw new Error('Ошибка обработки DOCX файла: ' + error.message);
  }
}

/**
 * Извлечение текста из DOC файла
 * @param {Object} file - Загруженный файл
 * @returns {string} Извлеченный текст
 */
async function extractFromDoc(file) {
  try {
    // Для DOC файлов используем тот же метод, что и для DOCX
    // mammoth может обрабатывать некоторые DOC файлы
    const result = await mammoth.extractRawText({
      path: file.path
    });
    
    if (result.messages.length > 0) {
      console.warn('Предупреждения при обработке DOC:', result.messages);
    }
    
    return result.value;
  } catch (error) {
    throw new Error('Ошибка обработки DOC файла. Убедитесь, что файл не поврежден.');
  }
}

/**
 * Извлечение текста из TXT файла
 * @param {Object} file - Загруженный файл
 * @returns {string} Извлеченный текст
 */
async function extractFromTxt(file) {
  try {
    const content = await fs.readFile(file.path, 'utf8');
    return content;
  } catch (error) {
    throw new Error('Ошибка чтения TXT файла: ' + error.message);
  }
}

/**
 * Извлечение текста из PDF файла
 * @param {Object} file - Загруженный файл
 * @returns {string} Извлеченный текст
 */
async function extractFromPdf(file) {
  try {
    // Для PDF файлов используем mammoth с конвертацией
    // Примечание: для полноценной работы с PDF может потребоваться дополнительная библиотека
    const result = await mammoth.extractRawText({
      path: file.path
    });
    
    if (result.messages.length > 0) {
      console.warn('Предупреждения при обработке PDF:', result.messages);
    }
    
    return result.value;
  } catch (error) {
    throw new Error('Ошибка обработки PDF файла. Убедитесь, что файл содержит извлекаемый текст.');
  }
}

/**
 * Очистка извлеченного текста
 * @param {string} text - Исходный текст
 * @returns {string} Очищенный текст
 */
function cleanExtractedText(text) {
  if (!text) {
    throw new Error('Пустой текст резюме');
  }
  
  // Удаление лишних пробелов и переносов строк
  let cleaned = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n\s*\n\s*\n/g, '\n\n') // Удаление множественных пустых строк
    .replace(/\s+/g, ' ') // Замена множественных пробелов одним
    .trim();
  
  // Проверка минимальной длины
  if (cleaned.length < 50) {
    throw new Error('Текст резюме слишком короткий. Минимум 50 символов.');
  }
  
  return cleaned;
}

/**
 * Валидация файла резюме
 * @param {Object} file - Загруженный файл
 * @returns {boolean} Результат валидации
 */
function validateResumeFile(file) {
  // Проверка наличия файла
  if (!file) {
    throw new Error('Файл не загружен');
  }
  
  // Проверка размера файла (максимум 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB в байтах
  if (file.size > maxSize) {
    throw new Error('Файл слишком большой. Максимальный размер: 10MB');
  }
  
  // Проверка типа файла
  const allowedTypes = [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/msword', // .doc
    'text/plain', // .txt
    'application/pdf' // .pdf
  ];
  
  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error('Неподдерживаемый тип файла. Разрешены: .docx, .doc, .txt, .pdf');
  }
  
  // Проверка расширения файла
  const allowedExtensions = ['.docx', '.doc', '.txt', '.pdf'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (!allowedExtensions.includes(fileExtension)) {
    throw new Error('Неподдерживаемое расширение файла. Разрешены: .docx, .doc, .txt, .pdf');
  }
  
  return true;
}

/**
 * Удаление временного файла
 * @param {string} filePath - Путь к файлу
 */
async function cleanupTempFile(filePath) {
  try {
    await fs.unlink(filePath);
    console.log('Временный файл удален:', filePath);
  } catch (error) {
    console.warn('Не удалось удалить временный файл:', filePath, error.message);
  }
}

/**
 * Полная обработка файла резюме
 * @param {Object} file - Загруженный файл
 * @returns {string} Обработанный текст резюме
 */
async function processResumeFile(file) {
  try {
    // Валидация файла
    validateResumeFile(file);
    
    // Извлечение текста
    const extractedText = await extractTextFromFile(file);
    
    // Очистка текста
    const cleanedText = cleanExtractedText(extractedText);
    
    // Удаление временного файла
    await cleanupTempFile(file.path);
    
    return cleanedText;
    
  } catch (error) {
    // Удаление временного файла в случае ошибки
    if (file && file.path) {
      await cleanupTempFile(file.path);
    }
    
    throw error;
  }
}

/**
 * Создание тестового резюме для демонстрации
 * @returns {string} Текст тестового резюме
 */
function getSampleResume() {
  return `
ИВАН ИВАНОВ
Frontend Developer

КОНТАКТЫ
Email: ivan.ivanov@email.com
Телефон: +7 (999) 123-45-67
LinkedIn: linkedin.com/in/ivanivanov

ПРОФЕССИОНАЛЬНЫЙ ОПЫТ

Frontend Developer | ООО "Технологии будущего" | 2022 - настоящее время
• Разрабатывал пользовательские интерфейсы с использованием React.js и TypeScript
• Оптимизировал производительность приложений, улучшив время загрузки на 30%
• Работал в команде из 5 разработчиков над крупным e-commerce проектом
• Интегрировал REST API и работал с Redux для управления состоянием

Junior Frontend Developer | ИП "Стартап" | 2021 - 2022
• Создавал адаптивные веб-страницы с использованием HTML5, CSS3, JavaScript
• Участвовал в разработке мобильного приложения с React Native
• Выполнял задачи по исправлению багов и улучшению UI/UX

ОБРАЗОВАНИЕ
Московский Технический Университет
Бакалавр информационных технологий | 2017 - 2021

НАВЫКИ
• JavaScript (ES6+), TypeScript
• React.js, React Native
• HTML5, CSS3, SASS/SCSS
• Git, GitHub
• REST API, GraphQL
• Webpack, Babel
• Jest, Testing Library

ЯЗЫКИ
Русский - родной
Английский - B2 (Upper Intermediate)

КУРСЫ И СЕРТИФИКАЦИИ
• React Developer Course - Udemy (2022)
• JavaScript Algorithms and Data Structures - freeCodeCamp (2021)
• Web Development Bootcamp - Яндекс.Практикум (2020)

О СЕБЕ
Увлеченный frontend разработчик с 2+ годами опыта создания современных веб-приложений. 
Стремлюсь к постоянному развитию и изучению новых технологий. 
Хорошо работаю в команде, умею эффективно решать задачи и соблюдать дедлайны.
  `.trim();
}

module.exports = {
  extractTextFromFile,
  cleanExtractedText,
  validateResumeFile,
  processResumeFile,
  getSampleResume
};
