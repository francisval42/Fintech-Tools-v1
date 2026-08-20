# Amortisation acceptance fixtures

Inputs: $85,000 financed, 7.99% p.a., 5 years (0% for the edge case). Repayment shown is the regular payment; final payment adjusted so closing balance equals the balloon exactly.

| Scenario | n | Regular pmt | Final pmt | Total interest | Total payable | Closing bal |
| :-- | --: | --: | --: | --: | --: | --: |
| Monthly, balloon $25500 | 60 | 1375.95 | 1375.83 | 23056.88 | 108056.88 | 25500.00 |
| Monthly, balloon $0 | 60 | 1723.09 | 1722.84 | 18385.15 | 103385.15 | 0.00 |
| Fortnightly, balloon $25500 | 130 | 634.24 | 634.96 | 22951.92 | 107951.92 | 25500.00 |
| Fortnightly, balloon $0 | 130 | 794.12 | 793.43 | 18234.91 | 103234.91 | 0.00 |
| Weekly, balloon $25500 | 260 | 316.95 | 316.56 | 22906.61 | 107906.61 | 25500.00 |
| Weekly, balloon $0 | 260 | 396.81 | 397.02 | 18170.81 | 103170.81 | 0.00 |
| Monthly, 0% rate, balloon $25,500 | 60 | 991.67 | 991.47 | 0.00 | 85000.00 | 25500.00 |

Phase 1 accepts when the app's schedule matches these to the cent.

## Adjustment, mode and fee fixtures (engine v1.1)

Base inputs as above unless noted. All figures independently cross-verified.

| Scenario | Mode | Periods | Final pmt | Total interest | Total payable | Fees |
| :-- | :-- | --: | --: | --: | --: | --: |
| Monthly $0 balloon, extra $10,000 @ p12 | reduce_term | 53 | 342.56 | 14943.24 | 99943.24 | 0 |
| Monthly $0 balloon, extra $10,000 @ p12 | reamortise | 60 | 1479.15 | 16669.23 | 101669.23 | 0 |
| Weekly $25,500 balloon, extra $5,000 @ p26 | reduce_term | 260 | 39.18 | 20878.08 | 105878.08 | 0 |
| Weekly $25,500 balloon, extra $5,000 @ p26 | reamortise | 260 | 292.66 | 21950.53 | 106950.53 | 0 |
| Monthly $0 balloon, skip p6 | reduce_term | 62 | 763.88 | 19149.28 | 104149.28 | 0 |
| Monthly $0 balloon, repayment $2,000 from p13 | reduce_term | 53 | 741.68 | 16418.76 | 101418.76 | 0 |
| Weekly $25,500 balloon, $10/month account fee | reduce_term | 260 | 316.56 | 22906.61 | 108506.61 | 600.00 |

Semantics: reduce_term keeps the repayment and retires early (with a balloon
the end date is fixed — the balance parks at the residual and later periods
run interest-only); reamortise recalculates the repayment over the remaining
periods after each extra/skip; skips accrue interest (balance rises); the
final payment always reconciles exactly; fees are charged alongside the
repayment (12/4/1 per year or per payment) and never capitalised; total
payable includes fees.
