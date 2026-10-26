"use client";

import { useEffect, useState } from "react";
import { EyeIcon } from "@/components/icons";
import { latestViewers } from "@/components/viewer-bus";

export function ViewerCount({ initial, publicId }: { initial: number; publicId: string }) {
  const path = `/jobs/${publicId}`;
  const [count, setCount] = useState(initial);

  useEffect(() => {
    const saved = latestViewers(path);
    if (typeof saved === "number") setCount(saved);
    const onCount = (event: Event) => {
      const detail = (event as CustomEvent<{ path?: string; viewers?: number }>).detail;
      if (detail?.path === path && typeof detail.viewers === "number") setCount(detail.viewers);
    };
    window.addEventListener("akazi-viewers", onCount);
    return () => window.removeEventListener("akazi-viewers", onCount);
  }, [path]);

  return (
    <span
      className="inline-flex items-center gap-1 rounded-md bg-chip px-2.5 py-1 font-semibold text-forest"
      aria-label={`${count} ${count === 1 ? "person" : "people"} viewed this role`}
    >
      <EyeIcon />
      <span className="text-ink">{count}</span>
    </span>
  );
}
