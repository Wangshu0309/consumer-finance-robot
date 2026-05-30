import { useMemo } from 'react';
import type { TrendPoint } from '../types';

interface Props { data: TrendPoint[] }

const W = 800; const H = 260;
const P = { top: 16, right: 20, bottom: 58, left: 64 };
const IW = W - P.left - P.right; const IH = H - P.top - P.bottom;

export default function MarginLineChart({ data }: Props) {
  const { valid, gmMin, gmMax } = useMemo(() => {
    const v = data.filter(d => d.gross_margin >= 1);
    if (v.length < 2) return { valid: v, gmMin: 0, gmMax: 100 };
    const min = Math.min(...v.map(d => d.gross_margin));
    const max = Math.max(...v.map(d => d.gross_margin));
    const range = max - min || 10;
    return {
      valid: v,
      gmMin: Math.max(0, min - range * 0.15),
      gmMax: max + range * 0.15,
    };
  }, [data]);

  if (valid.length < 2) return null;

  const gap = IW / valid.length;
  const y = (v: number) => P.top + IH - ((v - gmMin) / (gmMax - gmMin)) * IH;
  const ticks = [gmMin, (gmMin + gmMax) / 2, gmMax];

  // Build smooth path using cubic bezier
  const points = valid.map((d, i) => ({ x: P.left + i * gap + gap / 2, val: d.gross_margin, year: d.year }));
  const pathD = points.map((pt, i) => {
    if (i === 0) return `M ${pt.x} ${y(pt.val)}`;
    const prev = points[i - 1];
    const cpx1 = prev.x + (pt.x - prev.x) / 2;
    const cpx2 = pt.x - (pt.x - prev.x) / 2;
    return `C ${cpx1} ${y(prev.val)}, ${cpx2} ${y(pt.val)}, ${pt.x} ${y(pt.val)}`;
  }).join(' ');

  // Area fill under the line
  const areaD = pathD + ` L ${points[valid.length - 1].x} ${y(gmMin)} L ${points[0].x} ${y(gmMin)} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {/* Area fill */}
      <path d={areaD} fill="rgba(74,222,128,0.06)" />

      {/* Grid + ticks */}
      {ticks.map(t => (
        <g key={t}>
          <line x1={P.left} y1={y(t)} x2={W - P.right} y2={y(t)}
            stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
          <text x={P.left - 8} y={y(t) + 5} textAnchor="end"
            fill="#a8a498" fontSize="12" fontFamily="monospace">
            {t.toFixed(1)}%
          </text>
        </g>
      ))}

      {/* Line */}
      <path d={pathD} fill="none" stroke="#4ade80" strokeWidth="2.8"
        strokeLinecap="round" strokeLinejoin="round" />

      {/* Dots + value labels */}
      {points.map((pt) => (
        <g key={pt.x}>
          <circle cx={pt.x} cy={y(pt.val)} r="4.5"
            fill="#4ade80" stroke="#141826" strokeWidth="1.5">
            <title>{pt.year}年 毛利率 {pt.val.toFixed(1)}%</title>
          </circle>
          <text x={pt.x} y={y(pt.val) - 10} textAnchor="middle"
            fill="#4ade80" fontSize="11" fontFamily="monospace" fontWeight="600">
            {pt.val.toFixed(1)}%
          </text>
        </g>
      ))}

      {/* X labels */}
      {valid.map((d, i) => (
        <text key={d.year} x={P.left + i * gap + gap / 2} y={H - 6} textAnchor="middle"
          fill="#a8a498" fontSize="12" fontFamily="monospace">
          {d.year}
        </text>
      ))}

      {/* X-axis title */}
      <text x={W / 2} y={H - 32} textAnchor="middle" fill="#7d7a72" fontSize="11">年份</text>

      {/* Y-axis title */}
      <text x={14} y={P.top + IH / 2} textAnchor="middle" fill="#7d7a72" fontSize="11"
        transform={`rotate(-90, 14, ${P.top + IH / 2})`}>毛利率 (%)</text>

      {/* Expense ratio line */}
      <polyline fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="6,3"
        strokeLinecap="round" strokeLinejoin="round"
        points={valid.map((d,i) => `${P.left+i*gap+gap/2},${y(d.expense_ratio)}`).join(' ')}/>
      {valid.map((d,i) => (
        <g key={`er-${d.year}`}>
          <circle cx={P.left+i*gap+gap/2} cy={y(d.expense_ratio)} r="3"
            fill="#f59e0b" stroke="#141826" strokeWidth="1">
            <title>{d.year}年 期间费用率 {d.expense_ratio.toFixed(1)}%</title>
          </circle>
        </g>
      ))}

      {/* Legend */}
      <rect x={P.left + 4} y={P.top + 2} width="10" height="10" rx="5" fill="#4ade80" />
      <text x={P.left + 18} y={P.top + 12} fill="#a8a498" fontSize="11">毛利率</text>
      <line x1={P.left + 64} y1={P.top + 7} x2={P.left + 88} y2={P.top + 7}
        stroke="#f59e0b" strokeWidth="2" strokeDasharray="6,3"/>
      <text x={P.left + 92} y={P.top + 12} fill="#a8a498" fontSize="11">期间费用率</text>
    </svg>
  );
}
