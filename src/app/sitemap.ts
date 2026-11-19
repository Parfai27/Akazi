import type { MetadataRoute } from "next";
import { guides } from "@/lib/guides";
import { CANONICAL_ORIGIN } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
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

  return staticPaths.map((item) => ({
    url: item.path === "/" ? CANONICAL_ORIGIN : `${CANONICAL_ORIGIN}${item.path}`,
    changeFrequency: item.changeFrequency,
    priority: item.priority,
  }));
}
