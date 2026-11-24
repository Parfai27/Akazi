import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CompanyMark } from "@/components/company-mark";
import { ArrowLeftIcon, BellIcon, BuildingIcon } from "@/components/icons";
import { JobCard } from "@/components/job-card";
import { getCompanyPage, listCompanies } from "@/lib/jobs";
import { functionLabel, SHELVES } from "@/lib/organize";

type Params = { slug: string };

export async function generateStaticParams() {
  const companies = await listCompanies();
  if (companies.length === 0) return [{ slug: "company" }];
  return companies.map((company) => ({ slug: company.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const company = await getCompanyPage(slug);
  if (!company) return { title: "Company not found", robots: { index: false, follow: false } };
  const title = `${company.name} jobs`;
  const description = `${company.count} open ${company.count === 1 ? "role" : "roles"} at ${company.name} on Akazi.`;
  return {
    title,
    description,
    alternates: { canonical: `/companies/${slug}` },
    // These pages list other employers' openings, so the companies index is what search engines see.
    robots: { index: false, follow: true },
    openGraph: { title, description, url: `/companies/${slug}`, siteName: "Akazi", type: "website" },
  };
}

export default async function CompanyPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const company = await getCompanyPage(slug);
  if (!company) notFound();

  return (
    <main>
      <div className="border-b border-line bg-wash">
        <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
          <p className="flex items-center gap-2 text-sm font-medium text-forest">
            <Link href="/companies" className="inline-flex items-center gap-1 hover:underline">
              <ArrowLeftIcon />
              Companies
            </Link>
          </p>
          <div className="mt-4 flex min-w-0 items-start gap-4">
            <CompanyMark name={company.name} website={company.website} size="lg" />
            <div className="min-w-0">
              <h1 className="text-3xl font-extrabold tracking-tight break-words text-ink sm:text-4xl">{company.name}</h1>
              <p className="mt-2 text-base font-semibold text-forest">
                {company.count} open {company.count === 1 ? "role" : "roles"} on Akazi
              </p>
            </div>
          </div>
          <dl className="mt-6 flex flex-wrap gap-2 text-sm">
            {SHELVES.filter((shelf) => company.shelves[shelf.id] > 0).map((shelf) => (
              <div key={shelf.id} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1.5">
                <dt className="text-muted">{shelf.label}</dt>
                <dd className="font-bold tabular-nums text-ink">{company.shelves[shelf.id]}</dd>
              </div>
            ))}
            {company.functions.map((item) => (
              <div key={item.id} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1.5">
                <dt className="text-muted">{functionLabel(item.id)}</dt>
                <dd className="font-bold tabular-nums text-ink">{item.count}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <h2 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
          <BuildingIcon className="size-5 shrink-0 text-forest" />
          Open roles
        </h2>
        <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {company.cards.map((card) => (
            <JobCard key={card.job.id} job={card.job} closes={card.closes} soon={card.soon} />
          ))}
        </ul>
        <Link
          href="/alerts"
          className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-lg border border-line bg-card px-4 text-sm font-semibold text-forest hover:border-forest"
        >
          <BellIcon />
          Get email alerts for new roles
        </Link>
      </div>
    </main>
  );
}
