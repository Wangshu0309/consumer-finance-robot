import { useMemo } from 'react';
import type { TrendPoint } from '../types';

interface Props { data: TrendPoint[] }

const W = 800; const H = 260;
const P = { top: 22, right: 30, bottom: 52, left: 68 };
const IW = W - P.left - P.right; const IH = H - P.top - P.bottom;

export default function TurnoverChart({ data }: Props) {
  const chartData = useMemo(() => {
    const v = data.filter(d => d.inventory_turnover_days > 0 || d.ar_turnover_days > 0);
    if (v.length < 2) return null;
    const invVals = v.map(d => d.inventory_turnover_days).filter(x => x > 0);
    const arVals = v.map(d => d.ar_turnover_days).filter(x => x > 0);
    const allVals = [...invVals, ...arVals];
    const min = Math.min(...allVals) * 0.85;
    const max = Math.max(...allVals) * 1.15;
    return { valid: v, yMin: min, yMax: max };
  }, [data]);

  if (!chartData) return null;
  const { valid, yMin, yMax } = chartData;
  const yRange = yMax - yMin;
  const gap = IW / valid.length;
  const y = (v: number) => P.top + IH - ((v - yMin) / yRange) * IH;
  const ticks = [yMin, (yMin + yMax) / 2, yMax];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {ticks.map(t => (
        <g key={t}>
          <line x1={P.left} y1={y(t)} x2={W-P.right} y2={y(t)}
            stroke="rgba(255,255,255,0.05)" strokeWidth="0.5"/>
          <text x={P.left-8} y={y(t)+5} textAnchor="end"
            fill="#a8a498" fontSize="11" fontFamily="monospace">
            {t.toFixed(0)}天
          </text>
        </g>
      ))}

      {/* Inventory turnover line */}
      <polyline fill="none" stroke="#f59e0b" strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round"
        points={valid.map((d,i) => {
          if (d.inventory_turnover_days <= 0) return '';
          return `${P.left+i*gap+gap/2},${y(d.inventory_turnover_days)}`;
        }).filter(Boolean).join(' ')}/>

      {/* AR turnover line */}
      <polyline fill="none" stroke="#60a5fa" strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round"
        points={valid.map((d,i) => {
          if (d.ar_turnover_days <= 0) return '';
          return `${P.left+i*gap+gap/2},${y(d.ar_turnover_days)}`;
        }).filter(Boolean).join(' ')}/>

      {valid.map((d,i) => (
        <g key={d.year}>
          {d.inventory_turnover_days > 0 && (
            <circle cx={P.left+i*gap+gap/2} cy={y(d.inventory_turnover_days)} r="4"
              fill="#f59e0b" stroke="#141826" strokeWidth="1.5">
              <title>{d.year}年 存货周转 {d.inventory_turnover_days}天</title>
            </circle>
          )}
          {d.ar_turnover_days > 0 && (
            <circle cx={P.left+i*gap+gap/2} cy={y(d.ar_turnover_days)} r="4"
              fill="#60a5fa" stroke="#141826" strokeWidth="1.5">
              <title>{d.year}年 应收周转 {d.ar_turnover_days}天</title>
            </circle>
          )}
        </g>
      ))}

      {valid.map((d,i) => (
        <text key={`yr-${d.year}`} x={P.left+i*gap+gap/2} y={H-8} textAnchor="middle"
          fill="#a8a498" fontSize="12" fontFamily="monospace">{d.year}</text>
      ))}

      <text x={W/2} y={H-30} textAnchor="middle" fill="#7d7a72" fontSize="11">年份</text>
      <text x={14} y={P.top+IH/2} textAnchor="middle" fill="#7d7a72" fontSize="11"
        transform={`rotate(-90, 14, ${P.top+IH/2})`}>天</text>

      <rect x={P.left+4} y={P.top-2} width="10" height="10" rx="2" fill="#f59e0b"/>
      <text x={P.left+18} y={P.top+8} fill="#a8a498" fontSize="11">存货周转天数</text>
      <rect x={P.left+108} y={P.top-2} width="10" height="10" rx="2" fill="#60a5fa"/>
      <text x={P.left+122} y={P.top+8} fill="#a8a498" fontSize="11">应收周转天数</text>
    </svg>
  );
}
