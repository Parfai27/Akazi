import Link from "next/link";
import { HeroStat, PageHero } from "@/components/page-hero";
import { CompanyMark } from "@/components/company-mark";
import { BuildingIcon, PinIcon } from "@/components/icons";
import { listCompanies } from "@/lib/jobs";
import { pageMeta } from "@/lib/site";

export const metadata = pageMeta({
  title: "Companies hiring in Rwanda",
  description: "Employers with open roles on Akazi, with how many openings each one has and where.",
  path: "/companies",
});

export default async function CompaniesPage() {
  const companies = await listCompanies();
  const openings = companies.reduce((sum, company) => sum + company.count, 0);

  return (
    <main className="akazi-terrain pb-16">
      <PageHero
        crumbs={[{ label: "Companies", icon: <BuildingIcon /> }]}
        photo={{ src: "/people/work-people.jpg", position: "center 40%" }}
        title="Companies hiring"
        lede={`${companies.length} employers have ${openings} open roles on Akazi right now. Open one to see all of its openings in one place.`}
        aside={
          <div className="grid grid-cols-2 gap-3">
            <HeroStat value={companies.length} label="Employers hiring" />
            <HeroStat value={openings} label="Open roles" tone="amber" />
          </div>
        }
      />
      <div className="mx-auto w-full max-w-6xl px-4 pt-10 sm:px-6">
        {companies.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line bg-card px-5 py-10 text-muted">No companies are listed yet.</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {companies.map((company) => (
              <li key={company.slug} className="akazi-lift akazi-reveal">
                <Link
                  href={`/companies/${company.slug}`}
                  className="group flex h-full items-start gap-3 rounded-2xl border border-line bg-card p-4 shadow-[0_8px_24px_rgba(30,107,88,0.06)] hover:border-forest hover:shadow-[0_12px_28px_rgba(30,107,88,0.12)]"
                >
                  <CompanyMark name={company.name} website={company.website} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold break-words text-ink group-hover:text-forest">{company.name}</span>
                    <span className="mt-1 block text-sm font-semibold text-forest">
                      {company.count} open {company.count === 1 ? "role" : "roles"}
                    </span>
                    {company.places.length > 0 ? (
                      <span className="mt-1 flex items-start gap-1 text-xs break-words text-muted">
                        <PinIcon className="mt-px size-3 shrink-0" />
                        {company.places.join(" · ")}
                      </span>
                    ) : null}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
