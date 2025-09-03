# ResumeMint - Анализ резюме и вакансий

<!-- Vercel deployment update -->
ResumeMint Logo Version License Docker

<div align="center">

![ResumeMint Logo](https://img.shields.io/badge/ResumeMint-AI%20Powered-blue?style=for-the-badge&logo=openai)
![Version](https://img.shields.io/badge/version-1.0.0-green?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)
![Docker](https://img.shields.io/badge/Docker-Ready-blue?style=for-the-badge&logo=docker)

**Интеллектуальный анализ резюме и вакансий с использованием AI**

[🚀 Быстрый старт](#-быстрый-старт) • [📋 Возможности](#-возможности) • [📚 Документация](#-документация) • [🔧 Установка](#-установка)

</div>

---

## 📋 Описание

ResumeMint - это современное веб-приложение для анализа резюме и вакансий, использующее искусственный интеллект OpenAI для предоставления детальных рекомендаций и сопоставления кандидатов с требованиями работодателей.

### 🎯 Основные возможности

- **📊 Анализ резюме**: Детальный анализ сильных и слабых сторон
- **🎯 Сопоставление вакансий**: Точное сравнение резюме с требованиями
- **📝 Сопроводительные письма**: Автоматическая генерация персонализированных писем
- **🚀 Всё сразу**: Комплексный анализ в одном клике
- **🔒 Безопасность**: Защищенная обработка персональных данных
- **📱 Адаптивность**: Работа на всех устройствах

## 🚀 Быстрый старт

### Требования
- Docker 20.10+
- Docker Compose 2.0+
- OpenAI API ключ

### Установка за 3 минуты

```bash
# 1. Клонировать проект
git clone <repository-url>
cd ResumeMint1

# 2. Настроить API ключ
cp backend/env.example backend/.env
# Отредактировать backend/.env и добавить OPENAI_API_KEY

# 3. Запустить
docker compose up --build -d

# 4. Открыть в браузере
open http://localhost:8080
```

### Проверка работоспособности

```bash
# Проверить API
curl http://localhost:8080/api/ping

# Проверить логи
docker compose logs -f
```

## 📋 Возможности

### 🔍 Анализ резюме
- **Структурированный анализ**: Оценка опыта, навыков и достижений
- **Сильные стороны**: Выделение ключевых преимуществ кандидата
- **Области развития**: Конкретные рекомендации по улучшению
- **Советы по оптимизации**: Практические рекомендации

### 🎯 Детальное сопоставление
- **Построчный анализ**: Детальное сравнение каждого требования
- **Процент соответствия**: Точная оценка совместимости
- **Отсутствующие навыки**: Выявление недостающих компетенций
- **Рекомендации**: Конкретные шаги для улучшения

### 📝 Сопроводительные письма
- **Персонализация**: Учет специфики вакансии и опыта
- **Профессиональный тон**: Соответствие корпоративным стандартам
- **Конкретные достижения**: Акцент на измеримых результатах
- **Мотивация**: Обоснование интереса к позиции

### 🚀 Функция "Всё сразу"
- **Комплексный анализ**: Все функции в одном запросе
- **Параллельная обработка**: Быстрое получение результатов
- **Структурированный вывод**: Четкое разделение по разделам
- **Экономия времени**: Максимальная эффективность

## 📚 Документация

### 📖 Подробная документация

| Раздел | Описание | Файл |
|--------|----------|------|
| **Техническая документация** | Полное описание всех компонентов | [TECHNICAL_DOCS.md](TECHNICAL_DOCS.md) |
| **Обзор проекта** | Общая информация и архитектура | [docs/PROJECT_OVERVIEW.md](docs/PROJECT_OVERVIEW.md) |
| **Frontend** | Детали клиентской части | [docs/frontend/README.md](docs/frontend/README.md) |
| **Backend** | API и серверная логика | [docs/backend/README.md](docs/backend/README.md) |
| **Docker** | Контейнеризация и развертывание | [docs/docker/README.md](docs/docker/README.md) |
| **API** | Документация API endpoints | [docs/api/README.md](docs/api/README.md) |
| **Установка** | Пошаговые инструкции | [docs/setup/README.md](docs/setup/README.md) |
| **Конфигурация** | Настройки и переменные | [docs/config/README.md](docs/config/README.md) |
| **Развертывание** | Production deployment | [docs/deployment/README.md](docs/deployment/README.md) |
| **Troubleshooting** | Решение проблем | [docs/troubleshooting/README.md](docs/troubleshooting/README.md) |

## 🔧 Установка

### Локальная разработка

```bash
# Клонировать репозиторий
git clone <repository-url>
cd ResumeMint1

# Установить зависимости backend
cd backend
npm install

# Настроить переменные окружения
cp env.example .env
# Отредактировать .env

# Запустить backend
npm run dev

# В новом терминале запустить frontend
cd ..
python -m http.server 8080
```

### Docker развертывание

```bash
# Сборка и запуск
docker compose up --build -d

# Проверка статуса
docker compose ps

# Просмотр логов
docker compose logs -f
```

## 🔒 Безопасность

- **API ключи**: Хранение в защищенных переменных окружения
- **CORS защита**: Настроенные разрешенные источники
- **Rate limiting**: Ограничение количества запросов
- **Input validation**: Валидация входных данных

## 📄 Лицензия

Этот проект лицензирован под MIT License - см. файл [LICENSE](LICENSE) для деталей.

## 🆘 Поддержка

### Полезные ссылки

- **Техническая документация**: [TECHNICAL_DOCS.md](TECHNICAL_DOCS.md)
- **API Reference**: [docs/api/README.md](docs/api/README.md)
- **Troubleshooting**: [docs/troubleshooting/README.md](docs/troubleshooting/README.md)
- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)

### Часто задаваемые вопросы

**Q: Как получить OpenAI API ключ?**
A: Зарегистрируйтесь на [platform.openai.com](https://platform.openai.com) и создайте API ключ в разделе API Keys.

**Q: Почему не работает Docker?**
A: Убедитесь, что Docker Desktop установлен и запущен. См. [docs/troubleshooting/README.md](docs/troubleshooting/README.md).

**Q: Как изменить модель OpenAI?**
A: Отредактируйте переменную `OPENAI_MODEL` в файле `backend/.env`.

---

## 📖 Полная техническая документация

**Для получения полного технического описания проекта, архитектуры, API endpoints и детальной документации всех компонентов см. файл [TECHNICAL_DOCS.md](TECHNICAL_DOCS.md)**

---

<div align="center">

**ResumeMint** - Делаем анализ резюме простым и эффективным

[⭐ Star на GitHub](https://github.com/your-repo) • [🐛 Report Bug](https://github.com/your-repo/issues) • [💡 Request Feature](https://github.com/your-repo/issues)

</div>
