import type { MetadataRoute } from "next";
import { guides } from "@/lib/guides";
import { listSitemapJobs } from "@/lib/jobs";
import { CANONICAL_ORIGIN } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const listed = await listSitemapJobs();
  const staticPaths = [
    { path: "/", changeFrequency: "hourly" as const, priority: 1 },
    { path: "/about", changeFrequency: "monthly" as const, priority: 0.6 },
    { path: "/contact", changeFrequency: "monthly" as const, priority: 0.5 },
    { path: "/guides", changeFrequency: "monthly" as const, priority: 0.7 },
    ...guides.map((guide) => ({
      path: `/guides/${guide.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    { path: "/alerts", changeFrequency: "monthly" as const, priority: 0.6 },
    { path: "/privacy", changeFrequency: "yearly" as const, priority: 0.3 },
    { path: "/terms", changeFrequency: "yearly" as const, priority: 0.3 },
  ];

  return [
    ...staticPaths.map((item) => ({
      url: item.path === "/" ? CANONICAL_ORIGIN : `${CANONICAL_ORIGIN}${item.path}`,
      changeFrequency: item.changeFrequency,
      priority: item.priority,
    })),
    ...listed.map((job) => ({
      url: `${CANONICAL_ORIGIN}/jobs/${job.publicId}`,
      lastModified: lastModified(job.postedAt),
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}

function lastModified(iso: string | null) {
  if (!iso) return undefined;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? undefined : date;
}
