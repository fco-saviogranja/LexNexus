"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../../src/lib/api";
import { EmptyState, MetricCard, PageHeader, ProgressBar, SectionTabs, StatusPill } from "../../../components/StudyUi";

type DashboardData = {
  recentMaterials: Array<{
    sessionId: string;
    endedAt: string;
    durationSeconds: number;
    documentTitle: string;
  }>;
  weeklyHours: number;
  progressByDiscipline: Array<{
    disciplineId: string;
    disciplineName: string;
    percentCompleted: number;
  }>;
  consistencyDays: number;
  questionStats: {
    totalAnswers: number;
    correctAnswers: number;
    accuracyRate: number;
  };
  performanceStats: Array<{
    id: string;
    totalQuestions: number;
    correctAnswers: number;
    discipline?: { name: string } | null;
  }>;
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short"
});

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<DashboardData>("/dashboard")
      .then(setData)
      .catch((err: Error) => {
        console.error(err);
        setError("Não foi possível carregar a central de análise.");
      });
  }, []);

  const totalErrors = useMemo(() => {
    if (!data) {
      return 0;
    }

    return Math.max(0, data.questionStats.totalAnswers - data.questionStats.correctAnswers);
  }, [data]);

  const bestDiscipline = useMemo(() => {
    if (!data?.performanceStats.length) {
      return null;
    }

    return [...data.performanceStats]
      .map((item) => ({
        ...item,
        accuracy: item.totalQuestions ? (item.correctAnswers / item.totalQuestions) * 100 : 0
      }))
      .sort((left, right) => right.accuracy - left.accuracy)[0];
  }, [data]);

  const sessionBars = useMemo(() => {
    const sessions = data?.recentMaterials ?? [];
    const maxDuration = Math.max(...sessions.map((item) => item.durationSeconds), 1);

    return sessions.slice(0, 6).reverse().map((item) => ({
      id: item.sessionId,
      label: dateFormatter.format(new Date(item.endedAt)),
      minutes: Math.max(1, Math.round(item.durationSeconds / 60)),
      height: Math.max(12, Math.round((item.durationSeconds / maxDuration) * 100))
    }));
  }, [data]);

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Central de análise"
        title="Leia seu desempenho sem ruído."
        description="A análise do LexNexus cruza constância, volume e acerto para mostrar onde você está sustentando o ritmo e onde o estudo ainda vaza."
        actions={
          <>
            <Link className="brand-button" href="/app/questions">
              Voltar ao treino
            </Link>
            <Link className="brand-button-secondary" href="/app/cronograma">
              Corrigir agenda
            </Link>
          </>
        }
        summary={
          <div className="space-y-5">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] brand-muted">Melhor leitura atual</p>
              <h2 className="brand-title mt-3 text-3xl font-semibold">
                {bestDiscipline?.discipline?.name ?? "Sem base suficiente"}
              </h2>
              <p className="mt-3 text-sm leading-7 brand-muted">
                {bestDiscipline
                  ? `${Math.round((bestDiscipline.correctAnswers / Math.max(bestDiscipline.totalQuestions, 1)) * 100)}% de acerto na disciplina com melhor resposta.`
                  : "Resolva questões e registre sessões para destravar comparativos por disciplina."}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[12px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] brand-muted">Acertos</p>
                <p className="brand-title mt-3 text-3xl font-semibold">{data?.questionStats.correctAnswers ?? 0}</p>
              </div>
              <div className="rounded-[12px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] brand-muted">Erros</p>
                <p className="brand-title mt-3 text-3xl font-semibold">{totalErrors}</p>
              </div>
            </div>
          </div>
        }
      />

      <SectionTabs
        items={[
          { label: "Resumo", href: "#resumo", active: true },
          { label: "Disciplinas", href: "#disciplinas" },
          { label: "Histórico", href: "#historico" },
          { label: "Materiais", href: "#materiais" }
        ]}
      />

      {error ? (
        <EmptyState
          title="Análise indisponível."
          description={error}
          action={
            <Link className="brand-button" href="/app">
              Voltar para a mesa
            </Link>
          }
        />
      ) : null}

      <div id="resumo" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Horas na semana" value={data?.weeklyHours ?? 0} hint="Leitura e estudo somados." accent="semana" />
        <MetricCard label="Dias ativos" value={data?.consistencyDays ?? 0} hint="Constância recente." accent="ritmo" />
        <MetricCard
          label="Questões respondidas"
          value={data?.questionStats.totalAnswers ?? 0}
          hint="Volume total do treino."
          accent="pratica"
        />
        <MetricCard label="Acurácia" value={`${data?.questionStats.accuracyRate ?? 0}%`} hint="Percentual global de acerto." accent="score" />
        <MetricCard label="Erros mapeados" value={totalErrors} hint="Base para reforço e flashcards." accent="ajuste" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_360px]">
        <section id="disciplinas" className="brand-card p-6 md:p-7">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] brand-muted">Disciplinas</p>
              <h2 className="brand-title mt-2 text-3xl font-semibold">Desempenho por frente de estudo</h2>
            </div>
            <StatusPill tone="info">Leitura consolidada</StatusPill>
          </div>

          <div className="mt-6 grid gap-4">
            {(data?.performanceStats ?? []).map((item) => {
              const accuracy = item.totalQuestions ? Math.round((item.correctAnswers / item.totalQuestions) * 100) : 0;

              return (
                <article key={item.id} className="rounded-[12px] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-semibold">{item.discipline?.name ?? "Disciplina"}</p>
                      <p className="mt-1 text-sm brand-muted">
                        {item.correctAnswers} acertos em {item.totalQuestions} questões registradas.
                      </p>
                    </div>
                    <StatusPill tone={accuracy >= 70 ? "success" : accuracy >= 50 ? "info" : "warning"}>{accuracy}%</StatusPill>
                  </div>
                  <div className="mt-4">
                    <ProgressBar value={accuracy} />
                  </div>
                </article>
              );
            })}

            {data?.performanceStats?.length ? null : (
              <p className="text-sm leading-7 brand-muted">
                A prática ainda não gerou dados suficientes por disciplina. Resolva algumas questões para abrir esse painel.
              </p>
            )}
          </div>
        </section>

        <section className="grid gap-4">
          <article className="brand-card p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] brand-muted">Diagnóstico rápido</p>
            <h2 className="brand-title mt-3 text-3xl font-semibold">Onde atuar agora.</h2>
            <div className="mt-5 grid gap-3">
              <div className="rounded-[12px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold">Se a acurácia cair</p>
                <p className="mt-2 text-sm leading-6 brand-muted">Volte para biblioteca e revise o bloco-base antes de insistir no volume.</p>
              </div>
              <div className="rounded-[12px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold">Se o erro se repetir</p>
                <p className="mt-2 text-sm leading-6 brand-muted">Converta as falhas em flashcards e antecipe nova revisão.</p>
              </div>
              <div className="rounded-[12px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold">Se o ritmo oscilar</p>
                <p className="mt-2 text-sm leading-6 brand-muted">Reequilibre a agenda semanal em vez de aumentar a carga bruta.</p>
              </div>
            </div>
          </article>

          <article id="historico" className="brand-card p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] brand-muted">Histórico recente</p>
            <h2 className="brand-title mt-3 text-3xl font-semibold">Cadência de leitura</h2>
            <div className="mt-6 flex min-h-[190px] items-end gap-3">
              {sessionBars.map((item) => (
                <div key={item.id} className="flex flex-1 flex-col items-center gap-3">
                  <div
                    className="w-full rounded-t-[12px] bg-[linear-gradient(180deg,var(--brand-primary),rgba(4,116,129,0.18))]"
                    style={{ height: `${item.height}%` }}
                  />
                  <div className="text-center">
                    <p className="text-xs font-semibold text-slate-700">{item.minutes} min</p>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.14em] brand-muted">{item.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section className="brand-card p-6 md:p-7">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] brand-muted">Materiais</p>
              <h2 className="brand-title mt-2 text-3xl font-semibold">Leitura por material</h2>
            </div>
            <Link className="brand-button-secondary" href="/app/library">
              Ir para biblioteca
            </Link>
          </div>

          <div className="mt-6 grid gap-4">
            {(data?.progressByDiscipline ?? []).map((item) => (
              <article key={item.disciplineId} className="rounded-[12px] border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">{item.disciplineName}</p>
                  <span className="text-sm brand-muted">{item.percentCompleted}%</span>
                </div>
                <div className="mt-4">
                  <ProgressBar value={item.percentCompleted} />
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="materiais" className="brand-card p-6 md:p-7">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] brand-muted">Últimas sessões</p>
              <h2 className="brand-title mt-2 text-3xl font-semibold">Histórico de estudo</h2>
            </div>
            <Link className="brand-button-secondary" href="/app/library">
              Continuar leitura
            </Link>
          </div>

          <div className="mt-6 grid gap-3">
            {(data?.recentMaterials ?? []).map((item) => (
              <article key={item.sessionId} className="brand-card-light p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <p className="font-semibold">{item.documentTitle}</p>
                  <span className="text-xs uppercase tracking-[0.16em] brand-muted">
                    {dateFormatter.format(new Date(item.endedAt))}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 brand-muted">
                  Sessão com {Math.max(1, Math.round(item.durationSeconds / 60))} minutos registrados no viewer.
                </p>
              </article>
            ))}

            {data?.recentMaterials?.length ? null : (
              <p className="text-sm leading-7 brand-muted">
                Ainda não há sessões recentes. Assim que você usar a biblioteca e o viewer, o histórico aparece aqui.
              </p>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
