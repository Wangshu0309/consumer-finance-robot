import type { TrendPoint } from '../types';

interface Props { data: TrendPoint[] }

const W = 800; const H = 300;
const P = { top: 20, right: 30, bottom: 62, left: 68 };
const IW = W - P.left - P.right; const IH = H - P.top - P.bottom;

export default function RevenueBarChart({ data }: Props) {
  if (!data || data.length < 2) return null;

  const max = Math.max(...data.map(d => d.revenue)) * 1.2;
  const barW = Math.max(16, Math.min(38, IW / data.length * 0.45));
  const gap = IW / data.length;
  const ticks = [0, max * 0.25, max * 0.5, max * 0.75, max];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {ticks.map(t => (
        <g key={t}>
          <line x1={P.left} y1={P.top + IH - (t/max)*IH} x2={W-P.right} y2={P.top + IH - (t/max)*IH}
            stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
          <text x={P.left-8} y={P.top + IH - (t/max)*IH + 5} textAnchor="end"
            fill="#a8a498" fontSize="12" fontFamily="monospace">
            {t >= 10000 ? (t/10000).toFixed(1)+'万亿' : t >= 1 ? t.toFixed(0)+'亿' : t.toFixed(2)+'亿'}
          </text>
        </g>
      ))}

      {data.map((d, i) => {
        const x = P.left + i * gap + (gap - barW) / 2;
        const h = (d.revenue / max) * IH;
        const sign = d.revenue_growth >= 0 ? '+' : '';
        const trend = d.revenue_growth > 15 ? '高速增长' : d.revenue_growth > 5 ? '稳健增长' : d.revenue_growth > 0 ? '微增' : d.revenue_growth > -5 ? '基本持平' : d.revenue_growth > -15 ? '明显下滑' : '大幅收缩';
        const title = `${d.year}年 · 营收 ${d.revenue} 亿 · 同比 ${sign}${d.revenue_growth}%（${trend}）`;
        return (
          <g key={d.year}>
            <rect x={x} y={P.top + IH - h} width={barW} height={h} rx="3" fill="url(#barGrad)" opacity="0.9" />
            <rect x={x} y={P.top + IH - h} width={barW} height={h} rx="3" fill="transparent">
              <title>{title}</title>
            </rect>
            <text x={x + barW/2} y={P.top + IH - h - 6} textAnchor="middle"
              fill="#dfc278" fontSize="10.5" fontFamily="monospace" fontWeight="700">{d.revenue}</text>
            <text x={P.left + i * gap + gap/2} y={H - 8} textAnchor="middle"
              fill="#a8a498" fontSize="12" fontFamily="monospace">{d.year}</text>
          </g>
        );
      })}

      <text x={W / 2} y={H - 36} textAnchor="middle" fill="#7d7a72" fontSize="11">年份</text>
      <text x={14} y={P.top + IH / 2} textAnchor="middle" fill="#7d7a72" fontSize="11"
        transform={`rotate(-90, 14, ${P.top + IH / 2})`}>单位：亿</text>
      <rect x={P.left + 4} y={P.top - 2} width="10" height="10" rx="2" fill="url(#barGrad)" opacity="0.9" />
      <text x={P.left + 18} y={P.top + 8} fill="#a8a498" fontSize="11">营业收入</text>

      <defs>
        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#dfc278" stopOpacity="0.95"/>
          <stop offset="100%" stopColor="#8b7535" stopOpacity="0.45"/>
        </linearGradient>
      </defs>
    </svg>
  );
}
