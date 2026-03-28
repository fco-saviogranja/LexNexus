"use client";

import { ReactNode } from "react";
import { AppNav } from "../../components/AppNav";
import { AppTopbar } from "../../components/AppTopbar";
import { BrandMark } from "../../components/BrandLogo";
import { Guard } from "../../components/Guard";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <Guard>
      <div className="brand-shell">
        <div className="brand-frame mx-auto flex min-h-screen max-w-[1780px] flex-col gap-4 px-3 py-3 md:px-4 xl:flex-row xl:gap-5 xl:py-4">
          <AppNav />
          <div className="flex min-w-0 flex-1 flex-col gap-3.5">
            <AppTopbar />
            <main className="brand-panel relative min-w-0 flex-1 p-3.5 md:p-4 xl:p-5">
              <BrandMark className="pointer-events-none absolute bottom-[-110px] right-[-30px] h-[420px] w-[420px] opacity-[0.05] md:bottom-[-130px] md:right-[-54px] md:h-[560px] md:w-[560px]" />
              <div className="relative z-[1]">{children}</div>
            </main>
          </div>
        </div>
      </div>
    </Guard>
  );
}
