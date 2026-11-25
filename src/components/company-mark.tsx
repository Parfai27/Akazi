"use client";

import { useState } from "react";
import { companyLogo, employerIcon } from "@/lib/company-logos";

export function CompanyMark({
  name,
  website,
  size = "md",
}: {
  name: string;
  website?: string;
  size?: "sm" | "md" | "lg";
}) {
  const logo = companyLogo(name) ?? employerIcon(website);
  const [failedSrc, setFailedSrc] = useState("");
  const failed = Boolean(logo && failedSrc === logo.src);
  const box = size === "lg" ? "size-14 rounded-2xl" : size === "sm" ? "size-7 rounded-lg text-xs" : "size-12 rounded-xl";
  const letter = name.trim().charAt(0).toUpperCase() || "A";

  if (!logo || failed) {
    return (
      <span className={`inline-flex shrink-0 items-center justify-center bg-forest font-bold text-card ${size === "sm" ? "" : "text-lg"} ${box}`}>
        {letter}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden border border-line ${
        logo.bg ? "" : logo.cover ? "bg-[#0b2f6b]" : size === "sm" ? "bg-white p-0.5" : "bg-white p-1.5"
      } ${box}`}
      style={logo.bg ? { backgroundColor: logo.bg } : undefined}
    >
      <img
        src={logo.src}
        alt=""
        width={56}
        height={56}
        loading="lazy"
        decoding="async"
        className={`size-full ${logo.cover ? "object-cover" : "object-contain"}`}
        onLoad={(event) => {
          if (event.currentTarget.naturalWidth === 0) setFailedSrc(logo.src);
        }}
        onError={() => setFailedSrc(logo.src)}
      />
    </span>
  );
}
