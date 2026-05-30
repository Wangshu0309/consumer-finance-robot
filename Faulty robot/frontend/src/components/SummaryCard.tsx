import type { SummaryData } from '../types';

interface Props { summary: SummaryData }

const colorMap: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  green:  { bg: 'rgba(20,83,45,0.2)', border: 'rgba(74,222,128,0.2)', text: '#4ade80', glow: 'rgba(74,222,128,0.15)' },
  amber:  { bg: 'rgba(124,45,18,0.2)', border: 'rgba(251,146,60,0.2)', text: '#fb923c', glow: 'rgba(251,146,60,0.15)' },
  red:    { bg: 'rgba(127,29,29,0.2)', border: 'rgba(248,113,113,0.2)', text: '#f87171', glow: 'rgba(248,113,113,0.15)' },
};

export default function SummaryCard({ summary }: Props) {
  const c = colorMap[summary.rating_color] || colorMap.amber;

  return (
    <div
      className="rounded-2xl p-6 border backdrop-blur-sm"
      style={{ background: c.bg, borderColor: c.border, boxShadow: `0 0 40px ${c.glow}` }}
    >
      {/* Rating badge */}
      <div className="flex items-center gap-3 mb-4">
        <span
          className="text-sm font-bold px-3 py-1 rounded-lg"
          style={{ background: c.text + '20', color: c.text }}
        >
          {summary.rating}
        </span>
        <span className="text-xs text-ink-muted">综合评级</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Highlights */}
        <div>
          <p className="text-xs text-green-400 font-medium mb-2 flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            亮点
          </p>
          <ul className="space-y-1">
            {summary.highlights.map((h, i) => (
              <li key={i} className="text-xs text-ink-secondary leading-relaxed flex gap-1.5">
                <span className="text-green-400 mt-0.5 shrink-0">+</span>
                {h}
              </li>
            ))}
          </ul>
        </div>

        {/* Risks */}
        <div>
          <p className="text-xs text-red-400 font-medium mb-2 flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            关注点
          </p>
          <ul className="space-y-1">
            {summary.risks.map((r, i) => (
              <li key={i} className="text-xs text-ink-secondary leading-relaxed flex gap-1.5">
                <span className="text-red-400 mt-0.5 shrink-0">-</span>
                {r}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
