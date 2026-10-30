import Link from "next/link";
import { AlertForm } from "@/components/alert-form";
import { ArrowLeftIcon, BellIcon } from "@/components/icons";
import { pageMeta } from "@/lib/site";

export const metadata = pageMeta({
  title: "Email alerts",
  description: "Get an email when a Rwanda job opening matches your studies or CV.",
  path: "/alerts",
});

export default function AlertsPage() {
  return (
    <main>
      <div className="border-b border-line bg-wash">
        <div className="mx-auto w-full max-w-xl px-4 py-10 sm:px-6 sm:py-14">
          <p className="flex items-center gap-2 text-sm font-medium text-forest">
            <Link href="/" className="inline-flex items-center gap-1 hover:underline">
              <ArrowLeftIcon />
              Home
            </Link>
            <span aria-hidden="true">→</span>
            <span className="inline-flex items-center gap-1 text-ink">
              <BellIcon />
              Alerts
            </span>
          </p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-forest sm:text-5xl">Email alerts</h1>
          <p className="mt-4 text-base leading-7 text-muted">
            Tell us what you studied and share your CV. If you agree, we email you when a new opening matches.
          </p>
        </div>
      </div>
      <div className="mx-auto w-full max-w-xl px-4 py-8 sm:px-6">
        <div className="rounded-2xl border border-line bg-card p-5 shadow-[0_8px_24px_rgba(30,107,88,0.06)] sm:p-6">
          <AlertForm />
        </div>
      </div>
    </main>
  );
}
