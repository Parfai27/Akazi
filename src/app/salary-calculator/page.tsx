import Link from "next/link";
import { ArrowLeftIcon, CalculatorIcon } from "@/components/icons";
import { SalaryCalculator } from "@/components/salary-calculator";
import { breakdown, RATES_CHECKED } from "@/lib/salary";
import { pageMeta } from "@/lib/site";

export const metadata = pageMeta({
  title: "Rwanda salary calculator: gross to net pay",
  description:
    "Work out take-home pay in Rwanda from a gross monthly salary, with PAYE, RSSB pension, maternity, and CBHI deductions explained.",
  path: "/salary-calculator",
});

const rwf = new Intl.NumberFormat("en-RW", { maximumFractionDigits: 0 });

export default function SalaryCalculatorPage() {
  const example = breakdown(350_000);

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
              <CalculatorIcon />
              Salary calculator
            </span>
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-extrabold tracking-tight text-forest sm:text-5xl">
            Rwanda salary calculator
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
            Type the gross monthly salary from a job offer to see roughly what reaches your bank account, and where the rest
            goes.
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <SalaryCalculator />

        <p className="mt-6 rounded-xl border border-clay/30 bg-amber px-4 py-3 text-sm leading-6 text-clay-deep">
          This is an estimate using rates Akazi last checked in {RATES_CHECKED}. Allowances, other benefits, and new rules can
          change the real figure. Confirm with your employer&apos;s HR team, the Rwanda Revenue Authority (RRA), or RSSB.
        </p>

        <article className="mt-12 grid max-w-3xl gap-8 text-base leading-7 text-muted">
          <section>
            <h2 className="text-2xl font-extrabold tracking-tight text-ink">How take-home pay is worked out</h2>
            <p className="mt-3">
              A Rwandan payslip starts from the gross salary and takes off four things before you are paid: income tax
              (PAYE), your pension contribution, a small maternity leave contribution, and community health insurance
              (CBHI). Your employer pays its own share of pension, maternity, and occupational hazards on top of your
              gross salary, so those do not come out of your pay.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-extrabold tracking-tight text-ink">PAYE is charged in bands</h2>
            <p className="mt-3">
              Pay As You Earn is not one flat rate. Each slice of the monthly salary is taxed at its own rate: the first
              60,000 RWF is tax-free, the part from 60,001 to 100,000 RWF is taxed at 10%, the part from 100,001 to 200,000
              RWF at 20%, and everything above 200,000 RWF at 30%. A pay rise into a higher band only raises the tax on the
              extra amount, never on the whole salary.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-extrabold tracking-tight text-ink">A worked example: 350,000 RWF a month</h2>
            <ul className="mt-3 grid gap-2">
              <li>PAYE: 0 on the first 60,000, 4,000 on the next 40,000, 20,000 on the next 100,000, and 45,000 on the last 150,000, so {rwf.format(example.paye)} RWF.</li>
              <li>Pension at 6%: {rwf.format(example.pension)} RWF. Maternity at 0.3%: {rwf.format(example.maternity)} RWF.</li>
              <li>CBHI at 0.5% of what is left: {rwf.format(example.cbhi)} RWF.</li>
              <li>
                Take-home pay: about <strong className="text-ink">{rwf.format(example.net)} RWF</strong>, or{" "}
                {Math.round((example.net / example.gross) * 100)}% of the gross salary.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-extrabold tracking-tight text-ink">Using this when you compare offers</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>Ask whether a figure in an advert or offer is gross or net. Many Rwandan offers quote gross pay.</li>
              <li>Ask what allowances are included, such as transport or housing, and whether they are taxed.</li>
              <li>A remote role paid by a company abroad may be taxed differently. Check before you accept.</li>
            </ul>
            <p className="mt-4">
              <Link href="/" className="font-semibold text-forest underline-offset-4 hover:underline">
                Browse open roles
              </Link>
              {" · "}
              <Link href="/guides/preparing-for-interviews" className="font-semibold text-forest underline-offset-4 hover:underline">
                Preparing for interviews
              </Link>
            </p>
          </section>
        </article>
      </div>
    </main>
  );
}
