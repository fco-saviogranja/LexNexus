"use client";

import Link from "next/link";
import { useState, type CSSProperties, type ReactNode } from "react";
import { BrandIcon, type BrandIconName } from "../components/BrandIcons";
import { BrandMark } from "../components/BrandLogo";
import { MarketingDashboardMockup } from "../components/MarketingDashboardMockup";
import { ThemeToggle } from "../components/ThemeToggle";

const C = {
  ink: "var(--brand-page)",
  surface: "var(--brand-surface-solid)",
  elevated: "var(--brand-surface-soft)",
  border: "var(--brand-border)",
  borderSubtle: "var(--brand-border-soft)",
  accent: "var(--brand-accent)",
  accentStrong: "var(--brand-accent-strong)",
  accentAlt: "var(--brand-secondary)",
  accentAltDim: "var(--brand-secondary-strong)",
  text: "var(--brand-heading)",
  muted: "var(--brand-muted)",
  faint: "var(--brand-faint)",
  signal: "var(--brand-gradient-signal)",
  buttonInk: "var(--brand-button-ink)",
  buttonShadow: "var(--brand-button-shadow)",
  navBg: "var(--brand-navbar-bg)",
  footerBg: "var(--brand-footer-bg)",
  progressTrack: "var(--brand-progress-track)",
  accentLine: "var(--brand-accent-line)",
  accentGhost: "var(--brand-accent-ghost)",
  accentBorder: "var(--brand-accent-border)",
  accentBorderStrong: "var(--brand-accent-border-strong)",
  accentSoft: "var(--brand-accent-soft)",
  shadowStrong: "var(--brand-shadow-strong)",
  watermarkFilter: "var(--brand-watermark-filter)"
};

const features: Array<{ num: string; icon: BrandIconName; title: string; desc: string }> = [
  {
    num: "01",
    icon: "roadmap",
    title: "Mapas mentais jurídicos",
    desc: "Estrutura visual por disciplina, instituto e conexão normativa, pensada para OAB e concursos jurídicos."
  },
  {
    num: "02",
    icon: "study",
    title: "Definições integradas",
    desc: "Conceitos centrais, referências normativas e contexto jurídico reunidos ao redor de cada mapa."
  },
  {
    num: "03",
    icon: "target",
    title: "Prática sob demanda com IA",
    desc: "Quando o aluno quiser exercitar um ponto do mapa, a IA busca questões na internet por tema, banca e contexto jurídico."
  },
  {
    num: "04",
    icon: "analytics",
    title: "Painel de desempenho",
    desc: "Evolução detalhada por disciplina, tempo de estudo, acertos e comparativos de período."
  },
  {
    num: "05",
    icon: "calendar",
    title: "Planejamento inteligente",
    desc: "Organização adaptativa que acompanha seu ritmo, calendário de prova e prioridades reais de estudo."
  },
  {
    num: "06",
    icon: "flashcards",
    title: "Revisão orientada",
    desc: "Revisões e memória de longo prazo conduzidas por recorrência, desempenho e foco nos pontos sensíveis."
  }
];

const plans = [
  {
    name: "OAB",
    price: "R$ 49",
    period: "/ mês",
    desc: "Mapas mentais, definições e prática sob demanda para o Exame de Ordem.",
    features: [
      "Biblioteca completa",
      "Mapas mentais por disciplina",
      "IA para buscar questões por tema e banca",
      "Planejamento inteligente",
      "Flashcards ilimitados",
      "Painel completo"
    ],
    cta: "Escolher plano OAB",
    highlight: true
  },
  {
    name: "Concursos",
    price: "R$ 79",
    period: "/ mês",
    desc: "Para quem busca carreiras públicas com estudo visual e prática contextual.",
    features: [
      "Tudo do plano OAB",
      "IA com recorte por banca e carreira",
      "Mentoria em grupo",
      "Relatórios avançados",
      "Conteúdo exclusivo",
      "Suporte prioritário"
    ],
    cta: "Escolher plano Concursos",
    highlight: false
  }
];

const stats = [
  {
    eyebrow: "Mapa mental",
    title: "Estrutura visual da disciplina",
    desc: "O estudo parte de mapas mentais organizados por tema, instituto e conexão normativa."
  },
  {
    eyebrow: "Definições",
    title: "Contexto jurídico ao clicar",
    desc: "Cada ramo pode abrir conceitos, exceções, artigos e referências sem romper o fluxo."
  },
  {
    eyebrow: "Prática IA",
    title: "Busca sob demanda por banca",
    desc: "Quando fizer sentido praticar, a IA localiza questões públicas na internet com recorte jurídico."
  },
  {
    eyebrow: "Planejamento",
    title: "Revisão e continuidade",
    desc: "Mapa, leitura, memória e agenda funcionam como partes do mesmo sistema de estudo."
  }
];

const methodology = [
  {
    step: "01",
    title: "Diagnóstico por disciplina",
    desc: "A plataforma organiza o estudo por matéria, incidência e prioridade real, deixando claro o que precisa voltar primeiro."
  },
  {
    step: "02",
    title: "Mapa mental jurídico navegável",
    desc: "Cada disciplina se organiza em uma estrutura visual com definições, relações normativas e pontos sensíveis de cobrança."
  },
  {
    step: "03",
    title: "Prática contextual com IA",
    desc: "Quando o aluno precisa exercitar um ponto do mapa, a LexNexus aciona a IA para localizar questões na internet por tema, banca e recorte jurídico."
  }
];

const testimonials = [
  {
    quote:
      "Os mapas mentais me ajudam a visualizar a matéria com mais segurança. Quando preciso praticar, a IA puxa questões alinhadas ao tema sem quebrar o raciocínio.",
    name: "Camila Ferreira",
    credential: "Estudando para a OAB",
    initials: "CF"
  },
  {
    quote:
      "A plataforma transmite organização e profundidade. Consigo revisar os temas com mais lógica e, quando quero testar um ponto específico, a prática vem no contexto certo.",
    name: "Rafael Augusto",
    credential: "Preparação para tribunais",
    initials: "RA"
  },
  {
    quote:
      "A combinação entre mapa, definição e prática sob demanda deixa a rotina mais objetiva e profissional.",
    name: "Beatriz Novaes",
    credential: "Rotina para carreiras jurídicas",
    initials: "BN"
  }
];

const platformTabs = ["Mapa mental", "IA de prática", "Cronograma", "Desempenho"];

const mindMapNodes = [
  {
    title: "Poder Constituinte",
    summary: "Origem da Constituição, poder originário e reformador, limites materiais e formais de alteração.",
    bullets: ["Competência para reforma", "Cláusulas pétreas", "Mutação constitucional"],
    related: ["Art. 60", "EC", "Rigidez constitucional"]
  },
  {
    title: "Controle de Constitucionalidade",
    summary: "Conjunto de mecanismos que verifica se leis e atos normativos estão em conformidade com a Constituição.",
    bullets: ["Difuso e concentrado", "ADI, ADC e ADPF", "Efeitos e modulação"],
    related: ["STF", "Legitimados", "Efeito vinculante"]
  },
  {
    title: "Direitos Fundamentais",
    summary: "Garantias essenciais da pessoa humana, com aplicação imediata, limites e técnicas de ponderação.",
    bullets: ["Eficácia horizontal", "Reserva legal", "Colisão de direitos"],
    related: ["Art. 5º", "Princípios", "Proporcionalidade"]
  },
  {
    title: "Organização do Estado",
    summary: "Estrutura federativa, repartição de competências e relação entre União, Estados, DF e Municípios.",
    bullets: ["Competência legislativa", "Intervenção", "Federalismo cooperativo"],
    related: ["Arts. 18 a 36", "Competências", "Repartição"]
  }
] as const;

function InteractiveLink({
  href,
  children,
  primary = false
}: {
  href: string;
  children: ReactNode;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      style={
        primary
          ? {
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "13px 28px",
              fontSize: "15px",
              fontWeight: 700,
              borderRadius: "8px",
              color: C.buttonInk,
              background: C.signal,
              boxShadow: C.buttonShadow
            }
          : {
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "13px 28px",
              fontSize: "15px",
              borderRadius: "8px",
              border: `1px solid ${C.border}`,
              color: C.muted,
              background: "transparent"
            }
      }
    >
      {children}
    </Link>
  );
}

function SiteWordmark({ fontSize }: { fontSize: number }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0,
        fontFamily: "var(--font-display), sans-serif",
        fontSize: `${fontSize}px`,
        fontWeight: 600,
        letterSpacing: "-0.045em",
        lineHeight: 0.88,
        whiteSpace: "nowrap"
      }}
    >
      <span style={{ color: C.text }}>Lex</span>
      <span
        style={{
          backgroundImage: C.signal,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent"
        }}
      >
        Nexus
      </span>
    </span>
  );
}

function LogoMark({ size }: { size: number }) {
  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        flexShrink: 0
      }}
    >
      <BrandMark className="h-full w-full" />
    </div>
  );
}

function SiteLogo({ size = 32, wordmarkSize = 20 }: { size?: number; wordmarkSize?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
      <LogoMark size={size} />
      <SiteWordmark fontSize={wordmarkSize} />
    </div>
  );
}

function WatermarkLogo({
  size,
  style
}: {
  size: number;
  style?: CSSProperties;
}) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        width: `${size}px`,
        height: `${size}px`,
        pointerEvents: "none",
        userSelect: "none",
        opacity: 0.06,
        filter: C.watermarkFilter,
        ...style
      }}
    >
      <BrandMark className="h-full w-full" />
    </div>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        fontSize: "12px",
        color: C.accentStrong,
        letterSpacing: "0.12em",
        textTransform: "uppercase"
      }}
    >
      {children}
    </div>
  );
}

function SectionTitle({
  eyebrow,
  title,
  highlight
}: {
  eyebrow: string;
  title: string;
  highlight?: string;
}) {
  return (
    <div className="mb-14 max-w-2xl">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2
        style={{
          marginTop: "14px",
          fontFamily: "var(--font-display), sans-serif",
          fontSize: "clamp(1.85rem, 3.5vw, 2.6rem)",
          color: C.text,
          fontWeight: 600,
          lineHeight: 1.12,
          letterSpacing: "-0.03em"
        }}
      >
        {title}{" "}
        {highlight ? (
          <span
            style={{
              backgroundImage: C.signal,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent"
            }}
          >
            {highlight}
          </span>
        ) : null}
      </h2>
    </div>
  );
}

function Navbar() {
  const [open, setOpen] = useState(false);
  const links = [
    { label: "Plataforma", href: "#plataforma" },
    { label: "Recursos", href: "#recursos" },
    { label: "Metodologia", href: "#metodologia" },
    { label: "Planos", href: "#precos" }
  ];

  return (
    <nav
      className="fixed left-0 right-0 top-0 z-50 backdrop-blur-md"
      style={{
        background: C.navBg,
        borderBottom: `1px solid ${C.borderSubtle}`
      }}
    >
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="LexNexus">
          <div className="md:hidden">
            <SiteLogo size={40} wordmarkSize={18} />
          </div>
          <div className="hidden md:block">
            <SiteLogo size={46} wordmarkSize={22} />
          </div>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((item) => (
            <Link key={item.label} href={item.href} style={{ fontSize: "14px", color: C.faint }}>
              {item.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/register" style={{ fontSize: "14px", color: C.muted, padding: "8px 16px" }}>
            Criar conta
          </Link>
          <InteractiveLink href="/login" primary>
            Entrar
            <span aria-hidden="true">›</span>
          </InteractiveLink>
        </div>

        <div className="brand-mobile-only">
          <button
            type="button"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            className="grid h-10 w-10 place-items-center"
            onClick={() => setOpen((current) => !current)}
            style={{
              color: C.text,
              background: "transparent",
              border: "none",
              boxShadow: "none",
              padding: 0,
              borderRadius: 0,
              cursor: "pointer",
              fontSize: "22px"
            }}
          >
            {open ? "×" : "☰"}
          </button>
        </div>
      </div>

      {open ? (
        <div
          className="flex flex-col gap-4 p-4 md:hidden"
          style={{ background: C.surface, borderTop: `1px solid ${C.borderSubtle}` }}
        >
          {links.map((item) => (
            <Link key={item.label} href={item.href} onClick={() => setOpen(false)} style={{ fontSize: "14px", color: C.muted }}>
              {item.label}
            </Link>
          ))}
          <Link href="/register" onClick={() => setOpen(false)} style={{ fontSize: "14px", color: C.muted }}>
            Criar conta
          </Link>
          <InteractiveLink href="/login" primary>
            Entrar
          </InteractiveLink>
        </div>
      ) : null}
    </nav>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden px-4 pb-16 pt-28 sm:px-6 sm:pb-20 sm:pt-32" style={{ background: C.ink }}>
      <WatermarkLogo
        size={760}
        style={{
          right: "-8%",
          top: "50%",
          transform: "translateY(-50%)",
          opacity: 0.075
        }}
      />
      <div className="relative z-[1] mx-auto max-w-7xl">
        <div className="grid items-center gap-10 sm:gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "24px",
                padding: "8px 12px",
                fontSize: "12px",
                fontWeight: 700,
                color: C.accentStrong,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                border: `1px solid ${C.accentBorder}`,
                background: C.accentSoft
              }}
            >
              Metodologia central da LexNexus
            </div>

            <h1
              style={{
                fontFamily: "var(--font-display), sans-serif",
                fontSize: "clamp(2.2rem, 9vw, 3.7rem)",
                lineHeight: 1.08,
                color: C.text,
                fontWeight: 600,
                letterSpacing: "-0.04em",
                maxWidth: "620px"
              }}
            >
              Preparação jurídica estruturada por{" "}
              <span
                style={{
                  backgroundImage: C.signal,
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent"
                }}
              >
                mapas mentais interativos, conteúdo organizado e prática orientada
              </span>
              .
            </h1>

            <p
              style={{
                marginTop: "24px",
                marginBottom: "32px",
                fontSize: "clamp(15px, 4vw, 17px)",
                color: C.muted,
                lineHeight: 1.72,
                maxWidth: "520px"
              }}
            >
              A LexNexus centraliza mapas mentais do Direito, definições essenciais, conexões normativas e prática sob
              demanda com IA por tema e banca em uma experiência sólida para OAB e concursos jurídicos.
            </p>

            <div className="mb-8 flex flex-wrap gap-2.5">
              {["Direito Constitucional", "Direito Civil", "Direito Penal", "Direito Administrativo", "Direito Tributário"].map(
                (discipline) => (
                  <span
                    key={discipline}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "8px 12px",
                      fontSize: "12px",
                      color: C.muted,
                      border: `1px solid ${C.borderSubtle}`,
                      background: C.surface
                    }}
                  >
                    {discipline}
                  </span>
                )
              )}
            </div>

            <div className="grid gap-3 sm:flex sm:flex-row [&>*]:w-full sm:[&>*]:w-auto">
              <InteractiveLink href="/login" primary>
                Entrar na plataforma
                <span aria-hidden="true">→</span>
              </InteractiveLink>
              <InteractiveLink href="/register">Criar conta</InteractiveLink>
            </div>
          </div>

          <div className="flex justify-center lg:hidden">
            <MarketingDashboardMockup />
          </div>

          <div className="hidden justify-center lg:flex">
            <MarketingDashboardMockup />
          </div>
        </div>
      </div>
    </section>
  );
}

function StatsBar() {
  return (
    <section
      style={{
        background: C.surface,
        borderTop: `1px solid ${C.borderSubtle}`,
        borderBottom: `1px solid ${C.borderSubtle}`
      }}
    >
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="grid gap-0 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat, index) => (
            <div
              key={stat.title}
              className={[
                "flex flex-col justify-start px-1 py-5 sm:px-3",
                index < stats.length - 1 ? "xl:border-r" : "",
                index < 2 ? "md:border-b xl:border-b-0" : "",
                index % 2 === 0 ? "md:border-r xl:border-r" : ""
              ]
                .filter(Boolean)
                .join(" ")}
              style={{ borderColor: C.borderSubtle }}
            >
              <div
                style={{
                  fontSize: "11px",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  color: C.accentStrong,
                  fontWeight: 700
                }}
              >
                {stat.eyebrow}
              </div>
              <div
                style={{
                  marginTop: "10px",
                  fontFamily: "var(--font-display), sans-serif",
                  fontSize: "22px",
                  color: C.text,
                  fontWeight: 600,
                  lineHeight: 1.12,
                  letterSpacing: "-0.03em"
                }}
              >
                {stat.title}
              </div>
              <div style={{ marginTop: "10px", fontSize: "13px", color: C.faint, lineHeight: 1.65, maxWidth: "240px" }}>
                {stat.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="recursos" className="px-4 py-20 sm:px-6 md:py-28" style={{ background: C.ink }}>
      <div className="mx-auto max-w-7xl">
        <SectionTitle eyebrow="Recursos" title="Recursos centrais de uma preparação jurídica" highlight="mais precisa" />

        <div className="grid gap-4 md:gap-px md:border md:border-[color:var(--brand-border-soft)] md:grid-cols-2 lg:grid-cols-3" style={{ borderColor: C.borderSubtle }}>
          {features.map((feature) => (
            <div key={feature.title} className="rounded-[12px] p-6 sm:p-8 md:rounded-none" style={{ background: C.surface }}>
              <div
                style={{
                  marginBottom: "24px",
                  fontFamily: "var(--font-display), sans-serif",
                  fontSize: "13px",
                  color: C.accentGhost,
                  fontWeight: 600,
                  letterSpacing: "0.04em"
                }}
              >
                {feature.num}
              </div>
              <div className="flex items-start gap-4">
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "46px",
                    height: "46px",
                    flexShrink: 0,
                    borderRadius: "10px",
                    border: `1px solid ${C.accentBorder}`,
                    background: "color-mix(in srgb, var(--brand-accent-soft) 78%, white 22%)",
                    color: C.accentStrong,
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)"
                  }}
                >
                  <BrandIcon name={feature.icon} className="h-[20px] w-[20px]" strokeWidth={1.95} />
                </span>
                <div>
                  <h3 style={{ marginBottom: "10px", fontSize: "16px", color: C.text, fontWeight: 600 }}>{feature.title}</h3>
                  <p style={{ fontSize: "14px", color: C.muted, lineHeight: 1.68 }}>{feature.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PreviewCard({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        border: `1px solid ${C.borderSubtle}`,
        background: C.elevated,
        borderRadius: "8px"
      }}
    >
      {children}
    </div>
  );
}

function PlatformPreview() {
  const [active, setActive] = useState(0);
  const [selectedMindMapNode, setSelectedMindMapNode] = useState(1);
  const selectedMindMap = mindMapNodes[selectedMindMapNode];

  const previews = [
    <div key="mindmap" className="p-4 sm:p-6">
      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <PreviewCard>
          <div className="p-5 sm:p-6">
            <div
              style={{
                marginBottom: "10px",
                fontSize: "11px",
                color: C.accentStrong,
                textTransform: "uppercase",
                letterSpacing: "0.1em"
              }}
            >
              Mapa mental interativo · Direito Constitucional
            </div>
            <p style={{ marginBottom: "20px", fontSize: "13px", color: C.muted, lineHeight: 1.7 }}>
              Cada ramo abre a definição integrada, as conexões do tema e o contexto necessário para aprofundar o
              estudo sem perder a estrutura da disciplina.
            </p>

            <div className="mb-5 flex flex-col items-center">
              <div
                style={{
                  padding: "11px 20px",
                  background: C.signal,
                  color: C.buttonInk,
                  fontSize: "13px",
                  fontWeight: 700,
                  letterSpacing: "0.03em"
                }}
              >
                Direito Constitucional
              </div>
              <div style={{ width: "1px", height: "24px", background: C.accentBorder }} />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {mindMapNodes.map((node, index) => (
                <button
                  key={node.title}
                  type="button"
                  onClick={() => setSelectedMindMapNode(index)}
                  style={{
                    all: "unset",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    padding: "14px",
                    cursor: "pointer",
                    border: `1px solid ${index === selectedMindMapNode ? C.accentBorderStrong : C.borderSubtle}`,
                    background: index === selectedMindMapNode ? C.accentSoft : C.ink
                  }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      color: index === selectedMindMapNode ? C.accentStrong : C.faint,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase"
                    }}
                  >
                    Clique para abrir
                  </span>
                  <span style={{ fontSize: "14px", color: C.text, fontWeight: 600 }}>{node.title}</span>
                  <span style={{ fontSize: "12px", color: C.muted, lineHeight: 1.6 }}>{node.related.join(" · ")}</span>
                </button>
              ))}
            </div>

            <div
              className="mt-4 grid gap-2 sm:grid-cols-3"
              style={{ borderTop: `1px solid ${C.borderSubtle}`, paddingTop: "16px" }}
            >
              {["Doutrina conectada", "Artigos essenciais", "Bancas sugeridas"].map((item) => (
                <div
                  key={item}
                  style={{
                    padding: "10px 12px",
                    background: C.elevated,
                    border: `1px solid ${C.borderSubtle}`,
                    fontSize: "12px",
                    color: C.muted
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </PreviewCard>

        <PreviewCard>
          <div className="p-5 sm:p-6">
            <div
              style={{
                marginBottom: "10px",
                fontSize: "11px",
                color: C.accentStrong,
                textTransform: "uppercase",
                letterSpacing: "0.1em"
              }}
            >
              Definição integrada
            </div>

            <h3 style={{ marginBottom: "12px", fontSize: "20px", color: C.text, fontWeight: 600 }}>
              {selectedMindMap.title}
            </h3>

            <p style={{ marginBottom: "20px", fontSize: "14px", color: C.muted, lineHeight: 1.72 }}>
              {selectedMindMap.summary}
            </p>

            <div
              className="mb-4"
              style={{
                padding: "14px",
                background: C.accentSoft,
                border: `1px solid ${C.accentBorder}`
              }}
            >
              <div
                style={{
                  marginBottom: "10px",
                  fontSize: "11px",
                  color: C.accentStrong,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em"
                }}
              >
                O que o aluno vê ao clicar
              </div>
              <div className="flex flex-col gap-2.5">
                {selectedMindMap.bullets.map((bullet) => (
                  <div key={bullet} className="flex items-start gap-2.5">
                    <BrandIcon name="check" className="mt-[2px] h-[14px] w-[14px]" />
                    <span style={{ fontSize: "13px", color: C.text, lineHeight: 1.6 }}>{bullet}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              {selectedMindMap.related.map((item) => (
                <span
                  key={item}
                  style={{
                    padding: "7px 10px",
                    border: `1px solid ${C.borderSubtle}`,
                    background: C.ink,
                    fontSize: "12px",
                    color: C.muted
                  }}
                >
                  {item}
                </span>
              ))}
            </div>

            <div
              style={{
                padding: "14px",
                border: `1px solid ${C.borderSubtle}`,
                background: C.elevated
              }}
            >
              <div style={{ marginBottom: "6px", fontSize: "12px", color: C.text, fontWeight: 600 }}>
                Do conceito para a prática
              </div>
              <p style={{ fontSize: "13px", color: C.muted, lineHeight: 1.65 }}>
                Depois da leitura, a LexNexus pode acionar a IA para buscar prática naquele mesmo ponto do mapa,
                preservando o contexto jurídico e a linha de raciocínio.
              </p>
            </div>
          </div>
        </PreviewCard>
      </div>
    </div>,
    <div key="questions" className="p-4 sm:p-6">
      <PreviewCard>
        <div className="mb-4 p-5">
          <div
            style={{
              marginBottom: "12px",
              fontSize: "11px",
              color: C.accentStrong,
              textTransform: "uppercase",
              letterSpacing: "0.1em"
            }}
          >
            Prática sob demanda · IA acionada a partir do mapa
          </div>
          <p style={{ marginBottom: "20px", fontSize: "14px", color: C.text, lineHeight: 1.7 }}>
            A IA recebe o tema ativo do mapa mental, identifica o recorte jurídico e busca questões públicas na
            internet entre as principais bancas relacionadas ao assunto.
          </p>
          <div className="mb-4 flex flex-wrap gap-2">
            {["Controle de Constitucionalidade", "FGV", "Cebraspe", "FCC"].map((item) => (
              <span
                key={item}
                style={{
                  padding: "7px 10px",
                  border: `1px solid ${C.borderSubtle}`,
                  background: C.ink,
                  fontSize: "12px",
                  color: C.muted
                }}
              >
                {item}
              </span>
            ))}
          </div>
          <div className="flex flex-col gap-2.5">
            {[
              "FGV · Controle concentrado e legitimidade ativa",
              "Cebraspe · Efeitos da ADI e modulação",
              "FCC · Difuso x concentrado em controle de constitucionalidade"
            ].map((option, index) => (
              <div
                key={option}
                className="flex items-center gap-3 rounded-[8px] p-3"
                style={{
                  border: `1px solid ${index === 1 ? C.accentBorderStrong : C.borderSubtle}`,
                  background: index === 1 ? C.accentSoft : C.ink
                }}
              >
                <div
                  className="flex items-center justify-center rounded-full"
                  style={{
                    width: "20px",
                    height: "20px",
                    border: `1px solid ${index === 1 ? C.accentStrong : C.faint}`,
                    flexShrink: 0,
                    fontSize: "10px",
                    color: index === 1 ? C.accentStrong : C.faint
                  }}
                >
                  {index + 1}
                </div>
                <span style={{ fontSize: "13px", color: index === 1 ? C.text : C.muted }}>{option}</span>
              </div>
            ))}
          </div>
        </div>
      </PreviewCard>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span style={{ fontSize: "12px", color: C.faint }}>
          Busca contextualizada por tema, ramo e banca, sempre a partir do mapa mental ativo
        </span>
        <Link
          href="/login"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "8px",
            background: C.signal,
            color: C.buttonInk,
            padding: "8px 20px",
            fontSize: "13px",
            fontWeight: 700
          }}
        >
          Abrir seleção da IA
        </Link>
      </div>
    </div>,
    <div key="calendar" className="p-4 sm:p-6">
      <div className="brand-hide-scrollbar -mx-1 overflow-x-auto px-1 pb-1">
        <div className="mb-6 grid min-w-[460px] grid-cols-7 gap-2">
          {["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"].map((day, index) => (
            <div key={day} className="text-center">
              <div style={{ marginBottom: "6px", fontSize: "11px", color: C.faint }}>{day}</div>
              <div
                className="mx-auto flex items-center justify-center rounded-[8px]"
                style={{
                  width: "36px",
                  height: "36px",
                  background: index === 2 ? C.signal : index < 4 ? C.elevated : "transparent",
                  border: `1px solid ${index === 2 ? C.accentBorder : C.borderSubtle}`,
                  color: index === 2 ? C.buttonInk : index < 4 ? C.text : C.faint,
                  fontSize: "13px",
                  fontWeight: index === 2 ? 700 : 500
                }}
              >
                {24 + index}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {[
          { time: "08:00", subject: "Mapa mental · Direito Constitucional", duration: "1h 30min", done: true },
          { time: "10:00", subject: "Direito Civil - Contratos", duration: "2h", done: true },
          { time: "14:00", subject: "Revisão guiada do mapa", duration: "45min", done: false },
          { time: "16:00", subject: "Prática via IA · Direito Constitucional", duration: "40 min", done: false }
        ].map((session) => (
          <div
            key={session.time}
            className="flex items-center gap-4 rounded-[8px] p-4"
            style={{
              background: session.done ? C.elevated : C.surface,
              border: `1px solid ${session.done ? C.borderSubtle : C.border}`,
              opacity: session.done ? 0.65 : 1
            }}
          >
            <span style={{ width: "44px", flexShrink: 0, fontSize: "12px", color: C.faint }}>{session.time}</span>
            <div
              style={{
                width: "4px",
                minHeight: "20px",
                alignSelf: "stretch",
                borderRadius: "999px",
                background: session.done ? C.faint : C.accentStrong
              }}
            />
            <div className="flex-1">
              <div style={{ fontSize: "13px", color: C.text, fontWeight: 500 }}>{session.subject}</div>
              <div style={{ marginTop: "2px", fontSize: "12px", color: C.faint }}>{session.duration}</div>
            </div>
            {session.done ? <BrandIcon name="check" className="h-[14px] w-[14px]" /> : null}
          </div>
        ))}
      </div>
    </div>,
    <div key="dashboard" className="p-4 sm:p-6">
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Ramos vistos hoje", value: "18" },
          { label: "Sequencia ativa", value: "14 dias" },
          { label: "Conceitos retidos", value: "73%" }
        ].map((item) => (
          <PreviewCard key={item.label}>
            <div className="p-4">
              <div style={{ fontSize: "11px", color: C.faint, textTransform: "uppercase", letterSpacing: "0.07em" }}>{item.label}</div>
              <div style={{ marginTop: "8px", fontSize: "22px", color: C.accentStrong, fontWeight: 600 }}>{item.value}</div>
            </div>
          </PreviewCard>
        ))}
      </div>

      <PreviewCard>
        <div className="p-5">
          <div
            style={{
              marginBottom: "16px",
              fontSize: "12px",
              color: C.faint,
              textTransform: "uppercase",
              letterSpacing: "0.08em"
            }}
          >
            Desempenho por disciplina
          </div>
          {[
            { name: "Dir. Constitucional", pct: 88 },
            { name: "Dir. Civil", pct: 72 },
            { name: "Dir. Penal", pct: 65 },
            { name: "Dir. Administrativo", pct: 79 },
            { name: "Dir. Tributário", pct: 58 }
          ].map((subject) => (
            <div key={subject.name} className="mb-3 last:mb-0">
              <div className="mb-1.5 flex justify-between">
                <span style={{ fontSize: "13px", color: C.muted }}>{subject.name}</span>
                <span style={{ fontSize: "13px", color: C.accentStrong, fontWeight: 600 }}>{subject.pct}%</span>
              </div>
              <div style={{ height: "4px", borderRadius: "999px", background: C.progressTrack }}>
                <div
                  style={{
                    width: `${subject.pct}%`,
                    height: "100%",
                    borderRadius: "999px",
                    background: C.signal
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </PreviewCard>
    </div>
  ];

  return (
    <section id="plataforma" className="px-4 py-20 sm:px-6 md:py-28" style={{ background: C.surface }}>
      <div className="mx-auto max-w-7xl">
        <SectionTitle eyebrow="A Plataforma" title="Mapa mental, definição e prática por IA" highlight="conectados no mesmo fluxo" />

        <div className="brand-hide-scrollbar -mx-1 mb-0 overflow-x-auto px-1 pb-2">
          <div
            className="flex w-fit min-w-max gap-0 overflow-hidden"
            style={{ border: `1px solid ${C.border}`, borderRadius: "6px" }}
          >
            {platformTabs.map((tab, index) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActive(index)}
                style={{
                  all: "unset",
                  padding: "10px 18px",
                  fontSize: "13px",
                  cursor: "pointer",
                  background: active === index ? C.signal : "transparent",
                  color: active === index ? C.buttonInk : C.muted,
                  fontWeight: active === index ? 700 : 500,
                  borderRight: index < platformTabs.length - 1 ? `1px solid ${C.border}` : "none"
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div
          className="overflow-hidden rounded-tr-[14px] rounded-b-[14px]"
          style={{ border: `1px solid ${C.border}`, background: C.ink, borderTop: "none" }}
        >
          {previews[active]}
        </div>
      </div>
    </section>
  );
}

function Methodology() {
  return (
    <section id="metodologia" className="relative overflow-hidden px-4 py-20 sm:px-6 md:py-28" style={{ background: C.ink }}>
      <WatermarkLogo
        size={640}
        style={{
          left: "50%",
          bottom: "-180px",
          transform: "translateX(-50%)",
          opacity: 0.05
        }}
      />
      <div className="relative z-[1] mx-auto max-w-7xl">
        <SectionTitle eyebrow="Metodologia" title="Estrutura metodológica da LexNexus" highlight="para o estudo jurídico" />

        <div className="grid gap-4 md:gap-0 md:border md:grid-cols-3" style={{ borderColor: C.borderSubtle }}>
          {methodology.map((item, index) => (
            <div
              key={item.step}
              className={`rounded-[12px] p-6 sm:p-8 md:rounded-none md:p-10 ${index < methodology.length - 1 ? "md:border-r" : ""}`}
              style={{
                background: C.surface,
                borderColor: C.borderSubtle
              }}
            >
              <div
                style={{
                  marginBottom: "32px",
                  fontFamily: "var(--font-display), sans-serif",
                  fontSize: "48px",
                  color: "color-mix(in srgb, var(--brand-accent) 18%, transparent)",
                  fontWeight: 700,
                  lineHeight: 1
                }}
              >
                {item.step}
              </div>
              <h3 style={{ marginBottom: "16px", fontSize: "18px", color: C.text, fontWeight: 600 }}>{item.title}</h3>
              <p style={{ fontSize: "14px", color: C.muted, lineHeight: 1.7 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="px-4 py-20 sm:px-6 md:py-28" style={{ background: C.surface }}>
      <div className="mx-auto max-w-7xl">
        <SectionTitle eyebrow="Experiência" title="Quem está estudando" highlight="está gostando" />

        <div className="grid gap-5 md:grid-cols-3">
          {testimonials.map((item) => (
            <div
              key={item.name}
              className="flex flex-col justify-between rounded-[12px] p-6 sm:p-8"
              style={{ background: C.ink, border: `1px solid ${C.borderSubtle}` }}
            >
              <div style={{ marginBottom: "32px", fontSize: "13px", color: C.accentStrong, fontFamily: "Georgia, serif" }}>"</div>
              <p style={{ marginBottom: "32px", flex: 1, fontSize: "15px", color: C.muted, lineHeight: 1.75, fontStyle: "italic" }}>
                {item.quote}
              </p>
              <div className="flex items-center gap-3" style={{ borderTop: `1px solid ${C.borderSubtle}`, paddingTop: "20px" }}>
                <div
                  className="flex items-center justify-center rounded-full"
                  style={{
                    width: "38px",
                    height: "38px",
                    background: C.signal,
                    fontSize: "12px",
                    color: C.buttonInk,
                    fontWeight: 700,
                    flexShrink: 0
                  }}
                >
                  {item.initials}
                </div>
                <div>
                  <div style={{ fontSize: "14px", color: C.text, fontWeight: 500 }}>{item.name}</div>
                  <div style={{ marginTop: "2px", fontSize: "12px", color: C.faint }}>{item.credential}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="precos" className="px-4 py-20 sm:px-6 md:py-28" style={{ background: C.ink }}>
      <div className="mx-auto max-w-7xl">
        <SectionTitle eyebrow="Planos" title="Escolha o plano" highlight="mais adequado à sua meta" />

        <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className="flex flex-col rounded-[12px] p-6 sm:p-8"
              style={{
                background: C.surface,
                border: plan.highlight ? `1px solid ${C.accentBorderStrong}` : `1px solid ${C.borderSubtle}`,
                boxShadow: plan.highlight ? C.shadowStrong : "none"
              }}
            >
              {plan.highlight ? (
                <div
                  style={{
                    marginBottom: "16px",
                    display: "inline-block",
                    width: "fit-content",
                    borderRadius: "8px",
                    background: C.signal,
                    color: C.buttonInk,
                    padding: "4px 10px",
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase"
                  }}
                >
                  Recomendado
                </div>
              ) : null}

              <div style={{ marginBottom: "6px", fontSize: "18px", color: C.text, fontWeight: 600 }}>{plan.name}</div>
              <div style={{ marginBottom: "20px", fontSize: "13px", color: C.faint, lineHeight: 1.5 }}>{plan.desc}</div>

              <div className="mb-6 pb-6" style={{ borderBottom: `1px solid ${C.borderSubtle}` }}>
                <span
                  style={{
                    fontFamily: "var(--font-display), sans-serif",
                    fontSize: "34px",
                    color: plan.highlight ? C.accentStrong : C.text,
                    fontWeight: 600
                  }}
                >
                  {plan.price}
                </span>
                <span style={{ fontSize: "14px", color: C.faint }}>{plan.period}</span>
              </div>

              <ul className="mb-8 flex flex-1 flex-col gap-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <BrandIcon name="check" className="mt-[2px] h-[14px] w-[14px]" />
                    <span style={{ fontSize: "14px", color: C.muted }}>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/register"
                style={{
                  display: "inline-flex",
                  justifyContent: "center",
                  alignItems: "center",
                  width: "100%",
                  borderRadius: "8px",
                  padding: "12px",
                  fontSize: "14px",
                  fontWeight: 700,
                  background: plan.highlight ? C.signal : "transparent",
                  color: plan.highlight ? C.buttonInk : C.muted,
                  border: plan.highlight ? "none" : `1px solid ${C.borderSubtle}`
                }}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section
      className="px-4 py-20 sm:px-6 sm:py-24 md:py-32"
      style={{ background: C.surface, borderTop: `1px solid ${C.borderSubtle}` }}
    >
      <div className="mx-auto max-w-3xl text-center">
        <div className="mb-8 flex justify-center">
          <LogoMark size={112} />
        </div>
        <h2
          style={{
            marginBottom: "20px",
            fontFamily: "var(--font-display), sans-serif",
            fontSize: "clamp(2.1rem, 4vw, 3rem)",
            color: C.text,
            fontWeight: 600,
            lineHeight: 1.14,
            letterSpacing: "-0.03em"
          }}
        >
          Isso foi desenhado para quem quer estudar Direito
          <span className="hidden md:inline">
            <br />
          </span>
          <span
            style={{
              backgroundImage: C.signal,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent"
            }}
          >
            com clareza, ordem e profundidade.
          </span>
        </h2>
        <p style={{ margin: "0 auto 40px", maxWidth: "520px", fontSize: "16px", color: C.muted, lineHeight: 1.7 }}>
          Entre na plataforma e conheça uma estrutura de estudo pensada para dar clareza, profundidade e continuidade
          à preparação jurídica.
        </p>
        <InteractiveLink href="/register" primary>
          Criar conta
          <span aria-hidden="true">→</span>
        </InteractiveLink>
      </div>
    </section>
  );
}

function Footer() {
  const columns = [
    {
      label: "Plataforma",
      links: ["Dashboard", "Prática IA", "Viewer", "Biblioteca", "Cronograma", "Flashcards"]
    },
    {
      label: "Empresa",
      links: ["Sobre", "Metodologia", "Blog", "Imprensa", "Carreiras"]
    },
    {
      label: "Suporte",
      links: ["Central de ajuda", "Contato", "Termos de uso", "Privacidade"]
    }
  ];

  return (
    <footer style={{ background: C.footerBg, borderTop: `1px solid ${C.borderSubtle}` }}>
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16">
        <div className="mb-12 grid gap-10 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <div className="mb-4 flex items-center gap-2.5">
              <SiteLogo size={38} wordmarkSize={18} />
            </div>
            <p style={{ maxWidth: "220px", fontSize: "13px", color: C.faint, lineHeight: 1.7 }}>
              Plataforma jurídica de alta performance para estudar Direito com mapas mentais, definições integradas e
              prática sob demanda com IA.
            </p>
          </div>

          {columns.map((column) => (
            <div key={column.label}>
              <div
                style={{
                  marginBottom: "16px",
                  fontSize: "11px",
                  color: C.accentStrong,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  fontWeight: 600
                }}
              >
                {column.label}
              </div>
              <ul className="flex flex-col gap-2.5">
                {column.links.map((link) => (
                  <li key={link}>
                    <span style={{ fontSize: "13px", color: C.faint }}>{link}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center justify-between pt-8 md:flex-row" style={{ borderTop: `1px solid ${C.borderSubtle}` }}>
          <span style={{ fontSize: "12px", color: C.faint }}>© 2026 LexNexus Tecnologia Jurídica. Todos os direitos reservados.</span>
          <span style={{ marginTop: "8px", fontSize: "12px", color: C.faint }}>Construído para quem estuda Direito com método.</span>
        </div>
      </div>
    </footer>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ background: C.ink, color: C.text, fontFamily: "var(--font-sans), sans-serif" }}>
      <Navbar />
      <ThemeToggle compact className="brand-theme-toggle-floating" />
      <Hero />
      <StatsBar />
      <Features />
      <PlatformPreview />
      <Methodology />
      <Testimonials />
      <Pricing />
      <FinalCTA />
      <Footer />
    </div>
  );
}
