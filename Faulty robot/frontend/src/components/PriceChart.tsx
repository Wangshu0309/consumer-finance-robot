import type { PricePoint } from '../types';

interface Props { data: PricePoint[] }

const W = 800; const H = 240;
const P = { top: 16, right: 20, bottom: 44, left: 68 };
const IW = W - P.left - P.right; const IH = H - P.top - P.bottom;

export default function PriceChart({ data }: Props) {
  if (!data || data.length < 2) return null;
  const closes = data.map(d => d.close);
  const min = Math.min(...closes) * 0.92;
  const max = Math.max(...closes) * 1.08;
  const range = max - min;
  const gap = IW / data.length;
  const y = (v: number) => P.top + IH - ((v - min) / range) * IH;
  const ticks = [min, (min + max) / 2, max];

  // Fill area
  const areaD = data.map((d, i) => `${P.left + i * gap + gap / 2},${y(d.close)}`).join(' ')
    + ` ${P.left + (data.length - 1) * gap + gap / 2},${y(min)} ${P.left + gap / 2},${y(min)}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {/* Fill */}
      <polygon fill="rgba(74,222,128,0.08)" points={areaD} />

      {ticks.map(t => (
        <g key={t}>
          <line x1={P.left} y1={y(t)} x2={W - P.right} y2={y(t)}
            stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
          <text x={P.left - 8} y={y(t) + 5} textAnchor="end"
            fill="#a8a498" fontSize="11" fontFamily="monospace">
            {t.toFixed(0)}
          </text>
        </g>
      ))}

      {/* Price line */}
      <polyline fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        points={data.map((d, i) => `${P.left + i * gap + gap / 2},${y(d.close)}`).join(' ')} />

      {data.filter((_, i) => i % 6 === 0 || i === data.length - 1).map((d) => {
        const idx = data.indexOf(d);
        return (
          <g key={d.date}>
            <circle cx={P.left + idx * gap + gap / 2} cy={y(d.close)} r="3"
              fill="#4ade80" stroke="#141826" strokeWidth="1">
              <title>{d.date} 收盘 {d.close}</title>
            </circle>
          </g>
        );
      })}

      {data.filter((_, i) => i % 6 === 0 || i === data.length - 1).map(d => {
        const idx = data.indexOf(d);
        return (
          <text key={`yr-${d.date}`} x={P.left + idx * gap + gap / 2} y={H - 8} textAnchor="middle"
            fill="#a8a498" fontSize="11" fontFamily="monospace">
            {d.date.slice(0, 7)}
          </text>
        );
      })}

      <text x={W / 2} y={H - 28} textAnchor="middle" fill="#7d7a72" fontSize="11">日期</text>
      <text x={14} y={P.top + IH / 2} textAnchor="middle" fill="#7d7a72" fontSize="11"
        transform={`rotate(-90, 14, ${P.top + IH / 2})`}>收盘价（元）</text>

      <rect x={P.left + 4} y={P.top - 2} width="10" height="10" rx="5" fill="#4ade80" />
      <text x={P.left + 18} y={P.top + 8} fill="#a8a498" fontSize="11">收盘价</text>
    </svg>
  );
}
