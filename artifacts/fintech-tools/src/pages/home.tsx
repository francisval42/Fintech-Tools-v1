import { useState } from 'react';
import { SiteHeader, SiteFooter } from '@/components/layout';
import { SignupDialog } from '@/components/signup-dialog';
import { RequestToolDialog } from '@/components/request-tool-dialog';
import { ToolCard } from '@/components/tool-card';
import { useSeo } from '@/lib/seo';
import { useListTools } from '@workspace/api-client-react';

export default function Home() {
  const [signupOpen, setSignupOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);

  const { data: tools, isLoading, error } = useListTools();

  useSeo({
    title: 'Free financial calculators for Australian accountants | Fintech Tools',
    description: 'Professional-grade financial calculators for Australian accountants. Export schedules as PDFs branded with your firm\'s logo.',
    path: '/',
  });

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <SiteHeader onSignupClick={() => setSignupOpen(true)} />
      
      <main className="flex-1" id="hub">
        <div className="bg-charcoal text-white overflow-hidden relative">
          <div className="hidden sm:block absolute right-[-20px] top-0 bottom-0 w-[340px] pointer-events-none" aria-hidden="true">
            <span className="absolute w-[120px] h-[120px] bg-blue right-[120px] top-[36px]"></span>
            <span className="absolute w-[60px] h-[60px] bg-sky right-[60px] top-[156px]"></span>
            <span className="absolute w-[60px] h-[60px] bg-yellow right-[120px] top-[-24px]"></span>
            <span className="absolute w-[120px] h-[120px] bg-[#F5F3EE] right-0 top-[156px] rounded-bl-[120px]"></span>
          </div>
          
          <div className="max-w-[1040px] mx-auto px-[20px] pt-[32px] sm:pt-[44px] pb-[26px] sm:pb-[38px] relative z-10">
            <h1 className="font-display font-extrabold text-[clamp(27px,5.5vw,40px)] tracking-[-.02em] leading-[1.1] max-w-[620px] text-white">
              The calculators your practice pays for, <em className="not-italic text-yellow">free</em>.
            </h1>
            <p className="text-[#C9CCD2] mt-[13px] max-w-[540px] text-[clamp(15px,2.2vw,16.5px)]">
              Professional-grade financial calculators for Australian accountants. Export schedules as PDFs branded with your firm's logo, ready for the client file.
            </p>
            <div className="flex flex-col sm:flex-row sm:gap-[22px] gap-[8px] sm:flex-wrap mt-[24px]">
              <div className="flex items-baseline gap-[8px] text-[13px] text-[#C9CCD2]">
                <span className="font-mono text-sky font-semibold">&#10003;</span> No per-seat fees &mdash; free for accounting professionals
              </div>
              <div className="flex items-baseline gap-[8px] text-[13px] text-[#C9CCD2]">
                <span className="font-mono text-sky font-semibold">&#10003;</span> Branded exports &mdash; your logo on every PDF
              </div>
              <div className="flex items-baseline gap-[8px] text-[13px] text-[#C9CCD2]">
                <span className="font-mono text-sky font-semibold">&#10003;</span> Built for Australian lending and tax settings
              </div>
            </div>
          </div>
        </div>

        {error ? (
          <div className="max-w-[1080px] mx-auto px-[20px] py-[26px] text-red">
            Tools are temporarily unavailable.
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-[14px] px-[20px] py-[26px] max-w-[1080px] mx-auto" id="grid">
            {isLoading ? (
              // Skeleton cards
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-card border border-rule rounded-[14px] p-[18px] animate-pulse h-[160px]">
                  <div className="w-[22px] h-[22px] bg-rule rounded-sm mb-3" />
                  <div className="h-[20px] bg-rule rounded-sm w-3/4 mb-2" />
                  <div className="h-[14px] bg-rule rounded-sm w-full mb-1" />
                  <div className="h-[14px] bg-rule rounded-sm w-5/6" />
                </div>
              ))
            ) : (
              tools?.map(tool => (
                <ToolCard key={tool.slug} tool={tool} />
              ))
            )}
          </div>
        )}

        <div className="max-w-[1080px] mx-auto px-[20px] pt-[4px] pb-[36px]">
          <div className="rounded-[14px] p-[20px] bg-card border border-rule flex flex-col sm:flex-row items-start sm:items-center justify-between gap-[14px] flex-wrap">
            <p className="text-ink-soft text-[14px] max-w-[520px]">
              <strong className="text-ink font-semibold">Missing a tool your practice pays for?</strong> Tell us what it is and what it costs you per seat &mdash; popular requests get built first.
            </p>
            <button onClick={() => setRequestOpen(true)} className="btn">Request a tool</button>
          </div>
        </div>
      </main>

      <SiteFooter />
      <SignupDialog open={signupOpen} onOpenChange={setSignupOpen} toolSlug="site" />
      <RequestToolDialog open={requestOpen} onOpenChange={setRequestOpen} />
    </div>
  );
}
