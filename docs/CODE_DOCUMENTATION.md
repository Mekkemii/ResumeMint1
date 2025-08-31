# ResumeMint • Автоматическая документация кода

## Обзор

Проект ResumeMint теперь включает автоматический генератор документации кода, который создает Markdown файлы для каждого TypeScript/JavaScript файла в проекте.

## Что генерируется

### 1. Документация по файлам
Для каждого `.ts`, `.tsx`, `.js`, `.jsx` файла создается отдельный `.md` файл с:

- **Экспорты** - все экспортируемые функции, классы, переменные
- **Express роуты** - автоматическое обнаружение API эндпоинтов  
- **JSDoc комментарии** - извлечение документации из кода
- **Подписи функций** - отображение сигнатур (опционально)

### 2. Главный индекс
`docs/CODE_MAP.md` - карта всех файлов с группировкой по папкам

## Структура документации

```
docs/
├─ CODE_MAP.md                    # Главный индекс
└─ code/
   ├─ backend/src/
   │  ├─ routes/
   │  │  ├─ job.ts.md            # API роуты матчинга
   │  │  ├─ resume.ts.md         # API роуты оценки резюме
   │  │  ├─ cover.ts.md          # API роуты сопроводительного
   │  │  └─ premium.ts.md        # API роуты "всё сразу"
   │  ├─ services/
   │  │  ├─ prompts.ts.md        # Промпты для LLM
   │  │  ├─ llmClient.ts.md      # Клиент OpenAI
   │  │  └─ files.ts.md          # Обработка файлов
   │  ├─ middlewares/
   │  │  ├─ upload.ts.md         # Multer конфигурация
   │  │  ├─ validate.ts.md       # Валидация запросов
   │  │  └─ errors.ts.md         # Обработка ошибок
   │  └─ utils/
   │     ├─ text.ts.md           # Утилиты для текста
   │     └─ scoring.ts.md        # Метрики и оценки
   └─ frontend/src/
      ├─ components/
      │  ├─ Hero.tsx.md          # Главная секция
      │  ├─ HeroActions.tsx.md   # Кнопки действий
      │  ├─ RequestPanels.tsx.md # Панели форм
      │  └─ panels/
      │     ├─ ComparePanel.tsx.md
      │     ├─ ReviewPanel.tsx.md
      │     ├─ CoverPanel.tsx.md
      │     └─ PremiumPanel.tsx.md
      ├─ lib/
      │  ├─ api.ts.md            # API клиент
      │  └─ text.ts.md           # Текстовые утилиты
      └─ styles/
         └─ globals.css.md       # Глобальные стили
```

## Использование

### Локальная генерация

```bash
# Установка зависимостей
npm install

# Генерация документации
npm run docs:code
```

### Автоматическая генерация

При каждом пуше в `main` ветку GitHub Action автоматически:
1. Генерирует документацию
2. Коммитит изменения в `docs/code/`
3. Обновляет `docs/CODE_MAP.md`

## Конфигурация

Настройки в `tools/gendocs.config.json`:

```json
{
  "roots": ["backend/src", "frontend/src"],     // Сканируемые директории
  "include": ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],  // Включаемые файлы
  "exclude": ["**/*.d.ts", "**/__tests__/**"],  // Исключаемые файлы
  "outDir": "docs/code",                        // Папка для выходных файлов
  "indexFile": "docs/CODE_MAP.md",              // Главный индекс
  "titlePrefix": "ResumeMint •",                // Префикс заголовков
  "printSignatures": true,                      // Показывать сигнатуры функций
  "detectExpressRoutes": true                   // Искать Express роуты
}
```

## Примеры выходных файлов

### API роут (backend/src/routes/job.ts.md)

```markdown
# ResumeMint • backend/src/routes/job.ts

---
file: backend/src/routes/job.ts
updated: 2025-01-28T10:12:34.000Z
---

> Роуты матчинга вакансии. Принимает резюме/JD, возвращает разбор JD,
> требуемый грейд и сопоставление (match_percent, mapping и пр.)

## Экспорты

### `router` <sub>VariableDeclaration · L8-L76</sub>

```ts
router.post("/job/compare", async (req, res) => {
  try {
    const { resumeText, jobText } = req.body;
    // ... implementation
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
```

## Express-роуты

* `POST /job/compare`  *(L12)*
```

### React компонент (frontend/src/components/Hero.tsx.md)

```markdown
# ResumeMint • frontend/src/components/Hero.tsx

---
file: frontend/src/components/Hero.tsx
updated: 2025-01-28T10:12:34.000Z
---

> Главная секция с заголовком, описанием и кнопками действий

## Экспорты

### `Hero` <sub>FunctionDeclaration · L5-L45</sub>

```tsx
export default function Hero() {
  return (
    <section className="pt-8 pb-6">
      <div className="max-w-[1100px] mx-auto px-4 text-center">
        <h1 className="text-3xl md:text-4xl font-extrabold">
          AI ассистент для анализа резюме
        </h1>
        // ... JSX
      </div>
    </section>
  );
}
```
```

## Главный индекс (docs/CODE_MAP.md)

```markdown
# ResumeMint • Code Documentation Map

> Автогенерированная карта документации кода проекта.
> 
> Обновлено: 2025-01-28T10:12:34.000Z
> Файлов: 25

## backend/src

### routes

- [job.ts](./code/backend/src/routes/job.ts.md)
- [resume.ts](./code/backend/src/routes/resume.ts.md)
- [cover.ts](./code/backend/src/routes/cover.ts.md)
- [premium.ts](./code/backend/src/routes/premium.ts.md)

### services

- [prompts.ts](./code/backend/src/services/prompts.ts.md)
- [llmClient.ts](./code/backend/src/services/llmClient.ts.md)
- [files.ts](./code/backend/src/services/files.ts.md)

### middlewares

- [upload.ts](./code/backend/src/middlewares/upload.ts.md)
- [validate.ts](./code/backend/src/middlewares/validate.ts.md)
- [errors.ts](./code/backend/src/middlewares/errors.ts.md)

### utils

- [text.ts](./code/backend/src/utils/text.ts.md)
- [scoring.ts](./code/backend/src/utils/scoring.ts.md)

## frontend/src

### components

- [Hero.tsx](./code/frontend/src/components/Hero.tsx.md)
- [HeroActions.tsx](./code/frontend/src/components/HeroActions.tsx.md)
- [RequestPanels.tsx](./code/frontend/src/components/RequestPanels.tsx.md)

### panels

- [ComparePanel.tsx](./code/frontend/src/components/panels/ComparePanel.tsx.md)
- [ReviewPanel.tsx](./code/frontend/src/components/panels/ReviewPanel.tsx.md)
- [CoverPanel.tsx](./code/frontend/src/components/panels/CoverPanel.tsx.md)
- [PremiumPanel.tsx](./code/frontend/src/components/panels/PremiumPanel.tsx.md)

### lib

- [api.ts](./code/frontend/src/lib/api.ts.md)
- [text.ts](./code/frontend/src/lib/text.ts.md)

---

> Сгенерировано инструментом `tools/gendocs.ts`
```

## Преимущества

### 1. Автоматическое обновление
- Документация всегда актуальна
- Не нужно вручную обновлять при изменении кода
- GitHub Action автоматически генерирует на каждый пуш

### 2. Структурированность
- Четкая организация по папкам
- Легко найти нужный файл
- Главный индекс со всеми ссылками

### 3. Детальность
- Все экспорты с типами
- Express роуты с номерами строк
- JSDoc комментарии
- Сигнатуры функций

### 4. Интеграция
- Работает с TypeScript и JavaScript
- Поддержка React компонентов
- Автоматическое обнаружение Express роутов

## Расширение функциональности

Инструмент можно расширить для:

- **React пропсы** - извлечение типов пропсов компонентов
- **API схемы** - автоматическая генерация OpenAPI/Swagger
- **Тесты** - документация тестовых сценариев
- **Миграции** - документация изменений БД
- **Графики зависимостей** - визуализация связей между модулями

## Устранение неполадок

### "No files found"
Проверьте настройки в `gendocs.config.json`:
- Правильность путей в `roots`
- Корректность паттернов в `include`
- Не слишком ли строгие `exclude`

### Ошибки парсинга TypeScript
Убедитесь, что:
- Установлен `tsx` или `ts-node`
- Есть корректный `tsconfig.json`
- Файлы имеют правильные расширения

### Проблемы с Express роутами
Инструмент ищет паттерны вида `router.METHOD(path, handler)`. Если используете другие паттерны, может потребоваться доработка регулярных выражений.

## Заключение

Автоматическая документация кода значительно упрощает понимание и поддержку проекта ResumeMint. Каждый разработчик может быстро найти нужную информацию о любом файле в проекте, а документация всегда остается актуальной благодаря автоматической генерации.
