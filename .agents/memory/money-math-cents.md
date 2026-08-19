---
name: Money math convention (fintech-tools)
description: How financial schedules/ledgers must be computed and displayed across all fintech-tools calculators
---

# Money math convention

**Rule:** All calculator engines build the ledger in integer cents. Per-row interest is rounded to the cent; the final payment is adjusted to absorb accumulated rounding so the closing balance equals the balloon/target exactly. Summary totals are derived by summing ledger rows — never recomputed from closed-form formulas.

**Why:** The build spec requires schedules that reconcile to the cent (audience is accountants; fixtures in `attached_assets/acceptance-fixtures-amortisation.md` are checked to the cent). Closed-form totals drift from the rounded ledger.

**How to apply:** Reuse `artifacts/fintech-tools/src/lib/amortisation.ts` as the pattern for future calculators (Div 7A, ATO GIC, asset finance). Displayed totals rows must cross-foot (payment total = interest total + principal total, with the residual counted consistently — the locked design counts the residual in both the payment and principal totals). Verify new engines against fixture files before UI work.
