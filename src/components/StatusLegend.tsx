import type { HealthStatus } from '../domain/types';

type LegendItem = {
  status: HealthStatus;
  label: string;
  definition: string;
  swatchClass: string;
};

const legendItems: LegendItem[] = [
  {
    status: 'healthy',
    label: 'Healthy',
    definition: 'High confidence, active progress, and no urgent blocker.',
    swatchClass: 'bg-[#47594e]',
  },
  {
    status: 'watch',
    label: 'Watch',
    definition: 'Promising motion with one unresolved operating risk.',
    swatchClass: 'bg-[#b28c55]',
  },
  {
    status: 'at-risk',
    label: 'At risk',
    definition: 'Low confidence, weak cadence, or blocker needing intervention.',
    swatchClass: 'bg-[#8f3d34]',
  },
];

export function StatusLegend() {
  return (
    <section className="ui-sans border border-[#9d8f77] bg-[#fffaf0] p-4" aria-label="Relationship health legend">
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[#6c715f]">Status legend</p>
      <div className="mt-3 grid gap-3">
        {legendItems.map((item) => (
          <div key={item.status} className="grid grid-cols-[10px_minmax(0,1fr)] gap-3">
            <span className={`mt-1 h-2.5 w-2.5 ${item.swatchClass}`} aria-hidden="true" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#17211c]">{item.label}</p>
              <p className="mt-1 text-xs leading-5 text-[#59675e]">{item.definition}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
