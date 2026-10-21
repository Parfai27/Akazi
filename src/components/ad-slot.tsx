"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export function AdSlot({ client, slot }: { client: string; slot: string }) {
  const placed = useRef(false);

  useEffect(() => {
    if (!client || !slot || placed.current) return;
    placed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      placed.current = false;
    }
  }, [client, slot]);

  if (!client || !slot) return null;

  return (
    <aside className="my-8" aria-label="Advertisement">
      <p className="mb-2 text-xs font-medium tracking-wide text-muted uppercase">Advertisement</p>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
