const navItems = [
  { label: "Dashboard", active: true },
  { label: "Biblioteca", active: false },
  { label: "Questões", active: false },
  { label: "Simulados", active: false },
  { label: "Cronograma", active: false },
  { label: "Flashcards", active: false },
];

const subjects = [
  { name: "Dir. Constitucional", pct: 88 },
  { name: "Dir. Civil", pct: 72 },
  { name: "Dir. Penal", pct: 65 },
  { name: "Dir. Administrativo", pct: 79 },
];

const statCards = [
  { label: "Sequência", value: "14 dias" },
  { label: "Questões hoje", value: "47" },
  { label: "Aproveitamento", value: "73%" },
];

export function DashboardMockup() {
  return (
    <div
      className="relative w-full max-w-lg rounded-xl overflow-hidden shadow-2xl"
      style={{
        background: "#131628",
        border: "1px solid rgba(255,255,255,0.07)",
        transform: "perspective(1200px) rotateY(-8deg) rotateX(3deg)",
        transformStyle: "preserve-3d",
      }}
    >
      {/* Window chrome */}
      <div
        className="flex items-center gap-2 px-4 py-3 border-b"
        style={{ background: "#0F1122", borderColor: "rgba(255,255,255,0.05)" }}
      >
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#CC5050", opacity: 0.7 }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#C9A84C", opacity: 0.7 }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#3A7D44", opacity: 0.7 }} />
        </div>
        <div
          className="ml-3 flex-1 rounded"
          style={{ background: "#1B1E35", height: "18px", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <span style={{ fontSize: "8px", color: "#4D5070" }}>app.lexnexus.com.br</span>
        </div>
      </div>

      {/* App layout */}
      <div className="flex" style={{ minHeight: "340px" }}>
        {/* Sidebar */}
        <div
          className="flex flex-col gap-0.5 p-3"
          style={{ width: "120px", background: "#0F1122", borderRight: "1px solid rgba(255,255,255,0.04)" }}
        >
          <div className="mb-3 px-2" style={{ fontSize: "8px", color: "#C4974A", letterSpacing: "0.1em", fontWeight: 600 }}>
            LEXNEXUS
          </div>
          {navItems.map((item) => (
            <div
              key={item.label}
              className="px-2 py-1.5 rounded"
              style={{
                fontSize: "9px",
                background: item.active ? "rgba(196,151,74,0.10)" : "transparent",
                color: item.active ? "#C4974A" : "#4D5070",
                cursor: "default",
              }}
            >
              {item.label}
            </div>
          ))}

          <div className="mt-auto pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
            <div
              className="px-2 py-1.5 rounded flex items-center gap-1.5"
              style={{ fontSize: "9px", color: "#4D5070" }}
            >
              <div
                className="rounded-full"
                style={{ width: "16px", height: "16px", background: "linear-gradient(135deg,#C4974A,#8E7540)", flexShrink: 0 }}
              />
              Bruno M.
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-4">
          {/* Greeting */}
          <div className="mb-4">
            <div style={{ fontSize: "9px", color: "#4D5070" }}>Bom dia,</div>
            <div style={{ fontSize: "13px", color: "#ECEAE2", fontWeight: 600 }}>Bruno Medeiros</div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {statCards.map((card) => (
              <div
                key={card.label}
                className="rounded-lg p-2.5"
                style={{ background: "#1A1D30", border: "1px solid rgba(255,255,255,0.05)" }}
              >
                <div style={{ fontSize: "7px", color: "#4D5070", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {card.label}
                </div>
                <div style={{ fontSize: "14px", color: "#C4974A", marginTop: "4px", fontWeight: 600 }}>
                  {card.value}
                </div>
              </div>
            ))}
          </div>

          {/* Section label */}
          <div
            className="mb-3 pb-2"
            style={{ fontSize: "8px", color: "#4D5070", textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: "1px solid rgba(255,255,255,0.04)" }}
          >
            Desempenho por disciplina
          </div>

          {/* Progress bars */}
          <div className="flex flex-col gap-2.5">
            {subjects.map((s) => (
              <div key={s.name}>
                <div className="flex justify-between mb-1">
                  <span style={{ fontSize: "8px", color: "#8E90A2" }}>{s.name}</span>
                  <span style={{ fontSize: "8px", color: "#C4974A", fontWeight: 600 }}>{s.pct}%</span>
                </div>
                <div className="rounded-full" style={{ height: "3px", background: "#1E2138" }}>
                  <div
                    className="rounded-full h-full"
                    style={{
                      width: `${s.pct}%`,
                      background: "linear-gradient(to right, #6B5020, #C4974A)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Upcoming sessions */}
          <div
            className="mt-4 rounded-lg p-3"
            style={{ background: "rgba(196,151,74,0.06)", border: "1px solid rgba(196,151,74,0.12)" }}
          >
            <div style={{ fontSize: "8px", color: "#C4974A", marginBottom: "6px", fontWeight: 600, letterSpacing: "0.06em" }}>
              PRÓXIMA SESSÃO
            </div>
            <div style={{ fontSize: "9px", color: "#ECEAE2" }}>Direito Civil — Contratos</div>
            <div style={{ fontSize: "8px", color: "#4D5070", marginTop: "2px" }}>Hoje · 30 questões · 45 min</div>
          </div>
        </div>
      </div>
    </div>
  );
}
