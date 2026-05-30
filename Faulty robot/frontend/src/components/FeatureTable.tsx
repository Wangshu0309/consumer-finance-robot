import { useState } from 'react';
import { FEATURE_LABELS, formatPct, formatRatio } from '../utils/format';
import type { FeatureData } from '../types';

interface FeatureTableProps {
  features: FeatureData | null;
}

type FormatFn = (v: number | null | undefined) => string;

const FORMATTERS: Record<string, FormatFn> = {
  revenue_growth_yoy: formatPct,
  gross_margin_change: formatPct,
  net_cash_ratio: formatRatio,
  selling_expense_ratio: formatPct,
  inventory_turnover_days_change: formatPct,
  ar_turnover_days_change: formatPct,
};

export default function FeatureTable({ features }: FeatureTableProps) {
  const [open, setOpen] = useState(false);

  if (!features) return null;

  return (
    <div className="card border-white/[0.04]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-sm font-medium text-ink-secondary hover:text-ink-primary transition-colors"
      >
        <span className="flex items-center gap-2.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="9" y1="21" x2="9" y2="9" />
          </svg>
          核心财务指标
        </span>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
          className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-white/[0.04]">
          <table className="w-full text-sm">
            <tbody>
              {Object.entries(FEATURE_LABELS).map(([key, label], i) => {
                const value = features[key as keyof FeatureData];
                const formatter = FORMATTERS[key] || formatRatio;
                return (
                  <tr key={key} className={i > 0 ? 'border-t border-white/[0.03]' : ''}>
                    <td className="py-3 pl-5 text-ink-muted">{label}</td>
                    <td className="py-3 pr-5 text-right font-mono text-sm text-ink-primary tabular-nums">
                      {formatter(value)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
