import { SiteHeader, SiteFooter } from '@/components/layout';
import { SignupDialog } from '@/components/signup-dialog';
import { useSeo } from '@/lib/seo';
import { useState } from 'react';

export default function NotFound() {
  const [signupOpen, setSignupOpen] = useState(false);

  useSeo({
    title: 'Page Not Found | Fintech Tools',
    description: 'This page does not exist.',
    path: '/404',
  });

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <SiteHeader onSignupClick={() => setSignupOpen(true)} />
      
      <main className="flex-1 flex items-center justify-center p-[20px]">
        <div className="text-center">
          <span className="mark mx-auto mb-4" aria-hidden="true" style={{ transform: 'scale(1.5)', display: 'inline-grid' }}>
            <i></i><i></i><i></i>
          </span>
          <h1 className="font-display font-bold text-[24px] mt-4 mb-2 text-ink">This page does not exist</h1>
          <p className="text-ink-soft mb-6">We couldn't find the calculator or page you were looking for.</p>
          <a href="/" className="btn primary">Return home</a>
        </div>
      </main>

      <SiteFooter />
      <SignupDialog open={signupOpen} onOpenChange={setSignupOpen} toolSlug="site" />
    </div>
  );
}
