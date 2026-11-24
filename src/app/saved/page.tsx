import Link from "next/link";
import { ArrowLeftIcon, StarIcon } from "@/components/icons";
import { RecentJobsList, SavedJobsList } from "@/components/saved-jobs";
import { pageMeta } from "@/lib/site";

export const metadata = {
  ...pageMeta({
    title: "Saved jobs",
    description: "Roles you saved and opened on Akazi, kept on this device.",
    path: "/saved",
  }),
  robots: { index: false, follow: true },
};

export default function SavedPage() {
  return (
    <main>
      <div className="border-b border-line bg-wash">
        <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
          <p className="flex items-center gap-2 text-sm font-medium text-forest">
            <Link href="/" className="inline-flex items-center gap-1 hover:underline">
              <ArrowLeftIcon />
              Home
            </Link>
            <span aria-hidden="true">→</span>
            <span className="inline-flex items-center gap-1 text-ink">
              <StarIcon className="size-4 shrink-0" />
              Saved
            </span>
          </p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-forest sm:text-5xl">Saved jobs</h1>
          <p className="mt-4 text-base leading-7 text-muted">
            Saved and recently viewed roles stay on this device only. Clearing your browser data removes them.
          </p>
        </div>
      </div>
      <div className="mx-auto grid w-full max-w-3xl gap-10 px-4 py-8 sm:px-6">
        <section aria-labelledby="saved-title">
          <h2 id="saved-title" className="mb-4 text-2xl font-extrabold tracking-tight">
            Saved
          </h2>
          <SavedJobsList />
        </section>
        <section aria-labelledby="recent-title">
          <h2 id="recent-title" className="mb-4 text-2xl font-extrabold tracking-tight">
            Recently viewed
          </h2>
          <RecentJobsList />
        </section>
      </div>
    </main>
  );
}
