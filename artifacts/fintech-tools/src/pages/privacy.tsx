import { useState } from 'react';
import { SiteHeader, SiteFooter } from '@/components/layout';
import { SignupDialog } from '@/components/signup-dialog';
import { useSeo } from '@/lib/seo';

export default function Privacy() {
  const [signupOpen, setSignupOpen] = useState(false);

  useSeo({
    title: 'Privacy Policy | Fintech Tools',
    description: 'How we handle your data.',
    path: '/privacy',
  });

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <SiteHeader onSignupClick={() => setSignupOpen(true)} />
      
      <main className="flex-1 max-w-[720px] mx-auto px-[16px] sm:px-[20px] py-[32px] sm:py-[48px] w-full">
        <h1 className="font-display font-bold text-[28px] sm:text-[32px] mb-[24px]">Privacy Policy</h1>
        
        <div className="content !mt-0 !max-w-none">
          <p>This privacy policy explains how Fintech Tools handles data. We aim to keep it simple, transparent, and focused on providing a professional toolset for Australian accountants.</p>
          
          <h3>Anonymous Usage Analytics</h3>
          <p>We log anonymous usage data to understand which calculators are being used and how they are performing. When you run a calculation, the input values (such as the loan amount, term, and interest rate) are stored to help us improve the tool and see general usage trends.</p>
          <p><strong>We never collect end-client identity details.</strong> The figures are purely numbers; we have no way of knowing who the calculation is for.</p>

          <h3>Emails and Accounts</h3>
          <p>If you submit an email address to request a tool, get notified about a coming-soon feature, or create an account, we store that email securely. We only use it for the specific purpose you provided it for (such as notifying you when the tool is live). We do not sell your email address or use it for unrelated marketing.</p>

          <h3>Cookies and Tracking</h3>
          <p>In this first version of Fintech Tools, we do not use tracking cookies or third-party advertising trackers. The site is free of ads, and we do not sell your data to brokers.</p>

          <h3>Contact</h3>
          <p>If you have any questions about your data or wish to have your email removed from our notify list, please use the contact form.</p>
        </div>
      </main>

      <SiteFooter />
      <SignupDialog open={signupOpen} onOpenChange={setSignupOpen} toolSlug="site" />
    </div>
  );
}
