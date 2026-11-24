"use client";

import { useId, useState } from "react";
import { breakdown, DEFAULT_PENSION_RATE } from "@/lib/salary";

const rwf = new Intl.NumberFormat("en-RW", { maximumFractionDigits: 0 });
const percent = new Intl.NumberFormat("en-GB", { style: "percent", maximumFractionDigits: 1 });

function money(value: number) {
  return `${rwf.format(Math.round(value))} RWF`;
}

function Row({ label, value, note, strong = false }: { label: string; value: string; note?: string; strong?: boolean }) {
  return (
    <div className={`flex items-start justify-between gap-4 py-2.5 ${strong ? "text-base font-extrabold text-ink" : "text-sm"}`}>
      <dt className={strong ? "" : "text-muted"}>
        {label}
        {note ? <span className="block text-xs text-muted">{note}</span> : null}
      </dt>
      <dd className={`shrink-0 text-right tabular-nums ${strong ? "" : "font-semibold text-ink"}`}>{value}</dd>
    </div>
  );
}

export function SalaryCalculator() {
  const [gross, setGross] = useState("500000");
  const [pension, setPension] = useState(String(DEFAULT_PENSION_RATE * 100));
  const grossId = useId();
  const pensionId = useId();
  const amount = Number(gross.replace(/[^\d.]/g, "")) || 0;
  const pensionRate = Math.min(20, Math.max(0, Number(pension) || 0)) / 100;
  const result = breakdown(amount, pensionRate);
  const deductions = result.paye + result.pension + result.maternity + result.cbhi;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      <form className="grid h-fit gap-4 rounded-2xl border border-line bg-card p-5" onSubmit={(event) => event.preventDefault()}>
        <div>
          <label htmlFor={grossId} className="text-sm font-semibold text-ink">
            Gross monthly salary (RWF)
          </label>
          <input
            id={grossId}
            name="gross"
            inputMode="numeric"
            autoComplete="off"
            value={gross}
            onChange={(event) => setGross(event.target.value)}
            placeholder="e.g. 500000…"
            className="mt-1 min-h-12 w-full rounded-xl border border-line bg-card px-3 text-lg font-bold tabular-nums outline-none focus-visible:border-forest focus-visible:ring-3 focus-visible:ring-forest/25"
          />
          <p className="mt-1 text-xs text-muted">Before any deductions, as written in the job offer or contract.</p>
        </div>
        <div>
          <label htmlFor={pensionId} className="text-sm font-semibold text-ink">
            Your pension contribution (%)
          </label>
          <input
            id={pensionId}
            name="pension"
            type="number"
            inputMode="decimal"
            min={0}
            max={20}
            step={0.5}
            value={pension}
            onChange={(event) => setPension(event.target.value)}
            className="mt-1 min-h-11 w-full rounded-xl border border-line bg-card px-3 text-base tabular-nums outline-none focus-visible:border-forest focus-visible:ring-3 focus-visible:ring-forest/25"
          />
          <p className="mt-1 text-xs text-muted">RSSB is raising pension rates step by step. Check your payslip and change this if it differs.</p>
        </div>
      </form>

      <div className="grid gap-4" aria-live="polite">
        <div className="rounded-2xl bg-forest p-5 text-card">
          <p className="text-sm font-semibold text-card/80">Estimated take-home pay</p>
          <p className="mt-1 text-4xl font-extrabold tracking-tight tabular-nums">{money(result.net)}</p>
          <p className="mt-1 text-sm text-card/80">
            per month · {money(deductions)} in deductions
            {result.gross > 0 ? ` (${percent.format(deductions / result.gross)} of gross)` : ""}
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-card p-5">
          <h2 className="text-lg font-extrabold">Your deductions</h2>
          <dl className="mt-2 divide-y divide-line">
            <Row label="Gross salary" value={money(result.gross)} />
            <Row label="PAYE income tax" value={`− ${money(result.paye)}`} note="Paid to RRA, by band (see below)" />
            <Row label="Pension (RSSB)" value={`− ${money(result.pension)}`} note={`${percent.format(pensionRate)} of gross`} />
            <Row label="Maternity leave (RSSB)" value={`− ${money(result.maternity)}`} note="0.3% of gross" />
            <Row label="Community health insurance (CBHI)" value={`− ${money(result.cbhi)}`} note="0.5% of pay after the items above" />
            <Row label="Take-home pay" value={money(result.net)} strong />
          </dl>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-line bg-card p-5">
            <h2 className="text-lg font-extrabold">PAYE by band</h2>
            <dl className="mt-2 divide-y divide-line">
              {result.bands.map((band) => (
                <Row
                  key={band.from}
                  label={
                    Number.isFinite(band.to)
                      ? `${rwf.format(band.from)}–${rwf.format(band.to)} at ${percent.format(band.rate)}`
                      : `Above ${rwf.format(band.from)} at ${percent.format(band.rate)}`
                  }
                  value={money(band.tax)}
                />
              ))}
            </dl>
          </div>
          <div className="rounded-2xl border border-line bg-card p-5">
            <h2 className="text-lg font-extrabold">What it costs the employer</h2>
            <dl className="mt-2 divide-y divide-line">
              <Row label="Employer pension" value={money(result.employer.pension)} />
              <Row label="Employer maternity" value={money(result.employer.maternity)} note="0.3% of gross" />
              <Row label="Occupational hazards" value={money(result.employer.hazards)} note="2% of gross" />
              <Row label="Total monthly cost" value={money(result.employer.total)} strong />
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
