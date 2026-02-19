"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../../src/lib/api";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    apiFetch("/dashboard").then(setData).catch(console.error);
  }, []);

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded border bg-white p-3">Horas/semana: {data?.weeklyHours ?? 0}</div>
        <div className="rounded border bg-white p-3">Constância: {data?.consistencyDays ?? 0} dias</div>
        <div className="rounded border bg-white p-3">Respondidas: {data?.questionStats?.totalAnswers ?? 0}</div>
        <div className="rounded border bg-white p-3">Taxa acerto: {data?.questionStats?.accuracyRate ?? 0}%</div>
      </div>

      <article className="rounded border bg-white p-3">
        <h2 className="font-semibold">Materiais recentes</h2>
        <ul className="mt-2 text-sm">
          {data?.recentMaterials?.map((item: any) => (
            <li key={item.sessionId}>{item.documentTitle} - {new Date(item.endedAt).toLocaleString("pt-BR")}</li>
          ))}
        </ul>
      </article>
    </section>
  );
}
