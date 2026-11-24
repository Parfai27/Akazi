"use client";

import { PrinterIcon } from "@/components/icons";
import { SaveJobButton } from "@/components/saved-jobs";
import type { StoredJob } from "@/lib/saved-jobs";

export function JobActions({ job }: { job: StoredJob }) {
  return (
    <div className="mt-3 grid grid-cols-2 gap-2 print:hidden">
      <SaveJobButton job={job} />
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-line px-3 text-sm font-semibold text-ink hover:border-forest hover:text-forest"
      >
        <PrinterIcon />
        Print
      </button>
    </div>
  );
}
