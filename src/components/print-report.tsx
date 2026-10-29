"use client";

export function PrintReport() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex h-11 items-center rounded-lg bg-forest px-4 text-sm font-semibold text-card hover:bg-forest-deep print:hidden"
    >
      Print
    </button>
  );
}
