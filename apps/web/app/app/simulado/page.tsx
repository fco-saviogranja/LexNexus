"use client";

import { useState } from "react";
import { apiFetch } from "../../../src/lib/api";

type SimQuestion = {
  id: string;
  statement: string;
  options: Array<{ optionLetter: string; content: string }>;
};

export default function SimuladoPage() {
  const [count, setCount] = useState(10);
  const [questions, setQuestions] = useState<SimQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<any>(null);

  async function generate() {
    const data = await apiFetch<SimQuestion[]>(`/questions/simulado?count=${count}`);
    setQuestions(data);
    setAnswers({});
    setResult(null);
  }

  async function submit() {
    const payload = Object.entries(answers).map(([questionId, selectedOption]) => ({ questionId, selectedOption }));
    const data = await apiFetch("/questions/simulado/submit", {
      method: "POST",
      body: JSON.stringify({ answers: payload })
    });
    setResult(data);
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Simulado</h1>
      <div className="flex gap-2">
        <input type="number" min={1} max={100} value={count} onChange={(e) => setCount(Number(e.target.value))} />
        <button type="button" onClick={() => generate().catch(console.error)}>Gerar</button>
      </div>

      {questions.map((q, index) => (
        <article key={q.id} className="rounded border bg-white p-3">
          <p>{index + 1}. {q.statement}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {q.options.map((opt) => (
              <button key={opt.optionLetter} type="button" onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: opt.optionLetter }))}>
                {opt.optionLetter}
              </button>
            ))}
          </div>
        </article>
      ))}

      {questions.length ? <button type="button" onClick={() => submit().catch(console.error)}>Finalizar simulado</button> : null}
      {result ? <pre className="rounded border bg-white p-3 text-xs">{JSON.stringify(result, null, 2)}</pre> : null}
    </section>
  );
}
