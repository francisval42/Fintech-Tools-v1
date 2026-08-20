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


/* ------------------------------------------------------------------ */
/* Adjustments, fees and modes (v1.1)                                  */
/* ------------------------------------------------------------------ */

/**
 * How extra payments reshape the loan.
 * - reduce_term: repayment unchanged; loan retires early (default). With a
 *   balloon the contractual end date is fixed, so savings land in interest
 *   and a smaller final payment instead of a shorter term.
 * - reamortise: after each extra or skipped payment, the regular repayment
 *   recalculates over the remaining periods to the same end date/balloon.
 *   An explicit set_payment adjustment overrides recalculation until the
 *   next extra/skip event.
 */
export type AdjustmentMode = "reduce_term" | "reamortise";

export type FeeFrequency = "per_payment" | "monthly" | "quarterly" | "annually";

export type Adjustment =
  | { type: "extra"; period: number; amount: number }
  | { type: "set_payment"; fromPeriod: number; amount: number }
  | { type: "skip"; period: number };

export interface AccountFees {
  /** Fee amount in dollars, charged per fee period, paid alongside the repayment. */
  amount: number;
  /** Defaults to monthly in the UI. */
  frequency: FeeFrequency;
}

export interface ScheduleOptions {
  adjustments?: Adjustment[];
  fees?: AccountFees;
  mode?: AdjustmentMode;
}

const FEES_PER_YEAR: Record<FeeFrequency, number> = {
  per_payment: -1, // sentinel: every period
  monthly: 12,
  quarterly: 4,
  annually: 1,
};

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
  /** Account-keeping fee charged this period, paid alongside the repayment. */
  fee: number;
  /** Present when this row was reshaped by an adjustment (extra, skip, change, reconciliation). */
  adjustedNote?: string;
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
  /** Sum of account-keeping fees across all rows, dollars. 0 when no fees configured. */
  totalFees: number;
  /** Mode the schedule was computed under. */
  mode: AdjustmentMode;
  /** Non-fatal notes: capped extras, negative amortisation, forced reconciliation. */
  warnings: string[];
}

export type AmortisationOutcome =
  | { ok: true; result: AmortisationResult }
  | { ok: false; errors: FieldErrors; optionErrors?: string[] };

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
 * Compute the full amortisation schedule, optionally reshaped by adjustments,
 * account-keeping fees and an adjustment mode. Called with no options this is
 * byte-identical to the v1 engine (fees 0, no warnings, mode reduce_term).
 * Returns field errors instead of throwing when inputs are invalid.
 */
export function computeAmortisation(
  inputs: AmortisationInputs,
  options?: ScheduleOptions,
): AmortisationOutcome {
  const errors = validateInputs(inputs);
  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  const { amountFinanced: L, annualRatePct, termYears, balloon: B } = inputs;
  const frequency = inputs.frequency;
  const mode: AdjustmentMode = options?.mode ?? "reduce_term";

  const n = Math.round(termYears * frequency);
  const r = annualRatePct / 100 / frequency;

  const optionErrors = validateOptions(n, options);
  if (optionErrors.length > 0) {
    return { ok: false, errors: {}, optionErrors };
  }

  const balloonC = toCents(B);
  const feeC = options?.fees ? toCents(options.fees.amount) : 0;
  const feeFreq: FeeFrequency = options?.fees?.frequency ?? "monthly";

  // Adjustment lookups
  const extras = new Map<number, number>();
  const skips = new Set<number>();
  const setPayments = new Map<number, number>();
  for (const a of options?.adjustments ?? []) {
    if (a.type === "extra") {
      extras.set(a.period, (extras.get(a.period) ?? 0) + toCents(a.amount));
    } else if (a.type === "skip") {
      skips.add(a.period);
    } else {
      setPayments.set(a.fromPeriod, toCents(a.amount));
    }
  }

  const pmtFor = (balC: number, remaining: number): number => {
    if (remaining <= 0) return 0;
    if (r === 0) return Math.round((balC - balloonC) / remaining);
    const bal = balC / 100;
    const bl = balloonC / 100;
    const p =
      ((bal - bl * Math.pow(1 + r, -remaining)) * r) /
      (1 - Math.pow(1 + r, -remaining));
    return toCents(p);
  };

  /** Fee is charged when the elapsed fee-unit count crosses an integer. */
  const feeUnits = (period: number): number => {
    const perYear = FEES_PER_YEAR[feeFreq];
    if (perYear === -1) return period; // per payment
    return Math.floor((period * perYear) / frequency);
  };

  const pmtC = pmtFor(toCents(L), n);
  const warnings: string[] = [];
  const rows: ScheduleRow[] = [];

  let balanceC = toCents(L);
  let currentPmtC = pmtC;
  let manualOverride = false;
  let recalcPending = false;
  let totalInterestC = 0;
  let totalPaymentsC = 0;
  let totalFeesC = 0;

  const hasBalloon = balloonC > 0;
  const hasSkips = skips.size > 0;
  const hasSetPayments = setPayments.size > 0;
  // The schedule closes exactly at period n ("force reconcile") whenever the
  // end date is contractually fixed in practice: always with a balloon, always
  // in reamortise mode (its promise is same end date), and in reduce_term when
  // nothing (skips / changed repayments) can push the payoff later — extras
  // only ever bring it earlier. Otherwise the loan may extend, capped so a
  // repayment below interest can't loop forever.
  const forceReconcileAtN =
    hasBalloon || mode === "reamortise" || (!hasSkips && !hasSetPayments);
  const maxPeriods = forceReconcileAtN ? n : n + 10 * frequency;

  const pushRow = (
    period: number,
    paymentC: number,
    interestC: number,
    principalC: number,
    balC: number,
    rowFeeC: number,
    notes: string[],
  ) => {
    totalInterestC += interestC;
    totalPaymentsC += paymentC;
    totalFeesC += rowFeeC;
    rows.push({
      period,
      payment: toDollars(paymentC),
      interest: toDollars(interestC),
      principal: toDollars(principalC),
      balance: toDollars(Math.max(balC, 0)),
      fee: toDollars(rowFeeC),
      adjustedNote: notes.length ? notes.join("; ") : undefined,
    });
  };

  let i = 0;
  while (true) {
    i += 1;
    if (i > maxPeriods) {
      warnings.push(
        "Schedule stopped: the repayment settings never retire the loan (payment does not cover interest).",
      );
      break;
    }

    // Re-amortise after an extra/skip event, unless a manual payment stands.
    if (recalcPending) {
      recalcPending = false;
      if (mode === "reamortise" && !manualOverride) {
        currentPmtC = pmtFor(balanceC, n - (i - 1));
      }
    }
    const setP = setPayments.get(i);
    if (setP !== undefined) {
      currentPmtC = setP;
      manualOverride = true;
    }

    const interestC = Math.round(balanceC * r);
    const rowFeeC = feeC > 0 && feeUnits(i) > feeUnits(i - 1) ? feeC : 0;
    const floorC = hasBalloon ? balloonC : 0;
    const isSkipped = skips.has(i);
    let extraC = extras.get(i) ?? 0;
    const notes: string[] = [];

    // ---- Contractual final period: reconcile exactly to the floor ----
    if (i === n && forceReconcileAtN) {
      const principalC = balanceC - floorC;
      const finalPaymentC = principalC + interestC;
      if (isSkipped || setP !== undefined) {
        warnings.push(
          "The final payment is a reconciling payment and cannot be skipped or changed; the adjustment was ignored.",
        );
      }
      if (extraC > 0) {
        warnings.push(
          "An extra payment in the final period was ignored; the final payment already settles the schedule.",
        );
      }
      pushRow(i, finalPaymentC, interestC, principalC, floorC, rowFeeC, notes);
      balanceC = floorC;
      break;
    }

    let paymentC = isSkipped ? 0 : currentPmtC;
    if (isSkipped) notes.push("Payment skipped");
    if (setP !== undefined) notes.push(`Repayment changed to ${formatAUD(setP / 100)}`);

    let principalC = paymentC - interestC;
    let afterRegularC = balanceC - principalC;

    // ---- Regular payment would overshoot the floor: clamp ----
    // Without a balloon this is early payoff; with one, the balance parks at
    // the residual and later periods run interest-only to the fixed end date.
    if (!isSkipped && afterRegularC <= floorC) {
      principalC = balanceC - floorC;
      paymentC = principalC + interestC;
      if (extraC > 0) {
        warnings.push(
          `An extra payment in period ${i} was ignored; the balance already reaches ${hasBalloon ? "the residual" : "zero"} that period.`,
        );
        extraC = 0;
      }
      if (!hasBalloon) {
        notes.push("Final payment — loan retired");
        pushRow(i, paymentC, interestC, principalC, 0, rowFeeC, notes);
        balanceC = 0;
        break;
      }
      notes.push(
        principalC > 0
          ? "Payment reduced — balance has reached the residual"
          : "Interest-only — balance at residual",
      );
      pushRow(i, paymentC, interestC, principalC, floorC, rowFeeC, notes);
      balanceC = floorC;
      continue;
    }

    // ---- Extra payment, capped at the floor ----
    if (extraC > 0) {
      const headroomC = Math.max(0, afterRegularC - floorC);
      if (extraC > headroomC) {
        warnings.push(
          `Extra payment in period ${i} was capped at ${formatAUD(headroomC / 100)} so the balance cannot fall below ${hasBalloon ? "the residual" : "zero"}.`,
        );
        extraC = headroomC;
      }
      if (extraC > 0) notes.push(`Extra payment ${formatAUD(extraC / 100)}`);
    }

    if (principalC < 0) {
      notes.push("Interest exceeds payment — balance increasing");
    }

    paymentC += extraC;
    principalC += extraC;
    balanceC = afterRegularC - extraC;
    pushRow(i, paymentC, interestC, principalC, balanceC, rowFeeC, notes);

    if ((extras.get(i) ?? 0) > 0 || isSkipped) recalcPending = true;

    if (!hasBalloon && balanceC <= 0) break;
  }

  const periods = rows.length;
  const result: AmortisationResult = {
    inputs,
    periods,
    rows,
    periodicRepayment: toDollars(pmtC),
    finalPayment: rows[periods - 1]?.payment ?? toDollars(pmtC),
    totalInterest: toDollars(totalInterestC),
    totalPrincipal: toDollars(toCents(L) - balanceC),
    totalPayable: toDollars(totalPaymentsC + balloonC + totalFeesC),
    balloon: toDollars(balloonC),
    totalFees: toDollars(totalFeesC),
    mode,
    warnings,
  };

  return { ok: true, result };
}

function validateOptions(n: number, options?: ScheduleOptions): string[] {
  const errs: string[] = [];
  if (!options) return errs;
  if (options.fees) {
    if (!Number.isFinite(options.fees.amount) || options.fees.amount < 0) {
      errs.push("Account-keeping fee must be $0 or more.");
    } else if (options.fees.amount > 10000) {
      errs.push("Account-keeping fee looks too large (over $10,000).");
    }
  }
  for (const a of options.adjustments ?? []) {
    if (a.type === "set_payment") {
      if (!Number.isInteger(a.fromPeriod) || a.fromPeriod < 1 || a.fromPeriod > n) {
        errs.push(`"Change repayment" period must be between 1 and ${n}.`);
      }
      if (!Number.isFinite(a.amount) || a.amount <= 0) {
        errs.push("Changed repayment amount must be above $0.");
      }
    } else {
      if (!Number.isInteger(a.period) || a.period < 1 || a.period > n) {
        errs.push(`Adjustment period must be between 1 and ${n}.`);
      }
      if (a.type === "extra" && (!Number.isFinite(a.amount) || a.amount <= 0)) {
        errs.push("Extra payment amount must be above $0.");
      }
    }
  }
  return errs;
}

export interface ComparisonResult {
  /** Same inputs and fees, no adjustments. */
  baseline: AmortisationResult;
  adjusted: AmortisationResult;
  /** Positive numbers are savings from the adjustments. */
  interestSaved: number;
  feesSaved: number;
  periodsSaved: number;
  totalSaved: number;
}

/**
 * Run the engine twice — with and without adjustments — for the
 * "interest saved / paid off early" comparison. Fees apply to both sides
 * so the deltas isolate the effect of the adjustments themselves.
 */
export function computeComparison(
  inputs: AmortisationInputs,
  options: ScheduleOptions,
): { ok: true; comparison: ComparisonResult } | { ok: false; errors: FieldErrors; optionErrors?: string[] } {
  const adjusted = computeAmortisation(inputs, options);
  if (!adjusted.ok) return adjusted;
  const baseline = computeAmortisation(inputs, {
    fees: options.fees,
    mode: options.mode,
  });
  if (!baseline.ok) return baseline;
  const b = baseline.result;
  const a = adjusted.result;
  return {
    ok: true,
    comparison: {
      baseline: b,
      adjusted: a,
      interestSaved: Math.round((b.totalInterest - a.totalInterest) * 100) / 100,
      feesSaved: Math.round((b.totalFees - a.totalFees) * 100) / 100,
      periodsSaved: b.periods - a.periods,
      totalSaved: Math.round((b.totalPayable - a.totalPayable) * 100) / 100,
    },
  };
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
