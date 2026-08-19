import { useState } from 'react';
import { useCreateToolRequest, useLogUsageEvent } from '@workspace/api-client-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './dialog-wrapper';
import { z } from 'zod';

const emailSchema = z.string().email('Please enter a valid email address.');

export function SignupDialog({ 
  open, 
  onOpenChange, 
  toolSlug 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  toolSlug: string;
}) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const { mutateAsync: createRequest, isPending: isRequesting } = useCreateToolRequest();
  const { mutateAsync: logEvent } = useLogUsageEvent();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Email is required.');
      return;
    }

    const emailCheck = emailSchema.safeParse(email);
    if (!emailCheck.success) {
      setError(emailCheck.error.errors[0].message);
      return;
    }

    try {
      await Promise.all([
        createRequest({
          data: {
            requestText: 'Waitlist: free account / branded exports',
            email
          }
        }),
        logEvent({
          data: {
            toolSlug: toolSlug || 'site',
            eventType: 'notify_me',
            payload: { source: 'export' }
          }
        })
      ]);
      setSuccess(true);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      onOpenChange(val);
      if (!val) {
        setTimeout(() => {
          setSuccess(false);
          setEmail('');
          setError('');
        }, 300);
      }
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display font-bold text-[20px]">
            Create a free account to export this schedule with your firm's logo.
          </DialogTitle>
          <DialogDescription className="text-ink-soft text-[14px]">
            Free accounts are opening soon.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-4 text-[14.5px] font-medium text-ink">
            Thanks &mdash; we will email you when accounts open.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
            <div className="field !mb-0">
              <label htmlFor="signup-email">Email address</label>
              <input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@firm.com.au"
                disabled={isRequesting}
                className={error ? "!border-red focus:!border-red" : ""}
              />
              {error && <div className="error-text">{error}</div>}
            </div>
            <div className="flex justify-end mt-2">
              <button type="submit" disabled={isRequesting} className="btn primary w-full sm:w-auto">
                {isRequesting ? 'Submitting...' : 'Notify me'}
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
