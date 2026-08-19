import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'wouter';
import { SiteHeader, SiteFooter } from '@/components/layout';
import { SignupDialog } from '@/components/signup-dialog';
import { PageCopyRenderer } from '@/components/page-copy-renderer';
import { useSeo, parsePageCopy } from '@/lib/seo';
import { useGetToolBySlug, useLogUsageEvent, useListTools } from '@workspace/api-client-react';
import { 
  computeAmortisation, 
  validateInputs, 
  DEFAULT_INPUTS, 
  formatAUD, 
  groupRowsByYear, 
  FREQUENCIES,
  AmortisationInputs,
  AmortisationResult,
  Frequency
} from '@/lib/amortisation';

const SLUG = 'amortisation-schedule-calculator';

export default function AmortisationCalculatorPage() {
  const [signupOpen, setSignupOpen] = useState(false);
  const [inputs, setInputs] = useState<AmortisationInputs>(DEFAULT_INPUTS);
  
  // Keep track of the actual strings for the inputs to allow decimal typing without breaking
  const [rawInputs, setRawInputs] = useState({
    amountFinanced: String(DEFAULT_INPUTS.amountFinanced),
    annualRatePct: String(DEFAULT_INPUTS.annualRatePct),
    termYears: String(DEFAULT_INPUTS.termYears),
    balloon: String(DEFAULT_INPUTS.balloon),
  });

  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set([1]));

  const { data: tool, isLoading: toolLoading, error: toolError } = useGetToolBySlug(SLUG);
  const { data: tools } = useListTools();
  const relatedTools = tools?.filter(t => t.slug !== SLUG) || [];
  
  const { mutateAsync: logEvent } = useLogUsageEvent();

  const [debouncedInputs, setDebouncedInputs] = useState<AmortisationInputs>(inputs);
  const settleTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedInputs(inputs);
    }, 150);
    return () => clearTimeout(timer);
  }, [inputs]);

  useEffect(() => {
    // When debounced inputs change, wait 1.5s then log event if valid
    if (settleTimerRef.current) {
      clearTimeout(settleTimerRef.current);
    }
    
    const errors = validateInputs(debouncedInputs);
    if (Object.keys(errors).length === 0) {
      settleTimerRef.current = window.setTimeout(() => {
        logEvent({
          data: {
            toolSlug: SLUG,
            eventType: 'calculate',
            payload: debouncedInputs as any
          }
        }).catch(err => {
          console.warn('Failed to log calculation event', err);
        });
      }, 1500);
    }

    return () => {
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    };
  }, [debouncedInputs, logEvent]);

  let faqsData: any[] = [];
  if (tool?.pageCopy) {
    const parsed = parsePageCopy(tool.pageCopy);
    faqsData = parsed.faqs;
  }

  useSeo({
    title: tool?.seoTitle || 'Amortisation Schedule Calculator — Fintech Tools',
    description: tool?.seoDescription || 'Full repayment schedule with balloon/residual support.',
    path: `/${SLUG}`,
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": tool?.name || "Amortisation Schedule Calculator",
        "applicationCategory": "FinanceApplication",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "AUD"
        }
      },
      ...(faqsData.length > 0 ? [{
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
      }] : [])
    ]
  });

  const handleInputChange = (field: keyof AmortisationInputs, rawValue: string) => {
    if (field !== 'frequency') {
      setRawInputs(prev => ({ ...prev, [field]: rawValue }));
    }
    const num = Number(rawValue);
    setInputs(prev => ({ ...prev, [field]: isNaN(num) ? 0 : num }));
  };

  const outcome = useMemo(() => computeAmortisation(debouncedInputs), [debouncedInputs]);
  const isValid = outcome.ok;
  const errors = outcome.ok ? {} : outcome.errors;

  // Keep the last valid result without re-render churn (no setState during render/effect loops)
  const lastValidResultRef = useRef<AmortisationResult | null>(null);
  if (outcome.ok) {
    lastValidResultRef.current = outcome.result;
  }
  const result = outcome.ok ? outcome.result : lastValidResultRef.current;

  // Collapse back to year 1 when the inputs (and so the schedule shape) change
  useEffect(() => {
    setExpandedYears(new Set([1]));
  }, [debouncedInputs]);

  const toggleYear = (year: number) => {
    setExpandedYears(prev => {
      const next = new Set(prev);
      if (next.has(year)) next.delete(year);
      else next.add(year);
      return next;
    });
  };

  const expandAll = () => {
    if (!result) return;
    const groups = groupRowsByYear(result.rows, result.inputs.frequency);
    setExpandedYears(new Set(groups.map(g => g.year)));
  };

  const collapseAll = () => {
    setExpandedYears(new Set());
  };

  if (toolLoading) {
    return (
      <div className="min-h-[100dvh] flex flex-col">
        <SiteHeader onSignupClick={() => setSignupOpen(true)} />
        <main className="flex-1 max-w-[900px] mx-auto px-[16px] py-[18px] w-full animate-pulse">
          <div className="h-[20px] w-[100px] bg-rule rounded-sm mb-[14px]"></div>
          <div className="bg-card border border-rule rounded-[14px] h-[500px]"></div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (toolError || !tool) {
    return (
      <div className="min-h-[100dvh] flex flex-col">
        <SiteHeader onSignupClick={() => setSignupOpen(true)} />
        <main className="flex-1 max-w-[900px] mx-auto px-[16px] py-[48px] w-full text-center text-red">
          Tool not found or temporarily unavailable.
          <div className="mt-4"><Link href="/" className="btn">Return to directory</Link></div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const freqLabel = FREQUENCIES.find(f => f.value === debouncedInputs.frequency)?.label || 'Monthly';
  const displayResult = result;

  let groupedRows: { year: number; rows: any[] }[] = [];
  if (displayResult) {
    groupedRows = groupRowsByYear(displayResult.rows, displayResult.inputs.frequency);
  }

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <SiteHeader onSignupClick={() => setSignupOpen(true)} />
      
      <main className="flex-1 max-w-[900px] mx-auto px-[12px] sm:px-[16px] pt-[14px] sm:pt-[18px] pb-[40px] sm:pb-[48px] w-full" id="toolpage">
        <div className="text-[13px] text-ink-soft my-[2px] mb-[14px]">
          <Link href="/" className="border-none bg-none text-blue-deep font-semibold text-[13px] underline py-[6px]">
            &larr; All tools
          </Link>
        </div>

        <div className="bg-card border border-rule rounded-[14px] overflow-hidden">
          {/* Header */}
          <div className="flex items-baseline justify-between gap-[8px] flex-wrap px-[14px] sm:px-[18px] pt-[16px]">
            <h1 className="font-display font-extrabold text-[20px] tracking-[-.01em] text-ink">{tool.name}</h1>
            {/* OMIT brand chip as per spec */}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-[minmax(230px,300px)_1fr]">
            {/* Inputs */}
            <div className="px-[14px] sm:px-[18px] pt-[16px] pb-[20px] border-b sm:border-b-0 sm:border-r border-rule">
              <div className="field">
                <label>Amount financed</label>
                <input 
                  type="number" 
                  inputMode="decimal" 
                  value={rawInputs.amountFinanced}
                  onChange={(e) => handleInputChange('amountFinanced', e.target.value)}
                  min="0" 
                  step="500" 
                  className={errors.amountFinanced ? "!border-red" : ""}
                />
                {errors.amountFinanced && <div className="error-text">{errors.amountFinanced}</div>}
              </div>
              <div className="field">
                <label>Annual rate (%)</label>
                <input 
                  type="number" 
                  inputMode="decimal" 
                  value={rawInputs.annualRatePct}
                  onChange={(e) => handleInputChange('annualRatePct', e.target.value)}
                  min="0" 
                  step="0.01"
                  className={errors.annualRatePct ? "!border-red" : ""}
                />
                {errors.annualRatePct && <div className="error-text">{errors.annualRatePct}</div>}
              </div>
              <div className="field">
                <label>Term (years)</label>
                <input 
                  type="number" 
                  inputMode="numeric" 
                  value={rawInputs.termYears}
                  onChange={(e) => handleInputChange('termYears', e.target.value)}
                  min="1" 
                  max="30" 
                  step="0.5"
                  className={errors.termYears ? "!border-red" : ""}
                />
                {errors.termYears && <div className="error-text">{errors.termYears}</div>}
              </div>
              <div className="field">
                <label>Balloon / residual</label>
                <input 
                  type="number" 
                  inputMode="decimal" 
                  value={rawInputs.balloon}
                  onChange={(e) => handleInputChange('balloon', e.target.value)}
                  min="0" 
                  step="500"
                  className={errors.balloon ? "!border-red" : ""}
                />
                {errors.balloon && <div className="error-text">{errors.balloon}</div>}
              </div>
              <div className="field">
                <label>Repayment frequency</label>
                <select 
                  value={inputs.frequency}
                  onChange={(e) => handleInputChange('frequency', e.target.value)}
                  className={errors.frequency ? "!border-red" : ""}
                >
                  <option value="12">Monthly</option>
                  <option value="26">Fortnightly</option>
                  <option value="52">Weekly</option>
                </select>
                {errors.frequency && <div className="error-text">{errors.frequency}</div>}
              </div>
            </div>

            {/* Results */}
            <div className={`px-[14px] sm:px-[18px] pt-[16px] pb-[20px] bg-[#FBFBFA] min-w-0 flex flex-col transition-opacity duration-200 ${!isValid ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
              {displayResult ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-[10px] mb-[16px]">
                    <div className="border border-yellow bg-yellow rounded-[10px] px-[13px] py-[11px] min-w-0 sm:col-span-3">
                      <div className="text-[10.5px] font-semibold tracking-[.04em] uppercase text-[#5A5220]">{freqLabel} repayment</div>
                      <div className="text-[17px] font-semibold mt-[2px] overflow-wrap-anywhere num text-charcoal flex items-baseline gap-1">
                        {formatAUD(displayResult.periodicRepayment)}
                        <span className="text-[12px] font-sans font-medium text-[#5A5220] opacity-80">/{freqLabel.toLowerCase().replace('ly', '')}</span>
                      </div>
                    </div>
                    <div className="border border-rule bg-white rounded-[10px] px-[13px] py-[11px] min-w-0">
                      <div className="text-[10.5px] font-semibold tracking-[.04em] uppercase text-ink-soft">Total interest</div>
                      <div className="text-[17px] font-semibold mt-[2px] overflow-wrap-anywhere num text-ink">{formatAUD(displayResult.totalInterest)}</div>
                    </div>
                    <div className="border border-rule bg-white rounded-[10px] px-[13px] py-[11px] min-w-0">
                      <div className="text-[10.5px] font-semibold tracking-[.04em] uppercase text-ink-soft">Total payable</div>
                      <div className="text-[17px] font-semibold mt-[2px] overflow-wrap-anywhere num text-ink">{formatAUD(displayResult.totalPayable)}</div>
                    </div>
                    <div className="border border-rule bg-white rounded-[10px] px-[13px] py-[11px] min-w-0">
                      <div className="text-[10.5px] font-semibold tracking-[.04em] uppercase text-ink-soft">Payments</div>
                      <div className="text-[17px] font-semibold mt-[2px] overflow-wrap-anywhere num text-ink">{displayResult.periods}</div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-[14px]">Schedule</h3>
                    <div className="flex gap-3 text-[12px]">
                      <button onClick={expandAll} className="text-blue-deep hover:underline">Expand all</button>
                      <button onClick={collapseAll} className="text-blue-deep hover:underline">Collapse all</button>
                    </div>
                  </div>

                  <div className="overflow-x-auto overflow-scrolling-touch flex-1 border border-rule rounded-md bg-white">
                    <table className="w-full min-w-[480px] border-collapse text-[13px] relative">
                      <thead className="sticky top-0 bg-white z-10">
                        <tr>
                          <th className="text-left text-[11px] tracking-[.05em] uppercase text-ink-soft font-semibold px-[8px] py-[6px] border-b border-charcoal bg-white">#</th>
                          <th className="text-right text-[11px] tracking-[.05em] uppercase text-ink-soft font-semibold px-[8px] py-[6px] border-b border-charcoal bg-white">Payment</th>
                          <th className="text-right text-[11px] tracking-[.05em] uppercase text-ink-soft font-semibold px-[8px] py-[6px] border-b border-charcoal bg-white">Interest</th>
                          <th className="text-right text-[11px] tracking-[.05em] uppercase text-ink-soft font-semibold px-[8px] py-[6px] border-b border-charcoal bg-white">Principal</th>
                          <th className="text-right text-[11px] tracking-[.05em] uppercase text-ink-soft font-semibold px-[8px] py-[6px] border-b border-charcoal bg-white">Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupedRows.map(group => {
                          const isExpanded = expandedYears.has(group.year);
                          const yearPayments = group.rows.reduce((sum, r) => sum + r.payment, 0);
                          const yearInterest = group.rows.reduce((sum, r) => sum + r.interest, 0);
                          const yearPrincipal = group.rows.reduce((sum, r) => sum + r.principal, 0);
                          const closingBal = group.rows[group.rows.length - 1].balance;

                          return (
                            <React.Fragment key={group.year}>
                              {/* Subtotal row */}
                              <tr 
                                className="bg-[#FAFAFA] cursor-pointer hover:bg-[#F2F1EE] border-b border-[#EFEEEA]"
                                onClick={() => toggleYear(group.year)}
                              >
                                <td className="text-left px-[8px] py-[8px] font-semibold text-ink whitespace-nowrap">
                                  <span className="inline-block w-4">{isExpanded ? '▼' : '▶'}</span> Year {group.year}
                                </td>
                                <td className="text-right px-[8px] py-[8px] font-medium num text-ink">{formatAUD(yearPayments)}</td>
                                <td className="text-right px-[8px] py-[8px] font-medium num text-ink">{formatAUD(yearInterest)}</td>
                                <td className="text-right px-[8px] py-[8px] font-medium num text-ink">{formatAUD(yearPrincipal)}</td>
                                <td className="text-right px-[8px] py-[8px] font-medium num text-ink">{formatAUD(closingBal)}</td>
                              </tr>
                              
                              {/* Detailed rows */}
                              {isExpanded && group.rows.map(row => (
                                <tr key={row.period} className="border-b border-[#EFEEEA]">
                                  <td className="text-left px-[8px] py-[6px] num text-ink-soft">{row.period}</td>
                                  <td className="text-right px-[8px] py-[6px] num text-ink">{formatAUD(row.payment)}</td>
                                  <td className="text-right px-[8px] py-[6px] num text-ink">{formatAUD(row.interest)}</td>
                                  <td className="text-right px-[8px] py-[6px] num text-ink">{formatAUD(row.principal)}</td>
                                  <td className="text-right px-[8px] py-[6px] num text-ink">{formatAUD(row.balance)}</td>
                                </tr>
                              ))}
                            </React.Fragment>
                          );
                        })}
                        
                        {displayResult.balloon > 0 && (
                          <tr className="text-red font-medium border-b border-[#EFEEEA]">
                            <td colSpan={4} className="text-left px-[8px] py-[8px]">Residual / balloon due</td>
                            <td className="text-right px-[8px] py-[8px] num">{formatAUD(displayResult.balloon)}</td>
                          </tr>
                        )}
                        
                        <tr className="font-semibold text-ink" style={{ borderTop: '1px solid var(--charcoal)', borderBottom: '3px double var(--charcoal)' }}>
                          <td className="text-left px-[8px] py-[8px]">Totals</td>
                          <td className="text-right px-[8px] py-[8px] num text-ink">{formatAUD(displayResult.totalPayable)}</td>
                          <td className="text-right px-[8px] py-[8px] num text-ink">{formatAUD(displayResult.totalInterest)}</td>
                          {/* Principal total includes the residual so the totals row cross-foots: payment = interest + principal */}
                          <td className="text-right px-[8px] py-[8px] num text-ink">{formatAUD(displayResult.totalPrincipal + displayResult.balloon)}</td>
                          <td className="text-right px-[8px] py-[8px] num text-ink">{formatAUD(0)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-ink-soft">
                  Enter valid details to calculate schedule.
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-[10px] flex-wrap px-[14px] sm:px-[18px] py-[14px] border-t border-rule bg-[#FBFBFA]">
            <button className="btn primary" onClick={() => setSignupOpen(true)}>Export branded PDF</button>
            <button className="btn ghost" onClick={() => setSignupOpen(true)}>Download CSV</button>
            <span className="text-[12px] text-ink-soft w-full sm:w-auto">Sign in to export with your firm's logo and colours.</span>
          </div>
        </div>

        <PageCopyRenderer copy={tool.pageCopy} />

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
      <SignupDialog open={signupOpen} onOpenChange={setSignupOpen} toolSlug={SLUG} />
    </div>
  );
}
