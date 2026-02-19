"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiFetch } from "../../../src/lib/api";

export default function FlashcardsPage() {
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [cards, setCards] = useState<any[]>([]);

  async function load() {
    const data = await apiFetch<any[]>("/flashcards/due");
    setCards(data);
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

  async function create(event: FormEvent) {
    event.preventDefault();
    await apiFetch("/flashcards", {
      method: "POST",
      body: JSON.stringify({ front, back, sourceType: "manual" })
    });
    setFront("");
    setBack("");
    await load();
  }

  async function review(flashcardId: string, rating: "easy" | "medium" | "hard") {
    await apiFetch("/flashcards/reviews", {
      method: "POST",
      body: JSON.stringify({ flashcardId, rating })
    });
    await load();
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Flashcards</h1>

      <form onSubmit={create} className="space-y-2 rounded border bg-white p-3">
        <input value={front} onChange={(e) => setFront(e.target.value)} placeholder="Frente" className="w-full" required />
        <textarea value={back} onChange={(e) => setBack(e.target.value)} placeholder="Verso" className="w-full" required />
        <button type="submit">Criar flashcard</button>
      </form>

      <div className="space-y-2">
        {cards.map((card) => (
          <article key={card.id} className="rounded border bg-white p-3">
            <p className="font-medium">{card.front}</p>
            <p className="text-sm text-slate-600">{card.back}</p>
            <div className="mt-2 flex gap-2">
              <button type="button" onClick={() => review(card.id, "easy").catch(console.error)}>Fácil</button>
              <button type="button" onClick={() => review(card.id, "medium").catch(console.error)}>Médio</button>
              <button type="button" onClick={() => review(card.id, "hard").catch(console.error)}>Difícil</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
