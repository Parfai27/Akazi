import Link from "next/link";
import { CompanyHero, IconBadge, MailIcon } from "@/components/company-page";
import { InstagramIcon, WhatsAppIcon } from "@/components/icons";
import { CONTACT_EMAIL, INSTAGRAM_URL, pageMeta, WHATSAPP_CHANNEL_URL, WHATSAPP_GROUP_URL } from "@/lib/site";

export const metadata = pageMeta({
  title: "Contact",
  description: "Email Akazi about a listing, a takedown, email alerts, or a partnership.",
  path: "/contact",
});

const topics = [
  "A listing that is wrong, closed, or not actually open to someone in Rwanda.",
  "A request to remove a posting, or to stop email alerts tied to your address.",
  "A public careers page you would like the next crawl to include.",
  "A problem with the site, including advertising.",
];

const faqs = [
  {
    q: "Can Akazi submit my application?",
    a: "No. Akazi cannot submit an application for you. Use the Apply button on the listing to reach the employer.",
  },
  {
    q: "What should I include?",
    a: "Include the job link if you are writing about a role, and the address you used if you are writing about alerts.",
  },
  {
    q: "Is WhatsApp or Instagram enough?",
    a: "The same updates also go out there. Those channels are not a substitute for the email on this page.",
  },
  {
    q: "How quickly will someone reply?",
    a: "Akazi is a small site. A person reads the mail. Write in English, French, or Kinyarwanda.",
  },
];

export default function ContactPage() {
  return (
    <main className="bg-wash">
      <CompanyHero
        eyebrow="Contact"
        title="Write to a person."
        lede="Questions, corrections, and takedown requests come to one mailbox. A person reads them."
      />
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <h2 className="text-3xl font-extrabold tracking-tight text-ink">Reach Akazi</h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          <li>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="flex h-full gap-4 rounded-2xl border border-line bg-card p-5 shadow-[0_8px_24px_rgba(30,107,88,0.06)] hover:border-forest focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
            >
              <IconBadge>
                <MailIcon />
              </IconBadge>
              <span>
                <span className="block text-sm font-semibold text-muted">Email</span>
                <span className="mt-1 block text-lg font-extrabold tracking-tight text-ink">{CONTACT_EMAIL}</span>
                <span className="mt-2 block text-sm leading-6 text-muted">Best for a listing, a takedown, alerts, or a partnership.</span>
              </span>
            </a>
          </li>
          <li>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-full gap-4 rounded-2xl border border-line bg-card p-5 shadow-[0_8px_24px_rgba(30,107,88,0.06)] hover:border-forest focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
            >
              <IconBadge>
                <InstagramIcon />
              </IconBadge>
              <span>
                <span className="block text-sm font-semibold text-muted">Instagram</span>
                <span className="mt-1 block text-lg font-extrabold tracking-tight text-ink">@akazi.co.rw</span>
                <span className="mt-2 block text-sm leading-6 text-muted">The same updates, not a substitute for email.</span>
              </span>
            </a>
          </li>
          <li>
            <a
              href={WHATSAPP_CHANNEL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-full gap-4 rounded-2xl border border-line bg-card p-5 shadow-[0_8px_24px_rgba(30,107,88,0.06)] hover:border-forest focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
            >
              <IconBadge>
                <WhatsAppIcon />
              </IconBadge>
              <span>
                <span className="block text-sm font-semibold text-muted">WhatsApp channel</span>
                <span className="mt-1 block text-lg font-extrabold tracking-tight text-ink">Akazi channel</span>
                <span className="mt-2 block text-sm leading-6 text-muted">Broadcast updates. It does not replace the mailbox.</span>
              </span>
            </a>
          </li>
          <li>
            <a
              href={WHATSAPP_GROUP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-full gap-4 rounded-2xl border border-line bg-card p-5 shadow-[0_8px_24px_rgba(30,107,88,0.06)] hover:border-forest focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
            >
              <IconBadge>
                <WhatsAppIcon />
              </IconBadge>
              <span>
                <span className="block text-sm font-semibold text-muted">WhatsApp group</span>
                <span className="mt-1 block text-lg font-extrabold tracking-tight text-ink">Akazi group</span>
                <span className="mt-2 block text-sm leading-6 text-muted">The group chat. Email is still the way to reach staff.</span>
              </span>
            </a>
          </li>
        </ul>

        <div className="mt-10 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <section className="rounded-2xl border border-line bg-card p-5 shadow-[0_8px_24px_rgba(30,107,88,0.06)] sm:p-6" aria-labelledby="topics-title">
            <h2 id="topics-title" className="text-2xl font-extrabold tracking-tight text-ink">
              What to write about
            </h2>
            <ul className="mt-4 space-y-3">
              {topics.map((topic) => (
                <li key={topic} className="flex gap-3 text-sm leading-6 text-muted">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-forest" aria-hidden="true" />
                  <span>{topic}</span>
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-2xl border border-amber bg-amber px-5 py-6 sm:p-6" aria-labelledby="expect-title">
            <h2 id="expect-title" className="text-2xl font-extrabold tracking-tight text-ink">
              What to expect
            </h2>
            <p className="mt-3 text-sm leading-6 text-clay-deep">
              A person reads the mail. Write in English, French, or Kinyarwanda. There is no form and no ticket number.
            </p>
            <p className="mt-3 text-sm leading-6 text-clay-deep">
              The{" "}
              <Link className="font-semibold text-forest underline-offset-4 hover:underline" href="/privacy">
                privacy page
              </Link>{" "}
              says what the site stores. The{" "}
              <Link className="font-semibold text-forest underline-offset-4 hover:underline" href="/terms">
                terms of use
              </Link>{" "}
              say what the listings are and are not.
            </p>
          </section>
        </div>

        <section className="mt-14" aria-labelledby="faq-title">
          <h2 id="faq-title" className="text-3xl font-extrabold tracking-tight text-ink">
            Common questions
          </h2>
          <dl className="mt-6 grid gap-4 md:grid-cols-2">
            {faqs.map((item) => (
              <div key={item.q} className="rounded-2xl border border-line bg-card p-5">
                <dt className="text-base font-extrabold tracking-tight text-ink">{item.q}</dt>
                <dd className="mt-2 text-sm leading-6 text-muted">{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </main>
  );
}
