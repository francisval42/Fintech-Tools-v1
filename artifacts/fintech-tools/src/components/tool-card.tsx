import { Link } from 'wouter';
import { StepMark } from './layout';
import type { ToolSummary } from '@workspace/api-client-react';

export function ToolCard({ tool }: { tool: ToolSummary }) {
  return (
    <Link
      href={`/${tool.slug}`}
      className="bg-card border border-rule rounded-[14px] p-[18px] text-left flex flex-col gap-[9px] transition-colors hover:border-blue active:scale-[0.99]"
      data-testid={`tool-card-${tool.slug}`}
    >
      <StepMark />
      <h2 className="font-display text-[16.5px] font-bold leading-[1.25] text-ink">{tool.name}</h2>
      <p className="text-[13.5px] text-ink-soft flex-1">{tool.blurb}</p>
      {tool.status === 'live' ? (
        <span className="text-[13px] font-semibold text-blue-deep">Open calculator &rarr;</span>
      ) : (
        <span className="font-mono text-[10.5px] tracking-[.06em] uppercase text-ink-soft">Coming soon</span>
      )}
    </Link>
  );
}
