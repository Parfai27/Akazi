"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { BellIcon, SearchIcon } from "@/components/icons";
import { Logo } from "@/components/logo";

export function SiteHeader() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const query = params.get("q") ?? "";
  const [value, setValue] = useState(query);
  const focused = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!focused.current) setValue(query);
  }, [query]);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function hrefFor(next: string) {
    const q = next.trim();
    const search = new URLSearchParams(pathname === "/" ? params.toString() : "");
    if (q) search.set("q", q);
    else search.delete("q");
    const built = search.toString();
    return built ? `/?${built}` : "/";
  }

  function publish(next: string) {
    const href = hrefFor(next);
    const current = pathname + (params.size ? `?${params.toString()}` : "");
    if (href === current) return;
    router.replace(href, { scroll: pathname !== "/" });
  }

  function onChange(next: string) {
    setValue(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => publish(next), 180);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (timer.current) clearTimeout(timer.current);
    publish(value);
  }

  return (
    <header className="sticky top-0 z-30 bg-card">
      <div className="flex h-[4.5rem] w-full items-center gap-3 px-4 sm:gap-4 sm:px-8">
        <Link href="/" aria-label="Akazi" className="shrink-0 text-ink">
          <Logo />
        </Link>
        <HeaderSearch
          value={value}
          onChange={onChange}
          onSubmit={onSubmit}
          onFocus={() => {
            focused.current = true;
          }}
          onBlur={() => {
            focused.current = false;
          }}
          className="mx-2 hidden min-w-0 flex-1 md:flex"
        />
        <nav className="ml-auto flex shrink-0 items-center gap-2">
          <Link
            href="/alerts"
            aria-label="Email alerts"
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-line px-3 text-sm font-semibold text-ink hover:border-forest hover:text-forest"
          >
            <BellIcon />
            <span className="hidden sm:inline">Alerts</span>
          </Link>
        </nav>
      </div>
      <div className="px-4 pb-3 sm:px-8 md:hidden">
        <HeaderSearch
          value={value}
          onChange={onChange}
          onSubmit={onSubmit}
          onFocus={() => {
            focused.current = true;
          }}
          onBlur={() => {
            focused.current = false;
          }}
          className="flex"
        />
      </div>
    </header>
  );
}

function HeaderSearch({
  value,
  onChange,
  onSubmit,
  onFocus,
  onBlur,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  onFocus: () => void;
  onBlur: () => void;
  className: string;
}) {
  const [editable, setEditable] = useState(false);

  function allowTyping(input: HTMLInputElement) {
    input.readOnly = false;
    setEditable(true);
  }

  return (
    <form action="/" method="get" autoComplete="off" onSubmit={onSubmit} className={className}>
      <label className="min-w-0 flex-1">
        <span className="sr-only">Search openings</span>
        <input
          name="q"
          value={value}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          aria-autocomplete="none"
          readOnly={!editable}
          enterKeyHint="search"
          inputMode="search"
          onChange={(event) => onChange(event.target.value)}
          onPointerDown={(event) => {
            if (event.pointerType === "mouse") return;
            allowTyping(event.currentTarget);
          }}
          onTouchStart={(event) => allowTyping(event.currentTarget)}
          onFocus={(event) => {
            event.currentTarget.readOnly = false;
            setEditable(true);
            onFocus();
          }}
          onBlur={(event) => {
            event.currentTarget.readOnly = true;
            setEditable(false);
            onBlur();
          }}
          placeholder="Job title, company, or city"
          className="h-11 w-full rounded-l-lg bg-wash px-4 text-base outline-none"
        />
      </label>
      <button
        type="submit"
        className="inline-flex h-11 shrink-0 items-center gap-2 rounded-r-lg bg-forest px-4 text-sm font-semibold text-card hover:bg-forest-deep"
      >
        <SearchIcon />
        <span className="hidden sm:inline">Search</span>
      </button>
    </form>
  );
}
