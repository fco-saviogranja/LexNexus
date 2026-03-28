"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "../../../../src/lib/api";
import { EmptyState, MetricCard, PageHeader, SectionTabs, StatusPill } from "../../../../components/StudyUi";

type DocumentVersion = {
  id: string;
  versionNumber: number;
  isCurrent: boolean;
  mimeType: string;
  fileName?: string | null;
  changelog?: string | null;
  publishedAt?: string | null;
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric"
});

export default function DocumentVersionsPage() {
  const params = useParams<{ documentId: string }>();
  const documentId = params.documentId;
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!documentId) {
      return;
    }

    apiFetch<DocumentVersion[]>(`/documents/${documentId}/versions`)
      .then(setVersions)
      .catch((err: Error) => {
        console.error(err);
        setError("Não foi possível carregar o histórico do documento.");
      });
  }, [documentId]);

  const currentVersion = useMemo(() => versions.find((item) => item.isCurrent) ?? versions[0] ?? null, [versions]);

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Histórico"
        title="Linha de versões do material."
        description="Cada documento agora aparece como uma trilha de publicação: versão corrente, changelog e acesso rápido ao viewer."
        actions={
          <>
            <Link className="brand-button" href="/app/library">
              Voltar para biblioteca
            </Link>
            {currentVersion ? (
              <Link className="brand-button-secondary" href={`/app/viewer/${currentVersion.id}`}>
                Abrir material atual
              </Link>
            ) : null}
          </>
        }
        summary={
          <div className="space-y-5">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] brand-muted">Estado atual</p>
              <h2 className="brand-title mt-3 text-3xl font-semibold">
                {currentVersion ? `v${currentVersion.versionNumber}` : "Sem versão"}
              </h2>
              <p className="mt-3 text-sm leading-7 brand-muted">
                {currentVersion?.isCurrent ? "Versão corrente liberada para leitura no viewer." : "Nenhuma versão publicada para este documento."}
              </p>
            </div>
          </div>
        }
      />

      <SectionTabs
        items={[
          { label: "Timeline", href: "#timeline", active: true },
          { label: "Material", href: currentVersion ? `/app/viewer/${currentVersion.id}` : "/app/library" }
        ]}
      />

      {error ? <div className="rounded-[12px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Versões registradas" value={versions.length} hint="Histórico total do material." accent="timeline" />
        <MetricCard label="Versão corrente" value={currentVersion ? `v${currentVersion.versionNumber}` : "-"} hint="Versão em uso." accent="current" />
        <MetricCard label="Com changelog" value={versions.filter((item) => item.changelog).length} hint="Entradas documentadas." accent="notas" />
        <MetricCard
          label="Pronto para viewer"
          value={versions.length ? "Sim" : "Não"}
          hint="Abertura imediata quando houver versão publicada."
          accent="viewer"
        />
      </div>

      {versions.length ? (
        <section id="timeline" className="brand-card p-6 md:p-7">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] brand-muted">Timeline de publicação</p>
              <h2 className="brand-title mt-2 text-3xl font-semibold">Versões disponíveis</h2>
            </div>
            <StatusPill tone="info">{versions.length} versoes</StatusPill>
          </div>

          <div className="mt-6 grid gap-4">
            {versions.map((version) => (
              <article key={version.id} className="rounded-[16px] border border-slate-200 bg-white p-5 md:p-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill tone={version.isCurrent ? "success" : "default"}>{version.isCurrent ? "Atual" : "Histórica"}</StatusPill>
                      <StatusPill tone="info">v{version.versionNumber}</StatusPill>
                    </div>
                    <p className="mt-4 text-sm leading-7 brand-muted">
                      {version.changelog || "Sem changelog informado para esta versão."}
                    </p>
                    <p className="mt-3 text-xs uppercase tracking-[0.16em] brand-muted">
                      {version.mimeType === "application/pdf" ? "PDF" : version.mimeType === "application/json" ? "Mapa interativo" : "Imagem"}
                      {version.fileName ? ` · ${version.fileName}` : ""}
                    </p>
                    {version.publishedAt ? (
                      <p className="mt-3 text-xs uppercase tracking-[0.16em] brand-muted">
                        Publicada em {dateFormatter.format(new Date(version.publishedAt))}
                      </p>
                    ) : null}
                  </div>
                  <Link className="brand-button-secondary text-sm" href={`/app/viewer/${version.id}`}>
                    Abrir material
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : (
        <EmptyState
          title="Nenhuma versão publicada."
          description="Este documento ainda não tem versões publicadas para leitura."
          action={
            <Link className="brand-button" href="/app/library">
              Voltar para biblioteca
            </Link>
          }
        />
      )}
    </section>
  );
}
