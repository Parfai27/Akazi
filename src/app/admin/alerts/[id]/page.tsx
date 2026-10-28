import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";
import { getSignup } from "@/lib/staff-directory";
import { formatPosted } from "@/lib/url";

export const instant = false;

export const metadata = {
  title: "CV",
  robots: { index: false, follow: false },
};

export default async function SignupCvPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) redirect("/admin");
  const { id } = await params;
  const person = await getSignup(Number(id));
  if (!person) notFound();

  return (
    <div>
      <Link href="/admin/alerts" className="text-sm font-semibold text-forest underline-offset-4 hover:underline">
        Alerts
      </Link>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight">{person.name}</h1>
      <p className="mt-2 text-sm text-muted">
        <a className="text-forest underline-offset-4 hover:underline" href={`mailto:${person.email}`}>
          {person.email}
        </a>
        {" · "}
        Signed up {formatPosted(person.createdAt)}
      </p>
      <p className="mt-4 text-sm leading-6 text-muted">
        Studies: {person.studies || "Not given"}
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <h2 className="text-lg font-extrabold">CV</h2>
        {person.cvText ? (
          <a
            href={`/admin/alerts/${person.id}/cv`}
            className="inline-flex h-11 items-center rounded-lg bg-forest px-4 text-sm font-semibold text-card hover:bg-forest-deep"
          >
            Download
          </a>
        ) : null}
      </div>
      {person.cvText ? (
        <pre className="mt-3 max-w-3xl overflow-x-auto whitespace-pre-wrap rounded-2xl border border-line bg-card p-5 text-sm leading-6 text-ink">
          {person.cvText}
        </pre>
      ) : (
        <p className="mt-3 rounded-2xl border border-dashed border-line bg-card px-5 py-10 text-sm text-muted">
          This person did not submit a CV.
        </p>
      )}
    </div>
  );
}
