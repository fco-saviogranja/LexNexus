"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { saveAuth } from "../../src/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const response = await fetch(`${API_URL}/auth/login`, {
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
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold">Login</h1>
      <form className="mt-4 space-y-3" onSubmit={onSubmit}>
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
          Entrar
        </button>
      </form>
    </main>
  );
}
