"use client";

import { useState } from "react";
import { InstagramIcon, WhatsAppIcon } from "@/components/icons";

export function JobShare({ title, company }: { title: string; company: string }) {
  const [copied, setCopied] = useState(false);
  const [instagramCopied, setInstagramCopied] = useState(false);

  const message = `${title} at ${company}`;

  function shareWhatsApp() {
    const text = `${message}\n${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  }

  async function shareInstagram() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: message, text: message, url });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    await navigator.clipboard.writeText(url);
    setInstagramCopied(true);
    window.setTimeout(() => setInstagramCopied(false), 2000);
    window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
  }

  async function copyLink() {
    const url = window.location.href;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mt-5 border-t border-line pt-4">
      <h3 className="text-sm font-extrabold">Share</h3>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={shareWhatsApp}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#25D366] px-3 text-sm font-semibold text-white hover:brightness-95"
        >
          <WhatsAppIcon />
          WhatsApp
        </button>
        <button
          type="button"
          onClick={shareInstagram}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[linear-gradient(45deg,#f9ce34,#ee2a7b_55%,#6228d7)] px-3 text-sm font-semibold text-white hover:brightness-95"
        >
          <InstagramIcon />
          {instagramCopied ? "Link copied" : "Instagram"}
        </button>
      </div>
      <button
        type="button"
        onClick={copyLink}
        className="mt-2 inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-line px-3 text-sm font-semibold text-ink hover:border-forest hover:text-forest"
      >
        {copied ? "Link copied" : "Copy link"}
      </button>
    </div>
  );
}
