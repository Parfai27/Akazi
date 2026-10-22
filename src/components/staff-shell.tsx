"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { logout } from "@/app/admin/actions";
import { Logo } from "@/components/logo";

const NAV = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/openings", label: "Openings" },
  { href: "/admin/alerts", label: "Alerts" },
  { href: "/admin/mail", label: "Mail" },
  { href: "/admin/sources", label: "Sources" },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const path = usePathname();
  return (
    <nav className="grid gap-1" aria-label="Staff">
      {NAV.map((item) => {
        const active = item.exact ? path === item.href : path.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`rounded-lg px-3 py-2.5 text-sm font-semibold ${active ? "bg-forest text-card" : "text-card/80 hover:bg-card/10 hover:text-card"}`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function StaffShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-wash lg:pl-64">
      <aside className={`${open ? "flex" : "hidden"} fixed inset-y-0 left-0 z-40 w-64 flex-col bg-ink px-4 py-6 text-card lg:flex`}>
        <Link href="/admin" className="px-2 text-card" onClick={() => setOpen(false)}>
          <Logo compact />
        </Link>
        <p className="mt-1 px-2 text-xs font-semibold tracking-wide text-card/50 uppercase">Staff</p>
        <div className="mt-6">
          <NavLinks onNavigate={() => setOpen(false)} />
        </div>
        <form action={logout} className="mt-auto">
          <button type="submit" className="h-11 w-full rounded-lg border border-card/20 text-sm font-semibold text-card hover:bg-card/10">
            Log out
          </button>
        </form>
      </aside>
      {open ? (
        <button type="button" aria-label="Close menu" className="fixed inset-0 z-30 bg-ink/40 lg:hidden" onClick={() => setOpen(false)} />
      ) : null}
      <div className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-line bg-card px-4 lg:hidden">
        <button
          type="button"
          aria-label="Open menu"
          className="inline-flex h-10 items-center rounded-lg border border-line px-3 text-sm font-semibold"
          onClick={() => setOpen(true)}
        >
          Menu
        </button>
        <span className="font-extrabold">Staff</span>
      </div>
      <div className="px-4 py-6 sm:px-6 lg:px-8">{children}</div>
    </div>
  );
}
