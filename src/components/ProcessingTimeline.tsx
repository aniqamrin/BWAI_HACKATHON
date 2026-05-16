import { Check, Circle, Loader2 } from 'lucide-react';
import type { ProcessingStep } from '../state/useCohortDemo';

type ProcessingTimelineProps = {
  steps: ProcessingStep[];
};

const statusStyles = {
  pending: 'border-[#b9ad99] text-[#766c5d]',
  active: 'border-[#17211c] bg-[#17211c] text-[#f7f1e5]',
  done: 'border-[#2f5d46] bg-[#dce8d4] text-[#234634]',
} satisfies Record<ProcessingStep['status'], string>;

function StepIcon({ status }: { status: ProcessingStep['status'] }) {
  if (status === 'done') return <Check size={15} strokeWidth={2.5} aria-hidden="true" />;
  if (status === 'active') return <Loader2 size={15} className="animate-spin" strokeWidth={2.5} aria-hidden="true" />;
  return <Circle size={13} strokeWidth={2.5} aria-hidden="true" />;
}

export function ProcessingTimeline({ steps }: ProcessingTimelineProps) {
  return (
    <section className="transition-surface border border-[#9d8f77] bg-[#fffaf0] p-5">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-2xl font-semibold leading-none">Processing timeline</h2>
        <span className="ui-sans text-xs font-semibold uppercase tracking-[0.12em] text-[#657064]">Local pipeline</span>
      </div>
      <ol className="space-y-3">
        {steps.map((step) => (
          <li key={step.id} className="grid grid-cols-[2rem_1fr] gap-3">
            <span
              className={`mt-0.5 flex size-8 items-center justify-center border ${statusStyles[step.status]}`}
              aria-label={`${step.label}: ${step.status}`}
            >
              <StepIcon status={step.status} />
            </span>
            <span>
              <span className="ui-sans block text-sm font-semibold uppercase tracking-[0.08em] text-[#26352d]">
                {step.label}
              </span>
              <span className="ui-sans mt-1 block text-sm leading-5 text-[#657064]">{step.detail}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
