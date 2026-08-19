import { Link } from 'wouter';

export function StepMark({ className = '' }: { className?: string }) {
  return (
    <span className={`mark ${className}`} aria-hidden="true">
      <i></i><i></i><i></i>
    </span>
  );
}

export function SiteHeader({ onSignupClick }: { onSignupClick: () => void }) {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between gap-[10px] px-[18px] py-[12px] border-b border-rule bg-card">
      <Link href="/" className="wordmark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue rounded-sm">
        <StepMark />
        Fintech&nbsp;Tools<span className="tld">.com.au</span>
      </Link>
      <div className="flex items-center gap-[8px]">
        <button onClick={onSignupClick} className="btn ghost hidden sm:inline-flex">Log in</button>
        <button onClick={onSignupClick} className="btn primary">Create free account</button>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-charcoal text-[#C9CCD2] px-[20px] pt-[28px] pb-[36px] mt-[8px]">
      <div className="max-w-[1040px] mx-auto flex justify-between gap-[18px] flex-wrap items-baseline">
        <div>
          <div className="wordmark text-white text-[16px]">
            <StepMark />
            Fintech&nbsp;Tools<span className="tld !text-[#8A8F97]">.com.au</span>
          </div>
          <p className="text-[13px] text-[#9BA0A8] max-w-[420px] mt-[8px]">
            Free financial calculators for Australian accounting professionals. General information only &mdash; not financial or tax advice.
          </p>
        </div>
        <nav className="flex gap-[16px] flex-wrap text-[13px]">
          <Link href="/" className="font-medium text-[#C9CCD2] hover:text-white hover:underline">All tools</Link>
          <Link href="/contact" className="font-medium text-[#C9CCD2] hover:text-white hover:underline">Request a tool</Link>
          <Link href="/privacy" className="font-medium text-[#C9CCD2] hover:text-white hover:underline">Privacy</Link>
          <Link href="/contact" className="font-medium text-[#C9CCD2] hover:text-white hover:underline">Contact</Link>
        </nav>
      </div>
    </footer>
  );
}
