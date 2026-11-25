import { PageHero } from "@/components/page-hero";
import { Suspense } from "react";
import { AlertForm } from "@/components/alert-form";
import { BellIcon } from "@/components/icons";
import { pageMeta } from "@/lib/site";

export const metadata = pageMeta({
  title: "Email alerts",
  description: "Get an email when a Rwanda job opening matches your studies or CV.",
  path: "/alerts",
});

export default function AlertsPage() {
  return (
    <main className="akazi-terrain pb-16">
      <PageHero
        crumbs={[{ label: "Alerts", icon: <BellIcon /> }]}
        photo={{ src: "/people/hero-1.jpg", position: "center 8%" }}
        title="Email alerts"
        lede="Tell us what you studied and share your CV. If you agree, we email you when a new opening matches."
        compact
      />
      <div className="relative mx-auto -mt-12 w-full max-w-xl px-4 sm:px-6">
        <div className="akazi-reveal rounded-[1.75rem] border border-line bg-card p-5 shadow-[0_20px_50px_rgba(16,58,48,0.12)] sm:p-8">
          <Suspense fallback={null}>
            <AlertForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
