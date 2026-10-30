import type { Metadata } from "next";

export const CANONICAL_HOST = "akazi.co.rw";
export const CANONICAL_ORIGIN = `https://${CANONICAL_HOST}`;
export const CONTACT_EMAIL = "akazihelp@gmail.com";
export const INSTAGRAM_URL = "https://www.instagram.com/akazi.co.rw";
export const WHATSAPP_CHANNEL_URL = "https://whatsapp.com/channel/0029Vb9t2xE0gcfH3qfJ1J1l";
export const WHATSAPP_GROUP_URL = "https://chat.whatsapp.com/BMueuqlvheH7QtE63Bjo74";
export const LEGAL_UPDATED_ISO = "2026-10-30";
export const LEGAL_UPDATED_LABEL = "30 October 2026";

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
