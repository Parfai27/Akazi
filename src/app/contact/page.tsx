import Link from "next/link";
import { ProsePage } from "@/components/prose-page";
import { InstagramIcon, WhatsAppIcon } from "@/components/icons";
import { CONTACT_EMAIL, pageMeta } from "@/lib/site";

export const metadata = pageMeta({
  title: "Contact",
  description: "Email Akazi about a listing, a takedown, email alerts, or a partnership.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <ProsePage
      title="Contact"
      lede="Akazi is a small site. A person reads the mail. Write in English, French, or Kinyarwanda."
    >
      <p>
        <a
          className="inline-flex min-h-11 items-center rounded-lg bg-forest px-5 text-sm font-semibold text-card hover:bg-forest-deep"
          href={`mailto:${CONTACT_EMAIL}`}
        >
          {CONTACT_EMAIL}
        </a>
      </p>
      <h2 className="pt-4 text-2xl font-extrabold tracking-tight text-ink">What to write about</h2>
      <ul className="list-disc space-y-2 pl-5">
        <li>A listing that is wrong, closed, or not actually open to someone in Rwanda.</li>
        <li>A request to remove a posting, or to stop email alerts tied to your address.</li>
        <li>A public careers page you would like the next crawl to include.</li>
        <li>A problem with the site, including advertising.</li>
      </ul>
      <p>
        Include the job link if you are writing about a role, and the address you used if you are writing about alerts.
        Akazi cannot submit an application for you. Use the Apply button on the listing to reach the employer.
      </p>
      <p>
        The{" "}
        <Link className="font-medium text-forest underline-offset-4 hover:underline" href="/privacy">
          privacy page
        </Link>{" "}
        says what the site stores. The{" "}
        <Link className="font-medium text-forest underline-offset-4 hover:underline" href="/terms">
          terms of use
        </Link>{" "}
        say what the listings are and are not.
      </p>
      <h2 className="pt-4 text-2xl font-extrabold tracking-tight text-ink">Other places</h2>
      <p>The same updates also go out on Instagram and WhatsApp. Those are not a substitute for the email above.</p>
      <div className="flex flex-wrap gap-2 pt-1">
        <a
          href="https://www.instagram.com/akazi.co.rw"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 items-center gap-2 rounded-full border border-line bg-card px-3 text-sm font-semibold text-ink hover:border-forest"
        >
          <InstagramIcon />
          Instagram
        </a>
        <a
          href="https://whatsapp.com/channel/0029Vb9t2xE0gcfH3qfJ1J1l"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 items-center gap-2 rounded-full border border-line bg-card px-3 text-sm font-semibold text-ink hover:border-forest"
        >
          <WhatsAppIcon />
          Channel
        </a>
        <a
          href="https://chat.whatsapp.com/BMueuqlvheH7QtE63Bjo74"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 items-center gap-2 rounded-full border border-line bg-card px-3 text-sm font-semibold text-ink hover:border-forest"
        >
          <WhatsAppIcon />
          Group
        </a>
      </div>
    </ProsePage>
  );
}
