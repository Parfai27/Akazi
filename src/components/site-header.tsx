"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { BellIcon, CloseIcon, MenuIcon, SearchIcon } from "@/components/icons";
import { Logo } from "@/components/logo";

const NAV = [
  { href: "/", label: "Openings", match: (path: string) => path === "/" || path.startsWith("/jobs") },
  { href: "/about", label: "About", match: (path: string) => path === "/about" },
] as const;

export function SiteHeader() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const query = params.get("q") ?? "";
  const [value, setValue] = useState(query);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const focused = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!focused.current) setValue(query);
  }, [query]);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        menuButton.current?.focus();
      }
    }
    function onPointer(event: PointerEvent) {
      if (!headerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

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
    setOpen(false);
  }

  function closeMenu() {
    setOpen(false);
  }

  return (
    <header
      ref={headerRef}
      className={`sticky top-0 z-30 border-b border-line/80 bg-card/85 backdrop-blur-md ${
        scrolled ? "shadow-[0_8px_24px_rgba(23,26,33,0.06)]" : ""
      }`}
    >
      <div className="mx-auto flex h-[4.5rem] w-full max-w-6xl items-center gap-2 px-4 sm:gap-3 sm:px-6">
        <Link
          href="/"
          aria-label="Akazi"
          className="shrink-0 rounded-lg text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
        >
          <Logo />
        </Link>
        <nav className="ml-2 hidden items-center gap-1 md:flex" aria-label="Primary">
          {NAV.map((item) => (
            <NavLink key={item.href} href={item.href} active={item.match(pathname)}>
              {item.label}
            </NavLink>
          ))}
        </nav>
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
        <Link
          href="/alerts"
          aria-current={pathname === "/alerts" ? "page" : undefined}
          className={`ml-auto inline-flex h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest sm:px-4 ${
            pathname === "/alerts"
              ? "bg-forest-deep text-card"
              : "bg-forest text-card hover:bg-forest-deep"
          }`}
        >
          <BellIcon />
          Alerts
        </Link>
        <button
          ref={menuButton}
          type="button"
          className="inline-flex size-11 items-center justify-center rounded-lg border border-line text-ink hover:border-forest hover:text-forest focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest md:hidden"
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => setOpen((current) => !current)}
        >
          {open ? <CloseIcon /> : <MenuIcon />}
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
        </button>
      </div>
      {open ? (
        <div id={menuId} className="absolute inset-x-0 top-full z-30 border-b border-line bg-card shadow-[0_16px_32px_rgba(23,26,33,0.08)] md:hidden">
          <div className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-4">
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
            <nav className="grid gap-1" aria-label="Primary">
              {NAV.map((item) => (
                <NavLink key={item.href} href={item.href} active={item.match(pathname)} onClick={closeMenu} block>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      ) : null}
    </header>
  );
}

function NavLink({
  href,
  active,
  onClick,
  block,
  children,
}: {
  href: string;
  active: boolean;
  onClick?: () => void;
  block?: boolean;
  children: string;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      onClick={onClick}
      className={`inline-flex items-center rounded-lg text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest ${
        block ? "h-11 px-3" : "h-10 px-3"
      } ${active ? "bg-chip text-forest" : "text-ink hover:bg-wash hover:text-forest"}`}
    >
      {children}
    </Link>
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
    <form action="/" method="get" autoComplete="off" onSubmit={onSubmit} className={className} role="search">
      <label className="relative min-w-0 flex-1">
        <span className="sr-only">Search openings</span>
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
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
          className="h-11 w-full rounded-full bg-wash pr-12 pl-10 text-base text-ink outline-none focus-visible:ring-2 focus-visible:ring-forest"
        />
        <button
          type="submit"
          aria-label="Search"
          className="absolute top-1/2 right-1 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-forest text-card hover:bg-forest-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
        >
          <SearchIcon className="size-4 text-card" />
        </button>
      </label>
    </form>
  );
}
