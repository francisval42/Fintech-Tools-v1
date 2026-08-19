/**
 * Amortisation schedule engine — Fintech Tools v1.
 *
 * Ledger maths is done in integer CENTS so that every displayed row reconciles
 * exactly: payment = interest + principal, and balances chain to the cent.
 * The final payment absorbs the accumulated rounding difference so the closing
 * balance equals the balloon exactly (spec §7).
 *
 * Verified against attached_assets/acceptance-fixtures-amortisation.md.
 * Do NOT reimplement this math elsewhere — import from this module.
 */

export type Frequency = 12 | 26 | 52;

export const FREQUENCIES: ReadonlyArray<{
  value: Frequency;
  label: string;
  perYear: number;
}> = [
  { value: 12, label: "Monthly", perYear: 12 },
  { value: 26, label: "Fortnightly", perYear: 26 },
  { value: 52, label: "Weekly", perYear: 52 },
];

export function frequencyLabel(frequency: Frequency): string {
  return FREQUENCIES.find((f) => f.value === frequency)?.label ?? "Monthly";
}

export interface AmortisationInputs {
  /** Amount financed, in dollars. > 0, <= 100,000,000 */
  amountFinanced: number;
  /** Annual interest rate, percent. >= 0, <= 40 */
  annualRatePct: number;
  /** Term in years. 1–30, whole or half years. */
  termYears: number;
  /** Balloon / residual, dollars. >= 0, < amountFinanced */
  balloon: number;
  /** Repayments per year. */
  frequency: Frequency;
}

export const DEFAULT_INPUTS: AmortisationInputs = {
  amountFinanced: 85000,
  annualRatePct: 7.99,
  termYears: 5,
  balloon: 25500,
  frequency: 12,
};

export type FieldErrors = Partial<Record<keyof AmortisationInputs, string>>;

export interface ScheduleRow {
  /** 1-based period number */
  period: number;
  /** Dollars, exact to the cent */
  payment: number;
  interest: number;
  principal: number;
  /** Balance after this payment. Ends at the balloon amount on the final row. */
  balance: number;
}

export interface AmortisationResult {
  inputs: AmortisationInputs;
  /** Number of repayment periods */
  periods: number;
  rows: ScheduleRow[];
  /** Regular periodic repayment (hero stat), dollars */
  periodicRepayment: number;
  /** Final payment after rounding adjustment, dollars */
  finalPayment: number;
  /** Sum of interest across all rows, dollars */
  totalInterest: number;
  /** Sum of principal across all rows = amountFinanced − balloon, dollars */
  totalPrincipal: number;
  /** Sum of all payments + balloon, dollars */
  totalPayable: number;
  /** Balloon / residual due after the final payment, dollars */
  balloon: number;
}

export type AmortisationOutcome =
  | { ok: true; result: AmortisationResult }
  | { ok: false; errors: FieldErrors };

export function validateInputs(inputs: AmortisationInputs): FieldErrors {
  const errors: FieldErrors = {};
  const { amountFinanced, annualRatePct, termYears, balloon, frequency } =
    inputs;

  if (!Number.isFinite(amountFinanced) || amountFinanced <= 0) {
    errors.amountFinanced = "Enter an amount above $0.";
  } else if (amountFinanced > 100_000_000) {
    errors.amountFinanced = "Amount can’t exceed $100,000,000.";
  }

  if (!Number.isFinite(annualRatePct) || annualRatePct < 0) {
    errors.annualRatePct = "Rate can’t be negative.";
  } else if (annualRatePct > 40) {
    errors.annualRatePct = "Rate can’t exceed 40%.";
  }

  if (!Number.isFinite(termYears) || termYears < 1 || termYears > 30) {
    errors.termYears = "Term must be between 1 and 30 years.";
  } else if (!Number.isInteger(termYears * 2)) {
    errors.termYears = "Use whole or half years (e.g. 5 or 5.5).";
  }

  if (!Number.isFinite(balloon) || balloon < 0) {
    errors.balloon = "Balloon must be $0 or more.";
  } else if (
    Number.isFinite(amountFinanced) &&
    amountFinanced > 0 &&
    balloon >= amountFinanced
  ) {
    errors.balloon = "Balloon must be less than the amount financed.";
  }

  if (frequency !== 12 && frequency !== 26 && frequency !== 52) {
    errors.frequency = "Choose a repayment frequency.";
  }

  return errors;
}

const toCents = (dollars: number): number => Math.round(dollars * 100);
const toDollars = (cents: number): number => cents / 100;

/**
 * Compute the full amortisation schedule.
 * Returns field errors instead of throwing when inputs are invalid.
 */
export function computeAmortisation(
  inputs: AmortisationInputs,
): AmortisationOutcome {
  const errors = validateInputs(inputs);
  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  const { amountFinanced: L, annualRatePct, termYears, balloon: B } = inputs;
  const frequency = inputs.frequency;

  const n = Math.round(termYears * frequency);
  const r = annualRatePct / 100 / frequency;

  // Repayment with full floating precision (spec §7):
  // pmt = r === 0 ? (L − B) / n : (L − B×(1+r)^−n) × r ÷ (1 − (1+r)^−n)
  const pmtExact =
    r === 0
      ? (L - B) / n
      : ((L - B * Math.pow(1 + r, -n)) * r) / (1 - Math.pow(1 + r, -n));

  const pmtC = toCents(pmtExact);
  const balloonC = toCents(B);

  let balanceC = toCents(L);
  let totalInterestC = 0;
  let totalPaymentsC = 0;

  const rows: ScheduleRow[] = new Array(n);

  for (let i = 1; i <= n; i++) {
    // Interest on the running (cent-exact) balance, rounded to the cent.
    const interestC = Math.round(balanceC * r);
    let paymentC: number;
    let principalC: number;

    if (i < n) {
      paymentC = pmtC;
      principalC = paymentC - interestC;
      balanceC -= principalC;
    } else {
      // Final payment absorbs accumulated rounding so the closing balance
      // equals the balloon exactly.
      principalC = balanceC - balloonC;
      paymentC = principalC + interestC;
      balanceC = balloonC;
    }

    totalInterestC += interestC;
    totalPaymentsC += paymentC;

    rows[i - 1] = {
      period: i,
      payment: toDollars(paymentC),
      interest: toDollars(interestC),
      principal: toDollars(principalC),
      balance: toDollars(balanceC),
    };
  }

  const result: AmortisationResult = {
    inputs,
    periods: n,
    rows,
    periodicRepayment: toDollars(pmtC),
    finalPayment: rows[n - 1]?.payment ?? toDollars(pmtC),
    totalInterest: toDollars(totalInterestC),
    totalPrincipal: toDollars(toCents(L) - balloonC),
    totalPayable: toDollars(totalPaymentsC + balloonC),
    balloon: toDollars(balloonC),
  };

  return { ok: true, result };
}

const audFormatter = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
});

/** Format a dollar value as AUD currency, e.g. $1,522.93 */
export function formatAUD(value: number): string {
  return audFormatter.format(value);
}

/** Group schedule rows into years for paginated display (spec §7 long schedules). */
export function groupRowsByYear(
  rows: ScheduleRow[],
  frequency: Frequency,
): { year: number; rows: ScheduleRow[] }[] {
  const groups: { year: number; rows: ScheduleRow[] }[] = [];
  for (const row of rows) {
    const year = Math.ceil(row.period / frequency);
    const group = groups[groups.length - 1];
    if (group && group.year === year) {
      group.rows.push(row);
    } else {
      groups.push({ year, rows: [row] });
    }
  }
  return groups;
}
