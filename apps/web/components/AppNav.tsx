"use client";

import Link from "next/link";
import { clearAuth, getUser } from "../src/lib/auth";
import { usePathname, useRouter } from "next/navigation";
import { BrandLogo } from "./BrandLogo";
import { ThemeToggle } from "./ThemeToggle";
import { useEffect, useMemo, useState } from "react";
import { BrandIcon, type BrandIconName } from "./BrandIcons";

const sections = [
  {
    label: "Visão geral",
    items: [
      { href: "/app", label: "Mesa de estudos", icon: "study" },
      { href: "/app/dashboard", label: "Análise", icon: "analytics" },
      { href: "/app/cronograma", label: "Planejamento", icon: "calendar" },
    ],
  },
  {
    label: "Prática assistida",
    items: [
      { href: "/app/questions", label: "Prática IA", icon: "questions" },
      { href: "/app/simulado", label: "Seleções IA", icon: "simulado" },
      { href: "/app/flashcards", label: "Flashcards", icon: "flashcards" },
    ],
  },
  {
    label: "Acervo",
    items: [
      { href: "/app/library", label: "Biblioteca", icon: "library" },
      { href: "/app/study-guide", label: "Guia de Estudos", icon: "roadmap" },
    ],
  },
];

function isItemActive(pathname: string, href: string) {
  return href === "/app" ? pathname === href : pathname.startsWith(href);
}

function currentSectionLabel(pathname: string) {
  for (const section of sections) {
    for (const item of section.items) {
      if (isItemActive(pathname, item.href)) {
        return item.label;
      }
    }
  }

  return pathname.startsWith("/admin") ? "Admin" : "Mesa de estudos";
}

function NavigationGroups({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="space-y-5">
      {sections.map((section) => (
        <div key={section.label} className="space-y-2">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.12em] brand-muted">
            {section.label}
          </p>
          <nav className="grid gap-2">
            {section.items.map((item) => {
              const isActive = isItemActive(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  className="brand-sidebar-link"
                  data-active={isActive}
                  href={item.href}
                  onClick={onNavigate}
                >
                  <span className="brand-icon-chip">
                    <BrandIcon
                      name={item.icon as BrandIconName}
                      className="h-[18px] w-[18px]"
                    />
                  </span>
                  <span className="flex-1">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      ))}
    </div>
  );
}

function MemoryCadenceCard({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand-card p-3.5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] brand-muted">
        Cadência de memória
      </p>
      <p
        className={
          compact
            ? "brand-title mt-2.5 text-[22px]"
            : "brand-title mt-2.5 text-[24px]"
        }
      >
        1-7-30
      </p>
      <p className="mt-2 text-[13px] leading-5 brand-muted">
        A agenda não serve para enfeitar. Ela dita quando o assunto volta e sob
        qual intensidade.
      </p>
      <div className="mt-3 grid gap-2 text-[13px] brand-muted">
        {[
          ["Leitura-base", "Dia 0"],
          ["Revisão curta", "Dia 1"],
          ["Fixação tardia", "Dia 7 e 30"],
        ].map(([label, value]) => (
          <div
            key={label}
            className="brand-card-light flex items-center justify-between px-3 py-2.5"
          >
            <span>{label}</span>
            <span>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfileCard({ user }: { user: ReturnType<typeof getUser> }) {
  return (
    <div className="brand-card p-3.5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] brand-muted">
        Perfil ativo
      </p>
      <p className="mt-2.5 text-[15px] font-semibold text-[var(--brand-heading)]">
        {user?.name ?? "Sessão autenticada"}
      </p>
      <p className="mt-1 text-[13px] brand-muted">
        {user?.email ?? "Rotina jurídica em andamento"}
      </p>
    </div>
  );
}

export function AppNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<ReturnType<typeof getUser>>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setUser(getUser());
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const activeLabel = useMemo(() => currentSectionLabel(pathname), [pathname]);

  const mobileLogout = () => {
    clearAuth();
    router.push("/login");
  };

  return (
    <aside className="w-full lg:sticky lg:top-5 lg:w-[272px] lg:self-start">
      <div className="brand-panel p-3 lg:hidden">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <BrandLogo compact />
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle compact />
            <button
              type="button"
              className="brand-mobile-nav-button"
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? "Fechar navegação" : "Abrir navegação"}
              onClick={() => setMobileOpen((current) => !current)}
            >
              {mobileOpen ? "×" : "☰"}
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <span className="brand-badge">
            {user?.role === "admin" ? "Curadoria" : "Área do aluno"}
          </span>
          <span className="brand-meta-pill">{activeLabel}</span>
        </div>

        {mobileOpen ? (
          <div className="mt-4 space-y-4">
            <NavigationGroups
              pathname={pathname}
              onNavigate={() => setMobileOpen(false)}
            />

            {user?.role === "admin" ? (
              <div className="space-y-2">
                <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.12em] brand-muted">
                  Gestão
                </p>
                <Link
                  className="brand-sidebar-link"
                  data-active={pathname.startsWith("/admin")}
                  href="/admin"
                  onClick={() => setMobileOpen(false)}
                >
                  <span className="brand-icon-chip">
                    <BrandIcon name="admin" className="h-[18px] w-[18px]" />
                  </span>
                  <span className="flex-1">Admin</span>
                </Link>
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <MemoryCadenceCard compact />
              <ProfileCard user={user} />
            </div>

            <button
              type="button"
              className="brand-button-secondary w-full"
              onClick={mobileLogout}
            >
              Encerrar sessão
            </button>
          </div>
        ) : null}
      </div>

      <div className="hidden lg:block">
        <div className="brand-panel h-fit p-4">
          <div className="flex flex-col gap-4">
            <div className="brand-card-dark p-3.5">
              <BrandLogo
                compact
                subtitle="Sistema jurídico de mapas mentais, leitura e memória."
              />
              <div className="mt-3.5 flex flex-wrap gap-2">
                <span className="brand-badge">
                  {user?.role === "admin" ? "Curadoria" : "Área do aluno"}
                </span>
                <span className="brand-meta-pill">Método ativo</span>
                <ThemeToggle compact />
              </div>
            </div>

            <NavigationGroups pathname={pathname} />

            {user?.role === "admin" ? (
              <div className="space-y-2">
                <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.12em] brand-muted">
                  Gestão
                </p>
                <Link
                  className="brand-sidebar-link"
                  data-active={pathname.startsWith("/admin")}
                  href="/admin"
                >
                  <span className="brand-icon-chip">
                    <BrandIcon name="admin" className="h-[18px] w-[18px]" />
                  </span>
                  <span className="flex-1">Admin</span>
                </Link>
              </div>
            ) : null}

            <MemoryCadenceCard />
            <ProfileCard user={user} />

            <button
              type="button"
              className="brand-button-secondary w-full"
              onClick={() => {
                clearAuth();
                router.push("/login");
              }}
            >
              Encerrar sessão
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
