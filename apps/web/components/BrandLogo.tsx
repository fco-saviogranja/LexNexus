type BrandMarkProps = {
  className?: string;
};

type BrandLogoProps = {
  className?: string;
  subtitle?: string;
  compact?: boolean;
};

export function BrandMark({ className }: BrandMarkProps) {
  return (
    <img
      aria-hidden="true"
      alt=""
      className={["brand-mark-image", className].filter(Boolean).join(" ")}
      src="/brand/lexnexus-logo-official.png"
    />
  );
}

export function BrandLogo({
  className,
  subtitle,
  compact = false
}: BrandLogoProps) {
  return (
    <div
      className={["brand-logo", className].filter(Boolean).join(" ")}
      data-compact={compact ? "true" : "false"}
    >
      <div className="brand-logo-mark">
        <BrandMark className="h-full w-full" />
      </div>
      <div className="min-w-0">
        <div className={compact ? "brand-wordmark text-[2.15rem]" : "brand-wordmark text-[3.35rem]"}>
          <span className="brand-wordmark-primary">Lex</span>
          <span className="brand-wordmark-secondary">Nexus</span>
        </div>
        {subtitle ? <p className="brand-subtitle">{subtitle}</p> : null}
      </div>
    </div>
  );
}
