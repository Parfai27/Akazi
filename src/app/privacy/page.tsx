import Link from "next/link";
import { ArrowLeftIcon } from "@/components/icons";

export const metadata = {
  title: "Privacy",
  description: "What Akazi stores, and how advertising works on the site.",
};

export default function PrivacyPage() {
  return (
    <main className="bg-wash">
      <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
        <Link href="/" className="inline-flex items-center gap-1 text-sm font-medium text-forest hover:underline">
          <ArrowLeftIcon />
          Home
        </Link>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight">Privacy</h1>
        <div className="mt-6 space-y-4 text-base leading-7 text-muted">
          <p>
            Akazi lists job openings gathered from public career pages. You apply on the employer’s site. Akazi does not
            take applications, CVs, or applicant names for those roles.
          </p>
          <p>
            The email alert form stores your name, email, studies, and CV text only if you agree, and only to compare
            them with new openings. Staff can see those signups. They are not sold.
          </p>
          <p>
            A random cookie counts visits for the staff dashboard. It is not your name or email. Opening a job counts
            that kind of role, not who opened it.
          </p>
          <p>
            Some pages show advertisements from Google. Google may use a cookie to choose and measure those ads. You can
            read how Google uses data at{" "}
            <a
              className="font-medium text-forest underline-offset-4 hover:underline"
              href="https://policies.google.com/technologies/ads"
              target="_blank"
              rel="noopener noreferrer"
            >
              policies.google.com/technologies/ads
            </a>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
