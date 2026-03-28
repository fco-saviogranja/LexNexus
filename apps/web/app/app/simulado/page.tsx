"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../../src/lib/api";
import { EmptyState, MetricCard, PageHeader, ProgressBar, SectionTabs, StatusPill } from "../../../components/StudyUi";

type Discipline = {
  id: string;
  name: string;
  documents: Array<{ id: string }>;
};

type SimQuestion = {
  id: string;
  statement: string;
  disciplineId?: string;
  options: Array<{ optionLetter: string; content: string }>;
};

type SimResult = {
  total: number;
  correct: number;
  accuracy: number;
  report: Array<{
    questionId: string;
    selectedOption: string;
    correctOption?: string;
    isCorrect?: boolean;
  }>;
};

const presets = [10, 20, 40];

export default function SimuladoPage() {
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [count, setCount] = useState(20);
  const [disciplineId, setDisciplineId] = useState("");
  const [questions, setQuestions] = useState<SimQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<SimResult | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Discipline[]>("/library")
      .then(setDisciplines)
      .catch((err: Error) => {
        console.error(err);
        setError("Não foi possível carregar as disciplinas para o simulado.");
      });
  }, []);

  const answeredCount = Object.keys(answers).length;
  const selectedDiscipline = disciplines.find((item) => item.id === disciplineId);
  const reportByQuestion = useMemo(() => new Map(result?.report.map((item) => [item.questionId, item]) ?? []), [result]);

  async function generate() {
    setStatus(null);
    setError(null);

    try {
      const searchParams = new URLSearchParams({ count: String(count) });
      if (disciplineId) {
        searchParams.set("disciplineId", disciplineId);
      }

      const data = await apiFetch<SimQuestion[]>(`/questions/simulado?${searchParams.toString()}`);
      setQuestions(data);
      setAnswers({});
      setResult(null);
      setStatus(`Simulado com ${data.length} questões pronto para resolver.`);
    } catch (err) {
      console.error(err);
      setError("Não foi possível gerar o simulado.");
    }
  }

  async function submit() {
    setStatus(null);
    setError(null);

    try {
      const payload = Object.entries(answers).map(([questionId, selectedOption]) => ({ questionId, selectedOption }));
      const data = await apiFetch<SimResult>("/questions/simulado/submit", {
        method: "POST",
        body: JSON.stringify({
          disciplineId: disciplineId || undefined,
          title: selectedDiscipline ? `Simulado - ${selectedDiscipline.name}` : "Simulado livre",
          answers: payload
        })
      });
      setResult(data);
      setStatus("Resultado consolidado com sucesso.");
    } catch (err) {
      console.error(err);
      setError("Não foi possível fechar o simulado.");
    }
  }

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Avaliação"
        title="Transforme questões em prova com leitura de score."
        description="O simulador do LexNexus monta baterias sob medida, concentra as respostas em um fluxo único e fecha a rodada com relatório objetivo."
        actions={
          <>
            <button type="button" onClick={generate}>
              Gerar simulado
            </button>
            <Link className="brand-button-secondary" href="/app/dashboard">
              Abrir análise
            </Link>
          </>
        }
        summary={
          <div className="space-y-5">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] brand-muted">Rodada atual</p>
              <h2 className="brand-title mt-3 text-3xl font-semibold">
                {questions.length ? `${questions.length} questões abertas` : "Pronto para montar a prova"}
              </h2>
              <p className="mt-3 text-sm leading-7 brand-muted">
                {selectedDiscipline ? `Recorte principal: ${selectedDiscipline.name}.` : "Use todas as disciplinas ou estreite por uma frente específica."}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between text-sm brand-muted">
                <span>Questões respondidas</span>
                <span>{questions.length ? Math.round((answeredCount / questions.length) * 100) : 0}%</span>
              </div>
              <div className="mt-3">
                <ProgressBar value={questions.length ? (answeredCount / questions.length) * 100 : 0} />
              </div>
            </div>
          </div>
        }
      />

      <SectionTabs
        items={[
          { label: "Gerador", href: "#gerador", active: true },
          { label: "Prova", href: "#prova" },
          { label: "Resultado", href: "#resultado" }
        ]}
      />

      {status ? <div className="rounded-[12px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{status}</div> : null}
      {error ? <div className="rounded-[12px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Volume configurado" value={count} hint="Quantidade alvo por simulado." accent="prova" />
        <MetricCard label="Questões carregadas" value={questions.length} hint="Itens disponíveis nesta rodada." accent="pool" />
        <MetricCard label="Respondidas" value={answeredCount} hint="Itens já marcados." accent="andamento" />
        <MetricCard label="Score" value={`${result?.accuracy ?? 0}%`} hint="Acurácia da última submissão." accent="resultado" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_380px]">
        <section id="gerador" className="brand-card p-6 md:p-7">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] brand-muted">Gerador de prova</p>
              <h2 className="brand-title mt-2 text-3xl font-semibold">Monte a bateria</h2>
              <p className="mt-3 text-sm leading-7 brand-muted">
                Use presets de volume ou escolha a disciplina-alvo antes de abrir a rodada.
              </p>
            </div>
            <StatusPill tone="info">Banco dinâmico</StatusPill>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold" htmlFor="simulado-discipline">
                  Disciplina
                </label>
                <select id="simulado-discipline" value={disciplineId} onChange={(event) => setDisciplineId(event.target.value)}>
                  <option value="">Todas</option>
                  {disciplines.map((discipline) => (
                    <option key={discipline.id} value={discipline.id}>
                      {discipline.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold" htmlFor="simulado-count">
                  Número de questões
                </label>
                <input
                  id="simulado-count"
                  type="number"
                  min={1}
                  max={100}
                  value={count}
                  onChange={(event) => setCount(Number(event.target.value))}
                />
              </div>

              <button type="button" className="w-full" onClick={generate}>
                Gerar simulado
              </button>
            </div>

            <div className="grid gap-3">
              <p className="text-sm font-semibold">Presets rápidos</p>
              <div className="flex flex-wrap gap-3">
                {presets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className={count === preset ? undefined : "brand-button-secondary"}
                    onClick={() => setCount(preset)}
                  >
                    {preset} questões
                  </button>
                ))}
              </div>

              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                {disciplines.slice(0, 4).map((discipline) => (
                  <button
                    key={discipline.id}
                    type="button"
                    className={[
                      "rounded-[22px] border p-4 text-left",
                      disciplineId === discipline.id
                        ? "border-[var(--brand-primary)] bg-[var(--brand-primary-soft)]"
                        : "border-slate-200 bg-slate-50"
                    ].join(" ")}
                    onClick={() => setDisciplineId(discipline.id)}
                  >
                    <p className="font-semibold">{discipline.name}</p>
                    <p className="mt-2 text-sm leading-6 brand-muted">{discipline.documents.length} materiais vinculados.</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4">
          <article className="brand-card p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] brand-muted">Modo de uso</p>
            <h2 className="brand-title mt-3 text-3xl font-semibold">Feche a prova em uma sentada.</h2>
            <div className="mt-5 grid gap-3">
              <div className="rounded-[12px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold">1. Gere o lote</p>
                <p className="mt-2 text-sm leading-6 brand-muted">Escolha o volume e inicie a bateria.</p>
              </div>
              <div className="rounded-[12px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold">2. Marque tudo</p>
                <p className="mt-2 text-sm leading-6 brand-muted">Resposta única por questão, sem sair da tela.</p>
              </div>
              <div className="rounded-[12px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold">3. Leia o score</p>
                <p className="mt-2 text-sm leading-6 brand-muted">Acurácia e relatório por item logo após o envio.</p>
              </div>
            </div>
          </article>

          <article id="resultado" className="brand-card p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] brand-muted">Ultimo resultado</p>
            <h2 className="brand-title mt-3 text-3xl font-semibold">
              {result ? `${result.correct}/${result.total} corretas` : "Sem resultado ainda"}
            </h2>
            <p className="mt-3 text-sm leading-7 brand-muted">
              {result
                ? `Acurácia fechada em ${result.accuracy}%. Use o relatório para retornar aos pontos de maior atrito.`
                : "Submeta uma bateria completa para destravar o relatório detalhado."}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link className="brand-button-secondary" href="/app/dashboard">
                Abrir análise
              </Link>
              <Link className="brand-button-secondary" href="/app/flashcards">
                Revisar memória
              </Link>
            </div>
          </article>
        </section>
      </div>

      <section id="prova" className="brand-card p-6 md:p-7">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] brand-muted">Caderno de prova</p>
            <h2 className="brand-title mt-2 text-3xl font-semibold">Resolução em fluxo contínuo</h2>
          </div>
          {questions.length ? (
            <button type="button" onClick={submit}>
              Finalizar simulado
            </button>
          ) : null}
        </div>

        {questions.length ? (
          <div className="mt-6 grid gap-4">
            {questions.map((question, index) => {
              const review = reportByQuestion.get(question.id);

              return (
                <article key={question.id} className="rounded-[16px] border border-slate-200 bg-white p-5 md:p-6">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusPill tone="info">Questão {index + 1}</StatusPill>
                        {review ? (
                          <StatusPill tone={review.isCorrect ? "success" : "warning"}>
                            {review.isCorrect ? "Correta" : `Correta: ${review.correctOption}`}
                          </StatusPill>
                        ) : null}
                      </div>
                      <p className="mt-4 text-lg font-semibold leading-8">{question.statement}</p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3">
                    {question.options.map((option) => {
                      const selected = answers[question.id] === option.optionLetter;
                      const showCorrect = review?.correctOption === option.optionLetter;
                      const showWrong = selected && review && !review.isCorrect;

                      return (
                        <button
                          key={option.optionLetter}
                          type="button"
                          className={[
                            "flex flex-col items-start gap-3 rounded-[22px] border p-4 text-left",
                            showCorrect
                              ? "border-emerald-200 bg-emerald-50"
                              : showWrong
                                ? "border-rose-200 bg-rose-50"
                                : selected
                                  ? "border-[var(--brand-primary)] bg-[var(--brand-primary-soft)]"
                                  : "border-slate-200 bg-slate-50"
                          ].join(" ")}
                          onClick={() => setAnswers((current) => ({ ...current, [question.id]: option.optionLetter }))}
                        >
                          <span className="text-xs font-semibold uppercase tracking-[0.18em] brand-muted">{option.optionLetter}</span>
                          <span className="text-sm leading-7 text-slate-700">{option.content}</span>
                        </button>
                      );
                    })}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-6">
            <EmptyState
              title="Nenhum simulado gerado."
              description="Escolha volume e disciplina para abrir uma bateria de questões."
              action={
                <button type="button" onClick={generate}>
                  Gerar agora
                </button>
              }
            />
          </div>
        )}
      </section>
    </section>
  );
}
