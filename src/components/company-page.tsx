import type { ReactNode } from "react";
import { CONTACT_EMAIL, LEGAL_UPDATED_ISO, LEGAL_UPDATED_LABEL } from "@/lib/site";

export function CompanyHero({
  eyebrow,
  title,
  lede,
  children,
}: {
  eyebrow: string;
  title: string;
  lede: string;
  children?: ReactNode;
}) {
  return (
    <section className="border-b border-line bg-card">
      <div className="mx-auto w-full max-w-6xl px-4 pt-10 pb-8 sm:px-6 sm:pt-16 sm:pb-12">
        <p className="text-sm font-semibold text-forest">{eyebrow}</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-extrabold tracking-tight text-ink sm:text-5xl sm:leading-[1.08]">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted sm:text-lg sm:leading-8">{lede}</p>
        {children ? <div className="mt-6">{children}</div> : null}
      </div>
    </section>
  );
}

export function IconBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex size-11 items-center justify-center rounded-xl bg-chip text-forest">{children}</span>
  );
}

const card = "rounded-2xl border border-line bg-card p-5 shadow-[0_8px_24px_rgba(30,107,88,0.06)]";

export function FeatureCard({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <article className={card}>
      <IconBadge>{icon}</IconBadge>
      <h3 className="mt-4 text-lg font-extrabold tracking-tight text-ink">{title}</h3>
      <div className="mt-2 space-y-3 text-sm leading-6 text-muted">{children}</div>
    </article>
  );
}

export function MailLink({ className = "" }: { className?: string }) {
  return (
    <a className={`font-semibold text-forest underline-offset-4 hover:underline ${className}`} href={`mailto:${CONTACT_EMAIL}`}>
      {CONTACT_EMAIL}
    </a>
  );
}

export const LEGAL_SECTIONS_CLASS = "scroll-mt-28";

export function LegalLayout({
  eyebrow,
  title,
  lede,
  sections,
}: {
  eyebrow: string;
  title: string;
  lede: string;
  sections: { id: string; title: string; body: ReactNode }[];
}) {
  return (
    <main className="bg-wash">
      <CompanyHero eyebrow={eyebrow} title={title} lede={lede}>
        <p className="text-sm font-medium text-muted">
          Last updated{" "}
          <time dateTime={LEGAL_UPDATED_ISO} className="font-semibold text-ink">
            {LEGAL_UPDATED_LABEL}
          </time>
        </p>
      </CompanyHero>
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[15rem_minmax(0,42rem)] lg:items-start lg:gap-14 lg:py-14">
        <nav aria-label="On this page" className="lg:sticky lg:top-24">
          <p className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">On this page</p>
          <ol className="mt-3 flex flex-wrap gap-2 lg:flex-col lg:flex-nowrap lg:gap-1">
            {sections.map((section, index) => (
              <li key={section.id} className="shrink-0">
                <a
                  href={`#${section.id}`}
                  className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-2 text-sm font-semibold text-ink hover:border-forest hover:text-forest focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest lg:w-full lg:rounded-lg lg:border-0 lg:bg-transparent lg:px-2 lg:py-1.5"
                >
                  <span className="text-xs font-bold text-forest tabular-nums">{index + 1}</span>
                  {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <article className="space-y-10">
          {sections.map((section) => (
            <section key={section.id} id={section.id} aria-labelledby={`${section.id}-title`} className={LEGAL_SECTIONS_CLASS}>
              <h2 id={`${section.id}-title`} className="text-2xl font-extrabold tracking-tight text-ink">
                {section.title}
              </h2>
              <div className="mt-3 max-w-[65ch] space-y-4 text-base leading-8 text-muted">{section.body}</div>
            </section>
          ))}
        </article>
      </div>
    </main>
  );
}

export function MarkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 16.5 9 6l3.2 6.2L16 8l3 8.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 19h16" strokeLinecap="round" />
    </svg>
  );
}

export function PeopleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="9" cy="8" r="2.4" />
      <circle cx="16" cy="9" r="2" />
      <path d="M4.5 18c.8-2.2 2.6-3.3 4.5-3.3s3.7 1.1 4.5 3.3" strokeLinecap="round" />
      <path d="M14 14.8c1.4-.4 2.8-.2 4 .8" strokeLinecap="round" />
    </svg>
  );
}

export function SourceIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 5.5h8.5L19 10v8.5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-12a1 1 0 0 1 1-1Z" strokeLinejoin="round" />
      <path d="M14 5.5V10h5" strokeLinejoin="round" />
      <path d="M8 14h8M8 17h5" strokeLinecap="round" />
    </svg>
  );
}

export function ApplyIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M8 7h11M8 12h11M8 17h7" strokeLinecap="round" />
      <path d="m4.5 7 1.2 1.2L8 6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m4.5 12 1.2 1.2L8 11" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m4.5 17 1.2 1.2L8 16" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m5 8 7 5 7-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
