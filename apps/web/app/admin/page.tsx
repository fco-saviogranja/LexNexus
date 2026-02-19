"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppNav } from "../../components/AppNav";
import { Guard } from "../../components/Guard";
import { apiFetch } from "../../src/lib/api";

export default function AdminPage() {
  const [disciplines, setDisciplines] = useState<Array<{ id: string; name: string }>>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [newDiscipline, setNewDiscipline] = useState("");

  async function loadAll() {
    const [d, docs, q, u] = await Promise.all([
      apiFetch<Array<{ id: string; name: string }>>("/admin/disciplines"),
      apiFetch<any[]>("/admin/documents"),
      apiFetch<any[]>("/admin/questions"),
      apiFetch<any[]>("/admin/users")
    ]);
    setDisciplines(d);
    setDocuments(docs);
    setQuestions(q);
    setUsers(u);
  }

  useEffect(() => {
    loadAll().catch(console.error);
  }, []);

  async function createDiscipline(event: FormEvent) {
    event.preventDefault();
    await apiFetch("/admin/disciplines", { method: "POST", body: JSON.stringify({ name: newDiscipline }) });
    setNewDiscipline("");
    await loadAll();
  }

  async function uploadVersion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await apiFetch("/admin/document-versions/upload", {
      method: "POST",
      body: formData,
      headers: {}
    });
    await loadAll();
  }

  return (
    <Guard requireAdmin>
      <AppNav />
      <main className="mx-auto max-w-6xl space-y-6 p-4">
        <h1 className="text-2xl font-semibold">Admin</h1>

        <section className="rounded border bg-white p-3">
          <h2 className="font-semibold">Disciplinas</h2>
          <form onSubmit={createDiscipline} className="mt-2 flex gap-2">
            <input value={newDiscipline} onChange={(e) => setNewDiscipline(e.target.value)} placeholder="Nome" required />
            <button type="submit">Criar</button>
          </form>
          <ul className="mt-2 text-sm">
            {disciplines.map((item) => <li key={item.id}>{item.name}</li>)}
          </ul>
        </section>

        <section className="rounded border bg-white p-3">
          <h2 className="font-semibold">Upload nova versão PDF</h2>
          <form onSubmit={uploadVersion} className="mt-2 grid gap-2 sm:grid-cols-2">
            <select name="documentId" required>
              <option value="">Selecione documento</option>
              {documents.map((doc) => (
                <option key={doc.id} value={doc.id}>{doc.title}</option>
              ))}
            </select>
            <input name="changelog" placeholder="Changelog" />
            <input name="file" type="file" accept="application/pdf" required />
            <button type="submit">Publicar versão</button>
          </form>
        </section>

        <section className="rounded border bg-white p-3">
          <h2 className="font-semibold">Questões</h2>
          <p className="text-sm">Total: {questions.length}</p>
        </section>

        <section className="rounded border bg-white p-3">
          <h2 className="font-semibold">Usuários</h2>
          <ul className="text-sm">
            {users.map((u) => <li key={u.id}>{u.name} ({u.email}) - {u.role}</li>)}
          </ul>
        </section>
      </main>
    </Guard>
  );
}
