# Fintech Tools — Build Spec v1

**Site:** fintechtools.com.au **Date:** 19 Aug 2026 **Owner:** Francis Valente (admin)

---

## 1\. Purpose

Free, professional-grade financial calculators for Australian accountants. Accountants create a free account to save and export branded PDFs; the site is the give-first opener for VGFS/Recharge accountant outreach and a long-tail organic/LLM discovery asset. The site carries **no visible Recharge or Valco branding**. v1 ships one working tool (Amortisation Schedule) plus four coming-soon tool pages, login, admin-managed firm branding, branded PDF/CSV export, and usage tracking.

This spec is framework-neutral. Pair it with the framework-specific appendix. **Recommended appendix: Next.js** — tool pages must be server-rendered with full content in the initial HTML, because organic search and LLM crawlers are a primary acquisition channel. If built with Vite/SPA instead, static prerendering of all public pages is mandatory.

---

## 2\. Design reference

The file `fintech-tools-directory-eleflow.html` (uploaded alongside this spec) is the locked design reference. Match it, don't reinterpret it. Key tokens:

| Token | Value | Use |
| :---- | :---- | :---- |
| `--blue` | `#4A6CF7` | Primary buttons, links, hover/focus states |
| `--blue-deep` | `#3454E0` | Button hover, link text |
| `--sky` | `#6FC8F5` | Secondary accents, trust ticks |
| `--yellow` | `#F5D54A` | **Two uses only:** the step mark, and the hero stat block |
| `--charcoal` | `#1E2126` | Hero band, footer, table rules |
| `--paper` | `#F2F1EE` | Page background |
| `--card` | `#FFFFFF` | Cards |
| `--rule` | `#E2E1DC` | Borders |
| `--red` | `#C24A33` | Residual/owing rows only |

Typography: **Schibsted Grotesk** (700/800) for headings and wordmark, **Inter** (400/500/600) for body, **IBM Plex Mono** for all figures with `font-variant-numeric: tabular-nums`.

Non-negotiable design details from the reference:

- The CSS step mark (yellow top-right, blue bottom-left, sky bottom-right) is the site logo — header, footer, tool-card chips.  
- Schedule totals row uses the accounting double rule: 1px top border, 3px double bottom border.  
- Yellow must not spread beyond the mark and the hero stat. No yellow buttons, badges, or banners.  
- Mobile behaviours as per the reference: inputs stack above results, schedule table scrolls horizontally (never drops columns), inputs at 16px to prevent iOS zoom, hero shapes hidden on mobile.

---

## 3\. Routes and information architecture

Public (no login required to view and calculate):

- `/` — directory homepage: hero, tool card grid, request-a-tool band, footer  
- `/amortisation-schedule-calculator` — live tool (v1)  
- `/ato-tax-debt-comparison` — coming soon  
- `/asset-finance-comparison` — coming soon  
- `/division-7a-loan-calculator` — coming soon  
- `/instant-asset-write-off-calculator` — coming soon  
- `/privacy`, `/contact` — simple static pages  
- `/sitemap.xml`, `/robots.txt` — generated, all public routes indexed

Authenticated:

- `/account` — profile, firm details (read-only branding preview), change password  
- `/login`, `/signup`, `/invite/[token]` — auth flows

Admin only:

- `/admin` — dashboard: recent signups, recent usage  
- `/admin/firms` — create/edit firms and branding  
- `/admin/users` — list, pre-provision accounts, resend invites  
- `/admin/usage` — usage event log with filters  
- `/admin/requests` — tool requests inbox  
- `/admin/tools` — toggle tool visibility/live status, edit coming-soon copy

Tool slugs are permanent once live — they are the SEO asset. Adding a tool later \= new row in `tools` \+ its calculator module; the directory grid and sitemap update automatically.

---

## 4\. Data model

Postgres. Tables (ORM per appendix):

**users**

- id, email (unique), password\_hash (null until invite accepted), name, role (`user` | `admin`), firm\_id (FK, nullable), status (`invited` | `active`), created\_at, last\_login\_at

**firms**

- id, name, website (nullable), notes (admin-only free text), created\_at

**firm\_branding**

- id, firm\_id (FK, unique), logo\_url (uploaded asset), primary\_colour (hex), secondary\_colour (hex, nullable), display\_name\_on\_pdf, updated\_at  
- One branding record per firm. Users inherit branding via firm\_id.

**tools**

- id, slug (unique), name, blurb, status (`live` | `coming_soon` | `hidden`), sort\_order, seo\_title, seo\_description, page\_copy (markdown: "How it works", "Who it's for", FAQ pairs)

**usage\_events**

- id, user\_id (nullable — anonymous calculations logged with null), tool\_id, event\_type (`calculate` | `export_pdf` | `export_csv` | `signup` | `invite_accepted`), payload (jsonb), created\_at  
- payload for `calculate`: the input values (see §8 privacy note).

**tool\_requests**

- id, user\_id (nullable), email (nullable if anonymous), request\_text, current\_cost\_text ("what do you pay per seat"), created\_at, status (`new` | `reviewed`)

**invites**

- id, user\_id (FK), token (unique), expires\_at, accepted\_at

---

## 5\. Auth and roles

- Email \+ password accounts. Signup form: name, email, firm name (free text — admin links/merges to a firm record later), password.  
- **Pre-provisioned accounts (critical for outreach):** admin creates a user \+ firm \+ branding in `/admin`, system generates an invite link (`/invite/[token]`, 30-day expiry). Recipient sets a password on first visit and lands on the site already branded. This supports the "I've already built your account, your logo's on every PDF" outreach call.  
- Roles: `admin` sees `/admin/*`; everyone else doesn't. Seed one admin account (Francis) at first deploy.  
- Session: persistent cookie sessions, standard security (httpOnly, secure, CSRF on mutations). Password reset via email link.  
- Email sending: transactional only in v1 (invites, password resets). Provider per appendix; no marketing automation.

---

## 6\. Gating rules

- **View and calculate: free, no login, on every live tool.** The calculator must be fully usable by an anonymous visitor — this is what converts cold organic/LLM traffic.  
- **Export PDF, export CSV, save a calculation: login required.** Anonymous users clicking export see a signup prompt: "Create a free account to export this schedule with your firm's logo."  
- Logged-in users with no firm branding configured get exports with the default Fintech Tools cover style and a note that their firm branding can be set up (contact link) — do not block the export.

---

## 7\. Tool 1 — Amortisation Schedule (live at launch)

### Inputs

| Field | Type | Default | Validation |
| :---- | :---- | :---- | :---- |
| Amount financed | currency | 85,000 | \> 0, ≤ 100,000,000 |
| Annual rate % | decimal | 7.99 | ≥ 0, ≤ 40 |
| Term (years) | number | 5 | 1–30, integers and halves accepted |
| Balloon / residual | currency | 25,500 | ≥ 0, \< amount financed |
| Repayment frequency | select | Monthly | Monthly (12) / Fortnightly (26) / Weekly (52) |

### Calculation

- Periods `n = round(years × frequency)`; periodic rate `r = annual ÷ 100 ÷ frequency`.  
- Repayment: `pmt = r === 0 ? (L − B) / n : (L − B×(1+r)^−n) × r ÷ (1 − (1+r)^−n)` where `L` \= amount financed, `B` \= balloon.  
- Schedule: iterate `interest = balance × r`, `principal = pmt − interest`, `balance −= principal`. Keep full floating precision internally; display rounded to cents; adjust the **final payment** by the accumulated rounding difference so the closing balance equals the balloon exactly. The schedule must reconcile to the cent — this is the product's credibility.  
- Summary stats: periodic repayment (hero stat), total interest, total payable (`pmt × n + B`).  
- Recalculate live on input change (debounced \~150ms).

### Display

- On-screen: summary stats \+ full schedule table (all rows — the screen shows the complete schedule; the reference HTML's truncated table was mockup-only). Columns: \#, Payment, Interest, Principal, Balance. Residual row in red if balloon \> 0\. Totals row with double rule.  
- Long schedules (weekly × 30y \= 1,560 rows): render virtualised or paginated per year with expand-all.

### Edge cases

- Rate 0: straight-line principal, zero interest.  
- Balloon \= 0: no residual row.  
- Balloon entered ≥ amount: inline validation error, no calculation.

---

## 8\. Exports

### PDF (login required)

- A4 portrait. Header: firm logo (top-left, max height 18mm), firm display name, firm primary colour as a horizontal accent rule under the header.  
- Body: input summary block, three summary stats, full schedule table paginated with repeated column headers, totals row with the double rule, residual row in red.  
- Footer on every page: "Generated with FintechTools.com.au" (small, grey), generation date, page X of Y, and one disclaimer line: "General information only — not financial, credit or tax advice."  
- Filename: `amortisation-schedule-{amount}-{term}yr-{date}.pdf`.  
- Server-side generation (library per appendix). Must render identically regardless of client device.

### CSV (login required)

- Raw schedule: period, payment, interest, principal, balance, full precision to 2dp. Plus a header block of the inputs.

### Privacy note on usage payloads — DECISION FLAG D1

`usage_events.payload` stores the input values (amount, rate, term, balloon). These are client-deal figures but carry no client names — nothing on the site collects end-client identity. Storing them is what makes the opportunity-discovery play work later (e.g. seeing an accountant repeatedly running $200k schedules). v1 default: **store them**, and say so plainly on `/privacy`. Francis to confirm before launch.

---

## 9\. Coming-soon tool pages

Each of the four coming-soon tools gets a real page at its permanent slug — not a modal or a dead card. Page contents: tool name, blurb, 2–3 paragraphs of genuine descriptive copy about the problem it solves (from `tools.page_copy`), an FAQ block, and a "Notify me when this is live" email capture (writes a `usage_events` row and, for logged-out users, a `tool_requests` row with the email). These pages start earning search/LLM presence before the tools exist.

Launch set: ATO Tax Debt Comparison, Asset Finance Comparison, Div 7A Loan Calculator, Instant Asset Write-Off. Copy for these pages: placeholder acceptable at build time; Francis supplies final copy before deploy.

---

## 10\. Admin panel

- **Firms & branding:** create firm, upload logo (PNG/SVG/JPG, stored as asset), pick primary/secondary colours (colour picker \+ hex field), set PDF display name, live PDF header preview. Feature flag `SELF_SERVE_BRANDING` exists in config, **off** — when on, users can edit their own firm branding at `/account`. Build the editor once; the flag only controls who sees it.  
- **Users:** list with firm, status, last login; create pre-provisioned user (name, email, firm) → generates invite link shown to admin for copy/paste and optionally emailed; resend/revoke invites.  
- **Usage:** filterable table of usage\_events (by user, firm, tool, event type, date range). Simple counts at top: signups this week, calculations this week, exports this week.  
- **Tool requests:** inbox list, mark reviewed.  
- **Tools:** edit blurb/SEO fields/page copy, toggle status. No code deploy needed to flip a tool from coming\_soon to hidden or reorder the grid.

---

## 11\. SEO and LLM discoverability (launch requirements, not later polish)

- Every public page server-rendered with complete content in initial HTML.  
- Unique `<title>` and meta description per tool page from `tools.seo_*`. Open Graph tags.  
- FAQ blocks marked up with `FAQPage` structured data; tool pages with `WebApplication` structured data (`offers.price: 0`, `priceCurrency: AUD`).  
- Plain, factual on-page copy stating what the tool does, who it's for, that it's free, and that it's built for Australian settings — this phrasing is what LLM answer engines pick up.  
- `sitemap.xml` auto-includes all live and coming-soon pages; canonical URLs; robots allow all public routes, disallow `/admin` and `/account`.  
- Performance: public pages score ≥ 90 mobile on Lighthouse; no login wall, cookie banner, or interstitial on public pages.

---

## 12\. Out of scope for v1

- Referral capture / "explore finance options" pathways — **pending scoping with Alex (D2)**. Nothing in v1 references Recharge or Valco anywhere user-visible.  
- Self-serve branding (flag stays off), tool logic for the four coming-soon calculators, payments of any kind, marketing email automation, PPC landing variants, multi-user firm seats management (all users are individual accounts linked to a firm).

---

## 13\. Build phases

**Phase 1 — Skeleton and the live tool.** Routes, design system from the reference HTML, directory homepage, amortisation calculator working anonymously with full schedule, coming-soon pages, privacy/contact stubs, sitemap/robots. *Accept when: the amortisation schedule reconciles to the cent against a known-good reference calc for monthly, fortnightly and weekly with and without balloon, and the site matches the design reference on a 390px phone and a desktop.*

**Phase 2 — Accounts and exports.** Auth (signup, login, reset, invite flow), gating rules, firm/branding data model, server-side branded PDF and CSV export, `/account`. *Accept when: an invited user can set a password from an invite link and export a PDF carrying their firm's logo and colour, and an anonymous export attempt shows the signup prompt.*

**Phase 3 — Admin and instrumentation.** Full `/admin`, usage\_events logging on all event types (including anonymous calculations), tool request capture, admin usage views, SEO structured data pass, Lighthouse pass. *Accept when: Francis can pre-provision FJG Partners end-to-end (firm → branding → user → invite link) without touching code, and every calculate/export event appears in `/admin/usage`.*

Deploy on Replit with custom domain `fintechtools.com.au`. Confirm each phase in conversation before starting the next.  
