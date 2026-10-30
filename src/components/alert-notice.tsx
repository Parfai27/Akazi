"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BellIcon } from "@/components/icons";

const SEEN = "akazi-alert-note";
const ENTRY = "akazi-alert-entry";

function visitKey(path: string, params: URLSearchParams) {
  return [path, params.get("shelf") ?? "", params.get("fn") ?? "", params.get("company") ?? ""].join("|");
}

export function AlertNotice() {
  const path = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const here = visitKey(path, params);

  useEffect(() => {
    if (path.startsWith("/alerts")) {
      queueMicrotask(() => setOpen(false));
      return;
    }
    if (window.localStorage.getItem(SEEN)) return;
    const entry = window.sessionStorage.getItem(ENTRY);
    if (!entry) {
      window.sessionStorage.setItem(ENTRY, here);
      return;
    }
    if (entry === here) return;
    window.localStorage.setItem(SEEN, "1");
    queueMicrotask(() => setOpen(true));
  }, [here, path]);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="alert-notice-title"
      className="akazi-alert-pop fixed top-[8.75rem] right-3 z-50 w-56 md:top-[5.25rem] md:right-8 md:w-72"
    >
      <div className="relative rounded-[1.4rem] bg-forest px-4 pt-3 pb-3.5 text-card shadow-[0_16px_32px_rgba(30,107,88,0.35)]">
        <span aria-hidden="true" className="absolute -top-1.5 right-8 size-3.5 rotate-45 rounded-sm bg-forest md:right-10" />
        <button
          ref={closeRef}
          type="button"
          aria-label="Close"
          onClick={() => setOpen(false)}
          className="absolute top-1.5 right-1.5 inline-flex size-8 items-center justify-center rounded-full text-lg leading-none text-card/80 hover:bg-card/15 hover:text-card"
        >
          ×
        </button>
        <p id="alert-notice-title" className="pr-6 text-sm leading-6">
          <span className="akazi-alert-bell mr-1 inline-block align-middle">
            <BellIcon />
          </span>
          The bell is for email alerts. Add what you studied, and a CV if you want. We’ll email you when a new opening
          matches.
        </p>
        <Link
          href="/alerts"
          onClick={() => setOpen(false)}
          className="mt-2 inline-flex font-extrabold underline decoration-2 underline-offset-4 hover:text-amber"
        >
          Set up alerts
        </Link>
      </div>
    </div>
  );
}
