import Link from "next/link";
import { LegalLayout } from "@/components/company-page";
import { CONTACT_EMAIL, pageMeta } from "@/lib/site";

export const metadata = pageMeta({
  title: "Terms of use",
  description: "The terms for using Akazi, the Rwanda job board that lists public openings and sends you to the employer to apply.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <LegalLayout
      eyebrow="Terms"
      title="Terms of use."
      lede="These terms cover the public Akazi website. If you keep using the site, you are agreeing to them."
      sections={[
        {
          id: "the-service",
          title: "The service",
          body: (
            <p>
              Akazi lists job openings it finds on public career pages and shows them to people looking for work in
              Rwanda or for remote work they can do from Rwanda. Browsing the site is free. Akazi does not employ you,
              represent the employer, or submit an application on your behalf.
            </p>
          ),
        },
        {
          id: "listings",
          title: "Listings",
          body: (
            <>
              <p>
                Each advert belongs to the employer who published it. The summary and apply notes on a job page are
                Akazi&apos;s. The longer advertisement is reproduced so you can read it without leaving the site, and it
                may be incomplete or out of date. A deadline, a location, or a requirement on Akazi can differ from the
                original. Check the employer&apos;s page before you apply. When a deadline has passed, or the source no
                longer shows the role, Akazi may remove it without notice.
              </p>
              <p>
                Do not copy the whole board to build another site, and do not hammer the server with automated requests.
                Linking to a single job page is fine.
              </p>
            </>
          ),
        },
        {
          id: "applying",
          title: "Applying",
          body: (
            <p>
              The Apply button leaves Akazi. Whatever you send after that is between you and the employer, under their
              process. Never pay a fee to Akazi or to a stranger who claims they can place you. Akazi will not ask you
              to send mobile money to be considered for a job.
            </p>
          ),
        },
        {
          id: "email-alerts",
          title: "Email alerts",
          body: (
            <p>
              If you join alerts, you agree that Akazi may store the name, email, studies, and CV text you submit, and
              may email you when a new opening looks like a match. You can ask for that to stop by writing to the
              address below from the same email. Matching is automatic and can be wrong. An alert is not an offer.
            </p>
          ),
        },
        {
          id: "advertising",
          title: "Advertising and accounts",
          body: (
            <p>
              Some pages show ads from Google. Those ads are not job offers from Akazi, and a click is not an
              application. The staff area is private. Do not try to sign in unless you operate the site.
            </p>
          ),
        },
        {
          id: "liability",
          title: "Liability",
          body: (
            <p>
              The site is provided as it is. Akazi does not guarantee that a listing is accurate, lawful, or still
              open, or that the site will be available every hour. To the extent the law of Rwanda allows, Akazi is not
              liable for a decision you or an employer make after reading a page here, or for a loss caused by a
              listing that was wrong or late. Nothing on the site is legal, tax, or immigration advice.
            </p>
          ),
        },
        {
          id: "changes",
          title: "Changes and contact",
          body: (
            <p>
              These terms can be updated by editing this page. The version you see here is the current one. Questions
              go to{" "}
              <a className="font-semibold text-forest underline-offset-4 hover:underline" href={`mailto:${CONTACT_EMAIL}`}>
                {CONTACT_EMAIL}
              </a>
              . The{" "}
              <Link className="font-semibold text-forest underline-offset-4 hover:underline" href="/privacy">
                privacy page
              </Link>{" "}
              explains the data the site stores.
            </p>
          ),
        },
      ]}
    />
  );
}
