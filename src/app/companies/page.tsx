import Link from "next/link";
import { CompanyMark } from "@/components/company-mark";
import { ArrowLeftIcon, BuildingIcon, PinIcon } from "@/components/icons";
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
    <main>
      <div className="border-b border-line bg-wash">
        <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <p className="flex items-center gap-2 text-sm font-medium text-forest">
            <Link href="/" className="inline-flex items-center gap-1 hover:underline">
              <ArrowLeftIcon />
              Home
            </Link>
            <span aria-hidden="true">→</span>
            <span className="inline-flex items-center gap-1 text-ink">
              <BuildingIcon />
              Companies
            </span>
          </p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-forest sm:text-5xl">Companies hiring</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
            {companies.length} employers have {openings} open roles on Akazi right now. Open one to see all of its
            openings in one place.
          </p>
        </div>
      </div>
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        {companies.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line bg-card px-5 py-10 text-muted">No companies are listed yet.</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {companies.map((company) => (
              <li key={company.slug}>
                <Link
                  href={`/companies/${company.slug}`}
                  className="flex h-full items-start gap-3 rounded-2xl border border-line bg-card p-4 hover:border-forest"
                >
                  <CompanyMark name={company.name} website={company.website} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold break-words text-ink">{company.name}</span>
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
