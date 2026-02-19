"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiFetch } from "../../../src/lib/api";

export default function CronogramaPage() {
  const [disciplines, setDisciplines] = useState<Array<{ id: string; name: string }>>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [examDate, setExamDate] = useState("");
  const [dailyHours, setDailyHours] = useState(2);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    apiFetch<Array<{ id: string; name: string }>>("/admin/disciplines").then(setDisciplines).catch(console.error);
    apiFetch<any[]>("/study-tasks").then(setTasks).catch(console.error);
  }, []);

  async function createPlan(event: FormEvent) {
    event.preventDefault();
    const plan = await apiFetch<any>("/study-plans", {
      method: "POST",
      body: JSON.stringify({ examDate, dailyHours, disciplineIds: selected })
    });
    setTasks(plan.tasks ?? []);
  }

  async function completeTask(id: string) {
    await apiFetch(`/study-tasks/${id}/complete`, { method: "PATCH" });
    const refreshed = await apiFetch<any[]>("/study-tasks");
    setTasks(refreshed);
  }

  async function rescheduleTask(id: string) {
    await apiFetch(`/study-tasks/${id}/reschedule`, { method: "POST" });
    const refreshed = await apiFetch<any[]>("/study-tasks");
    setTasks(refreshed);
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Cronograma</h1>
      <form onSubmit={createPlan} className="space-y-2 rounded border bg-white p-3">
        <input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} required />
        <input type="number" value={dailyHours} onChange={(e) => setDailyHours(Number(e.target.value))} min={1} step={0.5} />
        <div className="space-y-1">
          {disciplines.map((d) => (
            <label key={d.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selected.includes(d.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelected((prev) => [...prev, d.id]);
                  } else {
                    setSelected((prev) => prev.filter((id) => id !== d.id));
                  }
                }}
              />
              {d.name}
            </label>
          ))}
        </div>
        <button type="submit">Gerar tarefas 1-7-30</button>
      </form>

      <div className="space-y-2">
        {tasks.map((task) => (
          <article key={task.id} className="rounded border bg-white p-3 text-sm">
            <p>{task.discipline?.name} - {new Date(task.scheduledDate).toLocaleDateString("pt-BR")} (R{task.revisionStage})</p>
            <div className="mt-2 flex gap-2">
              <button type="button" onClick={() => completeTask(task.id).catch(console.error)}>
                Concluir
              </button>
              <button type="button" onClick={() => rescheduleTask(task.id).catch(console.error)}>
                Reagendar
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
