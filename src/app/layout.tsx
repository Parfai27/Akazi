import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";
import { ChatWidget } from "@/components/chat-widget";
import { InstagramIcon, WhatsAppIcon } from "@/components/icons";
import { Logo } from "@/components/logo";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const outfit = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    (process.env.SITE_URL || process.env.RENDER_EXTERNAL_URL || "http://localhost:3000").replace(/\/$/, ""),
  ),
  title: {
    default: "Akazi — jobs in Rwanda",
    template: "%s · Akazi",
  },
  description:
    "Remote and on-site job openings in Rwanda, collected from public company career pages.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${outfit.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col text-ink">
        <Suspense fallback={<div className="h-[8.25rem] border-b border-line bg-card md:h-[4.5rem]" />}>
          <SiteHeader />
        </Suspense>
        <div className="flex-1">{children}</div>
        <footer className="mt-auto bg-ink text-card">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:flex-row sm:items-start sm:justify-between sm:px-6">
            <div className="max-w-sm">
              <Logo compact />
              <p className="mt-3 text-sm leading-6 text-card/75">
                Listings are gathered from public career pages. Akazi does not take applications — you apply on the
                employer’s site.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href="https://www.instagram.com/akazi.co.rw"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-card/20 px-3 text-sm font-semibold text-card hover:bg-card/10"
                >
                  <InstagramIcon />
                  Instagram
                </a>
                <a
                  href="https://whatsapp.com/channel/0029Vb9t2xE0gcfH3qfJ1J1l"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-card/20 px-3 text-sm font-semibold text-card hover:bg-card/10"
                >
                  <WhatsAppIcon />
                  Channel
                </a>
                <a
                  href="https://chat.whatsapp.com/BMueuqlvheH7QtE63Bjo74"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-card/20 px-3 text-sm font-semibold text-card hover:bg-card/10"
                >
                  <WhatsAppIcon />
                  Group
                </a>
              </div>
            </div>
            <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold" aria-label="Footer">
              <Link href="/" className="hover:text-card/70">
                Openings
              </Link>
              <Link href="/?shelf=kigali" className="hover:text-card/70">
                Kigali
              </Link>
              <Link href="/?shelf=country" className="hover:text-card/70">
                Elsewhere
              </Link>
              <Link href="/?shelf=remote" className="hover:text-card/70">
                Remote
              </Link>
              <Link href="/alerts" className="hover:text-card/70">
                Alerts
              </Link>
            </nav>
          </div>
          <p className="mx-auto w-full max-w-6xl border-t border-card/15 px-4 py-4 text-xs text-card/60 sm:px-6">
            © 2026 Akazi
          </p>
        </footer>
        <ChatWidget />
      </body>
    </html>
  );
}
