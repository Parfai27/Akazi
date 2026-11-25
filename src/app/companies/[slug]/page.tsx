import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CompanyMark } from "@/components/company-mark";
import { BellIcon, BuildingIcon } from "@/components/icons";
import { PageHero } from "@/components/page-hero";
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
    <main className="akazi-terrain pb-16">
      <PageHero
        crumbs={[{ label: "Companies", href: "/companies", icon: <BuildingIcon /> }, { label: company.name }]}
        title={company.name}
        lede={`${company.count} open ${company.count === 1 ? "role" : "roles"} on Akazi right now.`}
        aside={
          <div className="flex items-center gap-4 rounded-3xl bg-white p-5 text-ink shadow-[0_18px_40px_rgba(6,30,24,0.35)]">
            <CompanyMark name={company.name} website={company.website} size="lg" />
            <div className="min-w-0">
              <span className="block text-3xl leading-none font-extrabold tracking-tight tabular-nums">{company.count}</span>
              <span className="mt-1 block text-sm font-semibold text-forest">
                open {company.count === 1 ? "role" : "roles"}
              </span>
            </div>
          </div>
        }
      >
        <dl className="flex flex-wrap gap-2 text-sm">
          {SHELVES.filter((shelf) => company.shelves[shelf.id] > 0).map((shelf) => (
            <div key={shelf.id} className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5">
              <dt className="text-[#d6e8e0]">{shelf.label}</dt>
              <dd className="font-bold text-white tabular-nums">{company.shelves[shelf.id]}</dd>
            </div>
          ))}
          {company.functions.map((item) => (
            <div key={item.id} className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5">
              <dt className="text-[#d6e8e0]">{functionLabel(item.id)}</dt>
              <dd className="font-bold text-[#f5b942] tabular-nums">{item.count}</dd>
            </div>
          ))}
        </dl>
      </PageHero>
      <div className="mx-auto w-full max-w-6xl px-4 pt-10 sm:px-6">
        <h2 className="akazi-wipe flex items-center gap-2 text-2xl font-extrabold tracking-tight">
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
          className="mt-10 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#f5b942] px-6 text-sm font-extrabold text-ink hover:bg-[#f0aa22]"
        >
          <BellIcon />
          Get email alerts for new roles
        </Link>
      </div>
    </main>
  );
}
