# Memory Index

- [Orval + zod codegen quirks](orval-zod-codegen.md) — use `type: number` not `integer` in openapi.yaml (zod v3 vs v4 `zod.int()`); api-server can't import zod directly.
- [Money math convention](money-math-cents.md) — financial ledgers computed in integer cents, final payment absorbs rounding, totals derived from ledger rows, displayed totals must cross-foot.
