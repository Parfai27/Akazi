import { LegalLayout } from "@/components/company-page";
import { CONTACT_EMAIL, pageMeta } from "@/lib/site";

export const metadata = pageMeta({
  title: "Privacy",
  description: "What Akazi stores, and how advertising works on the site.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <LegalLayout
      eyebrow="Privacy"
      title="What Akazi stores."
      lede="The site keeps only what it needs to run email alerts, count visits, and show ads. It does not sell that information."
      sections={[
        {
          id: "email-alerts",
          title: "Email alerts",
          body: (
            <p>
              The email alert form stores your name, email, studies, and CV text only if you agree, and only to compare
              them with new openings. Staff can see those signups. They are not sold.
            </p>
          ),
        },
        {
          id: "visits",
          title: "Visits and job views",
          body: (
            <p>
              A random cookie counts visits for the staff dashboard. It is not your name or email. Opening a job adds
              to the number of people who viewed that role. That number is not your name.
            </p>
          ),
        },
        {
          id: "your-data",
          title: "Asking about your data",
          body: (
            <p>
              To ask about this data, or to stop email alerts, write to{" "}
              <a className="font-semibold text-forest underline-offset-4 hover:underline" href={`mailto:${CONTACT_EMAIL}`}>
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          ),
        },
        {
          id: "advertising",
          title: "Advertising",
          body: (
            <p>
              Some pages show advertisements from Google. Google may use a cookie to choose and measure those ads. You
              can read how Google uses data at{" "}
              <a
                className="font-semibold text-forest underline-offset-4 hover:underline"
                href="https://policies.google.com/technologies/ads"
                target="_blank"
                rel="noopener noreferrer"
              >
                policies.google.com/technologies/ads
              </a>
              .
            </p>
          ),
        },
      ]}
    />
  );
}
