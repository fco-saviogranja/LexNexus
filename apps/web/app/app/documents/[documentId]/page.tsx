"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "../../../../src/lib/api";

export default function DocumentVersionsPage() {
  const params = useParams<{ documentId: string }>();
  const documentId = params.documentId;
  const [versions, setVersions] = useState<Array<{ id: string; versionNumber: number; isCurrent: boolean; changelog?: string | null }>>([]);

  useEffect(() => {
    if (!documentId) {
      return;
    }
    apiFetch<Array<{ id: string; versionNumber: number; isCurrent: boolean; changelog?: string | null }>>(
      `/documents/${documentId}/versions`
    )
      .then(setVersions)
      .catch(console.error);
  }, [documentId]);

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Versões do documento</h1>
      <ul className="space-y-3">
        {versions.map((version) => (
          <li key={version.id} className="rounded-lg border bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="font-medium">v{version.versionNumber}</p>
              {version.isCurrent ? <span className="text-xs text-green-700">Atual</span> : null}
            </div>
            <p className="mt-2 text-sm text-slate-600">{version.changelog || "Sem changelog"}</p>
            <Link className="mt-2 inline-block text-sm text-blue-700" href={`/app/viewer/${version.id}`}>
              Abrir viewer
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
