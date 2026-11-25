import { PageHero } from "@/components/page-hero";
import { StarIcon } from "@/components/icons";
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
    <main className="akazi-terrain pb-16">
      <PageHero
        crumbs={[{ label: "Saved", icon: <StarIcon className="size-4 shrink-0" /> }]}
        photo={{ src: "/people/hero-2.jpg", position: "center 8%" }}
        title="Saved jobs"
        lede="Saved and recently viewed roles stay on this device only. Clearing your browser data removes them."
        compact
      />
      <div className="relative mx-auto grid w-full max-w-3xl gap-10 px-4 pt-10 sm:px-6">
        <section aria-labelledby="saved-title">
          <h2 id="saved-title" className="akazi-wipe mb-4 text-2xl font-extrabold tracking-tight">
            Saved
          </h2>
          <SavedJobsList />
        </section>
        <section aria-labelledby="recent-title">
          <h2 id="recent-title" className="akazi-wipe mb-4 text-2xl font-extrabold tracking-tight">
            Recently viewed
          </h2>
          <RecentJobsList />
        </section>
      </div>
    </main>
  );
}
