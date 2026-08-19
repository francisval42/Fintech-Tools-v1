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
