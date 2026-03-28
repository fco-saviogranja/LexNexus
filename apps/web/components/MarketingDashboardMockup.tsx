import { BrandMark } from "./BrandLogo";

const navItems = [
  { label: "Mapas", active: true },
  { label: "Biblioteca", active: false },
  { label: "Prática IA", active: false },
  { label: "Revisões", active: false },
  { label: "Cronograma", active: false },
  { label: "Desempenho", active: false }
];

const mapBranches = [
  { name: "Poder Constituinte", active: false },
  { name: "Controle de Constitucionalidade", active: true },
  { name: "Direitos Fundamentais", active: false },
  { name: "Organização do Estado", active: false }
];

const statCards = [
  { label: "Ramos hoje", value: "18" },
  { label: "Práticas IA", value: "06" },
  { label: "Retenção", value: "74%" }
];

export function MarketingDashboardMockup() {
  return (
    <div
      className="brand-dashboard-mockup relative w-full overflow-hidden rounded-[12px] shadow-[0_24px_64px_rgba(0,0,0,0.24)] sm:rounded-[14px] sm:shadow-[0_36px_90px_rgba(0,0,0,0.42)]"
      style={{
        background: "var(--brand-surface-solid)",
        border: "1px solid var(--brand-border)"
      }}
    >
      <div
        className="flex items-center gap-2 border-b px-4 py-3"
        style={{ background: "var(--brand-mockup-shell)", borderColor: "var(--brand-mockup-border)" }}
      >
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-[#cc5050]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#c9a84c]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#3a7d44]" />
        </div>
        <div
          className="ml-3 flex flex-1 items-center justify-center rounded-[8px]"
          style={{ background: "var(--brand-mockup-chip)", height: "22px" }}
        >
          <span className="text-[9px] tracking-[0.12em] text-[var(--brand-muted)]">app.lexnexus.com.br</span>
        </div>
      </div>

      <div className="flex min-h-[296px] sm:min-h-[352px]">
        <div
          className="flex w-[108px] flex-col gap-1 border-r p-2.5 sm:w-[132px] sm:p-3"
          style={{ background: "var(--brand-mockup-panel)", borderColor: "var(--brand-mockup-border)" }}
        >
          <div className="mb-4 flex flex-col items-center gap-1.5 px-1 text-center">
            <BrandMark className="h-10 w-10 shrink-0" />
            <span className="text-[7px] font-semibold uppercase tracking-[0.18em] text-[var(--brand-accent-strong)]">
              LexNexus
            </span>
          </div>

          {navItems.map((item) => (
            <div
              key={item.label}
              className="rounded-[8px] px-2 py-2 text-[10px] font-medium"
              style={{
                background: item.active ? "linear-gradient(135deg, rgba(77,185,255,0.16), rgba(130,103,255,0.12))" : "transparent",
                border: item.active ? "1px solid var(--brand-accent-border)" : "1px solid transparent",
                color: item.active ? "var(--brand-heading)" : "var(--brand-muted)"
              }}
            >
              {item.label}
            </div>
          ))}

          <div className="mt-auto border-t pt-4" style={{ borderColor: "var(--brand-mockup-border)" }}>
            <div
              className="flex items-center gap-2 rounded-[8px] px-2 py-1.5"
              style={{ background: "var(--brand-mockup-chip)" }}
            >
              <div className="h-4 w-4 rounded-full bg-[linear-gradient(135deg,var(--brand-accent),var(--brand-secondary))]" />
              <span className="text-[9px] text-[var(--brand-muted)]">Bruno M.</span>
            </div>
          </div>
        </div>

        <div className="flex-1 p-4">
          <div className="mb-4">
            <div className="text-[9px] text-[var(--brand-muted)]">Bom dia,</div>
            <div className="text-[13px] font-semibold text-[var(--brand-heading)]">Bruno Medeiros</div>
          </div>

          <div className="mb-4 grid grid-cols-3 gap-2">
            {statCards.map((card) => (
              <div
                key={card.label}
                className="rounded-[10px] p-2.5"
                style={{ background: "var(--brand-mockup-card)", border: "1px solid var(--brand-mockup-border)" }}
              >
                <div className="text-[7px] uppercase tracking-[0.08em] text-[var(--brand-muted)]">{card.label}</div>
                <div className="mt-1 text-[14px] font-semibold text-[var(--brand-accent-strong)]">{card.value}</div>
              </div>
            ))}
          </div>

          <div
            className="mb-3 border-b pb-2 text-[8px] uppercase tracking-[0.08em] text-[var(--brand-muted)]"
            style={{ borderColor: "var(--brand-mockup-border)" }}
          >
            Mapa mental de hoje
          </div>

          <div
            className="rounded-[10px] p-3"
            style={{ background: "var(--brand-mockup-card)", border: "1px solid var(--brand-mockup-border)" }}
          >
            <div className="mb-2 flex justify-center">
              <div className="rounded-[8px] bg-[linear-gradient(135deg,var(--brand-accent),var(--brand-secondary))] px-3 py-2 text-[8px] font-semibold uppercase tracking-[0.1em] text-[var(--brand-button-ink)]">
                Direito Constitucional
              </div>
            </div>
            <div className="mx-auto mb-3 h-4 w-px" style={{ background: "var(--brand-accent-border)" }} />

            <div className="grid gap-2 sm:grid-cols-2">
              {mapBranches.map((branch) => (
                <div
                  key={branch.name}
                  className="rounded-[8px] px-2.5 py-2"
                  style={{
                    background: branch.active ? "var(--brand-mockup-accent-soft)" : "var(--brand-mockup-panel)",
                    border: branch.active
                      ? "1px solid var(--brand-mockup-accent-border)"
                      : "1px solid var(--brand-mockup-border)"
                  }}
                >
                  <div className="mb-1 text-[6px] uppercase tracking-[0.12em] text-[var(--brand-muted)]">Clique</div>
                  <div className="text-[8px] font-medium leading-[1.35] text-[var(--brand-heading)]">{branch.name}</div>
                </div>
              ))}
            </div>
          </div>

          <div
            className="mt-4 rounded-[10px] p-3"
            style={{ background: "var(--brand-mockup-accent-soft)", border: "1px solid var(--brand-mockup-accent-border)" }}
          >
            <div className="mb-1 text-[8px] font-semibold tracking-[0.08em] text-[var(--brand-accent-strong)]">DEFINIÇÃO ABERTA</div>
            <div className="text-[10px] font-medium text-[var(--brand-heading)]">Controle de Constitucionalidade</div>
            <div className="mt-1 text-[8px] leading-[1.45] text-[var(--brand-muted)]">
              Mecanismos que verificam a compatibilidade de leis e atos normativos com a Constituição.
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {["FGV", "CEBRASPE", "FCC"].map((tag) => (
                <span
                  key={tag}
                  className="rounded-[6px] px-1.5 py-1 text-[6px] uppercase tracking-[0.1em] text-[var(--brand-heading)]"
                  style={{ background: "var(--brand-mockup-panel)", border: "1px solid var(--brand-mockup-border)" }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
