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
      className={`font-['Playfair_Display',serif] tracking-tight ${className}`}
      style={{ letterSpacing: "-0.01em" }}
    >
      <span style={{ color: "#ECEAE2", fontWeight: 600 }}>Lex</span>
      <span style={{ color: "#C4974A", fontStyle: "italic", fontWeight: 500 }}>
        Nexus
      </span>
    </span>
  );
}
