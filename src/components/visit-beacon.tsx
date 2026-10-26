"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { publishViewers } from "@/components/viewer-bus";

export function VisitBeacon() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    const day = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Africa/Kigali",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    const key = `akazi-visit:${day}:${pathname}`;
    try {
      if (sessionStorage.getItem(key)) return;
    } catch {
      /* private mode can block storage; the count still goes through */
    }
    void fetch("/api/visit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ path: pathname }),
      keepalive: true,
    })
      .then(async (response) => {
        if (!response.ok) return;
        try {
          sessionStorage.setItem(key, "1");
        } catch {
          /* ignore */
        }
        const data = (await response.json()) as { viewers?: unknown };
        if (typeof data.viewers === "number") publishViewers(pathname, data.viewers);
      })
      .catch(() => {
        /* a later visit in this tab can try again */
      });
  }, [pathname]);

  return null;
}
