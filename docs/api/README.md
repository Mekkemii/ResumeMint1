# API Endpoints - ResumeMint

## 📋 Описание

Документация API endpoints для ResumeMint backend сервера. Все endpoints доступны через `/api/` префикс.

## 🌐 Базовый URL

```
http://localhost:8080/api/  # Через Nginx прокси
http://localhost:5000/api/  # Прямой доступ к backend
```

## 📊 Общая информация

- **Content-Type**: `application/json`
- **Методы**: GET, POST
- **Аутентификация**: Не требуется
- **Лимиты**: 10MB на файл, 10MB на JSON

## 🔧 Основные Endpoints

### 1. `/api/parse/docx`

**Описание**: Парсинг DOCX файлов в текст

**Метод**: `POST`

**Content-Type**: `multipart/form-data`

**Параметры**:
- `file` - DOCX файл (обязательный)

**Пример запроса**:
```bash
curl -X POST http://localhost:8080/api/parse/docx \
  -F "file=@resume.docx"
```

**Ответ**:
```json
{
  "success": true,
  "text": "Извлеченный текст из DOCX файла...",
  "filename": "resume.docx"
}
```

**Ошибки**:
- `400` - Неверный формат файла
- `413` - Файл слишком большой
- `500` - Ошибка парсинга

### 2. `/api/analyze`

**Описание**: Анализ резюме с помощью AI

**Метод**: `POST`

**Content-Type**: `application/json`

**Параметры**:
- `resumeText` - Текст резюме (обязательный)
- `jobText` - Описание вакансии (опциональный)

**Пример запроса**:
```bash
curl -X POST http://localhost:8080/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "resumeText": "Иван Иванов\nРазработчик Python...",
    "jobText": "Требуется Python разработчик..."
  }'
```

**Ответ**:
```json
{
  "success": true,
  "analysis": {
    "summary": "Краткое резюме...",
    "strengths": ["Сильные стороны..."],
    "weaknesses": ["Области для улучшения..."],
    "recommendations": ["Рекомендации..."]
  },
  "match": {
    "score": 85,
    "details": "Детали соответствия..."
  }
}
```

### 3. `/api/premium/oneshot`

**Описание**: Премиум анализ с расширенными возможностями

**Метод**: `POST`

**Content-Type**: `application/json`

**Параметры**:
- `resumeText` - Текст резюме (обязательный)
- `jobText` - Описание вакансии (обязательный)

**Особенности**:
- Использует GPT-4o-mini модель
- Более детальный анализ
- Структурированный вывод

**Ответ**:
```json
{
  "success": true,
  "premium_analysis": {
    "executive_summary": "Краткое резюме для руководителя",
    "technical_skills": {
      "primary": ["Python", "Django"],
      "secondary": ["JavaScript", "React"]
    },
    "experience_analysis": "Анализ опыта работы",
    "cultural_fit": "Соответствие корпоративной культуре",
    "salary_recommendation": "Рекомендации по зарплате"
  }
}
```

### 4. `/api/combo/summary-match`

**Описание**: Комбинированный анализ с сводкой и соответствием

**Метод**: `POST`

**Content-Type**: `application/json`

**Параметры**:
- `resumeText` - Текст резюме (обязательный)
- `jobText` - Описание вакансии (обязательный)

**Ответ**:
```json
{
  "success": true,
  "summary": "Краткая сводка резюме",
  "match_analysis": {
    "overall_score": 87,
    "skills_match": 90,
    "experience_match": 85,
    "culture_match": 80
  },
  "detailed_feedback": "Детальная обратная связь"
}
```

### 5. `/api/vacancy/detailed-match`

**Описание**: Детальный анализ соответствия резюме требованиям вакансии с подробной обратной связью

**Метод**: `POST`

**Content-Type**: `application/json`

**Параметры**:
- `resumeText` - Текст резюме (обязательный)
- `jobText` - Описание вакансии (обязательный)

**Особенности**:
- Детальный анализ каждого требования
- Подробная обратная связь о недостатках
- Конкретные рекомендации для улучшения
- Построчный анализ соответствия

**Ответ**:
```json
{
  "job": {
    "job_summary": "Краткое описание позиции",
    "requirements": ["Требование 1", "Требование 2"],
    "nice_to_have": ["Желательный навык 1"],
    "job_grade": {
      "level": "Junior",
      "rationale": "Обоснование требуемого уровня"
    }
  },
  "candidate": {
    "candidate_summary": "Краткое описание кандидата",
    "candidate_grade": {
      "level": "Middle",
      "rationale": "Обоснование уровня кандидата"
    },
    "key_skills": ["Навык 1", "Навык 2"],
    "experience_summary": "Краткое описание опыта"
  },
  "match": {
    "overall_match": 75,
    "grade_fit": "выше требуемого",
    "chances": "Высокие",
    "strengths": ["Сильная сторона 1", "Сильная сторона 2"],
    "weaknesses": ["Слабая сторона 1"],
    "missing_requirements": ["Недостающий навык 1"],
    "recommendations": ["Рекомендация 1", "Рекомендация 2"]
  },
  "detailed_analysis": [
    {
      "requirement": "Требование из вакансии",
      "evidence": "Доказательства из резюме",
      "status": "полное соответствие",
      "score": 90,
      "comment": "Подробный комментарий"
    }
  ]
}
```

### 6. `/api/cover/generate`

**Описание**: Генерация персонализированного сопроводительного письма

**Метод**: `POST`

**Content-Type**: `application/json`

**Параметры**:
- `resumeText` - Текст резюме (обязательный)
- `jobText` - Описание вакансии (обязательный)

**Особенности**:
- Персонализированное письмо на основе резюме и вакансии
- Профессиональный тон
- Соответствие требованиям вакансии
- Оптимальная длина (110-160 слов)

**Ответ**:
```json
{
  "cover_letter": "Уважаемый работодатель! Меня зовут [Имя], и я хотел бы представить свою кандидатуру на позицию [Должность] в вашей компании. Имея [X] лет опыта в [области], я успешно реализовал проекты, связанные с [конкретные достижения]. Мой опыт работы с [технологии/навыки] полностью соответствует требованиям вашей вакансии. В частности, я [конкретные примеры соответствия требованиям]. Меня привлекает возможность работать в [название компании] благодаря [причины]. Готов обсудить, как мой опыт может быть полезен вашей команде. С уважением, [Имя]"
}
```

## 🔍 Вспомогательные Endpoints

### `/api/ping`

**Описание**: Проверка работоспособности API

**Метод**: `GET`

**Ответ**:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00Z",
  "version": "1.0.0"
}
```

### `/api/health`

**Описание**: Проверка здоровья системы

**Метод**: `GET`

**Ответ**:
```json
{
  "status": "healthy",
  "openai": "connected",
  "memory": "45%",
  "uptime": "2h 30m"
}
```

## 📝 Примеры использования

### JavaScript (Frontend)

```javascript
// Парсинг DOCX
async function parseDocx(file) {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('/api/parse/docx', {
    method: 'POST',
    body: formData
  });
  
  return await response.json();
}

// Анализ резюме
async function analyzeResume(resumeText, jobText = null) {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      resumeText,
      jobText
    })
  });
  
  return await response.json();
}

// Премиум анализ
async function premiumAnalysis(resumeText, jobText) {
  const response = await fetch('/api/premium/oneshot', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      resumeText,
      jobText
    })
  });
  
  return await response.json();
}
```

### Python

```python
import requests

# Парсинг DOCX
def parse_docx(file_path):
    with open(file_path, 'rb') as f:
        files = {'file': f}
        response = requests.post('http://localhost:8080/api/parse/docx', files=files)
    return response.json()

# Анализ резюме
def analyze_resume(resume_text, job_text=None):
    data = {'resumeText': resume_text}
    if job_text:
        data['jobText'] = job_text
    
    response = requests.post('http://localhost:8080/api/analyze', json=data)
    return response.json()
```

### cURL

```bash
# Проверка API
curl http://localhost:8080/api/ping

# Анализ резюме
curl -X POST http://localhost:8080/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"resumeText": "Иван Иванов\nPython разработчик с 3 годами опыта..."}'

# Парсинг файла
curl -X POST http://localhost:8080/api/parse/docx \
  -F "file=@resume.docx"
```

## ⚠️ Обработка ошибок

### Общий формат ошибки

```json
{
  "success": false,
  "error": "Описание ошибки",
  "code": "ERROR_CODE",
  "details": "Дополнительные детали"
}
```

### Коды ошибок

- `INVALID_FILE_TYPE` - Неподдерживаемый тип файла
- `FILE_TOO_LARGE` - Файл превышает лимит
- `INVALID_API_KEY` - Неверный OpenAI API ключ
- `OPENAI_ERROR` - Ошибка OpenAI API
- `VALIDATION_ERROR` - Ошибка валидации данных
- `INTERNAL_ERROR` - Внутренняя ошибка сервера

## 📊 Лимиты и ограничения

- **Размер файла**: 10MB
- **Размер JSON**: 10MB
- **Токены OpenAI**: 2000 (настраивается)
- **Время ответа**: 30 секунд
- **Запросы в минуту**: 60

## 🔗 Связанные файлы

- [Backend API](../backend/README.md)
- [Frontend интеграция](../frontend/README.md)
- [Docker конфигурация](../docker/README.md)
- [Troubleshooting](../troubleshooting/README.md)
