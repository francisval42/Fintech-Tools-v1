/**
 * Build-time prerender for fintechtools.com.au public routes (spec §11).
 *
 * The app is a Vite SPA; without this step, crawlers that don't execute
 * JavaScript (most LLM crawlers) see an empty <div id="root">. This script
 * runs after `vite build` and writes a static HTML file per public route:
 *
 *   dist/public/index.html                      (enriched in place)
 *   dist/public/<tool-slug>/index.html
 *   dist/public/privacy/index.html
 *   dist/public/contact/index.html
 *
 * Each file carries the route's real <title>, meta description, canonical,
 * Open Graph tags, JSON-LD (WebApplication + FAQPage for tools) and a static
 * content block inside #root. React's createRoot().render() replaces the
 * static block on mount, so users get the normal app; crawlers get content.
 *
 * Content comes from lib/db/src/tool-content.json — the same single source
 * of truth the API seeds the database from. No dependencies, plain Node.
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(here, "dist", "public");
const templatePath = path.join(distDir, "index.html");
const contentPath = path.join(here, "..", "..", "lib", "db", "src", "tool-content.json");

const ORIGIN = "https://fintechtools.com.au";

const template = readFileSync(templatePath, "utf8");
const tools = JSON.parse(readFileSync(contentPath, "utf8"));

/* ---------------- helpers ---------------- */

const escapeHtml = (s) =>
  s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

const escapeAttr = (s) => escapeHtml(s).replaceAll('"', "&quot;");

/** Minimal converter for tool-content pageCopy markdown (##, ###, paragraphs). */
function pageCopyToHtml(md) {
  return md
    .split(/\n\n+/)
    .map((block) => {
      const b = block.trim();
      if (b.startsWith("### ")) return `<h3>${escapeHtml(b.slice(4))}</h3>`;
      if (b.startsWith("## ")) return `<h2>${escapeHtml(b.slice(3))}</h2>`;
      if (b.length === 0) return "";
      return `<p>${escapeHtml(b)}</p>`;
    })
    .join("\n");
}

/** Parse "## FAQ" section of pageCopy into question/answer pairs for FAQPage JSON-LD. */
function parseFaq(md) {
  const faqIdx = md.indexOf("## FAQ");
  if (faqIdx === -1) return [];
  const section = md.slice(faqIdx);
  const pairs = [];
  const parts = section.split(/\n### /).slice(1);
  for (const part of parts) {
    const [q, ...rest] = part.split("\n");
    const answer = rest.join("\n").split(/\n## /)[0].trim().replace(/\n\n+/g, " ");
    if (q && answer) pairs.push({ question: q.trim(), answer });
  }
  return pairs;
}

function renderPage({ routePath, title, description, jsonLd, bodyHtml }) {
  const url = `${ORIGIN}${routePath === "/" ? "/" : routePath}`;
  let html = template;

  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`);
  html = html.replace(
    /<meta name="description" content="[^"]*" \/>/,
    `<meta name="description" content="${escapeAttr(description)}" />`,
  );
  html = html.replace(
    /<meta property="og:title" content="[^"]*" \/>/,
    `<meta property="og:title" content="${escapeAttr(title)}" />`,
  );
  html = html.replace(
    /<meta property="og:description" content="[^"]*" \/>/,
    `<meta property="og:description" content="${escapeAttr(description)}" />`,
  );

  // Canonical + og:url + JSON-LD, appended into <head>.
  // JSON-LD scripts carry class="seo-jsonld" so the client-side useSeo hook's
  // cleanup removes them on mount instead of duplicating them.
  const headExtras = [
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:url" content="${url}" />`,
    ...jsonLd.map(
      (data) =>
        `<script type="application/ld+json" class="seo-jsonld">${JSON.stringify(data)}</script>`,
    ),
  ].join("\n    ");
  html = html.replace("</head>", `    ${headExtras}\n  </head>`);

  html = html.replace(
    '<div id="root"></div>',
    `<div id="root">${bodyHtml}</div>`,
  );

  if (routePath === "/") {
    writeFileSync(templatePath, html);
  } else {
    const dir = path.join(distDir, routePath.replace(/^\//, ""));
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, "index.html"), html);
  }
  return url;
}

/* ---------------- routes ---------------- */

const written = [];

// Home
{
  const toolList = tools
    .map(
      (t) =>
        `<li><a href="/${t.slug}">${escapeHtml(t.name)}</a> — ${escapeHtml(t.blurb)}${
          t.status === "coming_soon" ? " (coming soon)" : ""
        }</li>`,
    )
    .join("\n        ");
  written.push(
    renderPage({
      routePath: "/",
      title: "Free financial calculators for Australian accountants | Fintech Tools",
      description:
        "Professional-grade financial calculators for Australian accountants. Export schedules as PDFs branded with your firm's logo.",
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Fintech Tools",
          url: `${ORIGIN}/`,
          description:
            "Free, professional-grade financial calculators for Australian accountants. No per-seat fees. Branded PDF exports for the client file.",
        },
      ],
      bodyHtml: `
      <main>
        <h1>The calculators your practice pays for, free.</h1>
        <p>Professional-grade financial calculators for Australian accountants. Export schedules as PDFs branded with your firm's logo, ready for the client file.</p>
        <ul>
          <li>No per-seat fees — free for accounting professionals</li>
          <li>Branded exports — your logo on every PDF</li>
          <li>Built for Australian lending and tax settings</li>
        </ul>
        <h2>Tools</h2>
        <ul>
        ${toolList}
        </ul>
      </main>`,
    }),
  );
}

// Tool pages (live and coming soon)
for (const t of tools) {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: t.name,
      url: `${ORIGIN}/${t.slug}`,
      description: t.seoDescription,
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web",
      offers: { "@type": "Offer", price: "0", priceCurrency: "AUD" },
    },
  ];
  const faq = parseFaq(t.pageCopy);
  if (faq.length > 0) {
    jsonLd.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    });
  }
  written.push(
    renderPage({
      routePath: `/${t.slug}`,
      title: t.seoTitle,
      description: t.seoDescription,
      jsonLd,
      bodyHtml: `
      <main>
        <h1>${escapeHtml(t.name)}</h1>
        <p>${escapeHtml(t.blurb)}</p>
        ${t.status === "coming_soon" ? "<p><em>This tool is in build — coming soon. All Fintech Tools calculators are free for accounting professionals.</em></p>" : ""}
        ${pageCopyToHtml(t.pageCopy)}
      </main>`,
    }),
  );
}

// Privacy + Contact
written.push(
  renderPage({
    routePath: "/privacy",
    title: "Privacy Policy | Fintech Tools",
    description:
      "How Fintech Tools handles your information. Free financial calculators for Australian accounting professionals.",
    jsonLd: [],
    bodyHtml: `<main><h1>Privacy Policy</h1><p>How Fintech Tools collects and handles information. Fintech Tools provides free financial calculators for Australian accounting professionals.</p></main>`,
  }),
);
written.push(
  renderPage({
    routePath: "/contact",
    title: "Contact Us | Fintech Tools",
    description:
      "Get in touch with Fintech Tools — free financial calculators for Australian accountants.",
    jsonLd: [],
    bodyHtml: `<main><h1>Contact Us</h1><p>Get in touch with Fintech Tools — free financial calculators for Australian accounting professionals.</p></main>`,
  }),
);

console.log(`prerender: wrote ${written.length} routes`);
for (const url of written) console.log(`  ${url}`);
