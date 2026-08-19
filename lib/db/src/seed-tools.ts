import { eq } from "drizzle-orm";
import { db } from "./index";
import { toolsTable } from "./schema";

type ToolSeed = typeof toolsTable.$inferInsert;

/**
 * Canonical tool content for fintechtools.com.au (Phase 1).
 * Code is the source of truth for tool content until the Phase 3 admin exists:
 * seeding runs on API-server boot and upserts by slug, so edits here reach
 * every environment (including fresh production databases) automatically.
 */
const TOOLS: ToolSeed[] = [
  {
    "slug": "amortisation-schedule-calculator",
    "name": "Amortisation Schedule",
    "blurb": "Full repayment schedule with balloon/residual support and weekly, fortnightly or monthly frequencies. Export for the client file.",
    "status": "live",
    "sortOrder": 1,
    "seoTitle": "Free Amortisation Schedule Calculator (Australia) | Fintech Tools",
    "seoDescription": "Build a full loan amortisation schedule with balloon/residual support and weekly, fortnightly or monthly repayments. Free for Australian accountants — no sign-up to calculate.",
    "pageCopy": "## How this calculator works\n\nEnter the amount financed, rate, term and any balloon or residual. The schedule splits every repayment into interest and principal using the actual repayment frequency — not a monthly approximation — so fortnightly and weekly schedules reconcile to the cent.\n\n## Who it's for\n\nAccountants preparing loan schedules for client files, chattel mortgage and hire purchase reconciliations, and end-of-year interest apportionment across balance dates.\n\n## FAQ\n\n### Does it handle balloon payments?\n\nYes — enter the residual and the schedule amortises to that figure at the final payment, shown as a separate line.\n\n### Can I export the schedule?\n\nExports arrive with free accounts, opening soon — a PDF or CSV branded with your firm's logo, ready for the client file.\n\n### What does it cost?\n\nNothing. All tools on this site are free for accounting professionals — no per-seat licences, no trial windows."
  },
  {
    "slug": "ato-tax-debt-comparison",
    "name": "ATO Tax Debt Comparison",
    "blurb": "True cost of an ATO payment plan (non-deductible GIC, compounding daily) side by side with refinancing the debt.",
    "status": "coming_soon",
    "sortOrder": 2,
    "seoTitle": "ATO Tax Debt Comparison Calculator | Fintech Tools",
    "seoDescription": "Compare the true cost of an ATO payment plan — non-deductible GIC compounding daily — against refinancing the debt. Free tool for Australian accountants, in build now.",
    "pageCopy": "## How it works\n\nEnter the tax debt, a proposed ATO payment plan term and the current general interest charge rate, then a refinance alternative with its rate, term and fees. The tool builds both repayment paths in full and puts them side by side — total repayments, interest cost and the effect of GIC no longer being deductible — so the client conversation starts from numbers, not gut feel.\n\nBecause GIC compounds daily and loan interest is typically charged on the reducing balance, the difference between the two paths is rarely obvious from the headline rates. The comparison shows the crossover clearly.\n\n## Who it's for\n\nAccountants advising clients with ATO debt on whether to hold a payment plan or refinance it — and practices that want a consistent, documented basis for that advice in the client file.\n\n## FAQ\n\n### Will it use the current GIC rate?\n\nYes — the GIC rate will be prefilled with the current published rate each quarter, and you can override it for scenario work.\n\n### Does it account for GIC deductibility?\n\nYes. The comparison reflects that GIC is no longer deductible, and lets you flag whether interest on the refinance alternative is deductible for the client's circumstances.\n\n### When is it coming?\n\nIt's in build now. Leave your email above and we'll notify you the day it goes live."
  },
  {
    "slug": "asset-finance-comparison",
    "name": "Asset Finance Comparison",
    "blurb": "Chattel mortgage vs finance lease vs outright purchase — repayments, GST treatment and deduction effect on one page.",
    "status": "coming_soon",
    "sortOrder": 3,
    "seoTitle": "Asset Finance Comparison Calculator | Fintech Tools",
    "seoDescription": "Chattel mortgage vs finance lease vs outright purchase — repayments, GST treatment and deduction effect side by side. Free for Australian accountants, in build now.",
    "pageCopy": "## How it works\n\nEnter the asset cost, finance terms and the entity's tax profile once. The tool lays out chattel mortgage, finance lease and outright purchase side by side: periodic repayments, GST treatment and timing, and the shape of the tax deductions over the life of the asset.\n\nInstead of juggling three spreadsheets, you get one page the client can actually follow — and a consistent basis for recommending a structure.\n\n## Who it's for\n\nAccountants and advisers helping clients finance vehicles and equipment, and anyone who has rebuilt the same chattel-mortgage-versus-lease spreadsheet more than once.\n\n## FAQ\n\n### Which structures are compared?\n\nChattel mortgage, finance lease and outright purchase at launch. Hire purchase and novated arrangements are on the roadmap.\n\n### Does it handle balloons and residuals?\n\nYes — balloon and residual values are part of the inputs for each financed option, consistent with our amortisation schedule calculator.\n\n### When is it coming?\n\nIt's in build now. Leave your email above and we'll notify you the day it goes live."
  },
  {
    "slug": "division-7a-loan-calculator",
    "name": "Div 7A Loan Calculator",
    "blurb": "Minimum yearly repayments and benchmark interest for Division 7A complying loans.",
    "status": "coming_soon",
    "sortOrder": 4,
    "seoTitle": "Division 7A Loan Calculator | Fintech Tools",
    "seoDescription": "Minimum yearly repayments, benchmark interest and amortisation for Division 7A complying loans. Free for Australian accountants, in build now.",
    "pageCopy": "## How it works\n\nEnter the loan amount, the income year the amalgamated loan arose and the loan term. The calculator applies the benchmark interest rate to produce the minimum yearly repayment for each year of the loan, plus a full amortisation of principal and interest — the schedule you need to keep a complying loan complying.\n\nRates update each income year, and the schedule recalculates against the balance actually outstanding, so catch-up scenarios and early repayments are straightforward to model.\n\n## Who it's for\n\nAccountants managing shareholder and associate loans under Division 7A — annual compliance checks, new loan agreements, and cleaning up loans that have drifted from their minimum repayments.\n\n## FAQ\n\n### Does it use the current benchmark rate?\n\nYes — the current year's benchmark interest rate will be prefilled, with prior years available for loans already on foot.\n\n### Can it handle 7-year and 25-year loans?\n\nBoth. Unsecured 7-year loans and secured 25-year loans follow the same minimum repayment mechanics with different terms.\n\n### When is it coming?\n\nIt's in build now. Leave your email above and we'll notify you the day it goes live."
  },
  {
    "slug": "instant-asset-write-off-calculator",
    "name": "Instant Asset Write-Off",
    "blurb": "Deduction and cash-flow effect of an eligible asset purchase under the current threshold.",
    "status": "coming_soon",
    "sortOrder": 5,
    "seoTitle": "Instant Asset Write-Off Calculator | Fintech Tools",
    "seoDescription": "Model the deduction and cash-flow effect of an eligible asset purchase under the current instant asset write-off threshold. Free tool for Australian accountants, in build now.",
    "pageCopy": "## How it works\n\nEnter the asset cost, the entity type and its marginal tax rate, and how the purchase is funded. The tool shows whether the asset fits under the current instant asset write-off threshold, the deduction claimed in year one versus standard depreciation, and the after-tax cash-flow effect of the purchase.\n\nIt's the difference between telling a client \"it's deductible\" and showing them what the purchase actually costs after tax.\n\n## Who it's for\n\nAccountants fielding the perennial June question — \"should I buy it before year end?\" — and advisers modelling equipment purchases for small business clients.\n\n## FAQ\n\n### Does it track the current threshold?\n\nYes — the threshold and eligibility settings will reflect current law for the income year you select, and you can override them for planning scenarios.\n\n### Does it compare against normal depreciation?\n\nYes. The write-off is shown against the general small business pool or effective-life depreciation, so the timing benefit is explicit.\n\n### When is it coming?\n\nIt's in build now. Leave your email above and we'll notify you the day it goes live."
  }
];

/** Idempotent upsert of the canonical tool rows (update-by-slug, insert if missing). */
export async function seedTools(): Promise<void> {
  for (const tool of TOOLS) {
    const updated = await db
      .update(toolsTable)
      .set({
        name: tool.name,
        blurb: tool.blurb,
        status: tool.status,
        sortOrder: tool.sortOrder,
        seoTitle: tool.seoTitle,
        seoDescription: tool.seoDescription,
        pageCopy: tool.pageCopy,
      })
      .where(eq(toolsTable.slug, tool.slug))
      .returning({ id: toolsTable.id });
    if (updated.length === 0) {
      await db.insert(toolsTable).values(tool);
    }
  }
}
