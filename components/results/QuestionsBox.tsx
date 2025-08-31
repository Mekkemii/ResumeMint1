import * as React from "react";

type Props = {
  questions: string[];
  onSubmit?: (answers: string[]) => void; // необязательный хук наверх
  storageKey?: string;                    // ключ для localStorage
};

export default function QuestionsBox({
  questions,
  onSubmit,
  storageKey = "rm-answers-default",
}: Props) {
  // поднимаем ответы из localStorage, если есть
  const load = (): string[] => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return questions.map(() => "");
  };

  const [answers, setAnswers] = React.useState<string[]>(load);
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    // если список вопросов изменился (другая проверка) — синхронизируем длину
    setAnswers((prev) => {
      const next = [...prev];
      next.length = questions.length;
      for (let i = 0; i < questions.length; i++) {
        if (typeof next[i] !== "string") next[i] = "";
      }
      return next;
    });
    setSaved(false);
  }, [questions]);

  const update = (i: number, v: string) => {
    setAnswers((arr) => {
      const next = arr.slice();
      next[i] = v;
      return next;
    });
    setSaved(false);
  };

  const save = () => {
    localStorage.setItem(storageKey, JSON.stringify(answers));
    setSaved(true);
    onSubmit?.(answers);
  };

  const clear = () => {
    const empty = questions.map(() => "");
    setAnswers(empty);
    localStorage.removeItem(storageKey);
    setSaved(false);
  };

  const copyAll = async () => {
    const text = questions
      .map((q, i) => `Q${i + 1}: ${q}\nA${i + 1}: ${answers[i] || "—"}\n`)
      .join("\n");
    await navigator.clipboard.writeText(text);
  };

  return (
    <section className="mt-4 bg-white/5 border border-white/10 rounded-3xl p-4 md:p-6">
      <div className="text-base md:text-lg font-semibold mb-3">
        Ответы на вопросы
      </div>

      {questions.length === 0 ? (
        <div className="text-white/70">Вопросов нет.</div>
      ) : (
        <div className="space-y-4">
          {questions.map((q, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="text-sm md:text-base font-medium">
                {i + 1}. {q}
              </div>
              <textarea
                value={answers[i] || ""}
                onChange={(e) => update(i, e.target.value)}
                placeholder="Ваш ответ…"
                rows={3}
                className="w-full rounded-2xl bg-[#252632] border border-white/10 px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500/40"
              />
              <div className="text-xs text-white/50">
                {answers[i]?.length || 0} символов
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          onClick={save}
          className="px-5 py-2.5 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white"
        >
          Сохранить ответы
        </button>
        <button
          onClick={copyAll}
          className="px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10"
        >
          Скопировать всё
        </button>
        <button
          onClick={clear}
          className="px-5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80"
        >
          Очистить
        </button>

        {saved && (
          <span className="self-center text-sm text-emerald-400">
            Сохранено локально
          </span>
        )}
      </div>

      {/* опционально — место для будущей кнопки генерации правок резюме */}
      {/* <div className="mt-3">
        <button className="px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10">
          Сгенерировать черновик правок резюме
        </button>
      </div> */}
    </section>
  );
}
