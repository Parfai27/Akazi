import Link from "next/link";
import { ArrowLeftIcon } from "@/components/icons";

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">That role is not here</h1>
      <p className="mt-3 text-muted">This role is no longer listed.</p>
      <Link
        href="/"
        className="mt-6 inline-flex min-h-11 items-center gap-1 rounded-full border border-line bg-card px-3 text-sm font-medium hover:border-forest hover:text-forest"
      >
        <ArrowLeftIcon />
        Back to openings
      </Link>
    </main>
  );
}
