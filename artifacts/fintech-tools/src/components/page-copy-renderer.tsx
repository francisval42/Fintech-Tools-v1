import { parsePageCopy } from '@/lib/seo';

export function PageCopyRenderer({ copy }: { copy: string }) {
  const { howItWorks, whoItsFor, howHeading, whoHeading, faqs } = parsePageCopy(copy);

  if (!howItWorks.length && !whoItsFor.length && !faqs.length) {
    return null; // Don't render empty sections
  }

  return (
    <div className="content max-w-[720px] mx-auto mt-[26px] mb-[8px] px-[2px]">
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
  );
}
