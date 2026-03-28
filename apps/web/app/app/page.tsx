"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../src/lib/api";
import { EmptyState, MetricCard, PageHeader, ProgressBar, SectionTabs, StatusPill } from "../../components/StudyUi";

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
};

type StudyTask = {
  id: string;
  scheduledDate: string;
  revisionStage: number;
  completed: boolean;
  discipline?: { name: string } | null;
};

type Flashcard = {
  id: string;
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short"
});

const weekdayFormatter = new Intl.DateTimeFormat("pt-BR", {
  weekday: "short",
  day: "2-digit"
});

export default function AppHomePage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [dueCards, setDueCards] = useState<Flashcard[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      apiFetch<DashboardData>("/dashboard"),
      apiFetch<StudyTask[]>("/study-tasks"),
      apiFetch<Flashcard[]>("/flashcards/due")
    ])
      .then(([dashboardData, taskData, flashcards]) => {
        setDashboard(dashboardData);
        setTasks(taskData);
        setDueCards(flashcards);
      })
      .catch((err: Error) => {
        console.error(err);
        setError("Não foi possível carregar a mesa de estudos agora.");
      });
  }, []);

  const upcomingTasks = useMemo(
    () =>
      [...tasks]
        .filter((task) => !task.completed)
        .sort((left, right) => new Date(left.scheduledDate).getTime() - new Date(right.scheduledDate).getTime())
        .slice(0, 6),
    [tasks]
  );

  const completedTasks = useMemo(() => tasks.filter((task) => task.completed).length, [tasks]);
  const completionRate = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0;
  const todayFocus = upcomingTasks[0];

  const weekDays = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return Array.from({ length: 5 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() + index);
      return date;
    });
  }, []);

  const tasksByDay = useMemo(() => {
    const groups = new Map<string, StudyTask[]>();

    for (const task of tasks) {
      const key = new Date(task.scheduledDate).toDateString();
      const current = groups.get(key) ?? [];
      current.push(task);
      groups.set(key, current);
    }

    return groups;
  }, [tasks]);

  const smartRecommendations = useMemo(() => {
    const items = [];

    if (dueCards.length > 0) {
      items.push({
        title: "Limpar fila de revisão",
        description: `${dueCards.length} flashcards aguardam retorno e estão puxando a memória para baixo.`,
        href: "/app/flashcards",
        cta: "Revisar agora"
      });
    }

    if ((dashboard?.questionStats.accuracyRate ?? 0) < 65) {
      items.push({
        title: "Ajustar prática por disciplina",
        description: "Se um ponto do mapa pedir exercício, vale abrir a prática por IA com recorte mais específico.",
        href: "/app/questions",
        cta: "Abrir prática IA"
      });
    }

    if (upcomingTasks.length === 0) {
      items.push({
        title: "Gerar novo ciclo",
        description: "Sem agenda viva, a plataforma perde o senso de prioridade. Reative a trilha da semana.",
        href: "/app/cronograma",
        cta: "Montar agenda"
      });
    }

    if (!items.length) {
      items.push({
        title: "Continuar o ritmo",
        description: "A mesa está equilibrada. Mantenha mapas, revisão, prática sob demanda e leitura girando no mesmo compasso.",
        href: "/app/dashboard",
        cta: "Ver análise"
      });
    }

    return items.slice(0, 3);
  }, [dashboard?.questionStats.accuracyRate, dueCards.length, upcomingTasks.length]);

  const disciplineHighlights = (dashboard?.progressByDiscipline ?? []).slice(0, 4);

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Mesa de estudos"
        title="Seu cockpit de estudo jurídico orientado por sinais."
        description="A área logada da LexNexus precisa parecer um produto SaaS educacional premium: prioridades visíveis, recomendações claras, blocos modulares e uma leitura rápida do que faz o aluno evoluir."
        actions={
          <>
            <Link className="brand-button" href="/app/questions">
              Abrir prática IA
            </Link>
            <Link className="brand-button-secondary" href="/app/cronograma">
              Ajustar agenda
            </Link>
          </>
        }
        summary={
          <div className="space-y-5">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] brand-muted">Comando do dia</p>
              <h2 className="brand-title mt-3 text-3xl font-semibold">
                {todayFocus ? todayFocus.discipline?.name ?? "Revisão prioritária" : "Trilha pronta para ser montada"}
              </h2>
              <p className="mt-3 text-sm leading-7 brand-muted">
                {todayFocus
                  ? `Próxima ação: revisão R${todayFocus.revisionStage} em ${dateFormatter.format(new Date(todayFocus.scheduledDate))}.`
                  : "Sem tarefas ativas. Gere o próximo ciclo para reativar teoria, prática e memória."}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[12px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] brand-muted">Tarefas vivas</p>
                <p className="brand-title mt-3 text-3xl font-semibold">{upcomingTasks.length}</p>
              </div>
              <div className="rounded-[12px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] brand-muted">Fila de memória</p>
                <p className="brand-title mt-3 text-3xl font-semibold">{dueCards.length}</p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-sm brand-muted">
                <span>Execução do plano</span>
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
          { label: "Mesa", href: "/app", active: true },
          { label: "Planejamento", href: "/app/cronograma" },
          { label: "Prática IA", href: "/app/questions" },
          { label: "Seleções IA", href: "/app/simulado" },
          { label: "Biblioteca", href: "/app/library" },
          { label: "Análise", href: "/app/dashboard" }
        ]}
      />

      {error ? (
        <EmptyState
          title="Mesa indisponível agora."
          description={error}
          action={
            <Link className="brand-button" href="/app/dashboard">
              Ir para análise
            </Link>
          }
        />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Horas na semana" value={dashboard?.weeklyHours ?? 0} hint="Tempo consolidado de leitura e estudo." accent="ritmo" />
        <MetricCard label="Dias de constância" value={dashboard?.consistencyDays ?? 0} hint="Frequência recente da rotina." accent="sequencia" />
        <MetricCard label="Práticas geradas" value={dashboard?.questionStats.totalAnswers ?? 0} hint="Volume registrado na prática assistida." accent="pratica" />
        <MetricCard label="Aproveitamento" value={`${dashboard?.questionStats.accuracyRate ?? 0}%`} hint="Leitura geral da prática já realizada." accent="score" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.18fr)_360px]">
        <section className="brand-card p-6 md:p-7">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] brand-muted">Semana em execução</p>
              <h2 className="brand-title mt-2 text-3xl font-semibold">Trilha ativa em leitura rapida</h2>
              <p className="mt-3 text-sm leading-7 brand-muted">
                O aluno precisa bater o olho e entender como a semana está distribuída. Por isso, a grade abaixo privilegia densidade com ordem.
              </p>
            </div>
            <Link className="brand-button-secondary" href="/app/cronograma">
              Abrir planejamento
            </Link>
          </div>

          <div className="mt-6 grid gap-3 lg:grid-cols-5">
            {weekDays.map((day) => {
              const items = tasksByDay.get(day.toDateString()) ?? [];

              return (
                <article key={day.toISOString()} className="brand-card-light p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] brand-muted">{weekdayFormatter.format(day)}</p>
                      <p className="mt-2 text-lg font-semibold text-[var(--brand-heading)]">{items.length} blocos</p>
                    </div>
                    <StatusPill tone={items.length ? "info" : "default"}>{items.length ? "ativo" : "livre"}</StatusPill>
                  </div>

                  <div className="mt-4 grid gap-2">
                    {items.slice(0, 3).map((task) => (
                      <div key={task.id} className="rounded-[10px] border border-slate-200 bg-white px-3 py-2.5">
                        <p className="text-sm font-semibold">{task.discipline?.name ?? "Disciplina"}</p>
                        <p className="mt-1 text-xs brand-muted">Revisão R{task.revisionStage}</p>
                      </div>
                    ))}

                    {items.length > 3 ? <p className="text-xs font-semibold text-[var(--brand-accent-strong)]">+{items.length - 3} blocos</p> : null}
                    {!items.length ? <p className="text-sm leading-6 brand-muted">Dia livre para leitura profunda ou recuperação.</p> : null}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <div className="grid gap-4">
          <section className="brand-card-dark p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] brand-muted">Recomendações inteligentes</p>
            <h2 className="brand-title mt-3 text-3xl font-semibold">O que fazer agora.</h2>
            <div className="mt-5 grid gap-3">
              {smartRecommendations.map((item) => (
                <div key={item.title} className="brand-card-light p-4">
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 brand-muted">{item.description}</p>
                  <Link className="mt-4 inline-flex text-xs font-semibold uppercase tracking-[0.14em] text-[var(--brand-accent-strong)]" href={item.href}>
                    {item.cta}
                  </Link>
                </div>
              ))}
            </div>
          </section>

          <section className="brand-card p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] brand-muted">Metas da semana</p>
            <h2 className="brand-title mt-3 text-3xl font-semibold">Controle sem fricção.</h2>
            <div className="mt-5 grid gap-3">
              <div className="rounded-[12px] border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">Execução da agenda</p>
                  <span className="text-sm brand-muted">{completionRate}%</span>
                </div>
                <div className="mt-3">
                  <ProgressBar value={completionRate} />
                </div>
              </div>
              <div className="rounded-[12px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold">Uso da prática IA</p>
                <p className="mt-2 text-sm leading-6 brand-muted">
                  {dashboard?.questionStats.totalAnswers
                    ? `${dashboard.questionStats.totalAnswers} interações registradas no recorte atual.`
                    : "Ainda sem prática assistida registrada nesta fase."}
                </p>
              </div>
              <div className="rounded-[12px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold">Fila de revisão</p>
                <p className="mt-2 text-sm leading-6 brand-muted">
                  {dueCards.length ? `${dueCards.length} itens pedem retorno imediato.` : "A fila está limpa no momento."}
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <section className="brand-card p-6 md:p-7">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] brand-muted">Disciplinas em foco</p>
              <h2 className="brand-title mt-2 text-3xl font-semibold">Mapa de progresso</h2>
              <p className="mt-3 text-sm leading-7 brand-muted">
                Cards elegantes, densidade controlada e barras de progresso claras ajudam o aluno a sentir avanços concretos sem poluição.
              </p>
            </div>
            <Link className="brand-button-secondary" href="/app/library">
              Abrir biblioteca
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {disciplineHighlights.map((item) => (
              <article key={item.disciplineId} className="brand-card-light p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-[var(--brand-heading)]">{item.disciplineName}</p>
                  <span className="text-sm brand-muted">{item.percentCompleted}%</span>
                </div>
                <div className="mt-4">
                  <ProgressBar value={item.percentCompleted} />
                </div>
              </article>
            ))}

            {disciplineHighlights.length ? null : (
              <div className="md:col-span-2">
                <EmptyState
                  title="Sem disciplinas suficientes ainda."
                  description="Assim que a biblioteca e o viewer forem usados com regularidade, o painel passa a mostrar progresso por frente de estudo."
                  action={
                    <Link className="brand-button" href="/app/library">
                      Começar pela biblioteca
                    </Link>
                  }
                />
              </div>
            )}
          </div>
        </section>

        <section className="brand-card p-6 md:p-7">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] brand-muted">Histórico recente</p>
              <h2 className="brand-title mt-2 text-3xl font-semibold">Leitura e retomada</h2>
              <p className="mt-3 text-sm leading-7 brand-muted">
                A mesa premium do aluno precisa combinar próximos passos com memória do que já foi feito. Isso sustenta retenção e continuidade.
              </p>
            </div>
            <Link className="brand-button-secondary" href="/app/dashboard">
              Ver análise
            </Link>
          </div>

          <div className="mt-6 grid gap-3">
            {(dashboard?.recentMaterials ?? []).slice(0, 5).map((item) => (
              <article key={item.sessionId} className="brand-card-light p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <p className="font-semibold text-[var(--brand-heading)]">{item.documentTitle}</p>
                  <span className="text-xs uppercase tracking-[0.16em] brand-muted">{dateFormatter.format(new Date(item.endedAt))}</span>
                </div>
                <p className="mt-3 text-sm leading-6 brand-muted">
                  Sessão de {Math.max(1, Math.round(item.durationSeconds / 60))} minutos registrada no histórico.
                </p>
              </article>
            ))}

            {dashboard?.recentMaterials?.length ? null : (
              <EmptyState
                title="Nenhuma leitura recente."
                description="Abra um material para que a plataforma comece a desenhar seu histórico de estudo e o ciclo de retorno."
                action={
                  <Link className="brand-button" href="/app/library">
                    Ir para biblioteca
                  </Link>
                }
              />
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
