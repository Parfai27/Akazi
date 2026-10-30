import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";
import { InstagramIcon, WhatsAppIcon } from "@/components/icons";
import { Logo } from "@/components/logo";
import { SiteFrame } from "@/components/site-frame";
import { SiteHeader } from "@/components/site-header";
import { adConfig } from "@/lib/ads";
import {
  CANONICAL_ORIGIN,
  CONTACT_EMAIL,
  INSTAGRAM_URL,
  SITE_DESCRIPTION,
  WHATSAPP_CHANNEL_URL,
  WHATSAPP_GROUP_URL,
} from "@/lib/site";
import "./globals.css";

const FOOTER_LINK = "text-sm font-semibold text-card/90 underline-offset-4 hover:text-card hover:underline";

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <nav aria-label={title}>
      <h2 className="text-xs font-semibold tracking-[0.14em] text-card/45 uppercase">{title}</h2>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className={FOOTER_LINK}>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

const outfit = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  metadataBase: new URL(CANONICAL_ORIGIN),
  title: {
    default: "Akazi — jobs in Rwanda",
    template: "%s · Akazi",
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    siteName: "Akazi",
    type: "website",
    url: "/",
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const ads = adConfig();
  return (
    <html lang="en" className={`${outfit.variable} h-full antialiased`}>
      {ads ? (
        <head>
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ads.client}`}
            crossOrigin="anonymous"
          />
        </head>
      ) : null}
      <body className="flex min-h-full flex-col text-ink">
        <Suspense fallback={<div className="h-[8.25rem] border-b border-line bg-card md:h-[4.5rem]" />}>
          <SiteFrame
            header={
              <Suspense fallback={<div className="h-[8.25rem] border-b border-line bg-card md:h-[4.5rem]" />}>
                <SiteHeader />
              </Suspense>
            }
            footer={
              <footer className="mt-auto bg-ink text-card">
                <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 pt-10 pb-8 sm:px-6 lg:grid-cols-[max-content_minmax(0,1fr)] lg:items-start lg:gap-16 lg:pt-12">
                  <div>
                    <Logo compact />
                    <p className="mt-3 max-w-xs text-sm leading-6 text-card/75">
                      Our vision is a Rwanda where everyone can reach the work that fits them.
                    </p>
                    <a className="mt-3 inline-block text-sm font-semibold text-card underline-offset-4 hover:underline" href={`mailto:${CONTACT_EMAIL}`}>
                      {CONTACT_EMAIL}
                    </a>
                    <div className="mt-4 flex w-max max-w-full flex-wrap gap-2">
                      <a
                        href={INSTAGRAM_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-10 items-center gap-2 rounded-full border border-card/20 px-3 text-sm font-semibold text-card hover:bg-card/10"
                      >
                        <InstagramIcon />
                        Instagram
                      </a>
                      <a
                        href={WHATSAPP_CHANNEL_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-10 items-center gap-2 rounded-full border border-card/20 px-3 text-sm font-semibold text-card hover:bg-card/10"
                      >
                        <WhatsAppIcon />
                        Channel
                      </a>
                      <a
                        href={WHATSAPP_GROUP_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-10 items-center gap-2 rounded-full border border-card/20 px-3 text-sm font-semibold text-card hover:bg-card/10"
                      >
                        <WhatsAppIcon />
                        Group
                      </a>
                    </div>
                  </div>
                  <div className="grid min-w-0 grid-cols-2 gap-x-8 gap-y-8 sm:grid-cols-3 sm:gap-x-10">
                    <FooterColumn
                      title="Jobs"
                      links={[
                        { href: "/", label: "Openings" },
                        { href: "/?shelf=kigali", label: "Kigali" },
                        { href: "/?shelf=country", label: "Elsewhere" },
                        { href: "/?shelf=remote", label: "Remote" },
                        { href: "/alerts", label: "Alerts" },
                      ]}
                    />
                    <FooterColumn
                      title="Resources"
                      links={[
                        { href: "/guides", label: "Guides" },
                        { href: "/guides/writing-a-cv-for-rwanda", label: "Writing a CV" },
                        { href: "/guides/preparing-for-interviews", label: "Interviews" },
                        { href: "/guides/remote-work-from-rwanda", label: "Remote work" },
                      ]}
                    />
                    <FooterColumn
                      title="Company"
                      links={[
                        { href: "/about", label: "About" },
                        { href: "/contact", label: "Contact" },
                        { href: "/privacy", label: "Privacy" },
                        { href: "/terms", label: "Terms" },
                      ]}
                    />
                  </div>
                </div>
                <p className="mx-auto w-full max-w-6xl border-t border-card/15 px-4 pt-4 pb-20 text-xs text-card/60 sm:px-6 sm:pb-6 lg:pr-44">
                  © 2026 Akazi
                </p>
              </footer>
            }
          >
            {children}
          </SiteFrame>
        </Suspense>
      </body>
    </html>
  );
}
