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
  if (!features) return null;

  return (
    <details className="mt-4 bg-white rounded-xl shadow">
      <summary className="px-5 py-3.5 text-sm font-semibold text-gray-600 cursor-pointer select-none hover:text-gray-800">
        核心财务指标
      </summary>
      <table className="w-full border-collapse text-sm">
        <tbody>
          {Object.entries(FEATURE_LABELS).map(([key, label]) => {
            const value = features[key as keyof FeatureData];
            const formatter = FORMATTERS[key] || formatRatio;
            return (
              <tr key={key} className="border-t border-gray-50">
                <td className="py-2.5 pl-5 text-gray-500 w-1/2">{label}</td>
                <td className="py-2.5 pr-5 text-right font-medium text-gray-800">
                  {formatter(value)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </details>
  );
}
