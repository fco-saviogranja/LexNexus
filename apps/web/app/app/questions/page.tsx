"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../../src/lib/api";

type Question = {
  id: string;
  statement: string;
  correctOption: string;
  options: Array<{ id: string; optionLetter: string; content: string }>;
};

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filter, setFilter] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  async function load() {
    const path = filter ? `/questions?q=${encodeURIComponent(filter)}` : "/questions";
    const data = await apiFetch<Question[]>(path);
    setQuestions(data);
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

  async function answer(questionId: string, selectedOption: string) {
    const result = await apiFetch<{ isCorrect: boolean }>("/answers", {
      method: "POST",
      body: JSON.stringify({ questionId, selectedOption })
    });
    setFeedback(result.isCorrect ? "Resposta correta" : "Resposta incorreta");
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Questões</h1>
      <div className="flex gap-2">
        <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Buscar enunciado" className="w-full" />
        <button type="button" onClick={() => load().catch(console.error)}>
          Filtrar
        </button>
      </div>
      {feedback ? <p className="text-sm text-blue-700">{feedback}</p> : null}
      {questions.map((question) => (
        <article key={question.id} className="rounded border bg-white p-3">
          <p className="font-medium">{question.statement}</p>
          <ul className="mt-2 space-y-2">
            {question.options.map((option) => (
              <li key={option.id} className="flex items-center justify-between rounded border p-2">
                <span>{option.optionLetter}) {option.content}</span>
                <button type="button" onClick={() => answer(question.id, option.optionLetter)}>Marcar</button>
              </li>
            ))}
          </ul>
        </article>
      ))}
    </section>
  );
}
