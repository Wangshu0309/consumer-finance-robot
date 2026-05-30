import type { TrendPoint } from '../types';

interface TrendChartProps { data: TrendPoint[] }

const W = 800; const H = 300;
const PAD = { top: 22, right: 68, bottom: 52, left: 68 };
const IW = W - PAD.left - PAD.right; const IH = H - PAD.top - PAD.bottom;

function fmt(v: number): string {
  if (Math.abs(v) >= 10000) return (v / 10000).toFixed(1) + '万亿';
  if (Math.abs(v) >= 1) return v.toFixed(0) + '亿';
  return v.toFixed(2) + '亿';
}

export default function TrendChart({ data }: TrendChartProps) {
  if (!data || data.length < 2) return null;

  const revMax = Math.max(...data.map(d => d.revenue));
  const revTop = revMax * 1.2;
  const npAll = data.map(d => d.net_profit);
  const npMax = Math.max(...npAll);
  const npMin = Math.min(...npAll);
  const npPad = Math.max(Math.abs(npMax), Math.abs(npMin)) * 0.15 || 0.5;
  const npTop = npMax + npPad;
  const npBot = npMin - npPad;
  const barW = Math.max(8, Math.min(28, IW / data.length * 0.35));
  const xScale = (i: number) => PAD.left + (i + 0.5) * (IW / data.length);
  const revY = (v: number) => PAD.top + IH - (v / revTop) * IH;
  const zeroY = revY(0);
  const npY = (v: number) => PAD.top + IH - ((v - npBot) / (npTop - npBot)) * IH;
  const revTicks = [0, revTop * 0.25, revTop * 0.5, revTop * 0.75, revTop];
  const npTicks = [npBot, (npBot + npTop) / 2, npTop];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
      <line x1={PAD.left} y1={zeroY} x2={W-PAD.right} y2={zeroY} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      {npMin < 0 && (
        <polygon fill="rgba(248,113,113,0.06)"
          points={data.map((d,i) => `${xScale(i)},${npY(Math.min(d.net_profit,0))}`).join(' ')
            + ` ${xScale(data.length-1)},${npY(0)} ${xScale(0)},${npY(0)}`} />
      )}
      {revTicks.map(t => (
        <g key={`rev-${t}`}>
          <line x1={PAD.left} y1={revY(t)} x2={W-PAD.right} y2={revY(t)} stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
          <text x={PAD.left-8} y={revY(t)+5} textAnchor="end" fill="#a8a498" fontSize="12" fontFamily="monospace">{fmt(t)}</text>
        </g>
      ))}
      {npTicks.map(t => (
        <g key={`np-${t}`}>
          <text x={W-PAD.right+8} y={npY(t)+5} textAnchor="start" fill="#a8a498" fontSize="11" fontFamily="monospace">{fmt(t)}</text>
        </g>
      ))}

      {data.map((d,i) => (
        <g key={`rev-${d.year}`}>
          <rect x={xScale(i)-barW/2} y={revY(d.revenue)} width={barW}
            height={zeroY-revY(d.revenue)} rx="2" fill="url(#revGrad)" opacity="0.85" />
          <rect x={xScale(i)-barW/2} y={revY(d.revenue)} width={barW}
            height={zeroY-revY(d.revenue)} rx="2" fill="transparent">
            <title>{d.year}年 · 营收 {d.revenue} 亿</title>
          </rect>
          <rect x={xScale(i)-barW/2} y={revY(d.revenue)-1.5} width={barW} height="3" rx="1.5" fill="#c9a84c" opacity="0.5" />
          <text x={xScale(i)} y={revY(d.revenue)-6} textAnchor="middle" fill="#dfc278" fontSize="10.5" fontFamily="monospace" fontWeight="700">{d.revenue}</text>
        </g>
      ))}

      <polyline fill="none" stroke="#4ade80" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.95"
        points={data.map((d,i) => `${xScale(i)},${npY(d.net_profit)}`).join(' ')} />

      {data.map((d,i) => (
        <g key={`np-${d.year}`}>
          <circle cx={xScale(i)} cy={npY(d.net_profit)} r="12" fill="transparent">
            <title>{d.year}年 · 归母净利润 {d.net_profit} 亿 · 同比 {d.np_growth >= 0 ? '+' : ''}{d.np_growth}%</title>
          </circle>
          <circle cx={xScale(i)} cy={npY(d.net_profit)} r="4.5"
            fill={d.net_profit>=0?"#4ade80":"#f87171"} stroke="#141826" strokeWidth="1.5" />
          <text x={xScale(i)} y={npY(d.net_profit)+(d.net_profit>=0?-12:20)} textAnchor="middle"
            fill={d.net_profit>=0?"#4ade80":"#f87171"} fontSize="10.5" fontFamily="monospace" fontWeight="600">{d.net_profit}</text>
        </g>
      ))}

      {data.map((d,i) => (
        <text key={`yr-${d.year}`} x={xScale(i)} y={H-8} textAnchor="middle" fill="#a8a498" fontSize="12" fontFamily="monospace">{d.year}</text>
      ))}

      <text x={W/2} y={H-28} textAnchor="middle" fill="#7d7a72" fontSize="11">年份</text>
      <text x={14} y={PAD.top+IH/2} textAnchor="middle" fill="#7d7a72" fontSize="11" transform={`rotate(-90,14,${PAD.top+IH/2})`}>营收（亿）</text>
      <text x={W-12} y={PAD.top+IH/2} textAnchor="middle" fill="#7d7a72" fontSize="11" transform={`rotate(90,${W-12},${PAD.top+IH/2})`}>归母净利润（亿）</text>

      <rect x={PAD.left+4} y={PAD.top-2} width="10" height="10" rx="2" fill="url(#revGrad)" opacity="0.85"/>
      <text x={PAD.left+18} y={PAD.top+8} fill="#a8a498" fontSize="11">营业收入</text>
      <line x1={PAD.left+72} y1={PAD.top+3} x2={PAD.left+96} y2={PAD.top+3} stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx={PAD.left+84} cy={PAD.top+3} r="3.5" fill="#4ade80" stroke="#141826" strokeWidth="1"/>
      <text x={PAD.left+102} y={PAD.top+8} fill="#a8a498" fontSize="11">归母净利润</text>

      <defs>
        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c9a84c" stopOpacity="0.9"/>
          <stop offset="100%" stopColor="#c9a84c" stopOpacity="0.2"/>
        </linearGradient>
      </defs>
    </svg>
  );
}
