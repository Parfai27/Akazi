import Link from "next/link";
import { ApplyIcon, CompanyHero, FeatureCard, MarkIcon, PeopleIcon, SourceIcon } from "@/components/company-page";
import { getPublicStats } from "@/lib/jobs";
import { CONTACT_EMAIL, pageMeta } from "@/lib/site";

export const metadata = pageMeta({
  title: "About",
  description: "Akazi lists job openings in Rwanda from public employer career pages, for people looking for work in the country or remotely.",
  path: "/about",
});

const steps = [
  {
    title: "Public pages are read",
    text: "Akazi checks company boards, NGOs, and public institutions, including the Rwanda civil-service portal, plus employers that publish roles a person in Rwanda can take.",
  },
  {
    title: "You compare them in one place",
    text: "Narrow the list to Kigali, the rest of the country, or remote work. Each opening keeps a link back to the original posting.",
  },
  {
    title: "You apply with the employer",
    text: "Open the role, read the summary, then use Apply. That leaves Akazi and opens the employer. Akazi does not take the application.",
  },
];

export default async function AboutPage() {
  const stats = await getPublicStats();
  const figures = [
    { label: "Open roles", value: stats.openings },
    { label: "In Kigali", value: stats.kigali },
    { label: "Elsewhere in Rwanda", value: stats.country },
    { label: "Remote", value: stats.remote },
    { label: "Employers", value: stats.employers },
  ];

  return (
    <main className="bg-wash">
      <CompanyHero
        eyebrow="About"
        title="A job board for work in Rwanda."
        lede="Akazi collects openings that employers have already published, and puts them in one place. The name is the Kinyarwanda word for work."
      />

      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <section aria-labelledby="mission-title">
          <h2 id="mission-title" className="max-w-2xl text-3xl font-extrabold tracking-tight text-ink">
            One list, instead of dozens of career sites.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
            The site is for people who want a role in Kigali, elsewhere in Rwanda, or a remote job they can do from
            here. You can also ask for an email when a new opening matches what you studied or the CV you choose to
            share.
          </p>
        </section>

        <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {figures.map((item) => (
            <div key={item.label} className="rounded-2xl border border-line bg-card px-4 py-5 shadow-[0_8px_24px_rgba(30,107,88,0.06)]">
              <dt className="text-sm font-semibold text-muted">{item.label}</dt>
              <dd className="mt-2 text-3xl font-extrabold tracking-tight text-ink tabular-nums">
                {item.value.toLocaleString("en")}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-sm leading-6 text-muted">
          Counts are open listings on Akazi right now. A role drops off when its deadline has passed or it disappears
          from the source.
        </p>

        <section className="mt-14" aria-labelledby="values-title">
          <h2 id="values-title" className="text-3xl font-extrabold tracking-tight text-ink">
            What Akazi is, and is not
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <FeatureCard icon={<MarkIcon />} title="What it is">
              <p>
                Akazi is a job board. It reads public career pages and job feeds, then lists the roles so you can
                browse them together.
              </p>
            </FeatureCard>
            <FeatureCard icon={<PeopleIcon />} title="Who it is for">
              <p>
                Use it if you are looking for work and you would rather not open dozens of career sites one by one.
                Employers do not post jobs by filling in a form here.
              </p>
              <p>
                If a company wants a role included, the practical route is to publish it on their own public careers
                page. The next read of that page can pick it up.
              </p>
            </FeatureCard>
            <FeatureCard icon={<SourceIcon />} title="Where listings come from">
              <p>
                Sources include company boards, NGOs, and public institutions. The long advert on a job page is the
                employer&apos;s text. The short summary, the apply notes, and the guides are written for Akazi.
              </p>
              <p>Always confirm the details on the employer&apos;s site before you apply.</p>
            </FeatureCard>
            <FeatureCard icon={<ApplyIcon />} title="How to apply">
              <p>
                Akazi is not an employer and not a recruitment agency. It does not take applications, charge a fee, or
                promise that a listing will still be open tomorrow.
              </p>
              <p>
                A calmer starting point is the{" "}
                <Link className="font-semibold text-forest underline-offset-4 hover:underline" href="/guides">
                  guides
                </Link>{" "}
                on a CV for this market, interviews, and remote work from Rwanda.
              </p>
            </FeatureCard>
          </div>
        </section>

        <section className="mt-14" aria-labelledby="steps-title">
          <h2 id="steps-title" className="text-3xl font-extrabold tracking-tight text-ink">
            How it works
          </h2>
          <ol className="mt-6 grid gap-4 lg:grid-cols-3">
            {steps.map((step, index) => (
              <li key={step.title} className="rounded-2xl border border-line bg-card p-5 shadow-[0_8px_24px_rgba(30,107,88,0.06)]">
                <span className="inline-flex size-9 items-center justify-center rounded-full bg-forest text-sm font-extrabold text-card">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-lg font-extrabold tracking-tight text-ink">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-14 rounded-2xl bg-forest px-6 py-8 text-card sm:flex sm:items-center sm:justify-between sm:gap-8 sm:px-8">
          <div className="max-w-xl">
            <h2 className="text-2xl font-extrabold tracking-tight">Find your next role</h2>
            <p className="mt-2 text-sm leading-6 text-card/80">
              Browse what is open now. Questions, corrections, and takedown requests go to{" "}
              <a className="font-semibold text-card underline-offset-4 hover:underline" href={`mailto:${CONTACT_EMAIL}`}>
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </div>
          <Link
            href="/"
            className="mt-5 inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg bg-card px-5 text-sm font-semibold text-forest hover:bg-chip focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-card sm:mt-0"
          >
            Browse openings
          </Link>
        </section>
      </div>
    </main>
  );
}
