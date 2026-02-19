import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-3xl font-bold">LexNexus</h1>
      <p className="mt-2 text-slate-600">Plataforma híbrida jurídico + tech para estudos.</p>
      <div className="mt-6 flex gap-3">
        <Link className="rounded-md bg-slate-900 px-4 py-2 text-white" href="/login">
          Entrar
        </Link>
        <Link className="rounded-md border px-4 py-2" href="/register">
          Criar conta
        </Link>
      </div>
    </main>
  );
}
