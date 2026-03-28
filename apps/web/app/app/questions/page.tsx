"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { EmptyState, MetricCard, PageHeader, SectionTabs, StatusPill, cx } from "../../../components/StudyUi";
import { apiFetch } from "../../../src/lib/api";

type FiltersPayload = {
  disciplines: Array<{ id: string; name: string; questionCount: number }>;
  bancas: string[];
  years: number[];
  instituicoes: string[];
  cargos: string[];
  niveis: string[];
  modalidades: string[];
  areasFormacao: string[];
  areasAtuacao: string[];
  subjects: string[];
  laws: string[];
  difficulties: Array<{ value: string; label: string }>;
  statuses: Record<"all" | "unresolved" | "resolved" | "correct" | "wrong", number>;
  extras: { withAnswerKey: number; withComments: number; withCommentedAnswer: number };
};

type QuestionComment = {
  id: string;
  body: string;
  createdAt: string;
  user: { id: string; name: string };
};

type Question = {
  id: string;
  questionNumber?: number | null;
  statement: string;
  correctOption: string | null;
  reviewStatus: "approved" | "pending_review" | "rejected";
  parseConfidence: number;
  banca: string;
  year: number;
  difficulty: "easy" | "medium" | "hard";
  instituicao?: string | null;
  cargo?: string | null;
  nivel?: string | null;
  modalidade?: string | null;
  subjectTags: string[];
  lawTags: string[];
  commentedAnswer?: string | null;
  discipline?: { id: string; name: string } | null;
  exam?: { examPageUrl?: string | null; sourceCategory?: string | null; reviewStatus?: "approved" | "pending_review" | "rejected" } | null;
  options: Array<{ id: string; optionLetter: string; content: string }>;
  comments: QuestionComment[];
  latestAnswer?: { selectedOption: string; isCorrect: boolean } | null;
  _count: { comments: number; simulationAttemptQuestions: number };
};

type FiltersState = {
  status: "all" | "unresolved" | "resolved" | "correct" | "wrong";
  q: string;
  disciplineId: string;
  subject: string;
  law: string;
  banca: string;
  year: string;
  instituicao: string;
  cargo: string;
  nivel: string;
  difficulty: string;
  modalidade: string;
  areaFormacao: string;
  areaAtuacao: string;
  limit: string;
  excludeOutdated: boolean;
  excludeAnnulled: boolean;
  onlyCommentedAnswer: boolean;
  onlyWithComments: boolean;
  onlyMyComments: boolean;
  onlyFromMySimulados: boolean;
  hasAnswerKey: boolean;
};

type AnswerResult = { selectedOption: string; isCorrect: boolean; correctOption: string | null };

const baseFilters: FiltersState = {
  status: "all",
  q: "",
  disciplineId: "",
  subject: "",
  law: "",
  banca: "",
  year: "",
  instituicao: "",
  cargo: "",
  nivel: "",
  difficulty: "",
  modalidade: "",
  areaFormacao: "",
  areaAtuacao: "",
  limit: "20",
  excludeOutdated: false,
  excludeAnnulled: false,
  onlyCommentedAnswer: false,
  onlyWithComments: false,
  onlyMyComments: false,
  onlyFromMySimulados: false,
  hasAnswerKey: false
};

const difficultyLabels = { easy: "Fácil", medium: "Média", hard: "Alta" } as const;
const statusLabels = { all: "Todas", unresolved: "Não resolvidas", resolved: "Resolvidas", correct: "Acertei", wrong: "Errei" } as const;

function buildSearchParams(filters: FiltersState) {
  const params = new URLSearchParams();
  if (filters.status !== "all") params.set("status", filters.status);
  for (const key of ["q", "disciplineId", "subject", "law", "banca", "year", "instituicao", "cargo", "nivel", "difficulty", "modalidade", "areaFormacao", "areaAtuacao", "limit"] as const) {
    const value = filters[key];
    if (value) params.set(key, value);
  }
  if (filters.excludeOutdated) params.set("excludeOutdated", "true");
  if (filters.excludeAnnulled) params.set("excludeAnnulled", "true");
  if (filters.onlyCommentedAnswer) params.set("onlyCommentedAnswer", "true");
  if (filters.onlyWithComments) params.set("onlyWithComments", "true");
  if (filters.onlyMyComments) params.set("onlyMyComments", "true");
  if (filters.onlyFromMySimulados) params.set("onlyFromMySimulados", "true");
  if (filters.hasAnswerKey) params.set("hasAnswerKey", "true");
  return params;
}

export default function QuestionsPage() {
  const [meta, setMeta] = useState<FiltersPayload | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filters, setFilters] = useState(baseFilters);
  const [results, setResults] = useState<Record<string, AnswerResult>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentingId, setCommentingId] = useState<string | null>(null);

  async function loadQuestions(nextFilters = filters) {
    setLoading(true);
    setStatus(null);
    setError(null);
    try {
      setQuestions(await apiFetch<Question[]>(`/questions?${buildSearchParams(nextFilters).toString()}`));
    } catch (err) {
      console.error(err);
      setError("Não foi possível carregar as questões.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    Promise.all([apiFetch<FiltersPayload>("/questions/filters"), loadQuestions(baseFilters)])
      .then(([payload]) => setMeta(payload))
      .catch((err) => {
        console.error(err);
        setError("Não foi possível preparar a área de questões.");
      });
  }, []);

  const sessionAnswers = Object.keys(results).length;
  const sessionCorrect = Object.values(results).filter((item) => item.isCorrect).length;
  const visibleWithComments = questions.filter((item) => item.comments.length > 0).length;
  const visibleWithAnswerKey = questions.filter((item) => item.correctOption).length;
  const appliedFilters = useMemo(() => Object.entries(filters).filter(([, value]) => value && value !== "all" && value !== "20").length, [filters]);

  async function answer(question: Question, selectedOption: string) {
    if (!question.correctOption) {
      setError("Essa questão ainda não tem gabarito importado.");
      return;
    }
    try {
      const response = await apiFetch<{ isCorrect: boolean; correctOption: string | null }>("/answers", {
        method: "POST",
        body: JSON.stringify({ questionId: question.id, selectedOption })
      });
      setResults((current) => ({ ...current, [question.id]: { selectedOption, isCorrect: response.isCorrect, correctOption: response.correctOption } }));
      setStatus(response.isCorrect ? "Resposta correta registrada." : "Resposta incorreta registrada.");
    } catch (err) {
      console.error(err);
      setError("Não foi possível registrar a resposta.");
    }
  }

  async function submitComment(questionId: string) {
    const body = commentDrafts[questionId]?.trim();
    if (!body) return;
    setCommentingId(questionId);
    try {
      const comment = await apiFetch<QuestionComment>(`/questions/${questionId}/comments`, {
        method: "POST",
        body: JSON.stringify({ body })
      });
      setQuestions((current) => current.map((item) => item.id === questionId ? { ...item, comments: [comment, ...item.comments].slice(0, 3), _count: { ...item._count, comments: item._count.comments + 1 } } : item));
      setCommentDrafts((current) => ({ ...current, [questionId]: "" }));
      setStatus("Comentário publicado.");
    } catch (err) {
      console.error(err);
      setError("Não foi possível publicar o comentário.");
    } finally {
      setCommentingId(null);
    }
  }

  const setFlag = (key: keyof FiltersState) => (checked: boolean) => setFilters((current) => ({ ...current, [key]: checked }));

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Treino prático"
        title="Banco jurídico consultável, com treino e leitura editorial."
        description="A busca combina palavra-chave, filtros por banca, órgão, cargo, nível, assunto e leis, sempre consultando apenas a base própria do LexNexus."
        actions={<><button type="button" onClick={() => loadQuestions().catch(console.error)}>Buscar questões</button><Link className="brand-button-secondary" href="/app/simulado">Gerar simulado</Link></>}
        summary={<div className="space-y-4"><div><p className="text-[11px] font-semibold uppercase tracking-[0.08em] brand-muted">Base consultável</p><h2 className="brand-title mt-3 text-[30px] font-semibold">{meta?.statuses.all ?? 0} questões</h2></div><div className="grid gap-3 sm:grid-cols-2"><div className="rounded-[12px] border border-slate-200 bg-slate-50 p-4"><p className="text-[11px] font-semibold uppercase tracking-[0.08em] brand-muted">Sessão</p><p className="brand-title mt-3 text-[28px] font-semibold">{sessionAnswers}</p></div><div className="rounded-[12px] border border-slate-200 bg-slate-50 p-4"><p className="text-[11px] font-semibold uppercase tracking-[0.08em] brand-muted">Acertos</p><p className="brand-title mt-3 text-[28px] font-semibold">{sessionCorrect}</p></div></div></div>}
      />

      <SectionTabs items={[{ label: "Filtro clássico", href: "#filtro", active: true }, { label: "Treino", href: "#treino" }, { label: "Comentários", href: "#comentarios" }]} />
      {status ? <div className="rounded-[12px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{status}</div> : null}
      {error ? <div className="rounded-[12px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Resultados carregados" value={questions.length} hint="Recorte atual." accent="query" />
        <MetricCard label="Com gabarito" value={visibleWithAnswerKey} hint="Itens respondiveis no lote." accent="gabarito" />
        <MetricCard label="Com comentários" value={visibleWithComments} hint="Debate visível agora." accent="social" />
        <MetricCard label="Filtros ativos" value={appliedFilters} hint="Refinamentos aplicados." accent="stack" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_340px]">
        <section id="filtro" className="brand-card p-6 md:p-7">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div><p className="text-[11px] font-semibold uppercase tracking-[0.08em] brand-muted">Filtro de questões</p><h2 className="brand-title mt-2 text-[28px] font-semibold">Monte o recorte</h2></div>
            <StatusPill tone="info">Metadados + status</StatusPill>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {(Object.keys(statusLabels) as Array<FiltersState["status"]>).map((key) => (
              <button key={key} type="button" className={cx("rounded-full border px-4 py-2 text-sm font-semibold transition", filters.status === key ? "border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900")} onClick={() => setFilters((current) => ({ ...current, status: key }))}>
                {statusLabels[key]}{meta ? ` (${meta.statuses[key]})` : ""}
              </button>
            ))}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="xl:col-span-4"><label className="mb-2 block text-sm font-semibold" htmlFor="q">Palavra-chave</label><input id="q" value={filters.q} onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))} placeholder="Ex.: lei 14.133, constitucionalidade, licitação" /></div>
            <SelectField id="disciplineId" label="Disciplina" value={filters.disciplineId} options={meta?.disciplines ?? []} getValue={(item) => item.id} getLabel={(item) => item.name} onChange={(value) => setFilters((current) => ({ ...current, disciplineId: value }))} />
            <SelectField id="subject" label="Assunto" value={filters.subject} options={meta?.subjects ?? []} onChange={(value) => setFilters((current) => ({ ...current, subject: value }))} />
            <SelectField id="law" label="Leis" value={filters.law} options={meta?.laws ?? []} onChange={(value) => setFilters((current) => ({ ...current, law: value }))} />
            <SelectField id="banca" label="Banca" value={filters.banca} options={meta?.bancas ?? []} onChange={(value) => setFilters((current) => ({ ...current, banca: value }))} />
            <SelectField id="year" label="Ano" value={filters.year} options={(meta?.years ?? []).map(String)} onChange={(value) => setFilters((current) => ({ ...current, year: value }))} />
            <SelectField id="instituicao" label="Instituição" value={filters.instituicao} options={meta?.instituicoes ?? []} onChange={(value) => setFilters((current) => ({ ...current, instituicao: value }))} />
            <SelectField id="cargo" label="Cargo" value={filters.cargo} options={meta?.cargos ?? []} onChange={(value) => setFilters((current) => ({ ...current, cargo: value }))} />
            <SelectField id="nivel" label="Nível" value={filters.nivel} options={meta?.niveis ?? []} onChange={(value) => setFilters((current) => ({ ...current, nivel: value }))} />
            <SelectField id="difficulty" label="Dificuldade" value={filters.difficulty} options={meta?.difficulties ?? []} getValue={(item) => item.value} getLabel={(item) => item.label} onChange={(value) => setFilters((current) => ({ ...current, difficulty: value }))} />
            <SelectField id="modalidade" label="Modalidade" value={filters.modalidade} options={meta?.modalidades ?? []} onChange={(value) => setFilters((current) => ({ ...current, modalidade: value }))} />
            <SelectField id="areaFormacao" label="Área de formação" value={filters.areaFormacao} options={meta?.areasFormacao ?? []} onChange={(value) => setFilters((current) => ({ ...current, areaFormacao: value }))} />
            <SelectField id="areaAtuacao" label="Área de atuação" value={filters.areaAtuacao} options={meta?.areasAtuacao ?? []} onChange={(value) => setFilters((current) => ({ ...current, areaAtuacao: value }))} />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <CheckGroup title="Excluir questões" items={[["Desatualizadas", filters.excludeOutdated, setFlag("excludeOutdated")], ["Anuladas", filters.excludeAnnulled, setFlag("excludeAnnulled")]]} />
            <CheckGroup title="Questões com" items={[["Gabarito comentado", filters.onlyCommentedAnswer, setFlag("onlyCommentedAnswer")], ["Comentários", filters.onlyWithComments, setFlag("onlyWithComments")], ["Meus comentários", filters.onlyMyComments, setFlag("onlyMyComments")], ["Dos meus simulados", filters.onlyFromMySimulados, setFlag("onlyFromMySimulados")], ["Com gabarito", filters.hasAnswerKey, setFlag("hasAnswerKey")]]} />
          </div>

          <div className="mt-6 flex flex-wrap gap-3"><button type="button" onClick={() => loadQuestions().catch(console.error)}>Buscar questões</button><button type="button" className="brand-button-secondary" onClick={() => { setFilters(baseFilters); loadQuestions(baseFilters).catch(console.error); }}>Limpar filtros</button></div>
        </section>

        <aside className="brand-card p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] brand-muted">Resumo do banco</p>
          <div className="mt-5 grid gap-3">
            <div className="rounded-[12px] border border-slate-200 bg-slate-50 p-4"><p className="text-[11px] font-semibold uppercase tracking-[0.08em] brand-muted">Respondidas</p><p className="brand-title mt-3 text-[28px] font-semibold">{meta?.statuses.resolved ?? 0}</p></div>
            <div className="rounded-[12px] border border-slate-200 bg-slate-50 p-4"><p className="text-[11px] font-semibold uppercase tracking-[0.08em] brand-muted">Acertos</p><p className="brand-title mt-3 text-[28px] font-semibold">{meta?.statuses.correct ?? 0}</p></div>
            <div className="rounded-[12px] border border-slate-200 bg-slate-50 p-4"><p className="text-[11px] font-semibold uppercase tracking-[0.08em] brand-muted">Com comentários</p><p className="brand-title mt-3 text-[28px] font-semibold">{meta?.extras.withComments ?? 0}</p></div>
          </div>
        </aside>
      </div>

      <section id="treino" className="brand-card p-6 md:p-7">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div><p className="text-[11px] font-semibold uppercase tracking-[0.08em] brand-muted">Treino</p><h2 className="brand-title mt-2 text-[28px] font-semibold">Rodada atual</h2></div>
          <StatusPill tone={loading ? "warning" : "info"}>{loading ? "carregando" : `${questions.length} itens`}</StatusPill>
        </div>

        {loading ? <div className="mt-6 text-sm brand-muted">Carregando questões...</div> : questions.length ? (
          <div className="mt-6 grid gap-4">
            {questions.map((question, index) => {
              const result = results[question.id] ?? (question.latestAnswer ? { ...question.latestAnswer, correctOption: question.correctOption } : null);
              return (
                <article key={question.id} className="rounded-[16px] border border-slate-200 bg-white p-5 md:p-6">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <StatusPill tone="info">Questão {question.questionNumber ?? index + 1}</StatusPill>
                        <StatusPill tone="default">{question.discipline?.name ?? "Disciplina"}</StatusPill>
                        <StatusPill tone="default">{question.banca}</StatusPill>
                        <StatusPill tone="default">{question.year}</StatusPill>
                        <StatusPill tone={question.difficulty === "hard" ? "warning" : question.difficulty === "medium" ? "info" : "success"}>{difficultyLabels[question.difficulty]}</StatusPill>
                        {question.exam?.sourceCategory ? <StatusPill tone="default">{question.exam.sourceCategory}</StatusPill> : null}
                      </div>
                      <p className="text-lg font-semibold leading-8">{question.statement}</p>
                      <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.14em] brand-muted">{question.cargo ? <span>{question.cargo}</span> : null}{question.instituicao ? <span>{question.instituicao}</span> : null}{question.nivel ? <span>{question.nivel}</span> : null}{question.modalidade ? <span>{question.modalidade}</span> : null}</div>
                    </div>
                    {result ? <StatusPill tone={result.isCorrect ? "success" : "warning"}>{result.isCorrect ? "Correta" : `Correta: ${result.correctOption ?? "-"}`}</StatusPill> : null}
                  </div>

                  {(question.subjectTags.length || question.lawTags.length) ? <div className="mt-4 flex flex-wrap gap-2">{question.subjectTags.map((item) => <span key={`${question.id}-subject-${item}`} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">{item}</span>)}{question.lawTags.map((item) => <span key={`${question.id}-law-${item}`} className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs text-cyan-700">{item}</span>)}</div> : null}

                  <div className="mt-5 grid gap-3">
                    {question.options.map((option) => {
                      const selected = result?.selectedOption === option.optionLetter;
                      const showCorrect = result && question.correctOption && option.optionLetter === question.correctOption;
                      const showWrong = selected && result && !result.isCorrect;
                      return (
                        <button key={option.id} type="button" disabled={!question.correctOption} className={cx("flex flex-col items-start gap-3 rounded-[12px] border p-4 text-left", !question.correctOption ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-80" : showCorrect ? "border-emerald-200 bg-emerald-50" : showWrong ? "border-rose-200 bg-rose-50" : selected ? "border-[var(--brand-primary)] bg-[var(--brand-primary-soft)]" : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white")} onClick={() => answer(question, option.optionLetter)}>
                          <span className="text-xs font-semibold uppercase tracking-[0.18em] brand-muted">{option.optionLetter}</span>
                          <span className="text-sm leading-7 text-slate-700">{option.content}</span>
                        </button>
                      );
                    })}
                  </div>

                  {question.commentedAnswer ? <div className="mt-5 rounded-[12px] border border-cyan-200 bg-cyan-50 p-4"><p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-cyan-700">Gabarito comentado</p><p className="mt-3 text-sm leading-7 text-cyan-800">{question.commentedAnswer}</p></div> : null}

                  <div id="comentarios" className="mt-5 rounded-[12px] border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div><p className="text-sm font-semibold">Comentários</p><p className="mt-1 text-sm brand-muted">{question._count.comments} registro(s)</p></div>
                      {question.exam?.examPageUrl ? <a className="text-sm text-[var(--brand-primary)] underline-offset-4 hover:underline" href={question.exam.examPageUrl} target="_blank" rel="noreferrer">Abrir prova</a> : null}
                    </div>
                    <div className="mt-4 grid gap-3">{question.comments.length ? question.comments.map((comment) => <article key={comment.id} className="rounded-[10px] border border-slate-200 bg-white p-3"><div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold">{comment.user.name}</p><span className="text-xs uppercase tracking-[0.08em] brand-muted">{new Date(comment.createdAt).toLocaleDateString("pt-BR")}</span></div><p className="mt-2 text-sm leading-6 text-slate-700">{comment.body}</p></article>) : <p className="text-sm leading-6 brand-muted">Nenhum comentário recente nesta questão.</p>}</div>
                    <div className="mt-4 flex flex-col gap-3 md:flex-row"><input value={commentDrafts[question.id] ?? ""} onChange={(event) => setCommentDrafts((current) => ({ ...current, [question.id]: event.target.value }))} placeholder="Escreva um comentário curto sobre a questão" /><button type="button" onClick={() => submitComment(question.id).catch(console.error)} disabled={commentingId === question.id}>{commentingId === question.id ? "Publicando..." : "Comentar"}</button></div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : <div className="mt-6"><EmptyState title="Nenhuma questão encontrada." description="Ajuste a busca ou relaxe os filtros para ampliar o recorte." action={<button type="button" onClick={() => { setFilters(baseFilters); loadQuestions(baseFilters).catch(console.error); }}>Limpar filtros</button>} /></div>}
      </section>
    </section>
  );
}

function SelectField<T extends string | { id?: string; name?: string; value?: string; label?: string }>({
  id, label, value, options, onChange, getValue, getLabel
}: { id: string; label: string; value: string; options: T[]; onChange: (value: string) => void; getValue?: (item: T) => string; getLabel?: (item: T) => string }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold" htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Todos</option>
        {options.map((item) => {
          const itemValue = getValue ? getValue(item) : String(item);
          const itemLabel = getLabel ? getLabel(item) : String(item);
          return <option key={`${id}-${itemValue}`} value={itemValue}>{itemLabel}</option>;
        })}
      </select>
    </div>
  );
}

function CheckGroup({ title, items }: { title: string; items: Array<[string, boolean, (checked: boolean) => void]> }) {
  return (
    <div>
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <div className="mt-4 grid gap-3">
        {items.map(([label, checked, onChange]) => (
          <label key={label} className="flex items-center gap-3 text-sm text-slate-700">
            <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
            <span>{label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
