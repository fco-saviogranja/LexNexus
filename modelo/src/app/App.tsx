import { useState } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import logoImg from "figma:asset/236e71b7ac08ed5ea884846b41d5149eea96eab8.png";
import { LexNexusLogo, LexNexusWordmark } from "./components/LexNexusLogo";
import { DashboardMockup } from "./components/DashboardMockup";
import {
  BookOpen,
  FileText,
  Brain,
  BarChart3,
  Calendar,
  Layers,
  ChevronRight,
  Menu,
  X,
  ArrowRight,
  Check,
} from "lucide-react";

// ─── Wing Watermark ─────────────────────────────────────────────────────────

function WingWatermark({
  size = 480,
  targetOpacity = 0.05,
  float = false,
  rotate = 0,
  wrapStyle = {},
  once = true,
}: {
  size?: number;
  targetOpacity?: number;
  float?: boolean;
  rotate?: number;
  wrapStyle?: React.CSSProperties;
  once?: boolean;
}) {
  return (
    <motion.div
      className="absolute pointer-events-none select-none"
      style={wrapStyle}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: targetOpacity }}
      viewport={{ once, amount: 0 }}
      transition={{ duration: 2.4, ease: "easeOut" }}
    >
      <motion.img
        src={logoImg}
        alt=""
        draggable={false}
        animate={
          float
            ? { y: [-14, 14, -14], rotate: [rotate - 1.5, rotate + 1.5, rotate - 1.5] }
            : { rotate }
        }
        transition={
          float
            ? { duration: 11, repeat: Infinity, ease: "easeInOut" }
            : undefined
        }
        style={{ width: size, display: "block" }}
      />
    </motion.div>
  );
}

// ─── Palette constants ──────────────────────────────────────────────────────
const C = {
  ink: "#0C0D1A",
  surface: "#131628",
  elevated: "#1A1D30",
  border: "rgba(255,255,255,0.06)",
  borderSubtle: "rgba(255,255,255,0.04)",
  gold: "#C4974A",
  goldDim: "#8E7540",
  text: "#ECEAE2",
  muted: "#8E90A2",
  faint: "#4D5070",
};

// ─── Data ───────────────────────────────────────────────────────────────────
const features = [
  {
    num: "01",
    icon: BookOpen,
    title: "Biblioteca Jurídica",
    desc: "Acervo completo de legislação, doutrina e jurisprudência organizado por disciplina e banca.",
  },
  {
    num: "02",
    icon: FileText,
    title: "Viewer de PDFs",
    desc: "Leitor com marcações, anotações, grifos e busca avançada dentro do próprio material.",
  },
  {
    num: "03",
    icon: Brain,
    title: "Questões & Simulados",
    desc: "Banco com milhares de questões OAB e concursos, com gabaritos comentados e estatísticas.",
  },
  {
    num: "04",
    icon: BarChart3,
    title: "Dashboard de Desempenho",
    desc: "Evolução detalhada por disciplina, tempo de estudo, acertos e comparativos de período.",
  },
  {
    num: "05",
    icon: Calendar,
    title: "Cronograma Inteligente",
    desc: "Planejamento adaptativo que se ajusta ao seu ritmo, às datas das provas e às suas lacunas.",
  },
  {
    num: "06",
    icon: Layers,
    title: "Flashcards",
    desc: "Revisão espaçada com algoritmo inteligente que prioriza os conceitos de menor retenção.",
  },
];

const plans = [
  {
    name: "Gratuito",
    price: "R$ 0",
    period: "",
    desc: "Para quem está começando a organizar os estudos.",
    features: ["Biblioteca básica", "100 questões / mês", "Flashcards limitados", "Dashboard básico"],
    cta: "Começar grátis",
    highlight: false,
  },
  {
    name: "OAB",
    price: "R$ 49",
    period: "/ mês",
    desc: "Preparação completa para o Exame de Ordem.",
    features: [
      "Biblioteca completa",
      "Questões ilimitadas",
      "Simulados OAB I e II",
      "Cronograma inteligente",
      "Flashcards ilimitados",
      "Dashboard completo",
    ],
    cta: "Assinar plano OAB",
    highlight: true,
  },
  {
    name: "Concursos",
    price: "R$ 79",
    period: "/ mês",
    desc: "Para quem mira cargos públicos de alta concorrência.",
    features: [
      "Tudo do plano OAB",
      "Simulados de concursos",
      "Mentoria em grupo",
      "Relatórios avançados",
      "Conteúdo exclusivo",
      "Suporte prioritário",
    ],
    cta: "Assinar Concursos",
    highlight: false,
  },
];

const stats = [
  { value: "50.000+", label: "Estudantes ativos" },
  { value: "2,3 mi+", label: "Questões respondidas" },
  { value: "89%", label: "Taxa de aprovação OAB" },
  { value: "4,9 ★", label: "Avaliação média" },
];

const methodology = [
  {
    step: "01",
    title: "Diagnóstico preciso",
    desc: "Avaliação inicial mapeia suas lacunas por disciplina e define o ponto exato de partida. Nada de conteúdo genérico.",
  },
  {
    step: "02",
    title: "Trilha personalizada",
    desc: "Um plano de estudos adaptado ao seu objetivo, ao tempo disponível e às datas das provas que você quer alcançar.",
  },
  {
    step: "03",
    title: "Revisão inteligente",
    desc: "Algoritmo de repetição espaçada garante que o conhecimento seja consolidado no momento certo, com o menor esforço.",
  },
];

const testimonials = [
  {
    quote:
      "O LexNexus mudou completamente a minha forma de estudar. Pela primeira vez senti que estava evoluindo de verdade — com dados, não chutes.",
    name: "Camila Ferreira",
    credential: "Aprovada — OAB XXXVII Exame",
    initials: "CF",
  },
  {
    quote:
      "A plataforma tem a profundidade de um material de ponta e a clareza de quem entende como o estudante de concurso pensa.",
    name: "Rafael Augusto",
    credential: "Aprovado — TJ-SP Escrevente",
    initials: "RA",
  },
  {
    quote:
      "O dashboard me deu controle total sobre os meus estudos. Sabia exatamente o que estudar, quando e por quê. Resultado: aprovação em 8 meses.",
    name: "Beatriz Novaes",
    credential: "Aprovada — PGM Recife",
    initials: "BN",
  },
];

const platformTabs = ["Dashboard", "Questões", "Cronograma", "Flashcards"];

// ─── Components ─────────────────────────────────────────────────────────────

function Divider() {
  return <div style={{ height: "1px", background: C.border }} />;
}

function Navbar() {
  const [open, setOpen] = useState(false);
  const links = ["Plataforma", "Recursos", "Metodologia", "Preços"];

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md"
      style={{
        background: "rgba(12,13,26,0.92)",
        borderBottom: `1px solid ${C.borderSubtle}`,
      }}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2.5">
          <LexNexusLogo size={32} />
          <LexNexusWordmark className="text-xl" />
        </a>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="transition-colors"
              style={{ fontSize: "14px", color: C.faint }}
              onMouseEnter={(e) => (e.currentTarget.style.color = C.text)}
              onMouseLeave={(e) => (e.currentTarget.style.color = C.faint)}
            >
              {item}
            </a>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <button
            className="transition-colors"
            style={{ fontSize: "14px", color: C.muted, padding: "8px 16px" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = C.text)}
            onMouseLeave={(e) => (e.currentTarget.style.color = C.muted)}
          >
            Entrar
          </button>
          <button
            className="flex items-center gap-1.5 transition-opacity rounded"
            style={{
              fontSize: "14px",
              background: C.gold,
              color: C.ink,
              padding: "8px 20px",
              fontWeight: 600,
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "0.88")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "1")}
          >
            Acessar plataforma
            <ChevronRight size={15} />
          </button>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden" style={{ color: C.text }} onClick={() => setOpen(!open)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div
          className="md:hidden p-6 flex flex-col gap-4"
          style={{ background: C.surface, borderTop: `1px solid ${C.borderSubtle}` }}
        >
          {links.map((item) => (
            <a key={item} href="#" style={{ fontSize: "14px", color: C.muted }}>
              {item}
            </a>
          ))}
          <button
            className="rounded mt-2"
            style={{ background: C.gold, color: C.ink, padding: "10px", fontWeight: 600, fontSize: "14px" }}
          >
            Acessar plataforma
          </button>
        </div>
      )}
    </nav>
  );
}

function Hero() {
  const { scrollY } = useScroll();
  const wingY = useTransform(scrollY, [0, 700], [0, -90]);
  const wingScale = useTransform(scrollY, [0, 700], [1, 1.08]);

  return (
    <section className="pt-32 pb-20 px-6 relative overflow-hidden" style={{ background: C.ink }}>

      {/* ── Watermark: parallax + breathing ── */}
      <motion.div
        className="absolute pointer-events-none select-none"
        style={{
          right: "-6%",
          top: "50%",
          translateY: "-50%",
          y: wingY,
          scale: wingScale,
          zIndex: 0,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.055 }}
        transition={{ duration: 3, delay: 0.6, ease: "easeOut" }}
      >
        <motion.img
          src={logoImg}
          alt=""
          draggable={false}
          animate={{ scale: [1, 1.025, 1] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          style={{ width: "560px", display: "block" }}
        />
      </motion.div>

      <div className="max-w-7xl mx-auto relative" style={{ zIndex: 1 }}>
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            {/* Eyebrow */}
            <div
              className="inline-flex items-center gap-2 mb-8 rounded"
              style={{
                fontSize: "12px",
                color: C.gold,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                borderBottom: `1px solid ${C.goldDim}`,
                paddingBottom: "6px",
              }}
            >
              Plataforma jurídica de alta performance
            </div>

            {/* Headline */}
            <h1
              className="font-['Playfair_Display',serif] mb-6"
              style={{
                fontSize: "clamp(2.4rem, 5vw, 3.5rem)",
                lineHeight: 1.12,
                color: C.text,
                fontWeight: 600,
                letterSpacing: "-0.02em",
              }}
            >
              Estude com método.{" "}
              <span style={{ color: C.gold, fontStyle: "italic" }}>
                Seja aprovado
              </span>{" "}
              com consistência.
            </h1>

            {/* Subheadline */}
            <p
              className="mb-10"
              style={{
                fontSize: "17px",
                color: C.muted,
                lineHeight: 1.7,
                maxWidth: "500px",
              }}
            >
              Biblioteca, questões, simulados, flashcards e análise de desempenho
              reunidos em uma única plataforma. Construída para quem leva a aprovação
              a sério.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                className="flex items-center justify-center gap-2 rounded transition-opacity group"
                style={{
                  background: C.gold,
                  color: C.ink,
                  padding: "13px 28px",
                  fontWeight: 600,
                  fontSize: "15px",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "0.88")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "1")}
              >
                Começar agora
                <ArrowRight size={16} />
              </button>
              <button
                className="flex items-center justify-center gap-2 rounded transition-colors"
                style={{
                  border: `1px solid ${C.border}`,
                  color: C.muted,
                  padding: "13px 28px",
                  fontSize: "15px",
                  background: "transparent",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = C.text;
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.15)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = C.muted;
                  (e.currentTarget as HTMLButtonElement).style.borderColor = C.border;
                }}
              >
                Ver a plataforma
              </button>
            </div>

            {/* Trust line */}
            <p
              className="mt-8"
              style={{ fontSize: "13px", color: C.faint }}
            >
              Sem cartão de crédito · Cancele quando quiser
            </p>
          </motion.div>

          {/* Right — Dashboard Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="hidden lg:flex justify-center"
          >
            <DashboardMockup />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function StatsBar() {
  return (
    <section style={{ background: C.surface, borderTop: `1px solid ${C.borderSubtle}`, borderBottom: `1px solid ${C.borderSubtle}` }}>
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className="flex flex-col items-center justify-center py-4"
              style={{
                borderRight: i < 3 ? `1px solid ${C.borderSubtle}` : "none",
              }}
            >
              <div
                className="font-['Playfair_Display',serif]"
                style={{ fontSize: "28px", color: C.gold, fontWeight: 600, lineHeight: 1 }}
              >
                {stat.value}
              </div>
              <div
                className="mt-1.5 text-center"
                style={{ fontSize: "13px", color: C.faint }}
              >
                {stat.label}
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
    <section id="recursos" className="py-28 px-6" style={{ background: C.ink }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-16 max-w-2xl">
          <div
            className="mb-4"
            style={{ fontSize: "12px", color: C.gold, letterSpacing: "0.12em", textTransform: "uppercase" }}
          >
            Recursos
          </div>
          <h2
            className="font-['Playfair_Display',serif]"
            style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)", color: C.text, fontWeight: 600, lineHeight: 1.2, letterSpacing: "-0.02em" }}
          >
            A plataforma completa para{" "}
            <span style={{ color: C.gold, fontStyle: "italic" }}>juristas em formação</span>
          </h2>
        </div>

        {/* Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px" style={{ border: `1px solid ${C.borderSubtle}` }}>
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className="p-8 transition-colors"
              style={{ background: C.surface }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = C.elevated)}
              onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = C.surface)}
            >
              <div
                className="mb-6 font-['Playfair_Display',serif]"
                style={{ fontSize: "13px", color: C.goldDim, fontWeight: 600, letterSpacing: "0.04em" }}
              >
                {f.num}
              </div>
              <div className="flex items-start gap-4">
                <f.icon size={18} style={{ color: C.gold, marginTop: "2px", flexShrink: 0 }} />
                <div>
                  <h3
                    className="mb-2"
                    style={{ fontSize: "16px", color: C.text, fontWeight: 500 }}
                  >
                    {f.title}
                  </h3>
                  <p style={{ fontSize: "14px", color: C.muted, lineHeight: 1.65 }}>{f.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PlatformPreview() {
  const [active, setActive] = useState(0);

  const previews = [
    {
      // Dashboard
      content: (
        <div className="p-6">
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { l: "Questões hoje", v: "47" },
              { l: "Sequência ativa", v: "14 dias" },
              { l: "Aproveitamento geral", v: "73%" },
            ].map((c) => (
              <div key={c.l} className="rounded-lg p-4" style={{ background: C.elevated, border: `1px solid ${C.borderSubtle}` }}>
                <div style={{ fontSize: "11px", color: C.faint, textTransform: "uppercase", letterSpacing: "0.07em" }}>{c.l}</div>
                <div style={{ fontSize: "22px", color: C.gold, marginTop: "8px", fontWeight: 600 }}>{c.v}</div>
              </div>
            ))}
          </div>
          <div className="rounded-lg p-5" style={{ background: C.elevated, border: `1px solid ${C.borderSubtle}` }}>
            <div style={{ fontSize: "12px", color: C.faint, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "16px" }}>
              Desempenho por disciplina
            </div>
            {[
              { name: "Dir. Constitucional", pct: 88 },
              { name: "Dir. Civil", pct: 72 },
              { name: "Dir. Penal", pct: 65 },
              { name: "Dir. Administrativo", pct: 79 },
              { name: "Dir. Tributário", pct: 58 },
            ].map((s) => (
              <div key={s.name} className="mb-3">
                <div className="flex justify-between mb-1.5">
                  <span style={{ fontSize: "13px", color: C.muted }}>{s.name}</span>
                  <span style={{ fontSize: "13px", color: C.gold, fontWeight: 600 }}>{s.pct}%</span>
                </div>
                <div className="rounded-full" style={{ height: "4px", background: "#1E2138" }}>
                  <div
                    className="rounded-full h-full"
                    style={{ width: `${s.pct}%`, background: `linear-gradient(to right, ${C.goldDim}, ${C.gold})` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      // Questões
      content: (
        <div className="p-6">
          <div className="rounded-lg p-5 mb-4" style={{ background: C.elevated, border: `1px solid ${C.borderSubtle}` }}>
            <div style={{ fontSize: "11px", color: C.gold, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>
              Questão 24 de 50 · OAB XXXVIII
            </div>
            <p style={{ fontSize: "14px", color: C.text, lineHeight: 1.7, marginBottom: "20px" }}>
              De acordo com o Código Civil, a prescrição para as dívidas líquidas constantes de instrumento público ou particular ocorre em:
            </p>
            <div className="flex flex-col gap-2.5">
              {["02 anos", "03 anos", "05 anos", "10 anos"].map((opt, i) => (
                <div
                  key={opt}
                  className="flex items-center gap-3 rounded-lg p-3"
                  style={{
                    border: `1px solid ${i === 2 ? C.gold : C.borderSubtle}`,
                    background: i === 2 ? "rgba(196,151,74,0.08)" : C.ink,
                  }}
                >
                  <div
                    className="rounded-full flex items-center justify-center"
                    style={{
                      width: "20px",
                      height: "20px",
                      border: `1px solid ${i === 2 ? C.gold : C.faint}`,
                      flexShrink: 0,
                      fontSize: "10px",
                      color: i === 2 ? C.gold : C.faint,
                    }}
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                  <span style={{ fontSize: "13px", color: i === 2 ? C.text : C.muted }}>{opt}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span style={{ fontSize: "12px", color: C.faint }}>Direito Civil · Prescrição e Decadência</span>
            <button className="rounded" style={{ background: C.gold, color: C.ink, padding: "8px 20px", fontSize: "13px", fontWeight: 600 }}>
              Confirmar resposta
            </button>
          </div>
        </div>
      ),
    },
    {
      // Cronograma
      content: (
        <div className="p-6">
          <div className="grid grid-cols-7 gap-2 mb-6">
            {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((d, i) => (
              <div key={d} className="text-center">
                <div style={{ fontSize: "11px", color: C.faint, marginBottom: "6px" }}>{d}</div>
                <div
                  className="rounded-lg flex items-center justify-center mx-auto"
                  style={{
                    width: "36px",
                    height: "36px",
                    background: i === 2 ? C.gold : i < 4 ? C.elevated : "transparent",
                    border: `1px solid ${i === 2 ? C.gold : C.borderSubtle}`,
                    fontSize: "13px",
                    color: i === 2 ? C.ink : i < 4 ? C.text : C.faint,
                    fontWeight: i === 2 ? 700 : 400,
                  }}
                >
                  {24 + i}
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-3">
            {[
              { time: "08:00", subject: "Direito Constitucional", duration: "1h 30min", done: true },
              { time: "10:00", subject: "Direito Civil — Contratos", duration: "2h", done: true },
              { time: "14:00", subject: "Revisão: Flashcards", duration: "45min", done: false },
              { time: "16:00", subject: "Simulado OAB — Parte I", duration: "2h", done: false },
            ].map((session) => (
              <div
                key={session.time}
                className="flex items-center gap-4 rounded-lg p-4"
                style={{
                  background: session.done ? C.elevated : C.surface,
                  border: `1px solid ${session.done ? C.borderSubtle : C.border}`,
                  opacity: session.done ? 0.6 : 1,
                }}
              >
                <span style={{ fontSize: "12px", color: C.faint, width: "44px", flexShrink: 0 }}>{session.time}</span>
                <div
                  className="w-1 rounded-full self-stretch"
                  style={{ background: session.done ? C.faint : C.gold, minHeight: "20px" }}
                />
                <div className="flex-1">
                  <div style={{ fontSize: "13px", color: C.text, fontWeight: 500 }}>{session.subject}</div>
                  <div style={{ fontSize: "12px", color: C.faint, marginTop: "2px" }}>{session.duration}</div>
                </div>
                {session.done && <Check size={14} style={{ color: C.goldDim }} />}
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      // Flashcards
      content: (
        <div className="p-6 flex flex-col items-center">
          <div style={{ fontSize: "12px", color: C.faint, marginBottom: "20px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Flashcard 12 de 40 · Dir. Constitucional
          </div>
          <div
            className="w-full rounded-xl p-8 mb-6 text-center"
            style={{
              background: C.elevated,
              border: `1px solid ${C.border}`,
              minHeight: "160px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <div style={{ fontSize: "12px", color: C.goldDim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "16px" }}>
              Frente
            </div>
            <p style={{ fontSize: "16px", color: C.text, lineHeight: 1.6 }}>
              Qual é o prazo para o controle de constitucionalidade concentrado via ADI?
            </p>
          </div>
          <div
            className="w-full rounded-xl p-6 mb-6"
            style={{ background: "rgba(196,151,74,0.07)", border: `1px solid rgba(196,151,74,0.18)` }}
          >
            <div style={{ fontSize: "12px", color: C.gold, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>
              Resposta
            </div>
            <p style={{ fontSize: "14px", color: C.text, lineHeight: 1.7 }}>
              A ADI não está sujeita a prazo decadencial ou prescricional. O controle concentrado pode ser exercido a qualquer tempo enquanto a norma estiver vigente.
            </p>
          </div>
          <div className="flex gap-3 w-full">
            {[
              { l: "Errei", col: "#8B4040" },
              { l: "Difícil", col: C.faint },
              { l: "Fácil", col: "#3A6B3A" },
            ].map((btn) => (
              <button
                key={btn.l}
                className="flex-1 rounded-lg"
                style={{ padding: "10px", fontSize: "13px", color: C.text, background: "transparent", border: `1px solid ${btn.col}` }}
              >
                {btn.l}
              </button>
            ))}
          </div>
        </div>
      ),
    },
  ];

  return (
    <section id="plataforma" className="py-28 px-6" style={{ background: C.surface }}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-12 max-w-2xl">
          <div
            className="mb-4"
            style={{ fontSize: "12px", color: C.gold, letterSpacing: "0.12em", textTransform: "uppercase" }}
          >
            A Plataforma
          </div>
          <h2
            className="font-['Playfair_Display',serif]"
            style={{
              fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)",
              color: C.text,
              fontWeight: 600,
              lineHeight: 1.2,
              letterSpacing: "-0.02em",
            }}
          >
            Cada ferramenta desenhada{" "}
            <span style={{ color: C.gold, fontStyle: "italic" }}>com propósito</span>
          </h2>
        </div>

        {/* Tabs */}
        <div
          className="flex gap-0 mb-0 w-fit"
          style={{ border: `1px solid ${C.border}`, borderRadius: "6px", overflow: "hidden" }}
        >
          {platformTabs.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActive(i)}
              style={{
                fontSize: "13px",
                padding: "10px 24px",
                background: active === i ? C.gold : "transparent",
                color: active === i ? C.ink : C.muted,
                fontWeight: active === i ? 600 : 400,
                borderRight: i < platformTabs.length - 1 ? `1px solid ${C.border}` : "none",
                transition: "all 0.2s",
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Preview panel */}
        <div
          className="rounded-b-xl rounded-tr-xl overflow-hidden"
          style={{ border: `1px solid ${C.border}`, background: C.ink, borderTop: "none" }}
        >
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {previews[active].content}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Methodology() {
  return (
    <section id="metodologia" className="py-28 px-6 relative overflow-hidden" style={{ background: C.ink }}>

      {/* ── Watermark: centralizada, fade-in + rotação suave ao entrar ── */}
      <WingWatermark
        size={520}
        targetOpacity={0.045}
        float
        rotate={-8}
        wrapStyle={{
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 0,
        }}
      />

      <div className="max-w-7xl mx-auto relative" style={{ zIndex: 1 }}>
        <div className="mb-16 max-w-xl">
          <div
            className="mb-4"
            style={{ fontSize: "12px", color: C.gold, letterSpacing: "0.12em", textTransform: "uppercase" }}
          >
            Metodologia
          </div>
          <h2
            className="font-['Playfair_Display',serif]"
            style={{
              fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)",
              color: C.text,
              fontWeight: 600,
              lineHeight: 1.2,
              letterSpacing: "-0.02em",
            }}
          >
            O método LexNexus
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-0" style={{ border: `1px solid ${C.borderSubtle}` }}>
          {methodology.map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="p-10"
              style={{
                background: C.surface,
                borderRight: i < methodology.length - 1 ? `1px solid ${C.borderSubtle}` : "none",
              }}
            >
              <div
                className="font-['Playfair_Display',serif] mb-8"
                style={{ fontSize: "48px", color: "rgba(196,151,74,0.15)", fontWeight: 700, lineHeight: 1 }}
              >
                {item.step}
              </div>
              <h3
                className="mb-4"
                style={{ fontSize: "18px", color: C.text, fontWeight: 500 }}
              >
                {item.title}
              </h3>
              <p style={{ fontSize: "14px", color: C.muted, lineHeight: 1.7 }}>{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="py-28 px-6 relative overflow-hidden" style={{ background: C.surface }}>

      {/* ── Watermark: asa esquerda, muito sutil, espelhada ── */}
      <WingWatermark
        size={440}
        targetOpacity={0.03}
        rotate={12}
        wrapStyle={{
          bottom: "-60px",
          left: "-80px",
          zIndex: 0,
        }}
      />

      <div className="max-w-7xl mx-auto relative" style={{ zIndex: 1 }}>
        <div className="mb-14 max-w-xl">
          <div
            className="mb-4"
            style={{ fontSize: "12px", color: C.gold, letterSpacing: "0.12em", textTransform: "uppercase" }}
          >
            Resultados
          </div>
          <h2
            className="font-['Playfair_Display',serif]"
            style={{
              fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)",
              color: C.text,
              fontWeight: 600,
              lineHeight: 1.2,
              letterSpacing: "-0.02em",
            }}
          >
            Quem usou o método,{" "}
            <span style={{ color: C.gold, fontStyle: "italic" }}>passou</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-xl p-8 flex flex-col justify-between"
              style={{
                background: C.ink,
                border: `1px solid ${C.borderSubtle}`,
              }}
            >
              {/* Quote */}
              <div
                className="mb-8"
                style={{ fontSize: "13px", color: C.gold, fontFamily: "Georgia, serif", lineHeight: 1 }}
              >
                "
              </div>
              <p
                className="mb-8 flex-1"
                style={{ fontSize: "15px", color: C.muted, lineHeight: 1.75, fontStyle: "italic" }}
              >
                {t.quote}
              </p>
              {/* Author */}
              <div className="flex items-center gap-3" style={{ borderTop: `1px solid ${C.borderSubtle}`, paddingTop: "20px" }}>
                <div
                  className="rounded-full flex items-center justify-center"
                  style={{
                    width: "38px",
                    height: "38px",
                    background: `linear-gradient(135deg, ${C.goldDim}, ${C.gold})`,
                    fontSize: "12px",
                    color: C.ink,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {t.initials}
                </div>
                <div>
                  <div style={{ fontSize: "14px", color: C.text, fontWeight: 500 }}>{t.name}</div>
                  <div style={{ fontSize: "12px", color: C.faint, marginTop: "2px" }}>{t.credential}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="preços" className="py-28 px-6" style={{ background: C.ink }}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-14 max-w-xl">
          <div
            className="mb-4"
            style={{ fontSize: "12px", color: C.gold, letterSpacing: "0.12em", textTransform: "uppercase" }}
          >
            Planos
          </div>
          <h2
            className="font-['Playfair_Display',serif]"
            style={{
              fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)",
              color: C.text,
              fontWeight: 600,
              lineHeight: 1.2,
              letterSpacing: "-0.02em",
            }}
          >
            Escolha o plano{" "}
            <span style={{ color: C.gold, fontStyle: "italic" }}>certo para sua meta</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-5 max-w-5xl">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className="rounded-xl p-8 flex flex-col"
              style={{
                background: plan.highlight ? C.surface : C.surface,
                border: plan.highlight ? `1px solid ${C.gold}` : `1px solid ${C.borderSubtle}`,
              }}
            >
              {plan.highlight && (
                <div
                  className="inline-block mb-4 rounded"
                  style={{
                    fontSize: "11px",
                    color: C.ink,
                    background: C.gold,
                    padding: "3px 10px",
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    width: "fit-content",
                  }}
                >
                  Recomendado
                </div>
              )}

              <div style={{ fontSize: "18px", color: C.text, fontWeight: 600, marginBottom: "6px" }}>
                {plan.name}
              </div>
              <div style={{ fontSize: "13px", color: C.faint, marginBottom: "20px", lineHeight: 1.5 }}>
                {plan.desc}
              </div>

              <div className="mb-6 pb-6" style={{ borderBottom: `1px solid ${C.borderSubtle}` }}>
                <span
                  className="font-['Playfair_Display',serif]"
                  style={{ fontSize: "32px", color: plan.highlight ? C.gold : C.text, fontWeight: 600 }}
                >
                  {plan.price}
                </span>
                <span style={{ fontSize: "14px", color: C.faint }}>{plan.period}</span>
              </div>

              <ul className="flex-1 flex flex-col gap-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check
                      size={14}
                      style={{ color: plan.highlight ? C.gold : C.goldDim, marginTop: "3px", flexShrink: 0 }}
                    />
                    <span style={{ fontSize: "14px", color: C.muted }}>{f}</span>
                  </li>
                ))}
              </ul>

              <button
                className="rounded w-full transition-opacity"
                style={{
                  padding: "12px",
                  fontSize: "14px",
                  fontWeight: 600,
                  background: plan.highlight ? C.gold : "transparent",
                  color: plan.highlight ? C.ink : C.muted,
                  border: plan.highlight ? "none" : `1px solid ${C.borderSubtle}`,
                }}
                onMouseEnter={(e) => {
                  if (plan.highlight) (e.currentTarget as HTMLButtonElement).style.opacity = "0.88";
                  else (e.currentTarget as HTMLButtonElement).style.color = C.text;
                }}
                onMouseLeave={(e) => {
                  if (plan.highlight) (e.currentTarget as HTMLButtonElement).style.opacity = "1";
                  else (e.currentTarget as HTMLButtonElement).style.color = C.muted;
                }}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="py-32 px-6 relative overflow-hidden" style={{ background: C.surface, borderTop: `1px solid ${C.borderSubtle}` }}>

      {/* ── Watermark: protagonista, maior, flutuando com breathing ── */}
      <WingWatermark
        size={680}
        targetOpacity={0.09}
        float
        rotate={0}
        once={false}
        wrapStyle={{
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 0,
        }}
      />

      <div className="max-w-3xl mx-auto text-center relative" style={{ zIndex: 1 }}>
        <div className="flex justify-center mb-8">
          <LexNexusLogo size={48} />
        </div>
        <h2
          className="font-['Playfair_Display',serif] mb-5"
          style={{
            fontSize: "clamp(2rem, 4vw, 3rem)",
            color: C.text,
            fontWeight: 600,
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
          }}
        >
          Isso foi desenhado para gente séria,
          <br />
          <span style={{ color: C.gold, fontStyle: "italic" }}>que quer resultado de verdade.</span>
        </h2>
        <p
          className="mb-10"
          style={{ fontSize: "16px", color: C.muted, lineHeight: 1.7, maxWidth: "520px", margin: "0 auto 40px" }}
        >
          Comece agora. Sem burocracia, sem cartão de crédito, sem compromisso.
          Apenas você e o caminho mais direto para a aprovação.
        </p>
        <button
          className="inline-flex items-center gap-2 rounded transition-opacity"
          style={{
            background: C.gold,
            color: C.ink,
            padding: "15px 36px",
            fontSize: "15px",
            fontWeight: 700,
            letterSpacing: "0.01em",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "0.88")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "1")}
        >
          Começar gratuitamente
          <ArrowRight size={16} />
        </button>
      </div>
    </section>
  );
}

function Footer() {
  const columns = [
    {
      label: "Plataforma",
      links: ["Dashboard", "Questões", "Simulados", "Biblioteca", "Cronograma", "Flashcards"],
    },
    {
      label: "Empresa",
      links: ["Sobre", "Metodologia", "Blog", "Imprensa", "Carreiras"],
    },
    {
      label: "Suporte",
      links: ["Central de ajuda", "Contato", "Termos de uso", "Privacidade"],
    },
  ];

  return (
    <footer style={{ background: "#090A17", borderTop: `1px solid ${C.borderSubtle}` }}>
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <LexNexusLogo size={28} />
              <LexNexusWordmark className="text-lg" />
            </div>
            <p style={{ fontSize: "13px", color: C.faint, lineHeight: 1.7, maxWidth: "220px" }}>
              Plataforma jurídica de alta performance para estudantes de Direito, OAB e concursos.
            </p>
          </div>

          {/* Links */}
          {columns.map((col) => (
            <div key={col.label}>
              <div
                className="mb-4"
                style={{ fontSize: "11px", color: C.gold, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}
              >
                {col.label}
              </div>
              <ul className="flex flex-col gap-2.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      style={{ fontSize: "13px", color: C.faint, textDecoration: "none", transition: "color 0.2s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = C.muted)}
                      onMouseLeave={(e) => (e.currentTarget.style.color = C.faint)}
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          className="flex flex-col md:flex-row items-center justify-between pt-8"
          style={{ borderTop: `1px solid ${C.borderSubtle}` }}
        >
          <span style={{ fontSize: "12px", color: C.faint }}>
            © 2026 LexNexus Tecnologia Jurídica. Todos os direitos reservados.
          </span>
          <span style={{ fontSize: "12px", color: C.faint, marginTop: "8px" }}>
            Construído para quem quer a aprovação.
          </span>
        </div>
      </div>
    </footer>
  );
}

// ─── App ────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <div
      className="min-h-screen"
      style={{ background: C.ink, fontFamily: "Inter, system-ui, sans-serif", color: C.text }}
    >
      <Navbar />
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