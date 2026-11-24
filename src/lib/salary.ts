/**
 * Monthly payroll rules used by the salary calculator. Sources disagree on some figures,
 * so every rate is shown on the page and the pension rate can be changed by the visitor.
 */
export const PAYE_BANDS = [
  { upTo: 60_000, rate: 0 },
  { upTo: 100_000, rate: 0.1 },
  { upTo: 200_000, rate: 0.2 },
  { upTo: Number.POSITIVE_INFINITY, rate: 0.3 },
] as const;

export const DEFAULT_PENSION_RATE = 0.06;
export const MATERNITY_RATE = 0.003;
export const CBHI_RATE = 0.005;
export const OCCUPATIONAL_HAZARDS_RATE = 0.02;
export const RATES_CHECKED = "November 2026";

export type PayBreakdown = {
  gross: number;
  paye: number;
  pension: number;
  maternity: number;
  cbhi: number;
  net: number;
  employer: { pension: number; maternity: number; hazards: number; total: number };
  bands: { from: number; to: number; rate: number; tax: number }[];
};

export function payeFor(gross: number) {
  let lower = 0;
  const bands: PayBreakdown["bands"] = [];
  for (const band of PAYE_BANDS) {
    const taxable = Math.max(0, Math.min(gross, band.upTo) - lower);
    if (taxable > 0 || band.rate === 0) bands.push({ from: lower, to: band.upTo, rate: band.rate, tax: taxable * band.rate });
    lower = band.upTo;
    if (gross <= band.upTo) break;
  }
  return { tax: bands.reduce((sum, band) => sum + band.tax, 0), bands };
}

export function breakdown(grossInput: number, pensionRate = DEFAULT_PENSION_RATE): PayBreakdown {
  const gross = Math.max(0, Number.isFinite(grossInput) ? grossInput : 0);
  const { tax, bands } = payeFor(gross);
  const pension = gross * pensionRate;
  const maternity = gross * MATERNITY_RATE;
  const beforeCbhi = gross - tax - pension - maternity;
  const cbhi = Math.max(0, beforeCbhi) * CBHI_RATE;
  const employerPension = gross * pensionRate;
  const employerMaternity = gross * MATERNITY_RATE;
  const hazards = gross * OCCUPATIONAL_HAZARDS_RATE;
  return {
    gross,
    paye: tax,
    pension,
    maternity,
    cbhi,
    net: beforeCbhi - cbhi,
    employer: {
      pension: employerPension,
      maternity: employerMaternity,
      hazards,
      total: gross + employerPension + employerMaternity + hazards,
    },
    bands,
  };
}
