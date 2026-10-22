"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

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
      sessionStorage.setItem(key, "1");
    } catch {
      /* private mode can block storage; the count still goes through */
    }
    void fetch("/api/visit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ path: pathname }),
      keepalive: true,
    }).catch(() => {
      try {
        sessionStorage.removeItem(key);
      } catch {
        /* ignore */
      }
    });
  }, [pathname]);

  return null;
}
