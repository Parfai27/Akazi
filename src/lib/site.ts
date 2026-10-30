import type { Metadata } from "next";

export const CANONICAL_HOST = "akazi.co.rw";
export const CANONICAL_ORIGIN = `https://${CANONICAL_HOST}`;
export const CONTACT_EMAIL = "akazihelp@gmail.com";

export const SITE_DESCRIPTION =
  "Browse open jobs in Rwanda. Akazi lists roles in Kigali, across the country, and remote work you can do from Rwanda.";

export function pageMeta(input: { title: string; description: string; path: string }): Metadata {
  return {
    title: input.title,
    description: input.description,
    alternates: { canonical: input.path },
    openGraph: {
      title: input.title,
      description: input.description,
      url: input.path,
      siteName: "Akazi",
      type: "website",
    },
  };
}
