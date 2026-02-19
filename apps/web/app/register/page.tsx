"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { saveAuth } from "../../src/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const response = await fetch(`${API_URL}/auth/register`, {
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
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold">Cadastro</h1>
      <form className="mt-4 space-y-3" onSubmit={onSubmit}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome" required className="w-full" />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" required className="w-full" />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Senha"
          type="password"
          required
          className="w-full"
        />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button type="submit" className="w-full">
          Criar conta
        </button>
      </form>
    </main>
  );
}
