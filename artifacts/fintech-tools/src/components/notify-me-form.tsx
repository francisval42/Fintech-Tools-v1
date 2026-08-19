import { useState } from 'react';
import { useCreateToolRequest, useLogUsageEvent } from '@workspace/api-client-react';
import { z } from 'zod';

const emailSchema = z.string().email('Please enter a valid email address.');

export function NotifyMeForm({ toolSlug, toolName }: { toolSlug: string, toolName: string }) {
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
            requestText: `Notify me: ${toolName}`,
            email
          }
        }),
        logEvent({
          data: {
            toolSlug,
            eventType: 'notify_me',
            payload: { source: 'coming_soon' }
          }
        })
      ]);
      setSuccess(true);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    }
  };

  if (success) {
    return (
      <div className="mt-[24px] p-[16px] bg-[#EBEFFE] border border-[#BACDFB] rounded-[8px] text-blue-deep text-[14px] font-medium text-center">
        Thanks &mdash; we'll email you when this tool is live.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-[24px] flex flex-col sm:flex-row gap-[8px]">
      <div className="flex-1 field !mb-0">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@firm.com.au"
          disabled={isRequesting}
          className={`!py-[9px] ${error ? "!border-red focus:!border-red" : ""}`}
        />
        {error && <div className="error-text">{error}</div>}
      </div>
      <button type="submit" disabled={isRequesting} className="btn primary w-full sm:w-auto h-[44px]">
        {isRequesting ? 'Submitting...' : 'Notify me'}
      </button>
    </form>
  );
}
