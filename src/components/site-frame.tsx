"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
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
      {header}
      <div className="flex-1">{children}</div>
      {footer}
      <ChatWidget />
      <VisitBeacon />
    </>
  );
}
