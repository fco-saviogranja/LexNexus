import { ReactNode } from "react";

export type BrandIconName =
  | "study"
  | "analytics"
  | "calendar"
  | "questions"
  | "simulado"
  | "flashcards"
  | "library"
  | "admin"
  | "check"
  | "target"
  | "roadmap"
  | "briefcase"
  | "users"
  | "shield"
  | "play"
  | "trophy";

const icons: Record<BrandIconName, ReactNode> = {
  study: (
    <>
      <path d="M4.75 18.25h14.5a1.5 1.5 0 0 0 1.5-1.5V8.5l-4.5-3.75H8a3.25 3.25 0 0 0-3.25 3.25v10.25Z" />
      <path d="M9 18.25v-4.5h7v4.5" />
      <path d="M16.25 4.75v3.5h4.5" />
    </>
  ),
  analytics: (
    <>
      <path d="M5 18.5h14" />
      <path d="M7.25 17.75v-5.5" />
      <path d="M12 17.75V8.75" />
      <path d="M16.75 17.75v-8" />
      <path d="M6.25 8.5 11 5.75l3.25 2 3.5-2.25" />
    </>
  ),
  calendar: (
    <>
      <path d="M6.5 4.75v3" />
      <path d="M17.5 4.75v3" />
      <rect x="4.75" y="6.75" width="14.5" height="12.5" rx="3" />
      <path d="M4.75 10.5h14.5" />
      <rect x="8.25" y="13" width="3.5" height="3.5" rx="1.1" fill="currentColor" opacity="0.18" stroke="none" />
    </>
  ),
  questions: (
    <>
      <path d="M7.75 7.75a4.25 4.25 0 1 1 7.4 2.82c-.9.92-2.15 1.67-2.15 3.18" />
      <circle cx="12" cy="17.75" r="1.05" fill="currentColor" stroke="none" />
      <path d="M5.5 20.25h13" />
    </>
  ),
  simulado: (
    <>
      <rect x="5" y="4.75" width="10.5" height="14" rx="2.5" />
      <path d="M8 8.75h4.5" />
      <path d="M8 12h4.5" />
      <path d="M18 7.25 20 9.25 15.75 13.5" />
    </>
  ),
  flashcards: (
    <>
      <rect x="6.25" y="5.25" width="11.5" height="8" rx="2.5" />
      <path d="M9 9.25h6" />
      <path d="M8.5 16.5h9.25a1.75 1.75 0 0 1 0 3.5H8.5a2.75 2.75 0 1 1 0-5.5h1" />
    </>
  ),
  library: (
    <>
      <path d="M6 6.5A2.75 2.75 0 0 1 8.75 3.75H19v16H8.75A2.75 2.75 0 0 0 6 22V6.5Z" />
      <path d="M6 6.5V18.75" />
      <path d="M10 8.25h5.75" />
    </>
  ),
  admin: (
    <>
      <rect x="4.75" y="4.75" width="14.5" height="14.5" rx="3" />
      <path d="M9.25 9.25h5.5" />
      <path d="M9.25 12h5.5" />
      <path d="M9.25 14.75h3" />
    </>
  ),
  check: (
    <>
      <path d="M5.5 12.5 9.1 16l9.4-9" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="7.25" />
      <circle cx="12" cy="12" r="3.25" />
      <path d="M12 2.75v3.5" />
      <path d="M21.25 12h-3.5" />
    </>
  ),
  roadmap: (
    <>
      <circle cx="6.5" cy="6.5" r="1.75" />
      <circle cx="17.5" cy="8.5" r="1.75" />
      <circle cx="9.25" cy="17.25" r="1.75" />
      <path d="M8 7.25 15.75 8.1" />
      <path d="M7.4 8.1 8.5 15.5" />
      <path d="M16.15 10 10.85 15.9" />
    </>
  ),
  briefcase: (
    <>
      <rect x="4.75" y="7.25" width="14.5" height="11.5" rx="2.5" />
      <path d="M9 7.25v-1a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1" />
      <path d="M4.75 12h14.5" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="9.25" r="2.75" />
      <path d="M4.75 18.5a4.75 4.75 0 0 1 8.5-2.9" />
      <circle cx="16.75" cy="10" r="2" />
      <path d="M14.75 18.5a3.75 3.75 0 0 1 4.5-3.65" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3.75 18.5 6v5.25c0 4.15-2.45 7.2-6.5 9-4.05-1.8-6.5-4.85-6.5-9V6L12 3.75Z" />
      <path d="M9.2 12.2 11.2 14.2 15.25 10" />
    </>
  ),
  play: (
    <>
      <rect x="4.75" y="5.25" width="14.5" height="13.5" rx="3" />
      <path d="m10 9.25 5 2.75-5 2.75V9.25Z" fill="currentColor" stroke="none" />
    </>
  ),
  trophy: (
    <>
      <path d="M8.5 5.25h7v2.5A3.5 3.5 0 0 1 12 11.25a3.5 3.5 0 0 1-3.5-3.5v-2.5Z" />
      <path d="M8.5 6H6.75a1.75 1.75 0 0 0 0 3.5H9" />
      <path d="M15.5 6h1.75a1.75 1.75 0 1 1 0 3.5H15" />
      <path d="M12 11.25v4.5" />
      <path d="M9 20h6" />
      <path d="M8 16.5h8" />
    </>
  )
};

export function BrandIcon({
  name,
  className = "h-5 w-5",
  strokeWidth = 1.85
}: {
  name: BrandIconName;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth}>
        {icons[name]}
      </g>
    </svg>
  );
}
