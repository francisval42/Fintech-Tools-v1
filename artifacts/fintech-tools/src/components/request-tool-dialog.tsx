import { useState } from 'react';
import { useCreateToolRequest } from '@workspace/api-client-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog-wrapper';

export function RequestToolDialog({ 
  open, 
  onOpenChange 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) {
  const [requestText, setRequestText] = useState('');
  const [currentCostText, setCurrentCostText] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const { mutateAsync: createRequest, isPending } = useCreateToolRequest();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!requestText.trim()) {
      setError('Please tell us what we should build.');
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
    <Dialog open={open} onOpenChange={(val) => {
      onOpenChange(val);
      if (!val) {
        setTimeout(() => {
          setSuccess(false);
          setRequestText('');
          setCurrentCostText('');
          setEmail('');
          setError('');
        }, 300);
      }
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display font-bold text-[20px]">
            Request a tool
          </DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="py-4 text-[14.5px] font-medium text-ink">
            Thanks &mdash; we read every request.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
            <div className="field">
              <label htmlFor="req-what">What should we build? *</label>
              <textarea
                id="req-what"
                value={requestText}
                onChange={(e) => setRequestText(e.target.value)}
                maxLength={4000}
                rows={3}
                disabled={isPending}
                className={`resize-none ${error && !requestText.trim() ? "!border-red" : ""}`}
              />
            </div>
            <div className="field">
              <label htmlFor="req-cost">What does this cost you today? (optional)</label>
              <input
                id="req-cost"
                type="text"
                value={currentCostText}
                onChange={(e) => setCurrentCostText(e.target.value)}
                disabled={isPending}
                className="!font-sans"
              />
            </div>
            <div className="field">
              <label htmlFor="req-email">Your email (optional)</label>
              <input
                id="req-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isPending}
                className="!font-sans"
              />
            </div>
            {error && <div className="error-text !mt-0">{error}</div>}
            <div className="flex justify-end mt-2">
              <button type="submit" disabled={isPending} className="btn primary w-full sm:w-auto">
                {isPending ? 'Submitting...' : 'Submit request'}
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
