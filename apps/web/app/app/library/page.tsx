"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "../../../src/lib/api";

type Discipline = {
  id: string;
  name: string;
  documents: Array<{ id: string; title: string; description?: string | null; versions: Array<{ id: string; versionNumber: number }> }>;
};

export default function LibraryPage() {
  const [items, setItems] = useState<Discipline[]>([]);

  useEffect(() => {
    apiFetch<Discipline[]>("/library").then(setItems).catch(console.error);
  }, []);

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Biblioteca</h1>
      {items.map((discipline) => (
        <article key={discipline.id} className="rounded-lg border bg-white p-4">
          <h2 className="font-semibold">{discipline.name}</h2>
          <ul className="mt-2 space-y-2">
            {discipline.documents.map((doc) => (
              <li key={doc.id} className="flex items-center justify-between rounded border p-2">
                <div>
                  <p>{doc.title}</p>
                  <p className="text-xs text-slate-500">{doc.description}</p>
                </div>
                <Link className="text-sm text-blue-700" href={`/app/documents/${doc.id}`}>
                  Ver versões
                </Link>
              </li>
            ))}
          </ul>
        </article>
      ))}
    </section>
  );
}
