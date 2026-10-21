import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";
import { ChatWidget } from "@/components/chat-widget";
import { Logo } from "@/components/logo";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const outfit = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
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
