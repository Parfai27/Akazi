"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { removeSubscriber } from "@/app/admin/actions";
import type { AlertRow } from "@/lib/staff-directory";
import { formatPosted } from "@/lib/url";

export function AlertTable({ rows }: { rows: AlertRow[] }) {
  const [query, setQuery] = useState("");
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => `${row.name}\n${row.email}\n${row.studies}`.toLowerCase().includes(q));
  }, [query, rows]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="block min-w-0 flex-1 sm:max-w-md">
          <span className="sr-only">Search signups</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name, email, or studies"
            className="h-11 w-full rounded-lg border border-line bg-card px-4 text-base outline-none focus:border-forest"
          />
        </label>
        <a href="/admin/export?kind=alerts" className="inline-flex h-11 items-center rounded-lg border border-line bg-card px-4 text-sm font-semibold hover:border-forest hover:text-forest">
          Download CSV
        </a>
      </div>
      <p className="mt-3 text-sm text-muted">
        {shown.length} {shown.length === 1 ? "signup" : "signups"}
        {query.trim() ? " match" : ""}
      </p>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-card">
        <table className="w-full min-w-[44rem] text-left text-sm">
          <thead className="border-b border-line text-xs font-semibold tracking-wide text-muted uppercase">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Studies</th>
              <th className="px-4 py-3">CV</th>
              <th className="px-4 py-3">Signed up</th>
              <th className="px-4 py-3">
                <span className="sr-only">Remove</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-muted">
                  No signups match that search.
                </td>
              </tr>
            ) : (
              shown.map((row) => (
                <tr key={row.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-semibold">{row.name}</td>
                  <td className="px-4 py-3">
                    <a className="text-forest underline-offset-4 hover:underline" href={`mailto:${row.email}`}>
                      {row.email}
                    </a>
                  </td>
                  <td className="max-w-xs px-4 py-3 text-muted">{row.studies || "Not given"}</td>
                  <td className="px-4 py-3">
                    {row.hasCv ? (
                      <span className="flex flex-wrap gap-x-3 gap-y-1">
                        <Link href={`/admin/alerts/${row.id}`} className="font-semibold text-forest underline-offset-4 hover:underline">
                          View
                        </Link>
                        <a
                          href={`/admin/alerts/${row.id}/cv`}
                          className="font-semibold text-forest underline-offset-4 hover:underline"
                        >
                          Download
                        </a>
                      </span>
                    ) : (
                      "No"
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted">{formatPosted(row.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <form action={removeSubscriber}>
                      <input type="hidden" name="id" value={row.id} />
                      <button type="submit" className="text-sm font-semibold text-clay-deep underline-offset-4 hover:underline">
                        Remove
                      </button>
                    </form>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
