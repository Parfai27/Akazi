"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { OpeningRow } from "@/lib/staff-directory";
import { deadlineKind } from "@/lib/organize";
import { deadlineLabel } from "@/lib/url";

const PAGE = 20;
const STATUSES = [
  { id: "all", label: "All" },
  { id: "open", label: "Open" },
  { id: "closed", label: "Closed" },
  { id: "new", label: "New" },
  { id: "soon", label: "Closing soon" },
] as const;

type Status = (typeof STATUSES)[number]["id"];

export function OpeningTable({ rows }: { rows: OpeningRow[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Status>("all");
  const [role, setRole] = useState("all");
  const [page, setPage] = useState(0);
  const roles = useMemo(() => [...new Set(rows.map((row) => row.role))].sort(), [rows]);
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (q && !`${row.title}\n${row.company}\n${row.role}`.toLowerCase().includes(q)) return false;
      if (role !== "all" && row.role !== role) return false;
      if (status === "open") return row.active;
      if (status === "closed") return !row.active;
      if (status === "new") return row.isNew;
      if (status === "soon") return row.active && deadlineKind(row.deadline) === "soon";
      return true;
    });
  }, [query, role, rows, status]);
  const pages = Math.max(1, Math.ceil(shown.length / PAGE));
  const current = Math.min(page, pages - 1);
  const slice = shown.slice(current * PAGE, current * PAGE + PAGE);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="block min-w-0 flex-1 sm:max-w-md">
          <span className="sr-only">Search roles</span>
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(0);
            }}
            placeholder="Role, employer, or type"
            className="h-11 w-full rounded-lg border border-line bg-card px-4 text-base outline-none focus:border-forest"
          />
        </label>
        <a href="/admin/export?kind=openings" className="inline-flex h-11 items-center rounded-lg border border-line bg-card px-4 text-sm font-semibold hover:border-forest hover:text-forest">
          Download CSV
        </a>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {STATUSES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setStatus(item.id);
              setPage(0);
            }}
            className={`h-9 rounded-full px-3 text-sm font-semibold ${status === item.id ? "bg-forest text-card" : "bg-card text-ink ring-1 ring-line"}`}
          >
            {item.label}
          </button>
        ))}
        <label className="sr-only" htmlFor="role-filter">
          Job type
        </label>
        <select
          id="role-filter"
          value={role}
          onChange={(event) => {
            setRole(event.target.value);
            setPage(0);
          }}
          className="h-9 rounded-full border border-line bg-card px-3 text-sm font-semibold"
        >
          <option value="all">All types</option>
          {roles.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
      <p className="mt-3 text-sm text-muted">
        {shown.length} {shown.length === 1 ? "role" : "roles"}
        {query.trim() || status !== "all" || role !== "all" ? " match" : ", most opened first"}
      </p>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-card">
        <table className="w-full min-w-[44rem] text-left text-sm">
          <thead className="border-b border-line text-xs font-semibold tracking-wide text-muted uppercase">
            <tr>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Opens</th>
              <th className="px-4 py-3">Deadline</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-muted">
                  No roles match that search.
                </td>
              </tr>
            ) : (
              slice.map((row) => (
                <tr key={row.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`/jobs/${row.id}`} className="font-semibold underline-offset-4 hover:underline">
                      {row.title}
                    </Link>
                    <p className="text-muted">{row.company}</p>
                  </td>
                  <td className="px-4 py-3">{row.role}</td>
                  <td className="px-4 py-3 font-semibold">{row.views}</td>
                  <td className="px-4 py-3 text-muted">{deadlineLabel(row.deadline)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${row.active ? "bg-chip text-forest-deep" : "bg-amber text-clay-deep"}`}>
                      {row.active ? "Open" : "Closed"}
                    </span>
                    {row.isNew ? <span className="ml-2 text-xs font-semibold text-forest">New</span> : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {pages > 1 ? (
        <div className="mt-4 flex items-center justify-between gap-3 text-sm">
          <p className="text-muted">
            Page {current + 1} of {pages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={current === 0}
              onClick={() => setPage(current - 1)}
              className="h-10 rounded-lg border border-line bg-card px-3 font-semibold disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={current >= pages - 1}
              onClick={() => setPage(current + 1)}
              className="h-10 rounded-lg border border-line bg-card px-3 font-semibold disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
