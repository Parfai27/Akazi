import Image from "next/image";
import Link from "next/link";
import { Fragment, type CSSProperties, type ReactNode } from "react";
import { HeroHills } from "@/components/hero-hills";

export type Crumb = { label: string; href?: string; icon?: ReactNode };

/**
 * The dark forest band every inner page opens with, so the whole site reads as one: grain, an optional photo faded
 * in on the right, the terraced hills along the bottom, and the title rising word by word from behind a mask.
 * Everything below it sits on the mint `akazi-terrain` field.
 */
export function PageHero({
  crumbs,
  eyebrow,
  title,
  lede,
  photo,
  aside,
  children,
  compact = false,
}: {
  crumbs?: Crumb[];
  eyebrow?: ReactNode;
  title: string;
  lede?: ReactNode;
  photo?: { src: string; position?: string };
  aside?: ReactNode;
  children?: ReactNode;
  compact?: boolean;
}) {
  const words = title.split(/\s+/).filter(Boolean);
  return (
    <section className="akazi-hero-enter relative isolate overflow-hidden bg-linear-to-b from-[#081a15] via-[#0d2b24] to-[#14463a] text-white">
      {photo ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-20 lg:left-auto lg:w-[55%] lg:[mask-image:linear-gradient(to_right,transparent,#000_45%)]"
        >
          <div className="akazi-parallax absolute inset-x-0 -top-28 bottom-0">
            <Image
              src={photo.src}
              alt=""
              fill
              priority
              sizes="(min-width: 1024px) 55vw, 100vw"
              className="object-cover"
              style={{ objectPosition: photo.position ?? "center" }}
            />
          </div>
          <div className="absolute inset-0 bg-[#081a15]/78 lg:bg-[#081a15]/25" />
        </div>
      ) : null}
      <HeroHills className="h-16 sm:h-24 lg:h-32" />
      <div aria-hidden="true" className="akazi-grain pointer-events-none absolute inset-0 -z-10" />
      <div
        className={`relative mx-auto grid w-full max-w-6xl items-end gap-8 px-4 sm:px-6 ${
          aside ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]" : ""
        } ${compact ? "pt-8 pb-20 sm:pt-10 sm:pb-24" : "pt-10 pb-24 sm:pt-14 sm:pb-32 lg:pb-36"}`}
      >
        <div className="min-w-0">
          {crumbs && crumbs.length > 0 ? (
            <nav aria-label="Breadcrumb" className="akazi-rise">
              <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium text-[#b9d3c8]">
                <li>
                  <Link href="/" className="hover:text-white hover:underline">
                    Home
                  </Link>
                </li>
                {crumbs.map((crumb, index) => {
                  const last = index === crumbs.length - 1;
                  return (
                    <li key={crumb.label} className="inline-flex items-center gap-2">
                      <span aria-hidden="true" className="text-[#f5b942]">
                        /
                      </span>
                      {crumb.href && !last ? (
                        <Link href={crumb.href} className="inline-flex items-center gap-1 hover:text-white hover:underline">
                          {crumb.icon}
                          {crumb.label}
                        </Link>
                      ) : (
                        <span aria-current={last ? "page" : undefined} className="inline-flex items-center gap-1 text-white">
                          {crumb.icon}
                          {crumb.label}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ol>
            </nav>
          ) : null}
          {eyebrow ? (
            <div style={{ "--d": "60ms" } as CSSProperties} className="akazi-rise mt-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-sm font-semibold text-[#d6e8e0]">
                {eyebrow}
              </span>
            </div>
          ) : null}
          <h1
            className={`mt-5 max-w-4xl font-extrabold tracking-[-0.04em] break-words ${
              compact ? "text-3xl leading-[1.08] sm:text-5xl" : "text-4xl leading-[1.02] sm:text-6xl lg:text-7xl"
            }`}
          >
            {words.map((word, index) => (
              <Fragment key={`${word}-${index}`}>
                <span className="akazi-mask">
                  <span style={{ "--d": `${80 + Math.min(index, 10) * 60}ms` } as CSSProperties} className="akazi-mask-in">
                    {word}
                  </span>
                </span>
                {index < words.length - 1 ? " " : null}
              </Fragment>
            ))}
          </h1>
          {lede ? (
            <div
              style={{ "--d": "260ms" } as CSSProperties}
              className="akazi-rise mt-5 max-w-2xl text-base leading-7 text-[#d6e8e0] sm:text-lg sm:leading-8"
            >
              {lede}
            </div>
          ) : null}
          {children ? (
            <div style={{ "--d": "340ms" } as CSSProperties} className="akazi-rise mt-7">
              {children}
            </div>
          ) : null}
        </div>
        {aside ? (
          <div style={{ "--d": "220ms" } as CSSProperties} className="akazi-rise akazi-rise-soft min-w-0">
            {aside}
          </div>
        ) : null}
      </div>
    </section>
  );
}

/** A frosted stat tile for a page hero's side column. */
export function HeroStat({ value, label, tone = "glass" }: { value: ReactNode; label: string; tone?: "glass" | "amber" }) {
  return (
    <div
      className={`rounded-2xl px-5 py-4 ${
        tone === "amber"
          ? "bg-[#f5b942] text-ink shadow-[0_18px_40px_rgba(6,30,24,0.35)]"
          : "border border-white/15 bg-white/10 text-white backdrop-blur-sm"
      }`}
    >
      <span className="block text-3xl leading-none font-extrabold tracking-tight tabular-nums">{value}</span>
      <span className={`mt-1.5 block text-sm font-semibold ${tone === "amber" ? "text-ink/80" : "text-[#d6e8e0]"}`}>
        {label}
      </span>
    </div>
  );
}
