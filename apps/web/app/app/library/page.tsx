"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../../src/lib/api";
import { EmptyState, MetricCard, PageHeader, ProgressBar, SectionTabs, StatusPill } from "../../../components/StudyUi";

type Discipline = {
  id: string;
  name: string;
  documents: Array<{
    id: string;
    title: string;
    kind: "study_material" | "mind_map";
    topic?: string | null;
    description?: string | null;
    versions: Array<{ id: string; versionNumber: number }>;
  }>;
};

export default function LibraryPage() {
  const [items, setItems] = useState<Discipline[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Discipline[]>("/library")
      .then((data) =>
        setItems(data.sort((left, right) => left.name.localeCompare(right.name)))
      )
      .catch((err: Error) => {
        console.error(err);
        setError("Não foi possível carregar a biblioteca.");
      });
  }, []);

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return items;
    }

    return items.filter((discipline) => {
      if (discipline.name.toLowerCase().includes(normalized)) {
        return true;
      }

      return discipline.documents.some((document) => {
        return (
          document.title.toLowerCase().includes(normalized) ||
          document.description?.toLowerCase().includes(normalized) ||
          document.topic?.toLowerCase().includes(normalized)
        );
      });
    });
  }, [items, query]);

  const documentCount = items.reduce((total, item) => total + item.documents.length, 0);
  const mindMapCount = items.reduce((total, item) => total + item.documents.filter((document) => document.kind === "mind_map").length, 0);

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Acervo"
        title="Biblioteca jurídica organizada por disciplina, assunto e tipo de material."
        description="O acervo do LexNexus passa a reunir materiais-base e mapas mentais no mesmo ambiente, com acesso por disciplina, assunto e histórico de versões."
        actions={
          <>
            <Link className="brand-button" href="/app/dashboard">
              Ver progresso
            </Link>
            <Link className="brand-button-secondary" href="/app/cronograma">
              Planejar leitura
            </Link>
          </>
        }
        summary={
          <div className="space-y-5">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] brand-muted">Acervo ativo</p>
              <h2 className="brand-title mt-3 text-3xl font-semibold">Leitura, consulta e memorização por disciplina</h2>
              <p className="mt-3 text-sm leading-7 brand-muted">
                Consulte materiais-base e mapas mentais com entrada direta no histórico de versões de cada item.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[12px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] brand-muted">Documentos</p>
                <p className="brand-title mt-3 text-3xl font-semibold">{documentCount}</p>
              </div>
              <div className="rounded-[12px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] brand-muted">Mapas mentais</p>
                <p className="brand-title mt-3 text-3xl font-semibold">{mindMapCount}</p>
              </div>
            </div>
          </div>
        }
      />

      <SectionTabs
        items={[
          { label: "Biblioteca", href: "#biblioteca", active: true },
          { label: "Disciplinas", href: "#disciplinas" },
          { label: "Documentos", href: "#disciplinas" }
        ]}
      />

      {error ? <div className="rounded-[12px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Disciplinas" value={items.length} hint="Frentes disponíveis no acervo." accent="mapa" />
        <MetricCard label="Documentos" value={documentCount} hint="Materiais cadastrados." accent="base" />
        <MetricCard label="Mapas mentais" value={mindMapCount} hint="Materiais de memorizar e revisar." accent="memoria" />
        <MetricCard label="Resultados filtrados" value={filteredItems.length} hint="Disciplinas visíveis agora." accent="query" />
      </div>

      <section id="biblioteca" className="brand-card p-6 md:p-7">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] brand-muted">Consulta</p>
            <h2 className="brand-title mt-2 text-3xl font-semibold">Busque por disciplina ou documento</h2>
          </div>
          <div className="w-full max-w-xl">
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ex.: constitucional, processo civil, execução" />
          </div>
        </div>
      </section>

      {filteredItems.length ? (
        <div id="disciplinas" className="grid gap-4 xl:grid-cols-2">
          {filteredItems.map((discipline) => {
            const completion = discipline.documents.length
              ? Math.round((discipline.documents.filter((document) => document.versions.length > 0).length / discipline.documents.length) * 100)
              : 0;

            return (
              <article key={discipline.id} className="brand-card p-6 md:p-7">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill tone="info">Disciplina</StatusPill>
                      <StatusPill tone="default">{discipline.documents.length} documentos</StatusPill>
                    </div>
                    <h2 className="brand-title mt-4 text-3xl font-semibold">{discipline.name}</h2>
                    <p className="mt-3 text-sm leading-7 brand-muted">
                      Use a biblioteca como ponto de retorno para materiais-base, mapas mentais e leitura guiada no viewer.
                    </p>
                  </div>
                  <div className="min-w-[140px] rounded-[12px] border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] brand-muted">Cobertura</p>
                    <p className="brand-title mt-3 text-3xl font-semibold">{completion}%</p>
                  </div>
                </div>

                <div className="mt-5">
                  <ProgressBar value={completion} />
                </div>

                <div className="mt-6 grid gap-3">
                  {discipline.documents.map((document) => (
                    <article key={document.id} className="brand-card-light flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="flex flex-wrap gap-2">
                          <StatusPill tone={document.kind === "mind_map" ? "warning" : "default"}>
                            {document.kind === "mind_map" ? "Mapa mental" : "Material"}
                          </StatusPill>
                          {document.topic ? <StatusPill tone="info">{document.topic}</StatusPill> : null}
                        </div>
                        <p className="font-semibold">{document.title}</p>
                        <p className="mt-2 text-sm leading-6 brand-muted">{document.description ?? "Sem descrição cadastrada."}</p>
                        <p className="mt-2 text-xs uppercase tracking-[0.16em] brand-muted">
                          {document.versions[0] ? `Versão atual: v${document.versions[0].versionNumber}` : "Sem versão publicada"}
                        </p>
                      </div>
                      <Link className="brand-button-secondary text-sm" href={`/app/documents/${document.id}`}>
                        Ver versões
                      </Link>
                    </article>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="Nenhum material encontrado."
          description="Refine a busca ou remova o filtro para listar novamente o acervo completo."
          action={
            <button type="button" onClick={() => setQuery("")}>
              Limpar busca
            </button>
          }
        />
      )}
    </section>
  );
}
