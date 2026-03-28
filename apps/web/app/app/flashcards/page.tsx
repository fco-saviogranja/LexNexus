"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../../src/lib/api";
import { EmptyState, MetricCard, PageHeader, ProgressBar, SectionTabs, StatusPill } from "../../../components/StudyUi";

type Discipline = {
  id: string;
  name: string;
};

type LibraryEntry = Discipline & {
  documents: Array<{ id: string }>;
};

type Flashcard = {
  id: string;
  front: string;
  back: string;
  discipline?: { name: string } | null;
  reviews?: Array<{ rating: "easy" | "medium" | "hard"; nextReviewAt: string }>;
};

export default function FlashcardsPage() {
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [disciplineId, setDisciplineId] = useState("");
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [allCards, setAllCards] = useState<Flashcard[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadAll() {
    const [library, dueCards, everyCard] = await Promise.all([
      apiFetch<LibraryEntry[]>("/library"),
      apiFetch<Flashcard[]>("/flashcards/due"),
      apiFetch<Flashcard[]>("/flashcards")
    ]);

    setDisciplines(
      library
        .map((item) => ({ id: item.id, name: item.name }))
        .sort((left, right) => left.name.localeCompare(right.name))
    );
    setCards(dueCards);
    setAllCards(everyCard);
  }

  useEffect(() => {
    loadAll().catch((err: Error) => {
      console.error(err);
      setError("Não foi possível carregar os flashcards.");
    });
  }, []);

  const reviewedCards = useMemo(() => allCards.filter((item) => item.reviews?.length).length, [allCards]);
  const completionRate = allCards.length ? Math.round((reviewedCards / allCards.length) * 100) : 0;

  async function create(event: FormEvent) {
    event.preventDefault();
    setStatus(null);
    setError(null);

    try {
      await apiFetch("/flashcards", {
        method: "POST",
        body: JSON.stringify({
          disciplineId: disciplineId || null,
          front,
          back,
          sourceType: "manual"
        })
      });

      setFront("");
      setBack("");
      setDisciplineId("");
      setStatus("Flashcard criado com sucesso.");
      await loadAll();
    } catch (err) {
      console.error(err);
      setError("Não foi possível criar o flashcard.");
    }
  }

  async function review(flashcardId: string, rating: "easy" | "medium" | "hard") {
    setStatus(null);
    setError(null);

    try {
      await apiFetch("/flashcards/reviews", {
        method: "POST",
        body: JSON.stringify({ flashcardId, rating })
      });
      setStatus("Revisão registrada e fila recalculada.");
      await loadAll();
    } catch (err) {
      console.error(err);
      setError("Não foi possível registrar a revisão.");
    }
  }

  async function createFromWrongQuestions() {
    setStatus(null);
    setError(null);

    try {
      const created = await apiFetch<Array<{ id: string }>>("/flashcards/from-wrong-questions", {
        method: "POST",
        body: JSON.stringify({ limit: 10 })
      });
      setStatus(`${created.length} flashcards gerados a partir dos erros recentes.`);
      await loadAll();
    } catch (err) {
      console.error(err);
      setError("Não foi possível gerar flashcards dos erros.");
    }
  }

  async function createFromAnnotations() {
    setStatus(null);
    setError(null);

    try {
      const created = await apiFetch<Array<{ id: string }>>("/flashcards/from-annotations", {
        method: "POST",
        body: JSON.stringify({ limit: 10 })
      });
      setStatus(`${created.length} flashcards gerados a partir das anotações.`);
      await loadAll();
    } catch (err) {
      console.error(err);
      setError("Não foi possível gerar flashcards das anotações.");
    }
  }

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Memorização jurídica"
        title="Fila diária de memória, não um depósito de frases."
        description="Os flashcards do LexNexus funcionam como camada de revisão orientada: criação manual, captura de erros e anotações, fila do dia e retorno calibrado pela prática."
        actions={
          <>
            <button type="button" onClick={createFromWrongQuestions}>
              Capturar erros
            </button>
            <button type="button" className="brand-button-secondary" onClick={createFromAnnotations}>
              Capturar anotacoes
            </button>
          </>
        }
        summary={
          <div className="space-y-5">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] brand-muted">Fila do dia</p>
              <h2 className="brand-title mt-3 text-3xl font-semibold">{cards.length} cartas aguardando resposta</h2>
              <p className="mt-3 text-sm leading-7 brand-muted">
                Quanto mais os erros entram na fila, mais o estudo deixa de desperdiçar fricção.
              </p>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm brand-muted">
                <span>Base revisada</span>
                <span>{completionRate}%</span>
              </div>
              <div className="mt-3">
                <ProgressBar value={completionRate} />
              </div>
            </div>
          </div>
        }
      />

      <SectionTabs
        items={[
          { label: "Fila do dia", href: "#fila", active: true },
          { label: "Novo flashcard", href: "#novo" },
          { label: "Fontes de captura", href: "#captura" }
        ]}
      />

      {status ? <div className="rounded-[12px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{status}</div> : null}
      {error ? <div className="rounded-[12px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Fila do dia" value={cards.length} hint="Cartas vencidas ou nunca revisadas." accent="due" />
        <MetricCard label="Base total" value={allCards.length} hint="Flashcards cadastrados." accent="stack" />
        <MetricCard label="Já revisados" value={reviewedCards} hint="Cartas com histórico." accent="review" />
        <MetricCard label="Cobertura" value={`${completionRate}%`} hint="Parcela da base com ao menos uma revisão." accent="cadence" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_380px]">
        <section id="novo" className="brand-card p-6 md:p-7">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] brand-muted">Novo flashcard</p>
              <h2 className="brand-title mt-2 text-3xl font-semibold">Adicionar conceito acionável</h2>
              <p className="mt-3 text-sm leading-7 brand-muted">
                Escreva a frente como pergunta ou gatilho de memória e o verso como resposta curta e útil.
              </p>
            </div>
            <StatusPill tone="info">Manual + automático</StatusPill>
          </div>

          <form onSubmit={create} className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold" htmlFor="flashcard-discipline">
                Disciplina
              </label>
              <select
                id="flashcard-discipline"
                value={disciplineId}
                onChange={(event) => setDisciplineId(event.target.value)}
              >
                <option value="">Sem vínculo</option>
                {disciplines.map((discipline) => (
                  <option key={discipline.id} value={discipline.id}>
                    {discipline.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold" htmlFor="flashcard-front">
                Frente
              </label>
              <input
                id="flashcard-front"
                value={front}
                onChange={(event) => setFront(event.target.value)}
                placeholder="Ex.: Requisitos da tutela de urgência"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold" htmlFor="flashcard-back">
                Verso
              </label>
              <textarea
                id="flashcard-back"
                value={back}
                onChange={(event) => setBack(event.target.value)}
                placeholder="Ex.: Probabilidade do direito e perigo de dano ou risco ao resultado útil do processo."
                required
              />
            </div>

            <button type="submit">Criar flashcard</button>
          </form>
        </section>

        <div className="grid gap-4">
          <section id="captura" className="brand-card p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] brand-muted">Fontes de captura</p>
            <h2 className="brand-title mt-3 text-3xl font-semibold">O que vira memória.</h2>
            <div className="mt-5 grid gap-3">
              <div className="rounded-[12px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold">Erros em questões</p>
                <p className="mt-2 text-sm leading-6 brand-muted">Transforme falhas recentes em cartas de reforço imediato.</p>
              </div>
              <div className="rounded-[12px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold">Anotações do viewer</p>
                <p className="mt-2 text-sm leading-6 brand-muted">Notas importantes saem da leitura e entram na fila de revisão.</p>
              </div>
              <div className="rounded-[12px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold">Criacao manual</p>
                <p className="mt-2 text-sm leading-6 brand-muted">Ideal para artigos, prazos, teses e listas secas.</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              <button type="button" className="w-full" onClick={createFromWrongQuestions}>
                Gerar dos erros
              </button>
              <button type="button" className="brand-button-secondary w-full" onClick={createFromAnnotations}>
                Gerar das anotações
              </button>
            </div>
          </section>

          <section className="brand-card p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] brand-muted">Continuidade</p>
            <h2 className="brand-title mt-3 text-3xl font-semibold">Ciclo completo de estudo.</h2>
            <p className="mt-3 text-sm leading-7 brand-muted">
              Alimente a fila a partir das questões e do viewer para que a memória acompanhe o resto do produto.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link className="brand-button-secondary" href="/app/questions">
                Ir para questões
              </Link>
              <Link className="brand-button-secondary" href="/app/library">
                Abrir biblioteca
              </Link>
            </div>
          </section>
        </div>
      </div>

      <section id="fila" className="brand-card p-6 md:p-7">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] brand-muted">Fila do dia</p>
            <h2 className="brand-title mt-2 text-3xl font-semibold">Revisão operacional</h2>
            <p className="mt-3 text-sm leading-7 brand-muted">
              Marque a dificuldade de cada carta. O sistema usa esse sinal para calcular a próxima volta.
            </p>
          </div>
          <StatusPill tone="info">{cards.length} em aberto</StatusPill>
        </div>

        {cards.length ? (
          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            {cards.map((card, index) => {
              const lastReview = card.reviews?.[0];

              return (
                <article key={card.id} className="rounded-[16px] border border-slate-200 bg-white p-5 md:p-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill tone="info">Card {index + 1}</StatusPill>
                    {card.discipline?.name ? <StatusPill tone="default">{card.discipline.name}</StatusPill> : null}
                    {lastReview?.nextReviewAt ? <StatusPill tone="warning">Retorno até {new Date(lastReview.nextReviewAt).toLocaleDateString("pt-BR")}</StatusPill> : null}
                  </div>
                  <p className="brand-title mt-5 text-3xl font-semibold leading-tight">{card.front}</p>
                  <div className="mt-5 rounded-[12px] border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] brand-muted">Resposta</p>
                    <p className="mt-3 text-sm leading-7 brand-muted">{card.back}</p>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <button type="button" className="brand-button-secondary" onClick={() => review(card.id, "easy")}>
                      Fácil
                    </button>
                    <button type="button" className="brand-button-secondary" onClick={() => review(card.id, "medium")}>
                      Médio
                    </button>
                    <button type="button" className="brand-button-secondary" onClick={() => review(card.id, "hard")}>
                      Difícil
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-6">
            <EmptyState
              title="Fila concluida."
              description="Não há revisões pendentes agora. Aproveite para capturar erros ou criar novas cartas a partir da biblioteca."
              action={
                <button type="button" onClick={createFromWrongQuestions}>
                  Gerar dos erros
                </button>
              }
            />
          </div>
        )}
      </section>
    </section>
  );
}
