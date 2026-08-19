import { useState } from 'react';
import { SiteHeader, SiteFooter } from '@/components/layout';
import { SignupDialog } from '@/components/signup-dialog';
import { useSeo } from '@/lib/seo';
import { useCreateToolRequest } from '@workspace/api-client-react';

export default function Contact() {
  const [signupOpen, setSignupOpen] = useState(false);
  const [requestText, setRequestText] = useState('');
  const [currentCostText, setCurrentCostText] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const { mutateAsync: createRequest, isPending } = useCreateToolRequest();

  useSeo({
    title: 'Contact | Fintech Tools',
    description: 'Get in touch or request a new financial calculator.',
    path: '/contact',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!requestText.trim()) {
      setError('Please tell us what we should build or how we can help.');
      return;
    }

    try {
      await createRequest({
        data: {
          requestText: requestText.trim(),
          currentCostText: currentCostText.trim() || undefined,
          email: email.trim() || undefined
        }
      });
      setSuccess(true);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <SiteHeader onSignupClick={() => setSignupOpen(true)} />
      
      <main className="flex-1 max-w-[720px] mx-auto px-[16px] sm:px-[20px] py-[32px] sm:py-[48px] w-full">
        <h1 className="font-display font-bold text-[28px] sm:text-[32px] mb-[12px]">Contact Us</h1>
        <p className="text-ink-soft mb-[32px]">Have a question, feedback, or a tool request? Let us know below.</p>
        
        <div className="bg-card border border-rule rounded-[14px] p-[20px] sm:p-[24px]">
          {success ? (
            <div className="py-[32px] text-center">
              <h2 className="font-display font-bold text-[20px] mb-[8px]">Thanks &mdash; we read every message.</h2>
              <p className="text-ink-soft">We'll get back to you if you left an email address.</p>
              <button 
                className="btn mt-[16px]" 
                onClick={() => {
                  setSuccess(false);
                  setRequestText('');
                  setCurrentCostText('');
                  setEmail('');
                }}
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-[16px]">
              <div className="field !mb-0">
                <label htmlFor="contact-what">What should we build or fix? *</label>
                <textarea
                  id="contact-what"
                  value={requestText}
                  onChange={(e) => setRequestText(e.target.value)}
                  maxLength={4000}
                  rows={4}
                  disabled={isPending}
                  className={`resize-none ${error && !requestText.trim() ? "!border-red" : ""}`}
                />
              </div>
              <div className="field !mb-0">
                <label htmlFor="contact-cost">If it's a tool request, what does this cost you today? (optional)</label>
                <input
                  id="contact-cost"
                  type="text"
                  value={currentCostText}
                  onChange={(e) => setCurrentCostText(e.target.value)}
                  disabled={isPending}
                />
              </div>
              <div className="field !mb-0">
                <label htmlFor="contact-email">Your email (optional)</label>
                <input
                  id="contact-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isPending}
                />
              </div>
              {error && <div className="error-text !mt-0">{error}</div>}
              <div className="flex justify-end mt-[8px]">
                <button type="submit" disabled={isPending} className="btn primary w-full sm:w-auto">
                  {isPending ? 'Submitting...' : 'Submit message'}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      <SiteFooter />
      <SignupDialog open={signupOpen} onOpenChange={setSignupOpen} toolSlug="site" />
    </div>
  );
}
