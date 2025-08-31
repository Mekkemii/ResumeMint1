/**
 * Расширенный детектор опыта работы в тексте резюме
 * Ищет признаки опыта с помощью регулярных выражений и контекстного анализа
 * Поддерживает различные форматы записи (HH, стандартные резюме, фриланс и т.д.)
 */

// Заголовки, которые НЕ являются опытом работы
const NOISE_HEADERS = [
  /^(специализаци[яи]|навыки|ключевые навыки|о себе|образование|сертификаты|курсы|обучение)\b/i,
];

// Заголовки, которые ЯВНО указывают на опыт работы
const EXP_HEADERS = [
  /^(опыт работы|профессиональный опыт|карьера|трудовая деятельность|история работы|работа)\b/i,
  /^(проекты|коммерческие проекты|кейсы|портфолио|реализованные проекты)\b/i,
  /^(практика|производственная практика|стажировка|интернатура|подработка|волонтерство)\b/i,
  /^(фриланс|консалтинг|внештатн|самозанят|гпх|удаленная работа|remote)\b/i,
];

// Ключевые слова, связанные с должностями и ролями
const POSITION_WORDS = /\b(должност|роль|позици|developer|engineer|analyst|менеджер|аналитик|разработчик|инженер|devops|data|fraud|антифрод|архитектор|дизайнер|тестировщик|qa|pm|po|ba|product|project|team lead|руководитель|директор|специалист|эксперт|консультант)\b/i;

// Ключевые слова, связанные с компаниями
const COMPANY_WORDS = /\b(ООО|АО|ПАО|банк|ltd|inc|corp|LLC|ООО\s+[«"].+?["»]?|банк\s+\S+|компания|организация|фирма|агентство|студия|лаборатория)\b/i;

// Ключевые слова, связанные с обязанностями
const DUTY_WORDS = /\b(обязанност|задач|ответственност|функци|работал|выполнял|участвовал|разрабатывал|создавал|оптимизировал|внедрял|интегрировал|поддерживал|администрировал)\b/i;

// Ключевые слова, связанные с достижениями
const ACH_WORDS = /\b(достижен|результат|kpi|метрик|экономическ|снизил|повысил|улучшил|увеличил|сократил|оптимизировал|автоматизировал|внедрил|реализовал|запустил|развернул)\b/i;

// Паттерн для дат (различные форматы)
const DATE_PATTERN = /(?:\b(20\d{2}|\d{2}\.\d{4}|\d{1,2}\.\d{4})\b)\s*[–\-—]\s*(?:\b(20\d{2}|по наст|наст\.|н\.в\.|\d{2}\.\d{4}|\d{1,2}\.\d{4}|настоящее время|present|current)\b)/i;

function detectExperience(text) {
  const raw = (text || "").replace(/\r/g, "\n");
  const lines = raw.split("\n");
  const clean = lines.map(s => s.trim()).filter(Boolean);

  const hits = [];
  const spans = [];

  // 1) Поиск явных заголовков опытных разделов
  for (let i = 0; i < clean.length; i++) {
    const line = clean[i].toLowerCase();
    if (EXP_HEADERS.some(h => h.test(clean[i]))) {
      // Собираем блок до следующего "шумного" заголовка
      let j = i + 1;
      while (j < clean.length && 
             !NOISE_HEADERS.some(n => n.test(clean[j])) && 
             !EXP_HEADERS.some(h => h.test(clean[j]))) {
        j++;
      }
      spans.push({ start: i, end: j - 1 });
      for (let k = i; k < j; k++) {
        if (!hits.includes(k)) hits.push(k);
      }
    }
  }

  // 1.5) Поиск заголовков в разных регистрах и с пробелами
  for (let i = 0; i < clean.length; i++) {
    const line = clean[i].toLowerCase().trim();
    const normalizedLine = line.replace(/\s+/g, ' ');
    
    // Проверяем различные варианты написания заголовков
    const isExpHeader = 
      normalizedLine.includes('опыт работы') ||
      normalizedLine.includes('профессиональный опыт') ||
      normalizedLine.includes('карьера') ||
      normalizedLine.includes('трудовая деятельность') ||
      normalizedLine.includes('история работы') ||
      normalizedLine.includes('работа') ||
      normalizedLine.includes('проекты') ||
      normalizedLine.includes('коммерческие проекты') ||
      normalizedLine.includes('кейсы') ||
      normalizedLine.includes('портфолио') ||
      normalizedLine.includes('практика') ||
      normalizedLine.includes('стажировка') ||
      normalizedLine.includes('интернатура') ||
      normalizedLine.includes('подработка') ||
      normalizedLine.includes('фриланс') ||
      normalizedLine.includes('консалтинг') ||
      normalizedLine.includes('самозанят');
    
    if (isExpHeader) {
      // Собираем блок до следующего "шумного" заголовка
      let j = i + 1;
      while (j < clean.length && 
             !NOISE_HEADERS.some(n => n.test(clean[j])) && 
             !EXP_HEADERS.some(h => h.test(clean[j]))) {
        j++;
      }
      spans.push({ start: i, end: j - 1 });
      for (let k = i; k < j; k++) {
        if (!hits.includes(k)) hits.push(k);
      }
    }
  }

  // 2) Поиск строк с датами и признаками опыта (HH формат)
  for (let i = 0; i < clean.length; i++) {
    const s = clean[i];
    if (DATE_PATTERN.test(s)) {
      // Проверяем контекст вокруг даты (окно в 4 строки)
      const window = clean.slice(Math.max(0, i - 2), Math.min(clean.length, i + 4)).join(" ");
      if (POSITION_WORDS.test(window) || COMPANY_WORDS.test(window) || DUTY_WORDS.test(window) || ACH_WORDS.test(window)) {
        if (!hits.includes(i)) hits.push(i);
        spans.push({ start: i, end: Math.min(clean.length - 1, i + 3) });
      }
    }
  }

  // 3) Поиск строк с явными признаками опыта (даже без дат)
  for (let i = 0; i < clean.length; i++) {
    const s = clean[i];
    // Если строка содержит должность + компанию или обязанности
    if ((POSITION_WORDS.test(s) && COMPANY_WORDS.test(s)) || 
        (POSITION_WORDS.test(s) && DUTY_WORDS.test(s)) ||
        (COMPANY_WORDS.test(s) && ACH_WORDS.test(s))) {
      if (!hits.includes(i)) hits.push(i);
    }
  }

  // 4) Поиск строк с датами в начале (формат "2022 - н.в. | Должность | Компания")
  for (let i = 0; i < clean.length; i++) {
    const s = clean[i];
    if (/^\d{4}\s*[-–—]\s*(н\.в\.|наст\.|настоящее время|present|current|\d{4})/i.test(s)) {
      if (POSITION_WORDS.test(s) || COMPANY_WORDS.test(s)) {
        if (!hits.includes(i)) hits.push(i);
        spans.push({ start: i, end: Math.min(clean.length - 1, i + 3) });
      }
    }
  }

  // 5) Поиск строк с должностями и компаниями (даже без дат)
  for (let i = 0; i < clean.length; i++) {
    const s = clean[i];
    // Проверяем, что это не заголовок раздела
    const isHeader = NOISE_HEADERS.some(h => h.test(s)) || EXP_HEADERS.some(h => h.test(s));
    if (!isHeader && POSITION_WORDS.test(s) && COMPANY_WORDS.test(s)) {
      if (!hits.includes(i)) hits.push(i);
      // Ищем связанные строки (обязанности, достижения)
      let j = i + 1;
      while (j < clean.length && j < i + 5 && 
             (DUTY_WORDS.test(clean[j]) || ACH_WORDS.test(clean[j]) || clean[j].startsWith('•') || clean[j].startsWith('-'))) {
        j++;
      }
      spans.push({ start: i, end: j - 1 });
    }
  }

  // Уникализируем и сортируем
  const uniq = [...new Set(hits)].sort((a, b) => a - b);
  const linesOut = uniq.map(i => clean[i]).filter(Boolean).slice(0, 24);

  // Объединяем пересекающиеся интервалы
  spans.sort((a, b) => a.start - b.start);
  const merged = [];
  for (const s of spans) {
    if (!merged.length || s.start > merged[merged.length - 1].end + 1) {
      merged.push({ ...s });
    } else {
      merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, s.end);
    }
  }

  return { 
    found: uniq.length > 0, 
    lines: linesOut, 
    spans: merged 
  };
}

/**
 * Вставляет маркеры опыта в текст для лучшего распознавания моделью
 */
function injectExperienceMarkers(text, spans) {
  const raw = (text || "").replace(/\r/g, "\n");
  const lines = raw.split("\n");
  
  // Вставляем маркеры с конца, чтобы не сбить индексы
  for (let k = spans.length - 1; k >= 0; k--) {
    const { start, end } = spans[k];
    if (end + 1 < lines.length) {
      lines.splice(end + 1, 0, "[/EXPERIENCE]");
    }
    lines.splice(start, 0, "[EXPERIENCE]");
  }
  
  return lines.join("\n");
}

module.exports = { detectExperience, injectExperienceMarkers };
