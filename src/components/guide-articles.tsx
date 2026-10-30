import Link from "next/link";
import type { ReactNode } from "react";

const h2 = "pt-4 text-2xl font-extrabold tracking-tight text-ink";
const list = "list-disc space-y-2 pl-5";

function A({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link className="font-medium text-forest underline-offset-4 hover:underline" href={href}>
      {children}
    </Link>
  );
}

export function CvGuide() {
  return (
    <>
      <h2 className={h2}>Keep it to two pages</h2>
      <p>
        For most private-sector and NGO roles in Kigali, two pages is enough. One page is better if you are early in
        your career. Public-service adverts sometimes ask for a specific form or for every certificate to be listed.
        If the advert names a format, follow that and ignore the rest of this page.
      </p>
      <p>A useful order is:</p>
      <ol className="list-decimal space-y-2 pl-5">
        <li>Your name, phone with the +250 prefix, email, and the district or city where you live.</li>
        <li>Two or three lines on the kind of role you want. Mention the employer&apos;s field, not a generic objective.</li>
        <li>Work, newest first. Each role gets the title, the organisation, the city, and the years.</li>
        <li>Education, with the institution and the year you finished.</li>
        <li>Languages, tools, and then two referees.</li>
      </ol>
      <h2 className={h2}>What local readers expect to see</h2>
      <p>
        A photo at the top is still common on CVs sent to Rwandan companies and NGOs. International and remote employers
        often prefer no photo. If the advert is silent, a simple head-and-shoulders photo is fine for a Kigali
        application and optional for a remote one.
      </p>
      <p>
        State languages honestly. “Kinyarwanda, native. English, working. French, basic.” is more useful than a row of
        stars. Many Kigali private-sector interviews are in English. Government and some NGO processes use Kinyarwanda
        or French. Do not claim a language you cannot use in a meeting.
      </p>
      <p>
        Referees should be people who have supervised you. Ask them before you send the CV. Give a name, a current
        role, an organisation, and a phone number. “References available on request” makes the reader do extra work.
      </p>
      <h2 className={h2}>Lead with the advert, not your life story</h2>
      <p>
        Read the posting once and underline the tasks. The first role on your CV should show those tasks, with a result
        if you have one. “Prepared monthly reports for 12 field sites” is stronger than “responsible for reporting”.
        If you have not done the exact job, show the closest work and say what you used: Excel, a district campaign, a
        campus project, a shop you ran.
      </p>
      <p>
        Cut anything that does not help this application. A 2014 school prize, a long list of workshops, and every
        software icon you have ever opened usually cost you the reader. Keep certificates that the advert names.
      </p>
      <h2 className={h2}>File and sending</h2>
      <ul className={list}>
        <li>Export a PDF named with your name, such as Aline-Uwase-CV.pdf. Do not send “final-final.docx”.</li>
        <li>Use an email address you check. A missed message is a missed interview.</li>
        <li>If they ask for a cover note, write five to eight lines: the role, where you saw it, and two reasons you can do it. Akazi is a fine place to say you found the opening.</li>
        <li>For email applications, put the job title in the subject line.</li>
      </ul>
      <h2 className={h2}>Leave these out</h2>
      <p>
        Do not invent an employer, a salary, or a language. Do not pay someone who says they will “submit your CV into
        the system” or “guarantee a shortlist”. A real employer listed on Akazi takes the application on their own
        site. If a message asks for mobile money before an interview, stop and{" "}
        <A href="/contact">tell Akazi</A> if the listing itself looks wrong.
      </p>
      <p>
        When a role is open, the <A href="/">board</A> links you to the original posting. Match the CV to that posting,
        not to a generic template.
      </p>
    </>
  );
}

export function InterviewGuide() {
  return (
    <>
      <h2 className={h2}>Before the day</h2>
      <p>
        Re-read the advert and the employer&apos;s own page. Note the duty station, the contract length if they gave
        one, and the three tasks they mention most. You will be asked about those, not about a different job you wish
        they had posted.
      </p>
      <p>Prepare four short stories from your own work or studies:</p>
      <ul className={list}>
        <li>A result you can put a number on, even a small one.</li>
        <li>A problem you noticed and what you did.</li>
        <li>A time you worked with people who disagreed.</li>
        <li>Something you did not know and how you learned it.</li>
      </ul>
      <p>
        Each story needs about a minute. Situation, what you did, what changed. Practise out loud in the language you
        expect. If the advert is in English, assume the interview is in English unless they tell you otherwise.
        Government panels may switch to Kinyarwanda or French. It is fine to ask which language they prefer at the
        start.
      </p>
      <h2 className={h2}>Getting there</h2>
      <p>
        Kigali traffic is the usual reason people arrive late. Leave earlier than the map suggests, and save the
        office landmark, not only the street name. If it is a video call, test the link the day before and have a
        phone hotspot ready. Tell them if you drop, then call back. Silence reads as “not interested”.
      </p>
      <p>
        Dress one step smarter than you think the office dresses. A clean shirt and closed shoes are enough for most
        NGOs and tech teams. A bank or a ministry panel is more formal. Carry a printed CV even if you already emailed
        it, plus a pen and a notebook.
      </p>
      <h2 className={h2}>In the room</h2>
      <p>
        Answer the question they asked. If you do not know, say what you would do to find out. Interviewers in Rwanda
        often include a practical question: how you would run a stock count, talk to a farmer, or explain a delay to a
        manager. Walk through the steps.
      </p>
      <p>Questions worth asking them, if they have not already answered:</p>
      <ul className={list}>
        <li>Where is the work done on a normal week, and is any of it in the field?</li>
        <li>Is the contract fixed-term or open, and when do they expect someone to start?</li>
        <li>Who would you report to?</li>
        <li>When will they decide, and will they write to people who are not selected?</li>
      </ul>
      <p>
        Salary is reasonable to ask once they have shown they want you, or if the advert invited it. Do not open with
        it. Do not ask them to guarantee a visa, a loan, or a job for a relative.
      </p>
      <h2 className={h2}>Afterwards</h2>
      <p>
        If you have an email for the panel, a short thank-you the same day is enough. Restate the role and one thing
        you can do. Do not send a new CV every two days. If they gave a decision date, wait until a few days after
        that before you follow up once.
      </p>
      <p>
        An offer that asks you to pay for a uniform, a training seat, or “file processing” is not a normal hire. Walk
        away. The same rule is on every <A href="/">Akazi listing</A>: the employer does not need your mobile-money PIN.
      </p>
    </>
  );
}

export function RemoteGuide() {
  return (
    <>
      <h2 className={h2}>Remote is not one thing</h2>
      <p>
        Some postings say remote and mean “anywhere”. Some mean “remote inside one country”, often the United States
        or a European country, and they will reject a Rwanda address. Read the location line before you spend an
        evening on the form. On Akazi, the <A href="/?shelf=remote">remote shelf</A> is meant for roles a person in
        Rwanda can actually take: worldwide, Africa, EMEA, or a plain remote with no country lock. If a listing still
        looks closed to Rwanda, <A href="/contact">send the link</A>.
      </p>
      <p>
        A hybrid or on-site role in Kigali is not remote. Those sit on the Kigali shelf. Do not describe yourself as
        available for a Nairobi office job if you cannot be there.
      </p>
      <h2 className={h2}>What to put on the application</h2>
      <ul className={list}>
        <li>City and country: Kigali, Rwanda. Hiding it wastes everyone&apos;s time if the employer cannot hire there.</li>
        <li>Time zone: East Africa Time, UTC+2. Say which hours you can overlap with their team.</li>
        <li>Languages you can use in writing, not only in speech. Remote jobs live in documents and calls.</li>
        <li>A portfolio, GitHub, writing samples, or a short note on a result. Remote hiring relies on proof, because they cannot watch you work.</li>
        <li>A phone number that works on WhatsApp or a normal call, and an email you check.</li>
      </ul>
      <p>
        Internet and power fail. Say, briefly, how you will keep working: a second connection, a charged laptop, a
        place you can go. You do not need a long essay. One sentence in a cover note is enough.
      </p>
      <h2 className={h2}>Money, tax, and contracts</h2>
      <p>
        A serious employer sends a contract before you start, and pays to an account you control. That might be a
        Rwandan bank or a service they already use. You should not pay them to “activate” wages, buy their equipment
        kit, or unlock a portal. Equipment, if they provide it, is shipped or reimbursed. It is not something you
        purchase by sending money to a person on WhatsApp.
      </p>
      <p>
        If you live in Rwanda, income you earn from abroad can still be taxable here. This page is not tax advice.
        The Rwanda Revenue Authority and a local accountant are the right place for your own case. Ask the employer
        whether they will contract you as an employee or as an independent contractor, because that changes what you
        file.
      </p>
      <h2 className={h2}>A simple way to search</h2>
      <p>
        Start with work you can already show. A remote role rarely trains you from zero. Use the board&apos;s function
        filters, then open only the postings whose location you are allowed to hold. The{" "}
        <A href="/guides/writing-a-cv-for-rwanda">CV guide</A> still applies: two pages, the relevant work first, and
        no fee to anyone who offers to submit it for you.
      </p>
      <p>
        When you apply, keep a note of the company, the title, and the date. Remote processes are slow. Following up
        once after the date they gave you is enough.
      </p>
    </>
  );
}

export const guideBodies = {
  "writing-a-cv-for-rwanda": CvGuide,
  "preparing-for-interviews": InterviewGuide,
  "remote-work-from-rwanda": RemoteGuide,
} as const;
