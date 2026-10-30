import Link from "next/link";
import { ProsePage } from "@/components/prose-page";
import { CONTACT_EMAIL, pageMeta } from "@/lib/site";

export const metadata = pageMeta({
  title: "About",
  description: "Akazi lists job openings in Rwanda from public employer career pages, for people looking for work in the country or remotely.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <ProsePage
      title="About Akazi"
      lede="Akazi is a job board for Rwanda. It collects openings that employers have already published, and puts them in one place."
    >
      <h2 className="pt-2 text-2xl font-extrabold tracking-tight text-ink">What it is</h2>
      <p>
        The name is the Kinyarwanda word for work. The site is for people who want a role in Kigali, elsewhere in
        Rwanda, or a remote job they can do from here. Akazi is not an employer and not a recruitment agency. It does
        not take applications, charge a fee, or promise that a listing will still be open tomorrow.
      </p>
      <h2 className="pt-4 text-2xl font-extrabold tracking-tight text-ink">Who it is for</h2>
      <p>
        Use it if you are looking for work and you would rather not open dozens of career sites one by one. You can
        narrow the list to Kigali, the rest of the country, or remote roles, and you can ask for an email when a new
        opening matches what you studied or the CV you choose to share.
      </p>
      <p>
        Employers do not post jobs by filling in a form on Akazi. If a company wants a role included, the practical
        route is to publish it on their own public careers page. The next read of that page can pick it up.
      </p>
      <h2 className="pt-4 text-2xl font-extrabold tracking-tight text-ink">Where the listings come from</h2>
      <p>
        Akazi reads public career pages and job feeds. That includes company boards, NGOs, and public institutions such
        as the Rwanda civil-service portal, together with employers that publish roles a person in Rwanda can take.
        Each opening keeps a link back to the original posting. The long advert on a job page is the employer&apos;s
        text. The short summary, the apply notes, and the guides are written for Akazi.
      </p>
      <p>
        A listing drops off when the deadline has passed or when it disappears from the source. Always confirm the
        details on the employer&apos;s site before you apply.
      </p>
      <h2 className="pt-4 text-2xl font-extrabold tracking-tight text-ink">How to apply</h2>
      <p>
        Open the role, read the summary, then use Apply. That leaves Akazi and opens the employer. If you want a
        calmer starting point, the{" "}
        <Link className="font-medium text-forest underline-offset-4 hover:underline" href="/guides">
          guides
        </Link>{" "}
        cover a CV for this market, interviews, and remote work from Rwanda.
      </p>
      <p>
        Questions, corrections, and takedown requests go to{" "}
        <a className="font-medium text-forest underline-offset-4 hover:underline" href={`mailto:${CONTACT_EMAIL}`}>
          {CONTACT_EMAIL}
        </a>
        .
      </p>
    </ProsePage>
  );
}
