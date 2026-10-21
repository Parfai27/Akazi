"use client";

import { useState } from "react";
import { companyLogo } from "@/lib/company-logos";

export function CompanyMark({ name, size = "md" }: { name: string; size?: "md" | "lg" }) {
  const logo = companyLogo(name);
  const [failed, setFailed] = useState(false);
  const box = size === "lg" ? "size-14 rounded-2xl" : "size-12 rounded-xl";
  const letter = name.trim().charAt(0).toUpperCase() || "A";

  if (!logo || failed) {
    return (
      <span className={`inline-flex shrink-0 items-center justify-center bg-forest text-lg font-bold text-card ${box}`}>
        {letter}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden border border-line ${
        logo.cover ? "bg-[#0b2f6b]" : "bg-white p-1.5"
      } ${box}`}
    >
      <img
        src={logo.src}
        alt=""
        className={`size-full ${logo.cover ? "object-cover" : "object-contain"}`}
        onError={() => setFailed(true)}
      />
    </span>
  );
}
