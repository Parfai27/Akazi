"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AlertNotice } from "@/components/alert-notice";
import { ChatWidget } from "@/components/chat-widget";
import { VisitBeacon } from "@/components/visit-beacon";

export function SiteFrame({
  header,
  footer,
  children,
}: {
  header: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}) {
  const path = usePathname();
  if (path.startsWith("/admin")) return <div className="min-h-full bg-wash">{children}</div>;

  return (
    <>
      <a
        href="#content"
        className="fixed top-3 left-3 z-50 -translate-y-20 rounded-lg bg-forest px-4 py-3 text-sm font-semibold text-card focus-visible:translate-y-0"
      >
        Skip to content
      </a>
      {header}
      <div id="content" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </div>
      {footer}
      <AlertNotice />
      <ChatWidget />
      <VisitBeacon />
    </>
  );
}
