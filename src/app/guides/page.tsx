import Link from "next/link";
import { ProsePage } from "@/components/prose-page";
import { guides } from "@/lib/guides";
import { pageMeta } from "@/lib/site";

export const metadata = pageMeta({
  title: "Guides",
  description: "Short original guides for job seekers in Rwanda: CVs, interviews, and remote work you can do from here.",
  path: "/guides",
});

export default function GuidesPage() {
  return (
    <ProsePage
      title="Guides"
      lede="These notes are written for Akazi. They are not copied from an employer advert. Use them before you apply, then go back to the opening and follow that employer’s instructions."
    >
      <ul className="grid gap-4">
        {guides.map((guide) => (
          <li key={guide.slug}>
            <Link
              href={`/guides/${guide.slug}`}
              className="block rounded-2xl border border-line bg-card p-5 hover:border-forest"
            >
              <span className="block text-lg font-extrabold tracking-tight text-ink">{guide.title}</span>
              <span className="mt-2 block text-sm leading-6 text-muted">{guide.lede}</span>
            </Link>
          </li>
        ))}
      </ul>
      <p>
        The openings themselves are on the <Link className="font-medium text-forest underline-offset-4 hover:underline" href="/">board</Link>.
      </p>
    </ProsePage>
  );
}
