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

type StudyPlan = {
  id: string;
  examDate: string;
  dailyHours: number;
  tasks: Array<{ id: string; completed: boolean }>;
};

type StudyTask = {
  id: string;
  scheduledDate: string;
  revisionStage: number;
  completed: boolean;
  discipline?: { name: string } | null;
  plan?: { id: string } | null;
};

const weekdayFormatter = new Intl.DateTimeFormat("pt-BR", {
  weekday: "short",
  day: "2-digit",
  month: "short"
});

export default function CronogramaPage() {
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [examDate, setExamDate] = useState("");
  const [dailyHours, setDailyHours] = useState(2);
  const [selected, setSelected] = useState<string[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadAll() {
    const [library, planData, taskData] = await Promise.all([
      apiFetch<LibraryEntry[]>("/library"),
      apiFetch<StudyPlan[]>("/study-plans"),
      apiFetch<StudyTask[]>("/study-tasks")
    ]);

    const sortedDisciplines = library
      .map((item) => ({ id: item.id, name: item.name }))
      .sort((left, right) => left.name.localeCompare(right.name));

    setDisciplines(sortedDisciplines);
    setPlans(planData);
    setTasks(taskData);
  }

  useEffect(() => {
    loadAll().catch((err: Error) => {
      console.error(err);
      setError("Não foi possível carregar o planejamento.");
    });
  }, []);

  const weekDays = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() + index);
      return date;
    });
  }, []);

  const groupedTasks = useMemo(() => {
    const groups = new Map<string, StudyTask[]>();

    for (const task of tasks) {
      const key = new Date(task.scheduledDate).toDateString();
      const current = groups.get(key) ?? [];
      current.push(task);
      groups.set(key, current);
    }

    return groups;
  }, [tasks]);

  const activePlan = plans[0] ?? null;
  const completedTasks = tasks.filter((task) => task.completed).length;
  const completionRate = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0;

  async function createPlan(event: FormEvent) {
    event.preventDefault();
    setStatus(null);
    setError(null);

    try {
      await apiFetch("/study-plans", {
        method: "POST",
        body: JSON.stringify({ examDate, dailyHours, disciplineIds: selected })
      });
      setStatus("Plano criado e agenda atualizada.");
      await loadAll();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Não foi possível criar o plano.");
    }
  }

  async function completeTask(id: string) {
    setStatus(null);
    setError(null);

    try {
      await apiFetch(`/study-tasks/${id}/complete`, { method: "PATCH" });
      setStatus("Tarefa marcada como concluída.");
      await loadAll();
    } catch (err) {
      console.error(err);
      setError("Não foi possível concluir a tarefa.");
    }
  }

  async function rescheduleTask(id: string) {
    setStatus(null);
    setError(null);

    try {
      await apiFetch(`/study-tasks/${id}/reschedule`, { method: "POST" });
      setStatus("Tarefa reagendada para o próximo dia útil.");
      await loadAll();
    } catch (err) {
      console.error(err);
      setError("Não foi possível reagendar a tarefa.");
    }
  }

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Planejamento"
        title="Monte a semana como uma mesa de comando."
        description="O cronograma do LexNexus deixa teoria, revisões 1-7-30 e margem de correções no mesmo painel. A agenda fica menos ornamental e mais operacional."
        actions={
          <>
            <Link className="brand-button" href="/app/questions">
              Praticar agora
            </Link>
            <Link className="brand-button-secondary" href="/app/library">
              Retomar biblioteca
            </Link>
          </>
        }
        summary={
          <div className="space-y-5">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] brand-muted">Plano ativo</p>
              <h2 className="brand-title mt-3 text-3xl font-semibold">
                {activePlan ? `${activePlan.dailyHours}h por dia` : "Nenhum plano criado"}
              </h2>
              <p className="mt-3 text-sm leading-7 brand-muted">
                {activePlan
                  ? `Prova-alvo em ${new Date(activePlan.examDate).toLocaleDateString("pt-BR")}.`
                  : "Escolha disciplinas, informe a prova e gere o primeiro ciclo."}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between text-sm brand-muted">
                <span>Execução geral</span>
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
          { label: "Agenda da semana", href: "#agenda", active: true },
          { label: "Novo plano", href: "#novo-plano" },
          { label: "Revisões", href: "#revisoes" }
        ]}
      />

      {status ? <div className="rounded-[12px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{status}</div> : null}
      {error ? <div className="rounded-[12px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Planos criados" value={plans.length} hint="Histórico de gerações." accent="pipeline" />
        <MetricCard label="Tarefas totais" value={tasks.length} hint="Blocos previstos na agenda." accent="agenda" />
        <MetricCard label="Concluidas" value={completedTasks} hint="Blocos efetivamente fechados." accent="done" />
        <MetricCard
          label="Pendentes"
          value={Math.max(0, tasks.length - completedTasks)}
          hint="Itens aguardando ação."
          accent="focus"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_380px]">
        <section id="agenda" className="brand-card p-6 md:p-7">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] brand-muted">Agenda da semana</p>
              <h2 className="brand-title mt-2 text-3xl font-semibold">Fila dos próximos 7 dias</h2>
              <p className="mt-3 text-sm leading-7 brand-muted">
                O quadro abaixo organiza revisões curtas, médias e tardias por dia útil. Reagende apenas quando o bloco realmente escapar.
              </p>
            </div>
            <StatusPill tone="info">Ciclo 1-7-30</StatusPill>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2 2xl:grid-cols-4">
            {weekDays.map((day) => {
              const taskItems = groupedTasks.get(day.toDateString()) ?? [];

              return (
                <article key={day.toISOString()} className="rounded-[12px] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] brand-muted">
                        {weekdayFormatter.format(day)}
                      </p>
                      <p className="mt-2 text-lg font-semibold">{taskItems.length} blocos</p>
                    </div>
                    <StatusPill tone={taskItems.length ? "info" : "default"}>{taskItems.length ? "ativo" : "livre"}</StatusPill>
                  </div>

                  <div className="mt-4 grid gap-3">
                    {taskItems.map((task) => (
                      <div key={task.id} className="rounded-[10px] border border-slate-200 bg-white p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold">{task.discipline?.name ?? "Disciplina"}</p>
                          <StatusPill tone={task.completed ? "success" : "warning"}>{task.completed ? "feito" : `R${task.revisionStage}`}</StatusPill>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {task.completed ? null : (
                            <button type="button" className="brand-button-secondary text-sm" onClick={() => completeTask(task.id)}>
                              Concluir
                            </button>
                          )}
                          <button type="button" className="brand-button-secondary text-sm" onClick={() => rescheduleTask(task.id)}>
                            Reagendar
                          </button>
                        </div>
                      </div>
                    ))}

                    {taskItems.length ? null : (
                      <p className="text-sm leading-6 brand-muted">
                        Dia livre. Use este espaço para leitura profunda ou recuperação.
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <div className="grid gap-4">
          <section id="novo-plano" className="brand-card p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] brand-muted">Novo plano</p>
            <h2 className="brand-title mt-3 text-3xl font-semibold">Gerar agenda por prova</h2>
            <form onSubmit={createPlan} className="mt-5 space-y-4">
              <div className="grid gap-3">
                <div>
                  <label className="mb-2 block text-sm font-semibold" htmlFor="exam-date">
                    Data da prova
                  </label>
                  <input id="exam-date" type="date" value={examDate} onChange={(event) => setExamDate(event.target.value)} required />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold" htmlFor="daily-hours">
                    Horas por dia
                  </label>
                  <input
                    id="daily-hours"
                    type="number"
                    min={1}
                    step={0.5}
                    value={dailyHours}
                    onChange={(event) => setDailyHours(Number(event.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold">Disciplinas prioritárias</p>
                <div className="grid gap-2">
                  {disciplines.map((discipline) => {
                    const isSelected = selected.includes(discipline.id);

                    return (
                      <label key={discipline.id} className="brand-card-light flex items-center gap-3 p-3 text-sm">
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={isSelected}
                          onChange={(event) => {
                            if (event.target.checked) {
                              setSelected((current) => [...current, discipline.id]);
                            } else {
                              setSelected((current) => current.filter((item) => item !== discipline.id));
                            }
                          }}
                        />
                        <span>{discipline.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <button type="submit" className="w-full">
                Gerar agenda
              </button>
            </form>
          </section>

          <section id="revisoes" className="brand-card p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] brand-muted">Leitura do ciclo</p>
            <h2 className="brand-title mt-3 text-3xl font-semibold">Como está distribuído.</h2>
            <div className="mt-5 grid gap-3">
              <div className="rounded-[12px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold">R0</p>
                <p className="mt-2 text-sm leading-6 brand-muted">Contato inicial com o material e primeiras marcações.</p>
              </div>
              <div className="rounded-[12px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold">R1</p>
                <p className="mt-2 text-sm leading-6 brand-muted">Retorno curto para impedir evaporação imediata.</p>
              </div>
              <div className="rounded-[12px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold">R7 e R30</p>
                <p className="mt-2 text-sm leading-6 brand-muted">Consolidação média e tardia com ganho real de memória.</p>
              </div>
            </div>
          </section>
        </div>
      </div>

      {tasks.length ? null : (
        <EmptyState
          title="Nenhum bloco criado ainda."
          description="Sem plano ativo, a agenda fica vazia. Gere uma trilha com data de prova e disciplinas-alvo."
          action={
            <Link className="brand-button" href="#novo-plano">
              Criar agora
            </Link>
          }
        />
      )}
    </section>
  );
}
