import { useEffect } from 'react';
import { useLocation } from 'wouter';

export function useSeo({
  title,
  description,
  path,
  jsonLd,
}: {
  title: string;
  description: string;
  path: string;
  jsonLd?: unknown[];
}) {
  const [location] = useLocation();

  useEffect(() => {
    document.title = title;
    
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', description);

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    const fullUrl = `https://fintechtools.com.au${path === '/' ? '' : path}`;
    canonical.setAttribute('href', fullUrl);

    // Clean up old JSON-LD
    document.querySelectorAll('script[type="application/ld+json"].seo-jsonld').forEach(el => el.remove());

    if (jsonLd && jsonLd.length > 0) {
      jsonLd.forEach(data => {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.className = 'seo-jsonld';
        script.text = JSON.stringify(data);
        document.head.appendChild(script);
      });
    }

    return () => {
      document.querySelectorAll('script[type="application/ld+json"].seo-jsonld').forEach(el => el.remove());
    };
  }, [title, description, path, location, jsonLd]);
}

export function parsePageCopy(copy: string) {
  // Parser for the constrained page-copy markdown:
  //   "## <Section heading>" starts a section (How..., Who..., FAQ)
  //   inside the FAQ section, "### <Question>" starts a question, following
  //   paragraphs are its answer. Only ##/### headings and paragraphs exist.
  // NOTE: sections must be detected per line — a naive split(/## /) also
  // matches the "## " inside "### " and silently destroys the FAQ.
  const sections: { heading: string; lines: string[] }[] = [];
  let current: { heading: string; lines: string[] } | null = null;

  for (const raw of copy.split('\n')) {
    const line = raw.trim();
    if (line.startsWith('## ') && !line.startsWith('###')) {
      current = { heading: line.slice(3).trim(), lines: [] };
      sections.push(current);
    } else if (current && line) {
      current.lines.push(line);
    }
  }

  let howItWorks: string[] = [];
  let whoItsFor: string[] = [];
  let howHeading = 'How it works';
  let whoHeading = "Who it's for";
  const faqs: { question: string, answer: string[] }[] = [];

  for (const section of sections) {
    const lower = section.heading.toLowerCase();
    if (lower.startsWith('how')) {
      howHeading = section.heading;
      howItWorks = section.lines;
    } else if (lower.startsWith('who')) {
      whoHeading = section.heading;
      whoItsFor = section.lines;
    } else if (lower.includes('faq')) {
      let currentQ = '';
      let currentA: string[] = [];
      for (const line of section.lines) {
        if (line.startsWith('### ')) {
          if (currentQ) {
            faqs.push({ question: currentQ, answer: currentA });
          }
          currentQ = line.slice(4).trim();
          currentA = [];
        } else {
          currentA.push(line);
        }
      }
      if (currentQ) {
        faqs.push({ question: currentQ, answer: currentA });
      }
    }
  }

  return { howItWorks, whoItsFor, howHeading, whoHeading, faqs };
}
