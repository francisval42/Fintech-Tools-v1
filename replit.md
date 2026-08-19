# Fintech Tools (fintechtools.com.au)

Free, professional-grade financial calculators for Australian accountants — a give-first outreach asset with no vendor branding. Build spec: `attached_assets/fintech-tools-build-spec-v1.md`; locked design reference: `attached_assets/fintech-tools-directory-eleflow.html`.

## Phase status

- **Phase 1 — SHIPPED**: directory homepage, working amortisation calculator (full schedule), 4 coming-soon tool pages, privacy/contact, sitemap/robots, anonymous usage telemetry, tool-request + notify-me capture.
- **Phase 2 (auth, branded PDF/CSV exports, accounts) and Phase 3 (admin, SEO pass): NOT started — require Francis's explicit go-ahead in conversation.** At Phase 2 kickoff, discuss auth approach: spec wants email+password+admin invites; platform prefers managed auth (Clerk/Replit Auth).

## Run & Operate

- Workflows: `artifacts/api-server: API Server` (port 5000) and `artifacts/fintech-tools: web` (Vite, previewPath `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks + Zod schemas from `lib/api-spec/openapi.yaml`
- `pnpm --filter @workspace/db run push` — push Drizzle schema changes (dev only)
- Required env: `DATABASE_URL`

## Where things live

- Amortisation engine (verified to the cent against `attached_assets/acceptance-fixtures-amortisation.md`): `artifacts/fintech-tools/src/lib/amortisation.ts` — **do not reimplement; reuse its integer-cents ledger pattern for future calculators**
- Frontend pages/components: `artifacts/fintech-tools/src/{pages,components}`; SEO + page-copy markdown parser: `src/lib/seo.ts`
- API routes: `artifacts/api-server/src/routes/{tools,tool-requests,usage-events}.ts`
- DB schema: `lib/db/src/schema/{tools,usage-events,tool-requests}.ts`; tool content (blurbs, SEO, page copy markdown) lives in the seeded `tools` table, not in code
- Static SEO files: `artifacts/fintech-tools/public/{robots.txt,sitemap.xml}` — update sitemap when tools launch

## Architecture decisions

- **Money math in integer cents**: per-row interest rounded to the cent, final payment absorbs rounding so closing balance == balloon exactly; summary totals derived from ledger rows. Displayed totals row follows the locked design: payment total = total payable (incl. residual), principal total = amount financed, so the row cross-foots.
- Tools are served from Postgres (`GET /api/tools`, `/api/tools/:slug`); homepage and tool pages render from the API, so launching a tool = DB status flip + route wiring.
- No auth in Phase 1: export/account buttons open a signup-prompt dialog that captures email as a tool-request + `notify_me` usage event.
- Anonymous `calculate` events are logged (debounced ~1.5s) with calculation inputs in the payload.
- **Tool content source of truth is `lib/db/src/seed-tools.ts`** (until the Phase 3 admin exists): the API server upserts it by slug on every boot, so fresh/production databases self-seed. Edit content there, not via ad-hoc SQL.
- Public POST endpoints are hardened: per-IP in-memory rate limits (10/min tool-requests, 60/min usage-events), 32kb JSON body cap, 4kb event payload cap, known-slug allowlist (+ `site` pseudo-slug), server-side email/trim validation. No CORS middleware on purpose — the web app calls the API same-origin via path routing.
- SPA today; **prerendering/SSR is still required before public launch** (spec §11) for SEO of tool pages.

## User preferences

- Design is LOCKED to the eleflow mockup: tokens/fonts/step-mark exactly as in `src/index.css`; yellow only on step-mark + hero stat; red only for residual rows. No Recharge/Valco branding anywhere.
- Phases 2 and 3 must not begin without Francis's explicit confirmation.
- Work in AUD, Australian financial conventions (GIC, Div 7A, chattel mortgage terminology).

## Gotchas

- In `lib/api-spec/openapi.yaml`, use `type: number` (never `type: integer`) — orval emits zod-v4-only `zod.int()` otherwise. api-server bundles without zod as a direct dep: routes use generated schemas' `safeParse`, never `import ... from 'zod'`.
- The page-copy markdown parser (`parsePageCopy` in seo.ts) must split sections per-line — `split(/## /)` corrupts `### ` FAQ headings.
- Coming-soon page copy + privacy wording are **drafts pending Francis's review before deploy** (privacy must keep plainly disclosing that calculation inputs are logged).

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
