"use client";

import { useEffect, useState } from "react";
import { useTheme, type ThemeMode } from "./ThemeProvider";

function ThemeGlyph({ theme }: { theme: ThemeMode }) {
  if (theme === "light") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="4.2" />
        <path d="M12 2.5v2.3" />
        <path d="M12 19.2v2.3" />
        <path d="M4.7 4.7 6.3 6.3" />
        <path d="M17.7 17.7 19.3 19.3" />
        <path d="M2.5 12h2.3" />
        <path d="M19.2 12h2.3" />
        <path d="M4.7 19.3 6.3 17.7" />
        <path d="M17.7 6.3 19.3 4.7" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 15.2A7.8 7.8 0 1 1 8.8 4a8.5 8.5 0 0 0 11.2 11.2Z" />
    </svg>
  );
}

export function ThemeToggle({
  compact = false,
  className
}: {
  compact?: boolean;
  className?: string;
}) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const nextTheme = mounted ? (theme === "dark" ? "light" : "dark") : "light";
  const label = mounted ? (nextTheme === "light" ? "Modo claro" : "Modo escuro") : "Alternar tema";

  return (
    <button
      type="button"
      className={["brand-theme-toggle", className].filter(Boolean).join(" ")}
      data-compact={compact ? "true" : "false"}
      aria-label={mounted ? `Ativar ${label.toLowerCase()}` : "Alternar tema"}
      onClick={toggleTheme}
      title={label}
    >
      <span className="brand-theme-toggle-icon" aria-hidden="true">
        <ThemeGlyph theme={nextTheme} />
      </span>
      {compact ? null : <span className="brand-theme-toggle-copy">{mounted ? label : "Tema"}</span>}
    </button>
  );
}
