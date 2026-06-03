import type { PeerData } from '../types';

interface Props { data: PeerData }

const rankColors: Record<string, string> = {
  '前25%': '#4ade80',
  '前50%': '#86efac',
  '后50%': '#fdba74',
  '后25%': '#f87171',
};

export default function PeerComparisonPanel({ data }: Props) {
  if (!data?.peers?.length) return null;

  return (
    <div>
      {/* Sector badge */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs px-2.5 py-1 rounded-full bg-gold/10 text-gold border border-gold/20">
          {data.sector}行业对比
        </span>
        <span className="text-xs text-ink-muted">基准分位参考</span>
      </div>

      {/* Comparison rows */}
      <div className="space-y-3">
        {data.peers.map(p => {
          const pct = ((p.value - p.p25) / (p.p75 - p.p25)) * 100;
          const clampedPct = Math.max(0, Math.min(100, pct));
          return (
            <div key={p.metric}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-ink-secondary">{p.metric}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-ink-primary">{p.value}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                    style={{ background: rankColors[p.rank] + '20', color: rankColors[p.rank] }}>
                    {p.rank}
                  </span>
                </div>
              </div>
              {/* Bar chart: p25-p50-p75 range + marker */}
              <div className="relative h-5">
                {/* Range bar */}
                <div className="absolute inset-y-2 left-0 right-0 rounded-full bg-white/[0.04]">
                  <div className="absolute inset-y-0 rounded-full bg-white/[0.06]"
                    style={{ left: '25%', right: '25%' }} />
                </div>
                {/* p25, p50, p75 labels */}
                <div className="absolute -bottom-1 left-[25%] text-[9px] text-ink-muted" style={{ transform: 'translateX(-50%)' }}>P25</div>
                <div className="absolute -bottom-1 left-[50%] text-[9px] text-ink-muted" style={{ transform: 'translateX(-50%)' }}>P50</div>
                <div className="absolute -bottom-1 left-[75%] text-[9px] text-ink-muted" style={{ transform: 'translateX(-50%)' }}>P75</div>
                {/* Value marker */}
                <div className="absolute top-1 w-2 h-2 rounded-full bg-gold shadow-[0_0_6px_rgba(201,168,76,0.5)]"
                  style={{ left: `${clampedPct}%`, transform: 'translateX(-50%)' }} />
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-ink-muted/70 mt-4">
        分位数据基于大消费行业板块统计基准，仅供参考定位公司在行业中的相对位置
      </p>
    </div>
  );
}
