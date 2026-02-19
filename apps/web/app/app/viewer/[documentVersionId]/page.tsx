"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Document, Page, pdfjs } from "react-pdf";
import { apiFetch } from "../../../../src/lib/api";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type ViewerPayload = {
  version: { id: string; versionNumber: number; changelog?: string | null } | null;
  state: { lastPage: number; percentCompleted: number } | null;
  annotations: Array<{ id: string; page: number; type: string; noteText?: string | null; color?: string | null }>;
  bookmarks: Array<{ id: string; page: number; label: string }>;
};

export default function ViewerPage() {
  const params = useParams<{ documentVersionId: string }>();
  const documentVersionId = params.documentVersionId;
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [payload, setPayload] = useState<ViewerPayload | null>(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [noteText, setNoteText] = useState("");

  useEffect(() => {
    if (!documentVersionId) {
      return;
    }
    apiFetch<{ url: string }>(`/viewer/${documentVersionId}/url`).then((data) => setPdfUrl(data.url));
    apiFetch<ViewerPayload>(`/viewer/${documentVersionId}`).then((data) => {
      setPayload(data);
      if (data.state?.lastPage) {
        setPage(data.state.lastPage);
      }
    });
  }, [documentVersionId]);

  const progress = useMemo(() => (pages ? Number(((page / pages) * 100).toFixed(2)) : 0), [page, pages]);

  async function saveState(nextPage: number) {
    setPage(nextPage);
    if (!documentVersionId) {
      return;
    }
    await apiFetch(`/viewer/${documentVersionId}/state`, {
      method: "PUT",
      body: JSON.stringify({ lastPage: nextPage, percentCompleted: progress })
    }).catch(console.error);
  }

  async function addNote() {
    if (!documentVersionId) {
      return;
    }
    await apiFetch(`/viewer/${documentVersionId}/annotations`, {
      method: "POST",
      body: JSON.stringify({ page, type: "note", noteText, color: "#fbbf24" })
    });
    setNoteText("");
    const refreshed = await apiFetch<ViewerPayload>(`/viewer/${documentVersionId}`);
    setPayload(refreshed);
  }

  async function addHighlight() {
    if (!documentVersionId) {
      return;
    }
    await apiFetch(`/viewer/${documentVersionId}/annotations`, {
      method: "POST",
      body: JSON.stringify({
        page,
        type: "highlight",
        rects: [{ x: 10, y: 10, width: 120, height: 20 }],
        color: "#fde047"
      })
    });
    const refreshed = await apiFetch<ViewerPayload>(`/viewer/${documentVersionId}`);
    setPayload(refreshed);
  }

  async function addBookmark() {
    if (!documentVersionId) {
      return;
    }
    await apiFetch(`/viewer/${documentVersionId}/bookmarks`, {
      method: "POST",
      body: JSON.stringify({ page, label: `Página ${page}` })
    });
    const refreshed = await apiFetch<ViewerPayload>(`/viewer/${documentVersionId}`);
    setPayload(refreshed);
  }

  return (
    <section className="grid gap-4 lg:grid-cols-[3fr_1fr]">
      <div className="rounded-lg border bg-white p-3">
        <h1 className="mb-2 text-xl font-semibold">Viewer PDF v{payload?.version?.versionNumber}</h1>
        <p className="mb-3 text-sm text-slate-500">{payload?.version?.changelog ?? "Sem changelog"}</p>
        {pdfUrl ? (
          <Document file={pdfUrl} onLoadSuccess={({ numPages }) => setPages(numPages)}>
            <Page pageNumber={page} width={700} />
          </Document>
        ) : (
          <p>Carregando PDF...</p>
        )}
        <div className="mt-3 flex items-center gap-2">
          <button type="button" onClick={() => saveState(Math.max(1, page - 1))}>
            Página anterior
          </button>
          <button type="button" onClick={() => saveState(Math.min(pages || page + 1, page + 1))}>
            Próxima página
          </button>
          <span className="text-sm">{page}/{pages || "-"}</span>
          <span className="text-sm">{progress}%</span>
        </div>
      </div>

      <aside className="space-y-4">
        <div className="rounded-lg border bg-white p-3">
          <h2 className="font-medium">Overlay</h2>
          <button type="button" className="mt-2 w-full" onClick={addHighlight}>
            Adicionar highlight
          </button>
          <button type="button" className="mt-2 w-full" onClick={addBookmark}>
            Favoritar página
          </button>
          <textarea
            className="mt-2 w-full"
            placeholder="Nova nota"
            value={noteText}
            onChange={(event) => setNoteText(event.target.value)}
          />
          <button type="button" className="mt-2 w-full" onClick={addNote}>
            Salvar nota
          </button>
        </div>

        <div className="rounded-lg border bg-white p-3">
          <h2 className="font-medium">Notas</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {payload?.annotations.filter((item) => item.type === "note").map((item) => (
              <li key={item.id} className="rounded border p-2">
                <p className="font-medium">Pág. {item.page}</p>
                <p>{item.noteText}</p>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </section>
  );
}
