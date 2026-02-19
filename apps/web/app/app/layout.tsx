"use client";

import { ReactNode } from "react";
import { AppNav } from "../../components/AppNav";
import { Guard } from "../../components/Guard";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <Guard>
      <AppNav />
      <main className="mx-auto max-w-6xl p-4">{children}</main>
    </Guard>
  );
}
