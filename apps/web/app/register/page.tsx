"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { BrandIcon } from "../../components/BrandIcons";
import { BrandLogo, BrandMark } from "../../components/BrandLogo";
import { ThemeToggle } from "../../components/ThemeToggle";
import { saveAuth } from "../../src/lib/auth";
import { getApiUrl } from "../../src/lib/api-url";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const response = await fetch(`${getApiUrl()}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.message ?? "Falha no cadastro");
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
        <section className="brand-panel relative flex flex-1 flex-col justify-between overflow-hidden p-8 md:p-10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-[-120px] right-[-80px] h-[420px] w-[420px] opacity-[0.055]"
          >
            <BrandMark className="h-full w-full" />
          </div>
          <div className="relative z-[1]">
            <BrandLogo subtitle="Uma identidade jurídica mais precisa e contemporânea." />
            <span className="brand-badge mt-8">Criação de conta</span>
            <h1 className="brand-title mt-6 max-w-2xl text-4xl font-semibold leading-tight md:text-[58px]">
              Comece em um ambiente desenhado para continuidade, não para enfeite.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 brand-muted">
              O cadastro leva para uma mesa que já conecta acervo, viewer, prática via IA e revisão. A nova identidade foi pensada para parecer confiável, técnica e memorável.
            </p>
          </div>

          <div className="relative z-[1] mt-10 grid gap-3 md:grid-cols-3">
            {[
              { title: "Viewer", description: "Leitura com notas, bookmarks e estado salvo.", icon: "study" },
              { title: "Prática IA", description: "Busca questões públicas na internet por banca e assunto.", icon: "questions" },
              { title: "Flashcards", description: "Memória conectada ao erro e ao cronograma.", icon: "flashcards" }
            ].map((item) => (
              <article key={item.title} className="brand-card p-5">
                <span className="brand-icon-chip">
                  <BrandIcon name={item.icon as "study" | "questions" | "flashcards"} className="h-[18px] w-[18px]" />
                </span>
                <p className="mt-4 text-sm font-semibold text-[var(--brand-heading)]">{item.title}</p>
                <p className="mt-2 text-sm leading-6 brand-muted">{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="brand-card-dark w-full max-w-[460px] p-5 md:p-6">
          <div className="brand-card-light p-6 md:p-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] brand-muted">Cadastro</p>
            <h2 className="brand-title mt-3 text-[34px] font-semibold">Criar conta</h2>
            <p className="mt-3 text-sm leading-6 brand-muted">
              Preencha os dados para abrir sua área de estudo e entrar direto na nova identidade do LexNexus.
            </p>

            <form className="mt-6 space-y-4" onSubmit={onSubmit}>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome" autoComplete="name" required />
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
                autoComplete="new-password"
                required
              />
              {error ? <p className="rounded-[16px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
              <button type="submit" className="w-full">
                Criar conta
              </button>
            </form>

            <div className="brand-divider mt-6" />

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm brand-muted">Já existe acesso?</p>
              <Link className="brand-button-secondary" href="/login">
                Ir para login
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
