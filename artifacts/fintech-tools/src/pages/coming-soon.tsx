import { useState } from 'react';
import { Link } from 'wouter';
import { SiteHeader, SiteFooter } from '@/components/layout';
import { SignupDialog } from '@/components/signup-dialog';
import { NotifyMeForm } from '@/components/notify-me-form';
import { useSeo, parsePageCopy } from '@/lib/seo';
import { useGetToolBySlug, useListTools } from '@workspace/api-client-react';
import NotFound from '@/pages/not-found';

export default function ComingSoonPage({ slug }: { slug: string }) {
  const [signupOpen, setSignupOpen] = useState(false);

  const { data: tool, isLoading, error } = useGetToolBySlug(slug);
  const { data: tools } = useListTools();

  const relatedTools = tools?.filter(t => t.slug !== slug) || [];

  let faqsData: any[] = [];
  if (tool?.pageCopy) {
    const parsed = parsePageCopy(tool.pageCopy);
    faqsData = parsed.faqs;
  }

  useSeo({
    title: tool?.seoTitle || (tool ? `${tool.name} — Fintech Tools` : 'Fintech Tools'),
    description: tool?.seoDescription || tool?.blurb || '',
    path: `/${slug}`,
    jsonLd: faqsData.length > 0 ? [{
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqsData.map(faq => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer.join('\n')
        }
      }))
    }] : undefined
  });

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex flex-col">
        <SiteHeader onSignupClick={() => setSignupOpen(true)} />
        <main className="flex-1 max-w-[900px] mx-auto px-[16px] py-[18px] w-full animate-pulse">
          <div className="h-[20px] w-[100px] bg-rule rounded-sm mb-[14px]"></div>
          <div className="bg-card border border-dashed border-rule rounded-[14px] p-[38px] px-[22px] text-center">
            <div className="h-[24px] w-[200px] bg-rule rounded-sm mx-auto mb-3"></div>
            <div className="h-[14px] w-[300px] bg-rule rounded-sm mx-auto mb-2"></div>
            <div className="h-[14px] w-[250px] bg-rule rounded-sm mx-auto"></div>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  // Unknown slug — render the real 404 page rather than an API-error message.
  if ((error as { status?: number } | null)?.status === 404) {
    return <NotFound />;
  }

  if (error || !tool) {
    return (
      <div className="min-h-[100dvh] flex flex-col">
        <SiteHeader onSignupClick={() => setSignupOpen(true)} />
        <main className="flex-1 max-w-[900px] mx-auto px-[16px] py-[48px] w-full text-center text-red">
          This page is temporarily unavailable. Please try again shortly.
          <div className="mt-4"><Link href="/" className="btn">Return to directory</Link></div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  // A live tool whose page isn't wired yet (deploy-time gap): show the same
  // layout with adjusted messaging — never navigate during render.
  const isLive = tool.status === 'live';

  const { howItWorks, whoItsFor, howHeading, whoHeading, faqs } = parsePageCopy(tool.pageCopy);

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <SiteHeader onSignupClick={() => setSignupOpen(true)} />
      
      <main className="flex-1 max-w-[900px] mx-auto px-[12px] sm:px-[16px] pt-[14px] sm:pt-[18px] pb-[40px] sm:pb-[48px] w-full">
        <div className="text-[13px] text-ink-soft my-[2px] mb-[14px]">
          <Link href="/" className="border-none bg-none text-blue-deep font-semibold text-[13px] underline py-[6px]">
            &larr; All tools
          </Link>
        </div>

        <div className="bg-card border border-dashed border-rule rounded-[14px] py-[38px] px-[22px] text-center">
          <h2 className="font-display text-[20px] font-bold mb-[6px] text-ink">{tool.name}</h2>
          <p className="text-ink-soft max-w-[480px] mx-auto mb-[4px]">{tool.blurb}</p>
          <span className="inline-block mt-[12px] font-mono text-[11px] tracking-[.06em] uppercase text-blue-deep bg-[#EBEFFE] rounded-full px-[13px] py-[5px]">
            {isLive ? <>Just launched &mdash; rolling out</> : <>In build &mdash; coming soon</>}
          </span>
          {!isLive && (
            <div className="max-w-[360px] mx-auto">
              <NotifyMeForm toolSlug={tool.slug} toolName={tool.name} />
            </div>
          )}
        </div>

        {(howItWorks.length > 0 || whoItsFor.length > 0 || faqs.length > 0) && (
          <div className="content">
            {howItWorks.length > 0 && (
              <>
                <h3>{howHeading}</h3>
                {howItWorks.map((p, i) => <p key={i}>{p}</p>)}
              </>
            )}

            {whoItsFor.length > 0 && (
              <>
                <h3>{whoHeading}</h3>
                {whoItsFor.map((p, i) => <p key={i}>{p}</p>)}
              </>
            )}

            {faqs.length > 0 && (
              <div className="faq">
                {faqs.map((faq, i) => (
                  <details key={i}>
                    <summary>{faq.question}</summary>
                    {faq.answer.map((p, j) => <p key={j}>{p}</p>)}
                  </details>
                ))}
              </div>
            )}
          </div>
        )}

        {relatedTools.length > 0 && (
          <div className="border-t border-rule mt-[34px] pt-[18px]">
            <h4 className="font-mono text-[11px] tracking-[.08em] uppercase text-ink-soft mb-[10px]">
              Other tools
            </h4>
            <div className="flex gap-[8px] overflow-x-auto pb-[6px] overflow-scrolling-touch">
              {relatedTools.map(t => (
                <Link 
                  key={t.slug}
                  href={`/${t.slug}`}
                  className="border border-rule bg-card rounded-full px-[15px] py-[9px] text-[13px] font-medium text-ink whitespace-nowrap shrink-0 hover:border-blue hover:text-blue-deep transition-colors"
                >
                  {t.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      <SiteFooter />
      <SignupDialog open={signupOpen} onOpenChange={setSignupOpen} toolSlug={slug} />
    </div>
  );
}
