/**
 * Глобальный обработчик ошибок
 * Обеспечивает единообразную обработку ошибок во всем приложении
 */

/**
 * Middleware для обработки ошибок
 * @param {Error} err - Объект ошибки
 * @param {Object} req - Express request объект
 * @param {Object} res - Express response объект
 * @param {Function} next - Express next функция
 */
const errorHandler = (err, req, res, next) => {
  // Логирование ошибки для отладки
  console.error('🚨 Ошибка:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Определение типа ошибки и соответствующего HTTP статуса
  let statusCode = 500;
  let errorMessage = 'Внутренняя ошибка сервера';
  let errorCode = 'INTERNAL_SERVER_ERROR';

  // Обработка различных типов ошибок
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorMessage = 'Ошибка валидации данных';
    errorCode = 'VALIDATION_ERROR';
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    errorMessage = 'Не авторизован';
    errorCode = 'UNAUTHORIZED';
  } else if (err.name === 'ForbiddenError') {
    statusCode = 403;
    errorMessage = 'Доступ запрещен';
    errorCode = 'FORBIDDEN';
  } else if (err.name === 'NotFoundError') {
    statusCode = 404;
    errorMessage = 'Ресурс не найден';
    errorCode = 'NOT_FOUND';
  } else if (err.name === 'OpenAIError') {
    statusCode = 503;
    errorMessage = 'Ошибка AI сервиса. Попробуйте позже.';
    errorCode = 'AI_SERVICE_ERROR';
  } else if (err.name === 'FileUploadError') {
    statusCode = 400;
    errorMessage = 'Ошибка загрузки файла';
    errorCode = 'FILE_UPLOAD_ERROR';
  } else if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 413;
    errorMessage = 'Файл слишком большой. Максимальный размер: 10MB';
    errorCode = 'FILE_TOO_LARGE';
  } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    statusCode = 400;
    errorMessage = 'Неподдерживаемый тип файла';
    errorCode = 'UNSUPPORTED_FILE_TYPE';
  }

  // Формирование ответа с ошибкой
  const errorResponse = {
    error: {
      message: errorMessage,
      code: errorCode,
      timestamp: new Date().toISOString(),
      path: req.url,
      method: req.method
    }
  };

  // В режиме разработки добавляем дополнительную информацию об ошибке
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.details = {
      originalMessage: err.message,
      stack: err.stack
    };
  }

  // Отправка ответа с ошибкой
  res.status(statusCode).json(errorResponse);
};

module.exports = errorHandler;
