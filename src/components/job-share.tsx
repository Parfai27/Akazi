"use client";

import { useEffect, useState } from "react";
import { FacebookIcon, WhatsAppIcon } from "@/components/icons";

export function JobShare({ title, company }: { title: string; company: string }) {
  const [pageUrl, setPageUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setPageUrl(window.location.href);
  }, []);

  const message = `${title} at ${company}`;
  const whatsapp = pageUrl ? `https://wa.me/?text=${encodeURIComponent(`${message}\n${pageUrl}`)}` : undefined;
  const facebook = pageUrl ? `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}` : undefined;

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
        <a
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#25D366] px-3 text-sm font-semibold text-white hover:brightness-95"
        >
          <WhatsAppIcon />
          WhatsApp
        </a>
        <a
          href={facebook}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#1877F2] px-3 text-sm font-semibold text-white hover:brightness-95"
        >
          <FacebookIcon />
          Facebook
        </a>
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
