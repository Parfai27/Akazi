import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeftIcon } from "@/components/icons";

export function ProsePage({
  eyebrow,
  title,
  lede,
  children,
}: {
  eyebrow?: string;
  title: string;
  lede?: string;
  children: ReactNode;
}) {
  return (
    <main className="bg-wash">
      <article className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
        <Link href="/" className="inline-flex items-center gap-1 text-sm font-medium text-forest hover:underline">
          <ArrowLeftIcon />
          Home
        </Link>
        {eyebrow ? <p className="mt-6 text-sm font-semibold text-forest">{eyebrow}</p> : null}
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-ink">{title}</h1>
        {lede ? <p className="mt-4 text-lg leading-8 text-muted">{lede}</p> : null}
        <div className="mt-8 space-y-4 text-base leading-7 text-muted">{children}</div>
      </article>
    </main>
  );
}
