import type { ReactNode } from "react";
import { PageHero, type Crumb } from "@/components/page-hero";

/** A reading page: the shared hero on top, then the text on a white sheet over the mint field. */
export function ProsePage({
  crumbs,
  title,
  lede,
  photo,
  children,
}: {
  crumbs?: Crumb[];
  title: string;
  lede?: string;
  photo?: { src: string; position?: string };
  children: ReactNode;
}) {
  return (
    <main className="akazi-terrain pb-16">
      <PageHero crumbs={crumbs} title={title} lede={lede} photo={photo} compact />
      <article className="relative mx-auto -mt-10 w-full max-w-3xl px-4 sm:px-6">
        <div className="akazi-reveal space-y-4 rounded-[1.75rem] border border-line bg-card p-6 text-base leading-7 text-muted shadow-[0_20px_50px_rgba(16,58,48,0.10)] sm:p-10">
          {children}
        </div>
      </article>
    </main>
  );
}
