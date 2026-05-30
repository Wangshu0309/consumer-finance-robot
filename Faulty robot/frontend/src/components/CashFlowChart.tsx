import type { TrendPoint } from '../types';

interface Props { data: TrendPoint[] }

const W = 800; const H = 260;
const P = { top: 22, right: 30, bottom: 52, left: 68 };
const IW = W - P.left - P.right; const IH = H - P.top - P.bottom;

export default function CashFlowChart({ data }: Props) {
  if (!data || data.length < 2) return null;

  const allVals = data.flatMap(d => [d.operating_cash_flow, d.net_profit]);
  const vMax = Math.max(...allVals) * 1.25;
  const vMin = Math.min(...allVals);
  const yBot = vMin < 0 ? vMin * 1.2 : 0;
  const yTop = vMax;
  const yRange = yTop - yBot;
  const gap = IW / data.length;
  const barW = Math.max(10, Math.min(22, IW / data.length * 0.18));

  const y = (v: number) => P.top + IH - ((v - yBot) / yRange) * IH;
  const zy = y(0);
  const ticks = vMin < 0 ? [yBot, yBot / 2, 0, yTop * 0.5, yTop] : [0, yTop * 0.25, yTop * 0.5, yTop * 0.75, yTop];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {ticks.map(t => (
        <g key={t}>
          <line x1={P.left} y1={y(t)} x2={W-P.right} y2={y(t)}
            stroke="rgba(255,255,255,0.05)" strokeWidth="0.5"/>
          <text x={P.left-8} y={y(t)+5} textAnchor="end"
            fill="#a8a498" fontSize="11" fontFamily="monospace">
            {t >= 1 ? t.toFixed(0)+'亿' : t.toFixed(1)+'亿'}
          </text>
        </g>
      ))}
      {vMin < 0 && <line x1={P.left} y1={zy} x2={W-P.right} y2={zy}
        stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>}

      {/* Cash flow bars */}
      {data.map((d, i) => {
        const cx = P.left + i * gap + gap * 0.25;
        return (
          <g key={`cf-${d.year}`}>
            <rect x={cx - barW/2} y={y(Math.max(d.operating_cash_flow, 0))}
              width={barW} height={Math.abs(d.operating_cash_flow) / yRange * IH} rx="2"
              fill="rgba(96,165,250,0.8)" opacity="0.85">
              <title>{d.year}年 经营现金流 {d.operating_cash_flow}亿</title>
            </rect>
          </g>
        );
      })}

      {/* Net profit bars */}
      {data.map((d, i) => {
        const cx = P.left + i * gap + gap * 0.75;
        return (
          <g key={`np-${d.year}`}>
            <rect x={cx - barW/2} y={y(Math.max(d.net_profit, 0))}
              width={barW} height={Math.abs(d.net_profit) / yRange * IH} rx="2"
              fill={d.net_profit >= 0 ? "rgba(74,222,128,0.8)" : "rgba(248,113,113,0.8)"} opacity="0.85">
              <title>{d.year}年 归母净利润 {d.net_profit}亿</title>
            </rect>
          </g>
        );
      })}

      {data.map((d,i) => (
        <text key={`yr-${d.year}`} x={P.left+i*gap+gap/2} y={H-8} textAnchor="middle"
          fill="#a8a498" fontSize="12" fontFamily="monospace">{d.year}</text>
      ))}

      <text x={W/2} y={H-30} textAnchor="middle" fill="#7d7a72" fontSize="11">年份</text>
      <text x={14} y={P.top+IH/2} textAnchor="middle" fill="#7d7a72" fontSize="11"
        transform={`rotate(-90, 14, ${P.top+IH/2})`}>亿</text>

      <rect x={P.left+4} y={P.top-2} width="10" height="10" rx="2" fill="rgba(96,165,250,0.8)"/>
      <text x={P.left+18} y={P.top+8} fill="#a8a498" fontSize="11">经营现金流</text>
      <rect x={P.left+98} y={P.top-2} width="10" height="10" rx="2" fill="rgba(74,222,128,0.8)"/>
      <text x={P.left+112} y={P.top+8} fill="#a8a498" fontSize="11">归母净利润</text>
    </svg>
  );
}
