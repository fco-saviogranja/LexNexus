"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getUser, type AuthUser } from "../src/lib/auth";
import { ThemeToggle } from "./ThemeToggle";

const PAGE_LABELS: Array<{ matcher: (pathname: string) => boolean; label: string; blurb: string }> = [
  { matcher: (pathname) => pathname === "/app", label: "Mesa de estudos", blurb: "Panorama do dia, prioridades e o próximo bloco de decisão." },
  { matcher: (pathname) => pathname.startsWith("/app/cronograma"), label: "Planejamento", blurb: "Agenda semanal, cadência e distribuição do ciclo." },
  { matcher: (pathname) => pathname.startsWith("/app/questions"), label: "Prática IA", blurb: "Solicitações por tema, banca e contexto a partir do mapa mental." },
  { matcher: (pathname) => pathname.startsWith("/app/simulado"), label: "Seleções IA", blurb: "Conjuntos de prática organizados sob demanda pela IA." },
  { matcher: (pathname) => pathname.startsWith("/app/library"), label: "Biblioteca", blurb: "Acervo jurídico com viewer, progresso e versões." },
  { matcher: (pathname) => pathname.startsWith("/app/flashcards"), label: "Flashcards", blurb: "Memória em fila diária, ligada ao que realmente falhou." },
  { matcher: (pathname) => pathname.startsWith("/app/dashboard"), label: "Análise", blurb: "Métricas, constância e leitura de desempenho sem ruído." },
  { matcher: (pathname) => pathname.startsWith("/app/documents"), label: "Versões", blurb: "Histórico dos materiais e evolução dos documentos." },
  { matcher: (pathname) => pathname.startsWith("/app/viewer"), label: "Viewer", blurb: "Leitura jurídica com marcações, contexto e continuidade." }
];

const todayFormatter = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "2-digit",
  month: "long"
});

function initialsForUser(user: AuthUser | null) {
  if (!user?.name) {
    return "LX";
  }

  return user.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function AppTopbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [todayLabel, setTodayLabel] = useState("");

  useEffect(() => {
    setUser(getUser());
    setTodayLabel(todayFormatter.format(new Date()));
  }, []);

  const pageMeta = useMemo(
    () => PAGE_LABELS.find((item) => item.matcher(pathname)) ?? PAGE_LABELS[0],
    [pathname]
  );

  return (
    <header className="brand-panel sticky top-3 z-20 p-3 md:top-4 md:p-3.5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="brand-badge">{pageMeta.label}</span>
            {todayLabel ? <span className="brand-meta-pill hidden sm:inline-flex">{todayLabel}</span> : null}
          </div>
          <div>
            <p className="brand-title text-[20px] font-semibold leading-7 sm:text-[24px] sm:leading-8 md:text-[28px] md:leading-8">
              {user ? `${user.name.split(" ")[0]}, o foco do dia está montado.` : "Painel LexNexus."}
            </p>
            <p className="mt-1.5 text-[12px] leading-5 brand-muted">{pageMeta.blurb}</p>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <ThemeToggle compact className="w-full sm:w-auto" />
            <Link className="brand-button-secondary w-full justify-center sm:w-auto" href="/app/questions">
              Abrir prática IA
            </Link>
            <Link className="brand-button-secondary w-full justify-center sm:w-auto" href="/app/cronograma">
              Ver agenda
            </Link>
            <Link className="brand-button col-span-2 w-full justify-center sm:col-span-1 sm:w-auto" href="/app/dashboard">
              Desempenho
            </Link>
          </div>

          <div className="brand-card hidden items-center gap-2.5 px-3 py-2 md:flex">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--brand-accent),var(--brand-secondary))] text-sm font-extrabold text-white shadow-[0_12px_24px_rgba(42,183,255,0.16)]">
              {initialsForUser(user)}
            </div>
            <div>
              <p className="text-[12px] font-semibold text-[var(--brand-heading)]">{user?.name ?? "Sessão ativa"}</p>
              <p className="text-xs brand-muted">{user?.role === "admin" ? "Painel de curadoria ativo" : "Rotina de estudo em andamento"}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
