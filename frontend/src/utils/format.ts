export function formatProb(prob: number | null): string {
  if (prob === null || prob === undefined) return '--';
  return (prob * 100).toFixed(1);
}

export function formatPct(value: number | null | undefined): string {
  if (value === null || value === undefined) return '--';
  return (value * 100).toFixed(2) + '%';
}

export function formatRatio(value: number | null | undefined): string {
  if (value === null || value === undefined) return '--';
  return value.toFixed(2);
}

export function getProbColorClass(prob: number | null): string {
  if (prob === null) return 'text-gray-900';
  if (prob >= 0.6) return 'text-green-600';
  if (prob >= 0.4) return 'text-orange-600';
  return 'text-red-600';
}

export function getGaugeColorClass(prob: number | null): string {
  if (prob === null) return 'bg-gray-300';
  if (prob >= 0.6) return 'bg-green-500';
  if (prob >= 0.4) return 'bg-orange-500';
  return 'bg-red-500';
}

export const FEATURE_LABELS: Record<string, string> = {
  revenue_growth_yoy: '营收同比增长率',
  gross_margin_change: '毛利率同比变化',
  net_cash_ratio: '净现比（经营现金流/净利润）',
  selling_expense_ratio: '销售费用率',
  inventory_turnover_days_change: '存货周转天数同比变化',
  ar_turnover_days_change: '应收账款周转天数同比变化',
};
