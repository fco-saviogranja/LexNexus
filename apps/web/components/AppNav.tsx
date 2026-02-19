"use client";

import Link from "next/link";
import { clearAuth, getUser } from "../src/lib/auth";
import { useRouter } from "next/navigation";

export function AppNav() {
  const router = useRouter();
  const user = typeof window === "undefined" ? null : getUser();

  return (
    <nav className="flex flex-wrap items-center gap-2 border-b bg-white p-3 text-sm">
      <Link href="/app">Home</Link>
      <Link href="/app/library">Biblioteca</Link>
      <Link href="/app/dashboard">Dashboard</Link>
      <Link href="/app/questions">Questões</Link>
      <Link href="/app/simulado">Simulado</Link>
      <Link href="/app/cronograma">Cronograma</Link>
      <Link href="/app/flashcards">Flashcards</Link>
      {user?.role === "admin" ? <Link href="/admin">Admin</Link> : null}
      <button
        type="button"
        className="ml-auto"
        onClick={() => {
          clearAuth();
          router.push("/login");
        }}
      >
        Sair
      </button>
    </nav>
  );
}
