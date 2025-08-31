# ResumeMint — Docker Overlay

Это накладка (overlay) для твоего текущего репозитория ResumeMint, добавляющая запуск через Docker без изменений исходников.

## Что добавлено
- backend/Dockerfile — контейнер для Node.js API из папки backend.
- docker/Dockerfile.web — Nginx, который раздаёт фронтенд из корня репо и проксирует /api на backend.
- docker/nginx/default.conf — конфиг Nginx.
- docker-compose.yml — поднимает web (Nginx) и api (Node).
- .dockerignore — исключает backend/ и прочее из web-образа.

## Запуск
1) Скопируй файлы в корень твоего репо ResumeMint.
2) (Опционально) создай backend/.env и укажи OPENAI_API_KEY.
3) Запусти: docker compose up --build
4) Открой http://localhost:8080 — фронт; /api/* проксируется в backend:5000.
