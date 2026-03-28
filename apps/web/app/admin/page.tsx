"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppNav } from "../../components/AppNav";
import { Guard } from "../../components/Guard";
import { MetricCard, StatusPill } from "../../components/StudyUi";
import { apiFetch } from "../../src/lib/api";

type Discipline = { id: string; name: string };

type AdminDocument = {
  id: string;
  title: string;
  kind: "study_material" | "mind_map";
  topic?: string | null;
  description?: string | null;
  discipline: { id: string; name: string };
  versions: Array<{ id: string; versionNumber: number; isCurrent: boolean }>;
};

type AdminUser = { id: string; name: string; email: string; role: string };

type ImportOverview = {
  counts: {
    questions: { total: number; approved: number; pendingReview: number; rejected: number };
    exams: { total: number; approved: number; pendingReview: number; rejected: number };
    materials: { studyMaterials: number; mindMaps: number };
  };
  recentRuns: Array<{
    id: string;
    status: string;
    trigger: string;
    categories: string[];
    importedQuestions: number;
    pendingReviewQuestions: number;
    failedExams: number;
    startedAt: string;
    finishedAt?: string | null;
  }>;
  recentIssues: Array<{
    id: string;
    stage: string;
    severity: "info" | "warning" | "error";
    message: string;
    createdAt: string;
    sourceKey?: string | null;
    exam?: { id: string; title: string; sourceCategory?: string | null } | null;
  }>;
  reviewQueue: Array<{
    id: string;
    statement: string;
    parseConfidence: number;
    reviewStatus: "approved" | "pending_review" | "rejected";
    year: number;
    banca: string;
    discipline: { id: string; name: string };
    exam?: { id: string; title: string; sourceCategory?: string | null } | null;
  }>;
};

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit"
});

function labelForDocumentKind(kind: AdminDocument["kind"]) {
  return kind === "mind_map" ? "Mapa mental" : "Material";
}

export default function AdminPage() {
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [documents, setDocuments] = useState<AdminDocument[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [overview, setOverview] = useState<ImportOverview | null>(null);
  const [newDiscipline, setNewDiscipline] = useState("");
  const [newDocumentTitle, setNewDocumentTitle] = useState("");
  const [newDocumentDisciplineId, setNewDocumentDisciplineId] = useState("");
  const [newDocumentKind, setNewDocumentKind] = useState<"study_material" | "mind_map">("study_material");
  const [newDocumentTopic, setNewDocumentTopic] = useState("");
  const [newDocumentDescription, setNewDocumentDescription] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  async function loadAll() {
    const [disciplineData, documentData, userData, overviewData] = await Promise.all([
      apiFetch<Discipline[]>("/admin/disciplines"),
      apiFetch<AdminDocument[]>("/admin/documents"),
      apiFetch<AdminUser[]>("/admin/users"),
      apiFetch<ImportOverview>("/admin/imports/overview")
    ]);
    setDisciplines(disciplineData);
    setDocuments(documentData);
    setUsers(userData);
    setOverview(overviewData);
  }

  useEffect(() => {
    loadAll().catch((err) => {
      console.error(err);
      setError("Não foi possível carregar a área administrativa.");
    });
  }, []);

  async function createDiscipline(event: FormEvent) {
    event.preventDefault();
    setStatus(null);
    setError(null);
    try {
      await apiFetch("/admin/disciplines", { method: "POST", body: JSON.stringify({ name: newDiscipline }) });
      setNewDiscipline("");
      setStatus("Disciplina criada.");
      await loadAll();
    } catch (err) {
      console.error(err);
      setError("Não foi possível criar a disciplina.");
    }
  }

  async function createDocument(event: FormEvent) {
    event.preventDefault();
    setStatus(null);
    setError(null);
    try {
      await apiFetch("/admin/documents", {
        method: "POST",
        body: JSON.stringify({
          title: newDocumentTitle,
          disciplineId: newDocumentDisciplineId,
          kind: newDocumentKind,
          topic: newDocumentTopic || null,
          description: newDocumentDescription || null
        })
      });
      setNewDocumentTitle("");
      setNewDocumentDisciplineId("");
      setNewDocumentKind("study_material");
      setNewDocumentTopic("");
      setNewDocumentDescription("");
      setStatus("Material cadastrado.");
      await loadAll();
    } catch (err) {
      console.error(err);
      setError("Não foi possível cadastrar o material.");
    }
  }

  async function uploadVersion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    setError(null);
    const formData = new FormData(event.currentTarget);
    try {
      await apiFetch("/admin/document-versions/upload", {
        method: "POST",
        body: formData,
        headers: {}
      });
      event.currentTarget.reset();
      setStatus("Versão publicada no acervo.");
      await loadAll();
    } catch (err) {
      console.error(err);
      setError("Não foi possível publicar a versão.");
    }
  }

  async function reviewQuestion(questionId: string, reviewStatus: "approved" | "rejected") {
    setReviewingId(questionId);
    setStatus(null);
    setError(null);
    try {
      await apiFetch(`/admin/questions/${questionId}/review`, {
        method: "PATCH",
        body: JSON.stringify({ reviewStatus })
      });
      setStatus(reviewStatus === "approved" ? "Questão aprovada para a base." : "Questão retirada da base.");
      await loadAll();
    } catch (err) {
      console.error(err);
      setError("Não foi possível atualizar a curadoria da questão.");
    } finally {
      setReviewingId(null);
    }
  }

  return (
    <Guard requireAdmin>
      <div className="brand-shell">
        <div className="brand-frame mx-auto flex min-h-screen max-w-7xl flex-col gap-4 px-4 py-4 lg:flex-row lg:px-6 lg:py-6">
          <AppNav />
          <main className="brand-panel min-w-0 flex-1 space-y-6 p-5 md:p-6 lg:p-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] brand-muted">Curadoria editorial</p>
              <h1 className="brand-title mt-2 text-4xl font-extrabold">Administração do acervo e da base jurídica</h1>
              <p className="mt-3 max-w-3xl text-base leading-7 brand-muted">
                Esta área concentra cadastro de disciplinas, materiais de estudo, mapas mentais e acompanhamento da ingestão das provas do PCI.
              </p>
            </div>

            {status ? <div className="rounded-[12px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{status}</div> : null}
            {error ? <div className="rounded-[12px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Questões aprovadas" value={overview?.counts.questions.approved ?? 0} hint="Itens prontos para consulta." accent="curadoria" />
              <MetricCard label="Fila de revisão" value={overview?.counts.questions.pendingReview ?? 0} hint="Questões aguardando decisão editorial." accent="revisao" />
              <MetricCard label="Materiais base" value={overview?.counts.materials.studyMaterials ?? 0} hint="Textos e guias publicados." accent="acervo" />
              <MetricCard label="Mapas mentais" value={overview?.counts.materials.mindMaps ?? 0} hint="Materiais de memorização por assunto." accent="mapa" />
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
              <section className="brand-card p-5">
                <h2 className="text-xl font-semibold">Criar disciplina</h2>
                <form onSubmit={createDiscipline} className="mt-4 flex flex-col gap-3 md:flex-row">
                  <input value={newDiscipline} onChange={(event) => setNewDiscipline(event.target.value)} placeholder="Ex.: Direito Constitucional" required />
                  <button type="submit">Salvar disciplina</button>
                </form>
                <div className="mt-4 grid gap-2 text-sm md:grid-cols-2">
                  {disciplines.map((item) => (
                    <div key={item.id} className="brand-card-light p-4">
                      {item.name}
                    </div>
                  ))}
                </div>
              </section>

              <section className="brand-card p-5">
                <h2 className="text-xl font-semibold">Cadastrar material</h2>
                <form onSubmit={createDocument} className="mt-4 grid gap-3 md:grid-cols-2">
                  <input value={newDocumentTitle} onChange={(event) => setNewDocumentTitle(event.target.value)} placeholder="Título" required />
                  <select value={newDocumentDisciplineId} onChange={(event) => setNewDocumentDisciplineId(event.target.value)} required>
                    <option value="">Selecione a disciplina</option>
                    {disciplines.map((discipline) => (
                      <option key={discipline.id} value={discipline.id}>
                        {discipline.name}
                      </option>
                    ))}
                  </select>
                  <select value={newDocumentKind} onChange={(event) => setNewDocumentKind(event.target.value as "study_material" | "mind_map")}>
                    <option value="study_material">Material de estudo</option>
                    <option value="mind_map">Mapa mental</option>
                  </select>
                  <input value={newDocumentTopic} onChange={(event) => setNewDocumentTopic(event.target.value)} placeholder="Assunto ou recorte" />
                  <textarea className="md:col-span-2" value={newDocumentDescription} onChange={(event) => setNewDocumentDescription(event.target.value)} placeholder="Descrição curta do material" />
                  <button type="submit" className="md:col-span-2">Cadastrar material</button>
                </form>
              </section>
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
              <section className="brand-card p-5">
                <h2 className="text-xl font-semibold">Publicar arquivo do acervo</h2>
                <form onSubmit={uploadVersion} className="mt-4 grid gap-3 sm:grid-cols-2">
                  <select name="documentId" required>
                    <option value="">Selecione o material</option>
                    {documents.map((document) => (
                      <option key={document.id} value={document.id}>
                        {document.title} · {labelForDocumentKind(document.kind)}
                      </option>
                    ))}
                  </select>
                  <input name="changelog" placeholder="Resumo da atualização" />
                  <input name="file" type="file" accept="application/pdf,image/png,image/jpeg,image/webp" required />
                  <button type="submit">Publicar versão</button>
                </form>
                <p className="mt-3 text-sm leading-6 brand-muted">
                  Para materiais-base, use PDF. Para mapas mentais, o Lex aceita PDF, PNG, JPG e WEBP.
                </p>
              </section>

              <section className="brand-card p-5">
                <h2 className="text-xl font-semibold">Pessoas com acesso</h2>
                <div className="mt-4 space-y-2 text-sm">
                  {users.map((user) => (
                    <div key={user.id} className="brand-card-light p-4">
                      {user.name} ({user.email}) · {user.role}
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <section className="brand-card p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Base de materiais</h2>
                  <p className="mt-2 text-sm leading-6 brand-muted">O acervo agora diferencia materiais-base e mapas mentais por disciplina e assunto.</p>
                </div>
                <StatusPill tone="info">{documents.length} itens cadastrados</StatusPill>
              </div>

              <div className="mt-4 grid gap-3 xl:grid-cols-2">
                {documents.map((document) => (
                  <article key={document.id} className="rounded-[14px] border border-slate-200 bg-white p-4">
                    <div className="flex flex-wrap gap-2">
                      <StatusPill tone={document.kind === "mind_map" ? "warning" : "default"}>{labelForDocumentKind(document.kind)}</StatusPill>
                      <StatusPill tone="info">{document.discipline.name}</StatusPill>
                      {document.topic ? <StatusPill tone="default">{document.topic}</StatusPill> : null}
                    </div>
                    <p className="mt-3 text-base font-semibold">{document.title}</p>
                    <p className="mt-2 text-sm leading-6 brand-muted">{document.description ?? "Sem descrição cadastrada."}</p>
                    <p className="mt-3 text-xs uppercase tracking-[0.12em] brand-muted">
                      {document.versions[0] ? `Versão atual: v${document.versions[0].versionNumber}` : "Sem versão publicada"}
                    </p>
                  </article>
                ))}
              </div>
            </section>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
              <section className="brand-card p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">Fila de revisão do PCI</h2>
                    <p className="mt-2 text-sm leading-6 brand-muted">Aprovar libera a questão na base. Rejeitar retira o item da consulta estudantil.</p>
                  </div>
                  <StatusPill tone="warning">{overview?.reviewQueue.length ?? 0} itens carregados</StatusPill>
                </div>

                <div className="mt-4 grid gap-3">
                  {(overview?.reviewQueue ?? []).map((question) => (
                    <article key={question.id} className="rounded-[14px] border border-slate-200 bg-white p-4">
                      <div className="flex flex-wrap gap-2">
                        <StatusPill tone="info">{question.discipline.name}</StatusPill>
                        <StatusPill tone="default">{question.banca}</StatusPill>
                        <StatusPill tone="default">{question.year}</StatusPill>
                        {question.exam?.sourceCategory ? <StatusPill tone="default">{question.exam.sourceCategory}</StatusPill> : null}
                      </div>
                      <p className="mt-3 text-sm leading-7 text-slate-800">{question.statement}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.12em] brand-muted">
                        <span>Confiança {Math.round(question.parseConfidence * 100)}%</span>
                        {question.exam?.title ? <span>{question.exam.title}</span> : null}
                      </div>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <button type="button" onClick={() => reviewQuestion(question.id, "approved").catch(console.error)} disabled={reviewingId === question.id}>
                          {reviewingId === question.id ? "Salvando..." : "Aprovar"}
                        </button>
                        <button type="button" className="brand-button-secondary" onClick={() => reviewQuestion(question.id, "rejected").catch(console.error)} disabled={reviewingId === question.id}>
                          Rejeitar
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <div className="grid gap-4">
                <section className="brand-card p-5">
                  <h2 className="text-xl font-semibold">Últimas execuções</h2>
                  <div className="mt-4 grid gap-3">
                    {(overview?.recentRuns ?? []).map((run) => (
                      <article key={run.id} className="rounded-[14px] border border-slate-200 bg-white p-4">
                        <div className="flex flex-wrap gap-2">
                          <StatusPill tone={run.status === "completed" ? "success" : run.status === "completed_with_errors" ? "warning" : "default"}>{run.status}</StatusPill>
                          <StatusPill tone="default">{run.trigger}</StatusPill>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-slate-800">{run.categories.join(", ") || "Categorias padrao"}</p>
                        <p className="mt-2 text-xs uppercase tracking-[0.12em] brand-muted">
                          {dateTimeFormatter.format(new Date(run.startedAt))}
                        </p>
                        <p className="mt-3 text-sm brand-muted">
                          {run.importedQuestions} questões importadas · {run.pendingReviewQuestions} em revisão · {run.failedExams} falhas
                        </p>
                      </article>
                    ))}
                  </div>
                </section>

                <section className="brand-card p-5">
                  <h2 className="text-xl font-semibold">Ocorrências recentes</h2>
                  <div className="mt-4 grid gap-3">
                    {(overview?.recentIssues ?? []).map((issue) => (
                      <article key={issue.id} className="rounded-[14px] border border-slate-200 bg-white p-4">
                        <div className="flex flex-wrap gap-2">
                          <StatusPill tone={issue.severity === "error" ? "warning" : issue.severity === "warning" ? "info" : "default"}>{issue.severity}</StatusPill>
                          <StatusPill tone="default">{issue.stage}</StatusPill>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-slate-800">{issue.message}</p>
                        <p className="mt-2 text-xs uppercase tracking-[0.12em] brand-muted">
                          {dateTimeFormatter.format(new Date(issue.createdAt))}
                        </p>
                        {issue.exam?.title ? <p className="mt-2 text-sm brand-muted">{issue.exam.title}</p> : null}
                      </article>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </main>
        </div>
      </div>
    </Guard>
  );
}
