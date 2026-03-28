import Link from "next/link";
import { ReactNode } from "react";

export function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  summary?: ReactNode;
};

export function PageHeader({ eyebrow, title, description, actions, summary }: PageHeaderProps) {
  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="brand-card p-4 sm:p-5 md:p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] brand-muted">{eyebrow}</p>
        <h1 className="brand-title mt-3 text-[24px] font-semibold leading-[1.02] sm:text-[28px] md:text-[34px]">{title}</h1>
        <p className="mt-3 max-w-3xl text-[13px] leading-6 brand-muted">{description}</p>
        {actions ? <div className="mt-5 grid gap-2.5 sm:flex sm:flex-wrap">{actions}</div> : null}
      </div>
      {summary ? <aside className="brand-card p-4 sm:p-5">{summary}</aside> : null}
    </section>
  );
}

type TabItem = {
  label: string;
  href?: string;
  active?: boolean;
  note?: string;
};

export function SectionTabs({ items }: { items: TabItem[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const className = "brand-section-tab";

        const content = (
          <>
            <span>{item.label}</span>
            {item.note ? (
              <span className="brand-section-tab-note">{item.note}</span>
            ) : null}
          </>
        );

        return item.href ? (
          <Link key={`${item.label}-${item.href}`} className={className} data-active={item.active ? "true" : "false"} href={item.href}>
            {content}
          </Link>
        ) : (
          <div key={item.label} className={className} data-active={item.active ? "true" : "false"}>
            {content}
          </div>
        );
      })}
    </div>
  );
}

type MetricCardProps = {
  label: string;
  value: ReactNode;
  hint?: string;
  accent?: ReactNode;
};

export function MetricCard({ label, value, hint, accent }: MetricCardProps) {
  return (
    <article className="brand-stat-card">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] brand-muted">{label}</p>
        {accent ? <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--brand-accent-strong)]">{accent}</div> : null}
      </div>
      <p className="brand-title mt-2.5 text-[24px] font-semibold">{value}</p>
      {hint ? <p className="mt-2 text-[12px] leading-5 brand-muted">{hint}</p> : null}
    </article>
  );
}

export function PanelTitle({
  eyebrow,
  title,
  description,
  action
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow ? <p className="text-[11px] font-semibold uppercase tracking-[0.12em] brand-muted">{eyebrow}</p> : null}
        <h2 className="brand-title mt-2 text-[24px] font-semibold">{title}</h2>
        {description ? <p className="mt-3 max-w-3xl text-[13px] leading-6 brand-muted">{description}</p> : null}
      </div>
      {action ? <div className="flex flex-wrap gap-3">{action}</div> : null}
    </div>
  );
}

export function ProgressBar({ value }: { value: number }) {
  const safeValue = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));

  return (
    <div className="brand-progress-track">
      <div
        className="h-full rounded-full bg-[linear-gradient(90deg,var(--brand-accent),var(--brand-secondary))]"
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="brand-card p-4 sm:p-5 md:p-6">
      <h3 className="brand-title text-[22px] font-semibold sm:text-[26px]">{title}</h3>
      <p className="mt-3 max-w-2xl text-[13px] leading-6 brand-muted">{description}</p>
      {action ? <div className="mt-4 grid gap-2.5 sm:flex sm:flex-wrap">{action}</div> : null}
    </div>
  );
}

export function StatusPill({
  children,
  tone = "default"
}: {
  children: ReactNode;
  tone?: "default" | "success" | "warning" | "info";
}) {
  return (
    <span className="brand-status-pill" data-tone={tone}>
      {children}
    </span>
  );
}
