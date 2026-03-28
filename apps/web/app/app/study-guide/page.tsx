"use client";

import { useMemo, useState } from "react";
import { resolveBuiltInMindMap } from "../../../src/data/mind-maps";
import {
  buildMindMapIndex,
  type MindMapData,
  type MindMapNode,
} from "../../../src/lib/mind-map";

/* ═══════════════════════════════════════════════════════════════
   Available guides (expand as new disciplines are added)
   ═══════════════════════════════════════════════════════════════ */
const GUIDES = [
  { slug: "oab-direito-constitucional", label: "Direito Constitucional — OAB" },
];

const PRIORITY_ORDER: Record<string, number> = { alta: 0, media: 1, baixa: 2 };

function priorityColor(p: string) {
  if (p === "alta")
    return {
      bg: "#fef3c7",
      text: "#92400e",
      border: "#f59e0b",
      badge: "🔥 Alta — Cai muito em prova",
    };
  if (p === "media")
    return {
      bg: "#e0e7ff",
      text: "#3730a3",
      border: "#6366f1",
      badge: "📌 Média",
    };
  return {
    bg: "#f1f5f9",
    text: "#475569",
    border: "#94a3b8",
    badge: "📎 Baixa",
  };
}

/* ═══════════════════════════════════════════════════════════════
   Study Guide PDF page
   ═══════════════════════════════════════════════════════════════ */
export default function StudyGuidePage() {
  const [selectedGuide, setSelectedGuide] = useState(GUIDES[0].slug);

  // Load the mind map data as if it were a built-in mind map file
  const mindMap = useMemo(() => {
    return resolveBuiltInMindMap({ fileName: `${selectedGuide}.json` });
  }, [selectedGuide]);

  const index = useMemo(
    () => (mindMap ? buildMindMapIndex(mindMap) : null),
    [mindMap],
  );

  // Sort branches by study priority, then by priority field
  const sortedBranches = useMemo(() => {
    if (!index || !mindMap) return [];
    const branches = [...index.primaryBranches];
    branches.sort((a, b) => {
      const aIdx = mindMap.meta.studyPriority.indexOf(a.id);
      const bIdx = mindMap.meta.studyPriority.indexOf(b.id);
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return (
        (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2)
      );
    });
    return branches;
  }, [index, mindMap]);

  const handlePrint = () => {
    window.print();
  };

  if (!mindMap || !index) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-gray-500">
        Guia de estudo não encontrado.
      </div>
    );
  }

  const totalTopics = mindMap.nodes.filter((n) => n.layer === "topic").length;
  const highPriority = sortedBranches.filter((b) => b.priority === "alta");

  return (
    <>
      {/* ── Screen controls (hidden on print) ── */}
      <div className="print:hidden space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-400">
            Guia de estudo
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--brand-heading)]">
            Gerador de PDF — Foco em Provas
          </h1>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            Conteúdo organizado por incidência em provas. Clique em{" "}
            <strong>Gerar PDF</strong> para baixar o guia otimizado para
            impressão.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedGuide}
            onChange={(e) => setSelectedGuide(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm"
          >
            {GUIDES.map((g) => (
              <option key={g.slug} value={g.slug}>
                {g.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handlePrint}
            className="rounded-xl bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-2.5 text-sm font-bold text-white shadow-lg hover:shadow-xl transition"
          >
            🖨️ Gerar PDF
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Ramos
            </p>
            <p className="mt-1 text-2xl font-bold text-gray-800">
              {sortedBranches.length}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Tópicos totais
            </p>
            <p className="mt-1 text-2xl font-bold text-gray-800">
              {totalTopics}
            </p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">
              🔥 Alta incidência
            </p>
            <p className="mt-1 text-2xl font-bold text-amber-800">
              {highPriority.length} ramos
            </p>
          </div>
        </div>
      </div>

      {/* ── Printable study guide ── */}
      <div className="mt-6 print:mt-0">
        {/* PDF Cover */}
        <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 p-8 text-white text-center print:rounded-none print:border-0 print:break-after-page">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
            LexNexus — Guia de Estudo
          </p>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight">
            {mindMap.meta.title}
          </h1>
          <p className="mt-2 text-lg text-slate-300">
            {mindMap.meta.discipline} · {mindMap.meta.examTrack}
          </p>
          <div className="mt-6 inline-block rounded-full bg-amber-400/90 px-6 py-2 text-sm font-bold text-slate-900">
            Conteúdo priorizado por incidência em provas
          </div>
          <div className="mt-8 grid grid-cols-3 gap-4 max-w-md mx-auto text-sm">
            <div className="rounded-xl bg-white/10 p-3">
              <p className="text-slate-400 text-xs">Ramos</p>
              <p className="text-xl font-bold">{sortedBranches.length}</p>
            </div>
            <div className="rounded-xl bg-white/10 p-3">
              <p className="text-slate-400 text-xs">Tópicos</p>
              <p className="text-xl font-bold">{totalTopics}</p>
            </div>
            <div className="rounded-xl bg-amber-500/20 p-3">
              <p className="text-amber-300 text-xs">🔥 Alta</p>
              <p className="text-xl font-bold">{highPriority.length}</p>
            </div>
          </div>
          <p className="mt-8 text-xs text-slate-500">
            Fontes:{" "}
            {mindMap.meta.sourceProfile
              .map((s) => s.file.split("/").pop())
              .join(" · ")}
          </p>
        </div>

        {/* Branches — ordered by study priority */}
        {sortedBranches.map((branch, branchIdx) => {
          const topics = (index.childrenByParentId[branch.id] ?? []).sort(
            (a, b) =>
              (PRIORITY_ORDER[a.priority] ?? 2) -
              (PRIORITY_ORDER[b.priority] ?? 2),
          );
          const pc = priorityColor(branch.priority);

          return (
            <section
              key={branch.id}
              className="mt-6 print:mt-0 print:break-before-page"
            >
              <div
                className="rounded-2xl border-2 overflow-hidden print:rounded-none print:border print:border-gray-300"
                style={{ borderColor: pc.border }}
              >
                {/* Branch header */}
                <div
                  className="px-6 py-5 print:px-4 print:py-3"
                  style={{ backgroundColor: pc.bg }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p
                        className="text-xs font-bold uppercase tracking-wider"
                        style={{ color: pc.text + "90" }}
                      >
                        Ramo {branchIdx + 1} de {sortedBranches.length}
                      </p>
                      <h2
                        className="mt-1 text-2xl font-bold print:text-xl"
                        style={{ color: pc.text }}
                      >
                        {branch.label}
                      </h2>
                    </div>
                    <span
                      className="shrink-0 rounded-full px-3 py-1 text-xs font-bold"
                      style={{
                        backgroundColor: pc.border + "20",
                        color: pc.text,
                      }}
                    >
                      {pc.badge}
                    </span>
                  </div>
                  <p
                    className="mt-2 text-sm leading-relaxed"
                    style={{ color: pc.text + "cc" }}
                  >
                    {branch.summary}
                  </p>
                  {branch.keyReferences.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {branch.keyReferences.map((ref) => (
                        <span
                          key={ref}
                          className="rounded-full px-2.5 py-0.5 text-xs font-medium border"
                          style={{
                            borderColor: pc.border + "40",
                            color: pc.text,
                            backgroundColor: "white",
                          }}
                        >
                          📌 {ref}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Topics */}
                <div className="divide-y divide-gray-100 bg-white">
                  {topics.map((topic, topicIdx) => {
                    const tpc = priorityColor(topic.priority);
                    const subTopics = index.childrenByParentId[topic.id] ?? [];

                    return (
                      <div
                        key={topic.id}
                        className="px-6 py-4 print:px-4 print:py-3"
                      >
                        <div className="flex items-start gap-3">
                          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">
                            {topicIdx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-base font-bold text-gray-800">
                                {topic.label}
                              </h3>
                              <span
                                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                style={{
                                  backgroundColor: tpc.bg,
                                  color: tpc.text,
                                }}
                              >
                                {tpc.badge}
                              </span>
                            </div>

                            <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">
                              {topic.summary}
                            </p>

                            {topic.keyReferences.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {topic.keyReferences.map((ref) => (
                                  <span
                                    key={ref}
                                    className="text-xs font-medium text-gray-500 bg-gray-50 border border-gray-200 rounded-full px-2 py-0.5"
                                  >
                                    {ref}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Microtopics if any */}
                            {subTopics.length > 0 && (
                              <div className="mt-3 ml-2 border-l-2 border-gray-100 pl-4 space-y-2">
                                {subTopics.map((sub) => (
                                  <div key={sub.id}>
                                    <p className="text-sm font-semibold text-gray-700">
                                      {sub.label}
                                    </p>
                                    <p className="text-xs text-gray-500 leading-relaxed">
                                      {sub.summary}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          );
        })}

        {/* Footer with sources */}
        <div className="mt-8 print:mt-4 print:break-before-page rounded-xl border border-gray-200 bg-gray-50 p-6 print:rounded-none">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">
            Fontes utilizadas
          </h3>
          <div className="mt-3 space-y-2">
            {mindMap.meta.sourceProfile.map((source) => (
              <div key={source.file} className="flex items-start gap-2 text-sm">
                <span className="shrink-0 text-gray-400">📚</span>
                <div>
                  <span className="font-medium text-gray-700">
                    {source.role.replace(/_/g, " ")}
                  </span>
                  <span className="text-gray-400"> — </span>
                  <span className="text-gray-500">
                    {source.file.split("/").pop()}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-gray-400">
            Gerado pelo LexNexus. Conteúdo priorizado por frequência em provas
            da {mindMap.meta.examTrack}.
          </p>
        </div>
      </div>

      {/* Print-specific styles */}
      <style>{`
        @media print {
          @page { margin: 1.5cm; size: A4; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .brand-shell, .brand-frame { all: unset !important; }
          nav, [data-nav], .brand-sidebar-link { display: none !important; }
          main { padding: 0 !important; }
        }
      `}</style>
    </>
  );
}
