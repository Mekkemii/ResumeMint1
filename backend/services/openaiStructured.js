/**
 * Сервис для работы с OpenAI Structured Outputs
 * Гарантирует жёсткий формат ответа по JSON-схеме
 */

const OpenAI = require('openai');
const { resumeEvaluationSchema } = require('../schemas/resumeEvaluation');

// Инициализация OpenAI клиента
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Оценка резюме с использованием Structured Outputs
 * @param {string} resumeText - Текст резюме
 * @param {Object} evidence - Информация о найденном опыте
 * @returns {Object} Структурированная оценка резюме
 */
async function evaluateResumeStructured(resumeText, evidence = {}) {
  try {
    console.log('🚀 Отправляем запрос к OpenAI с Structured Outputs...');
    
    // Проверяем API ключ
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key-here') {
      throw new Error('OpenAI API ключ не настроен');
    }

    const { systemPrompt, userPrompt } = require('../prompts/apiResumeReview');
    
    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: userPrompt(resumeText, evidence)
      }
    ];

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages,
      temperature: 0.2,
      top_p: 1,
      seed: 42, // Фиксированный seed для воспроизводимости
      max_tokens: 1500,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "ResumeMintEvaluation",
          schema: resumeEvaluationSchema,
          strict: true
        }
      }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Пустой ответ от OpenAI');
    }

    // Парсим JSON ответ
    let evaluation;
    try {
      evaluation = JSON.parse(content);
    } catch (parseError) {
      console.error('Ошибка парсинга JSON:', parseError);
      console.error('Сырой ответ:', content);
      throw new Error('Невалидный JSON ответ от модели');
    }

    // Логируем для диагностики
    console.log('📊 Результат оценки:');
    console.log(`  Грейд: ${evaluation.grade?.level || 'Unknown'}`);
    console.log(`  Оценки: text=${evaluation.scores?.text}, structure=${evaluation.scores?.structure}, overall=${evaluation.scores?.overall}`);
    console.log(`  ATS: ${evaluation.ats?.score}`);
    console.log(`  Токены: ${response.usage?.prompt_tokens}/${response.usage?.completion_tokens}`);
    console.log(`  Модель: ${response.model}`);
    console.log(`  System fingerprint: ${response.system_fingerprint}`);

    return {
      evaluation,
      raw_model_output: content,
      usage: response.usage,
      model: response.model,
      system_fingerprint: response.system_fingerprint,
      meta: {
        model: response.model,
        temperature: 0.2,
        seed: 42,
        ts: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error('❌ Ошибка при оценке резюме:', error.message);
    
    // Возвращаем fallback ответ в случае ошибки
    return {
      evaluation: {
        grade: {
          level: "Unknown",
          reason: "Ошибка при анализе резюме"
        },
        scores: {
          text: null,
          structure: null,
          overall: null
        },
        strengths: ["Не удалось проанализировать резюме"],
        gaps: ["Ошибка в системе анализа"],
        add: ["Попробуйте позже"],
        questions: ["Что произошло при анализе резюме?"]
      },
      error: error.message,
      raw_model_output: null,
      usage: null,
      model: null,
      system_fingerprint: null,
      meta: {
        model: null,
        temperature: 0.2,
        seed: 42,
        ts: new Date().toISOString()
      }
    };
  }
}

module.exports = { evaluateResumeStructured };
