import Link from "next/link";
import { notFound } from "next/navigation";
import { guideBodies } from "@/components/guide-articles";
import { ProsePage } from "@/components/prose-page";
import { getGuide, guides } from "@/lib/guides";
import { pageMeta } from "@/lib/site";

export function generateStaticParams() {
  return guides.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return { title: "Guide not found", robots: { index: false, follow: false } };
  return pageMeta({ title: guide.title, description: guide.description, path: `/guides/${guide.slug}` });
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = getGuide(slug);
  const Body = guide ? guideBodies[guide.slug as keyof typeof guideBodies] : null;
  if (!guide || !Body) notFound();

  return (
    <ProsePage eyebrow="Guide" title={guide.title} lede={guide.lede}>
      <Body />
      <p className="pt-4">
        <Link className="font-medium text-forest underline-offset-4 hover:underline" href="/guides">
          All guides
        </Link>
        {" · "}
        <Link className="font-medium text-forest underline-offset-4 hover:underline" href="/">
          Back to openings
        </Link>
      </p>
    </ProsePage>
  );
}
