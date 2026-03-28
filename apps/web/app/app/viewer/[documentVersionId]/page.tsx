"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "../../../../src/lib/api";
import { MindMapViewer } from "../../../../components/MindMapViewer";
import { EmptyState, MetricCard, PageHeader, ProgressBar, SectionTabs, StatusPill } from "../../../../components/StudyUi";
import { resolveBuiltInMindMap } from "../../../../src/data/mind-maps";
import type { MindMapData } from "../../../../src/lib/mind-map";

const PdfDocumentViewer = dynamic(
  () => import("../../../../components/PdfDocumentViewer").then((module) => module.PdfDocumentViewer),
  {
    ssr: false,
    loading: () => <div className="flex min-h-[420px] items-center justify-center text-slate-600">Preparando PDF...</div>
  }
);

type ViewerPayload = {
  version: {
    id: string;
    versionNumber: number;
    mimeType: string;
    blobUrl: string;
    fileName?: string | null;
    changelog?: string | null;
    document?: {
      title: string;
      kind: "study_material" | "mind_map";
      topic?: string | null;
    } | null;
  } | null;
  state: { lastPage: number; percentCompleted: number } | null;
  annotations: Array<{ id: string; page: number; type: string; noteText?: string | null; color?: string | null }>;
  bookmarks: Array<{ id: string; page: number; label: string }>;
};

export default function ViewerPage() {
  const params = useParams<{ documentVersionId: string }>();
  const router = useRouter();
  const documentVersionId = params.documentVersionId;
  const [assetUrl, setAssetUrl] = useState("");
  const [payload, setPayload] = useState<ViewerPayload | null>(null);
  const [mindMap, setMindMap] = useState<MindMapData | null>(null);
  const [selectedMindMapNodeId, setSelectedMindMapNodeId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [noteText, setNoteText] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refreshPayload(id: string) {
    const data = await apiFetch<ViewerPayload>(`/viewer/${id}`);
    setPayload(data);
    if (data.version?.mimeType !== "application/pdf") {
      setPage(1);
      setPages(1);
      return;
    }
    if (data.state?.lastPage) {
      setPage(data.state.lastPage);
    }
  }

  useEffect(() => {
    if (!documentVersionId) {
      return;
    }

    refreshPayload(documentVersionId)
      .catch((err: Error) => {
        console.error(err);
        setError("Não foi possível carregar o viewer.");
      });
  }, [documentVersionId]);

  useEffect(() => {
    if (!documentVersionId || !payload?.version?.id || payload.version.id === documentVersionId) {
      return;
    }

    router.replace(`/app/viewer/${payload.version.id}`);
  }, [documentVersionId, payload?.version?.id, router]);

  const builtInMindMap = useMemo(
    () => resolveBuiltInMindMap(payload?.version ?? null),
    [payload?.version?.fileName, payload?.version?.blobUrl]
  );

  useEffect(() => {
    if (!documentVersionId || !payload?.version) {
      return;
    }

    if (builtInMindMap) {
      setAssetUrl("");
      setMindMap(builtInMindMap);
      setSelectedMindMapNodeId((current) => current ?? builtInMindMap.meta.studyPriority[0] ?? builtInMindMap.meta.rootNodeId);
      return;
    }

    apiFetch<{ url: string }>(`/viewer/${documentVersionId}/url`)
      .then((data) => setAssetUrl(data.url))
      .catch((err: Error) => {
        console.error(err);
        setError("Não foi possível carregar o asset do viewer.");
      });
  }, [builtInMindMap, documentVersionId, payload?.version]);

  useEffect(() => {
    if (payload?.version?.mimeType !== "application/json") {
      setMindMap(null);
      setSelectedMindMapNodeId(null);
      return;
    }

    if (builtInMindMap) {
      return;
    }

    if (!assetUrl) {
      return;
    }

    fetch(assetUrl)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Falha ao carregar mapa mental (${response.status})`);
        }

        return response.json() as Promise<MindMapData>;
      })
      .then((data) => {
        setMindMap(data);
        setSelectedMindMapNodeId((current) => current ?? data.meta.studyPriority[0] ?? data.meta.rootNodeId);
      })
      .catch((err: Error) => {
        console.error(err);
        setError("Não foi possível carregar o mapa mental.");
      });
  }, [assetUrl, builtInMindMap, payload?.version?.mimeType]);

  const isPdf = payload?.version?.mimeType === "application/pdf";
  const isMindMap = payload?.version?.mimeType === "application/json";
  const selectedMindMapNode = isMindMap && mindMap
    ? mindMap.nodes.find((node) => node.id === selectedMindMapNodeId) ?? mindMap.nodes.find((node) => node.id === mindMap.meta.rootNodeId) ?? null
    : null;
  const viewerReady = Boolean(assetUrl) || (isMindMap && Boolean(mindMap));
  const progress = useMemo(() => {
    if (!payload?.version) {
      return 0;
    }
    if (!isPdf) {
      return 100;
    }
    return pages ? Number(((page / pages) * 100).toFixed(2)) : payload?.state?.percentCompleted ?? 0;
  }, [isPdf, page, pages, payload]);
  const notes = payload?.annotations.filter((item) => item.type === "note") ?? [];
  const documentTitle = payload?.version?.document?.title ?? payload?.version?.fileName ?? "Material";
  const pageHeaderTitle = isPdf
    ? documentTitle
    : isMindMap
      ? documentTitle
      : "Visualizacao guiada do mapa mental.";
  const pageHeaderDescription = isPdf
    ? "Leitura assistida com progresso salvo, marcacoes, bookmarks e notas no mesmo fluxo."
    : isMindMap
      ? "Mapa em formato de lamina: ramos no topo, subtemas clicaveis e painel lateral apenas como apoio."
      : "Consulta guiada do material visual dentro da biblioteca.";

  async function saveState(nextPage: number) {
    setStatus(null);
    setError(null);
    setPage(nextPage);

    if (!documentVersionId) {
      return;
    }

    try {
      const nextProgress = isPdf ? (pages ? Number(((nextPage / pages) * 100).toFixed(2)) : 0) : 100;
      await apiFetch(`/viewer/${documentVersionId}/state`, {
        method: "PUT",
        body: JSON.stringify({ lastPage: nextPage, percentCompleted: nextProgress })
      });
      setStatus("Posição de leitura salva.");
    } catch (err) {
      console.error(err);
      setError("Não foi possível salvar a posição de leitura.");
    }
  }

  async function addNote() {
    if (!documentVersionId || !noteText.trim()) {
      return;
    }

    setStatus(null);
    setError(null);

    try {
      const normalizedNoteText = isMindMap && selectedMindMapNode ? `[${selectedMindMapNode.label}] ${noteText.trim()}` : noteText.trim();
      await apiFetch(`/viewer/${documentVersionId}/annotations`, {
        method: "POST",
        body: JSON.stringify({ page, type: "note", noteText: normalizedNoteText, color: "#157A73" })
      });
      setNoteText("");
      await refreshPayload(documentVersionId);
      setStatus(isMindMap ? "Nota adicionada ao mapa mental." : "Nota adicionada ao material.");
    } catch (err) {
      console.error(err);
      setError("Não foi possível salvar a nota.");
    }
  }

  async function addHighlight() {
    if (!documentVersionId) {
      return;
    }

    setStatus(null);
    setError(null);

    try {
      await apiFetch(`/viewer/${documentVersionId}/annotations`, {
        method: "POST",
        body: JSON.stringify({
          page,
          type: "highlight",
          rects: [{ x: 10, y: 10, width: 120, height: 20 }],
          color: "#C39353"
        })
      });
      await refreshPayload(documentVersionId);
      setStatus("Marcação rápida adicionada.");
    } catch (err) {
      console.error(err);
      setError("Não foi possível adicionar o highlight.");
    }
  }

  async function addBookmark() {
    if (!documentVersionId) {
      return;
    }

    setStatus(null);
    setError(null);

    try {
      const label = isMindMap ? `Mapa · ${selectedMindMapNode?.label ?? "Visão geral"}` : `Página ${page}`;
      await apiFetch(`/viewer/${documentVersionId}/bookmarks`, {
        method: "POST",
        body: JSON.stringify({ page, label })
      });
      await refreshPayload(documentVersionId);
      setStatus(isMindMap ? "Bookmark salvo no mapa mental." : "Bookmark salvo na leitura.");
    } catch (err) {
      console.error(err);
      setError("Não foi possível salvar o bookmark.");
    }
  }

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Viewer"
        title={pageHeaderTitle}
        description={pageHeaderDescription}
        actions={
          <>
            <Link className="brand-button" href="/app/library">
              Voltar para biblioteca
            </Link>
            <button type="button" className="brand-button-secondary" onClick={addBookmark}>
              {isMindMap ? "Favoritar nó atual" : "Favoritar página"}
            </button>
          </>
        }
        summary={
          <div className="space-y-5">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] brand-muted">Release em leitura</p>
              <h2 className="brand-title mt-3 text-3xl font-semibold">
                {payload?.version ? `v${payload.version.versionNumber}` : "Carregando"}
              </h2>
              <p className="mt-3 text-sm leading-7 brand-muted">{payload?.version?.changelog ?? "Sem changelog registrado para esta versão."}</p>
              {payload?.version?.document ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusPill tone={payload.version.document.kind === "mind_map" ? "warning" : "info"}>
                    {payload.version.document.kind === "mind_map" ? "Mapa mental" : "Material de estudo"}
                  </StatusPill>
                  <StatusPill tone="default">{payload.version.document.title}</StatusPill>
                  {payload.version.document.topic ? <StatusPill tone="default">{payload.version.document.topic}</StatusPill> : null}
                </div>
              ) : null}
            </div>
            <div>
              <div className="flex items-center justify-between text-sm brand-muted">
                <span>Progresso</span>
                <span>{progress}%</span>
              </div>
              <div className="mt-3">
                <ProgressBar value={progress} />
              </div>
            </div>
          </div>
        }
      />

      {!isMindMap ? (
        <SectionTabs
          items={[
            { label: isMindMap ? "Mapa" : "Leitura", href: "#leitura", active: true },
            { label: "Notas", href: "#notas" },
            { label: "Bookmarks", href: "#bookmarks" }
          ]}
        />
      ) : null}

      {status ? <div className="rounded-[12px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{status}</div> : null}
      {error ? <div className="rounded-[12px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      {isMindMap ? (
        <div className="brand-card px-4 py-3">
          <div className="flex flex-wrap gap-2">
            <StatusPill tone="info">{selectedMindMapNode?.label ?? "Mapa aberto"}</StatusPill>
            <StatusPill tone="default">{mindMap?.nodes.length ?? "-"} nos</StatusPill>
            <StatusPill tone="default">{notes.length} notas</StatusPill>
            <StatusPill tone="default">{payload?.bookmarks.length ?? 0} bookmarks</StatusPill>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label={isPdf ? "Pagina atual" : isMindMap ? "No atual" : "Estado"}
            value={isPdf ? page : isMindMap ? selectedMindMapNode?.label ?? "Mapa aberto" : "Mapa aberto"}
            hint={isPdf ? "Ponto salvo da leitura." : isMindMap ? "Ponto selecionado no mapa." : "Registro de consulta ao mapa mental."}
            accent="viewer"
          />
          <MetricCard
            label={isPdf ? "Total de paginas" : isMindMap ? "Nos totais" : "Formato"}
            value={isPdf ? pages || "-" : isMindMap ? mindMap?.nodes.length ?? "-" : "Imagem"}
            hint={isPdf ? "Numero carregado do PDF." : isMindMap ? "Estrutura navegavel do mapa." : "Mapa mental visual no acervo."}
            accent="pdf"
          />
          <MetricCard label="Notas" value={notes.length} hint="Anotacoes de estudo nesta versao." accent="note" />
          <MetricCard label="Bookmarks" value={payload?.bookmarks.length ?? 0} hint="Paginas marcadas para retorno." accent="flag" />
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <section id="leitura" className="brand-card overflow-hidden p-4 md:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] brand-muted">Leitura</p>
              <h2 className="brand-title mt-2 text-[22px] font-semibold md:text-[26px]">
                {isPdf ? `Pagina ${page}` : documentTitle}
              </h2>
              {isMindMap && selectedMindMapNode ? (
                <p className="mt-2 text-[13px] leading-6 brand-muted">Ponto selecionado: {selectedMindMapNode.label}</p>
              ) : null}
            </div>
            <StatusPill tone="info">
              {isPdf ? `${page}/${pages || "-"}` : isMindMap ? "Lamina interativa" : payload?.version?.fileName ?? "Imagem"}
            </StatusPill>
          </div>

          <div className={isMindMap ? "mt-4" : "mt-4 overflow-x-auto rounded-[22px] bg-white/90 p-3"}>
            {viewerReady ? (
              isPdf ? (
                <PdfDocumentViewer assetUrl={assetUrl} page={page} onLoadSuccess={setPages} />
              ) : isMindMap ? (
                mindMap ? (
                  <MindMapViewer map={mindMap} selectedNodeId={selectedMindMapNodeId} onSelectNode={setSelectedMindMapNodeId} />
                ) : (
                  <div className="flex min-h-[420px] items-center justify-center text-slate-600">Carregando mapa mental...</div>
                )
              ) : (
                <div className="flex min-h-[420px] items-center justify-center rounded-[22px] bg-slate-50 p-4">
                  <img src={assetUrl} alt={payload?.version?.document?.title ?? "Mapa mental"} className="h-auto max-h-[920px] w-full rounded-[18px] object-contain" />
                </div>
              )
            ) : (
              <div className="flex min-h-[420px] items-center justify-center text-slate-600">Carregando material...</div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {isPdf ? (
              <>
                <button type="button" className="brand-button-secondary" onClick={() => saveState(Math.max(1, page - 1))}>
                  Pagina anterior
                </button>
                <button type="button" className="brand-button-secondary" onClick={() => saveState(Math.min(pages || page + 1, page + 1))}>
                  Proxima pagina
                </button>
                <button type="button" className="brand-button-secondary" onClick={addHighlight}>
                  Highlight rápido
                </button>
              </>
            ) : isMindMap ? (
              <button type="button" className="brand-button-secondary" onClick={() => saveState(1)}>
                Registrar consulta deste mapa
              </button>
            ) : (
              <button type="button" className="brand-button-secondary" onClick={() => saveState(1)}>
                Registrar consulta
              </button>
            )}
          </div>
        </section>

        <div className="grid gap-4">
          <section className="brand-card p-4 md:p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] brand-muted">Overlay</p>
            <h2 className="brand-title mt-3 text-[22px] font-semibold">Acoes do viewer</h2>
            <div className="mt-4 grid gap-3">
              <button type="button" className="brand-button-secondary w-full" onClick={addBookmark}>
                {isPdf ? `Favoritar página ${page}` : isMindMap ? `Favoritar ${selectedMindMapNode?.label ?? "este mapa"}` : "Favoritar este mapa"}
              </button>
              {isPdf ? (
                <button type="button" className="brand-button-secondary w-full" onClick={addHighlight}>
                  Aplicar highlight
                </button>
              ) : null}
            </div>

            <div id="notas" className="mt-4">
              <label className="mb-2 block text-sm font-semibold" htmlFor="viewer-note">
                Nova nota
              </label>
              <textarea
                id="viewer-note"
                placeholder={
                  isMindMap
                    ? "Registre definição, exceção, artigo ou conexão importante deste ramo."
                    : "Registre artigo, exceção, pegadinha ou tese importante desta página."
                }
                value={noteText}
                onChange={(event) => setNoteText(event.target.value)}
              />
              <button type="button" className="mt-3 w-full" onClick={addNote}>
                Salvar nota
              </button>
            </div>
          </section>

          <section id="bookmarks" className="brand-card p-4 md:p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] brand-muted">Bookmarks</p>
            <h2 className="brand-title mt-3 text-[22px] font-semibold">Paginas para retorno</h2>
            <div className="mt-4 grid gap-3">
              {(payload?.bookmarks ?? []).map((item) => (
                <article key={item.id} className="rounded-[12px] border border-slate-200 bg-slate-50 p-4">
                  <p className="font-semibold">{item.label}</p>
                  <p className="mt-2 text-sm leading-6 brand-muted">Pagina {item.page}</p>
                </article>
              ))}
              {payload?.bookmarks?.length ? null : <p className="text-sm leading-7 brand-muted">Nenhum bookmark salvo nesta versão.</p>}
            </div>
          </section>

          <section className="brand-card p-4 md:p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] brand-muted">Notas</p>
            <h2 className="brand-title mt-3 text-[22px] font-semibold">Anotacoes da leitura</h2>
            <div className="mt-4 grid gap-3">
              {notes.map((item) => (
                <article key={item.id} className="rounded-[12px] border border-slate-200 bg-slate-50 p-4">
                  <p className="font-semibold">Pag. {item.page}</p>
                  <p className="mt-2 text-sm leading-7 brand-muted">{item.noteText}</p>
                </article>
              ))}
              {notes.length ? null : <p className="text-sm leading-7 brand-muted">Nenhuma nota criada ainda para esta versão.</p>}
            </div>
          </section>
        </div>
      </div>

      {!viewerReady && !error ? (
        <EmptyState
          title="Preparando o viewer."
          description="O material ainda está sendo carregado. Assim que o conteúdo estiver pronto, a leitura aparece aqui."
        />
      ) : null}
    </section>
  );
}
