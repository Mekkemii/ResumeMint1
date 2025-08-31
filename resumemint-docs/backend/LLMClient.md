# llmClient.js

## Назначение
Единая точка вызова OpenAI Chat Completions c `response_format: json_object`.

## Интерфейс
```js
chatJson({ messages, model?, max_tokens? }) -> { json, usage }
```

## Где править модель и температуру
Ищите якорь **[DOCS:LLM_CONFIG]**. По умолчанию:
- `model = process.env.MODEL_CHEAP || "gpt-4o-mini"`
- `temperature = 0.2`

## usage
Возвращает `{ prompt_tokens, completion_tokens, total_tokens }` — выводим в UI.
