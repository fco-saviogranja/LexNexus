import logoImg from "figma:asset/236e71b7ac08ed5ea884846b41d5149eea96eab8.png";

export function LexNexusLogo({ size = 40 }: { size?: number }) {
  return (
    <img
      src={logoImg}
      alt="LexNexus"
      width={size}
      height={size}
      style={{ width: size, height: size, objectFit: "contain" }}
    />
  );
}

export function LexNexusWordmark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.45em",
        lineHeight: 1,
      }}
    >
      {/* LEX — serif, dourado, tracked */}
      <span
        style={{
          fontFamily: "'Playfair Display', serif",
          fontWeight: 600,
          color: "#C4974A",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
        }}
      >
        Lex
      </span>

      {/* Separador vertical fino */}
      <span
        style={{
          display: "inline-block",
          width: "1px",
          height: "0.9em",
          background: "rgba(196,151,74,0.3)",
          alignSelf: "center",
          flexShrink: 0,
        }}
      />

      {/* NEXUS — sans-serif, off-white, leve, muito espaçado */}
      <span
        style={{
          fontFamily: "Inter, system-ui, sans-serif",
          fontWeight: 300,
          color: "#ECEAE2",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
        }}
      >
        Nexus
      </span>
    </span>
  );
}