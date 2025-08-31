# ResumeMint • Documentation Generator

Автоматическая генерация документации кода для проекта ResumeMint.

## Что делает

Инструмент `gendocs.ts` анализирует TypeScript и JavaScript файлы в проекте и создает Markdown документацию для каждого файла:

- **Экспорты** - все экспортируемые функции, классы, переменные
- **Express роуты** - автоматическое обнаружение API эндпоинтов
- **JSDoc комментарии** - извлечение документации из кода
- **Подписи функций** - отображение сигнатур (опционально)

## Установка

```bash
npm install
```

## Использование

### Генерация документации

```bash
npm run docs:code
```

### Альтернативный способ (если tsx не работает)

```bash
npm run docs:code:js
```

## Конфигурация

Настройки находятся в `tools/gendocs.config.json`:

```json
{
  "roots": ["backend/src", "frontend/src"],     // Директории для сканирования
  "include": ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],  // Включаемые файлы
  "exclude": ["**/*.d.ts", "**/__tests__/**"],  // Исключаемые файлы
  "outDir": "docs/code",                        // Папка для выходных файлов
  "indexFile": "docs/CODE_MAP.md",              // Главный индекс
  "titlePrefix": "ResumeMint •",                // Префикс заголовков
  "printSignatures": true,                      // Показывать сигнатуры функций
  "detectExpressRoutes": true                   // Искать Express роуты
}
```

## Структура выходных файлов

```
docs/
├─ CODE_MAP.md                    # Главный индекс со всеми ссылками
└─ code/
   ├─ backend/src/
   │  ├─ routes/
   │  │  ├─ job.ts.md            # Документация для job.ts
   │  │  └─ resume.ts.md         # Документация для resume.ts
   │  ├─ services/
   │  │  ├─ prompts.ts.md        # Документация для prompts.ts
   │  │  └─ llmClient.ts.md      # Документация для llmClient.ts
   │  └─ ...
   └─ frontend/src/
      ├─ components/
      │  ├─ Hero.tsx.md          # Документация для Hero.tsx
      │  └─ RequestPanels.tsx.md # Документация для RequestPanels.tsx
      └─ ...
```

## Пример выходного файла

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
router.post("/job/compare", async (req, res) => { /* ... */ })
```

## Express-роуты

* `POST /job/compare`  *(L12)*
```

## GitHub Action

При каждом пуше в `main` ветку автоматически запускается генерация документации (см. `.github/workflows/gendocs.yml`).

## Настройка для новых проектов

1. Скопируйте `tools/gendocs.config.json` и `tools/gendocs.ts`
2. Установите зависимости: `npm i -D ts-morph @babel/parser globby prettier gray-matter chalk tsx`
3. Добавьте скрипты в `package.json`:
   ```json
   {
     "scripts": {
       "docs:code": "tsx tools/gendocs.ts"
     }
   }
   ```
4. Настройте `gendocs.config.json` под вашу структуру проекта

## Расширение функциональности

Инструмент можно расширить для:

- **React компоненты** - извлечение пропсов и типов
- **API схемы** - автоматическая генерация OpenAPI/Swagger
- **Тесты** - документация тестовых сценариев
- **Миграции** - документация изменений БД

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
Инструмент ищет паттерны вида `router.METHOD(path, handler)`. Если используете другие паттерны, может потребоваться доработка регулярных выражений в `findExpressRoutesTS()`.
