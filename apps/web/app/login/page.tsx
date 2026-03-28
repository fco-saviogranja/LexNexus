"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { BrandIcon } from "../../components/BrandIcons";
import { BrandLogo, BrandMark } from "../../components/BrandLogo";
import { ThemeToggle } from "../../components/ThemeToggle";
import { saveAuth } from "../../src/lib/auth";
import { getApiUrl } from "../../src/lib/api-url";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const response = await fetch(`${getApiUrl()}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.message ?? "Falha no login");
      return;
    }

    saveAuth(data);
    router.push("/app");
  }

  return (
    <div className="brand-shell">
      <main className="brand-frame relative mx-auto flex min-h-screen max-w-[1240px] flex-col gap-5 px-4 py-5 md:px-6 lg:flex-row lg:items-stretch lg:py-8">
        <div className="absolute right-4 top-5 z-20 md:right-6 md:top-8">
          <ThemeToggle compact />
        </div>
        <section className="brand-card-dark relative flex flex-1 flex-col justify-between overflow-hidden p-8 md:p-10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-[-120px] right-[-80px] h-[420px] w-[420px] opacity-[0.06]"
          >
            <BrandMark className="h-full w-full" />
          </div>
          <div className="relative z-[1]">
            <BrandLogo subtitle="Mapas mentais, leitura e prática sob demanda." />
            <span className="brand-badge mt-8">Acesso ao ambiente LexNexus</span>
            <h1 className="brand-title mt-6 max-w-2xl text-4xl font-semibold leading-tight md:text-[58px]">
              Entre em uma mesa de estudo com aparência de sistema, não de improviso.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 brand-muted">
              O novo visual organiza melhor o foco: biblioteca, viewer, agenda, prática via IA e revisão aparecem como partes da mesma operação jurídica.
            </p>
          </div>

          <div className="relative z-[1] mt-10 grid gap-3">
            {[
              { title: "Biblioteca", description: "Materiais-base, viewer e versões em um fluxo contínuo.", icon: "library" },
              { title: "Prática IA", description: "Busca questões na internet por banca, tema e contexto jurídico.", icon: "questions" },
              { title: "Cadência", description: "Agenda 1-7-30 para o estudo não perder retorno.", icon: "calendar" }
            ].map((item) => (
              <article key={item.title} className="brand-card-light flex items-start gap-4 p-4">
                <span className="brand-icon-chip">
                  <BrandIcon name={item.icon as "library" | "questions" | "calendar"} className="h-[18px] w-[18px]" />
                </span>
                <div>
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 brand-muted">{item.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="brand-panel w-full max-w-[460px] p-5 md:p-6">
          <div className="brand-card p-6 md:p-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] brand-muted">Login</p>
            <h2 className="brand-title mt-3 text-[34px] font-semibold">Entrar</h2>
            <p className="mt-3 text-sm leading-6 brand-muted">
              Use seu e-mail para retomar a rotina de leitura, prática e revisão. Se ainda não houver conta, o cadastro fica logo abaixo.
            </p>

            <form className="mt-6 space-y-4" onSubmit={onSubmit}>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-mail"
                type="email"
                autoComplete="email"
                required
              />
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Senha"
                type="password"
                autoComplete="current-password"
                required
              />
              {error ? <p className="rounded-[16px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
              <button type="submit" className="w-full">
                Entrar no painel
              </button>
            </form>

            <div className="brand-divider mt-6" />

            <div className="mt-6 grid gap-3">
              <div className="brand-card-light p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] brand-muted">No primeiro acesso</p>
                <p className="mt-2 text-sm leading-6 brand-muted">
                  O novo sistema foi desenhado para deixar o fluxo mais claro desde a primeira tela.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm brand-muted">Primeira vez no LexNexus?</p>
                <Link className="brand-button-secondary" href="/register">
                  Criar conta
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
