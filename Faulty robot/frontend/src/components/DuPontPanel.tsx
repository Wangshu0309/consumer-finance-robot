import type { DuPontData } from '../types';

interface Props { data: DuPontData }

export default function DuPontPanel({ data }: Props) {
  if (!data?.current?.roe) return null;

  const { current, previous, contributions } = data;
  const items = [
    { label: 'ROE', cur: current.roe, prev: previous.roe, fmt: (v: number) => v.toFixed(1) + '%' },
    { label: '净利率', cur: current.net_margin, prev: previous.net_margin, fmt: (v: number) => v.toFixed(1) + '%' },
    { label: '资产周转率', cur: current.asset_turnover, prev: previous.asset_turnover, fmt: (v: number) => v.toFixed(2) },
    { label: '权益乘数', cur: current.equity_multiplier, prev: previous.equity_multiplier, fmt: (v: number) => v.toFixed(2) },
  ];

  const contribItems = [
    { label: '净利率贡献', val: contributions.net_margin },
    { label: '周转率贡献', val: contributions.asset_turnover },
    { label: '杠杆贡献', val: contributions.equity_multiplier },
  ];

  return (
    <div>
      {/* DuPont formula display */}
      <div className="text-center mb-4">
        <p className="text-xs font-mono text-gold tracking-wide">
          ROE = 净利率 × 资产周转率 × 权益乘数
        </p>
      </div>

      {/* Metrics table */}
      <div className="overflow-x-auto mb-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] text-ink-muted text-xs">
              <th className="text-left py-2">指标</th>
              <th className="text-right py-2">当前</th>
              <th className="text-right py-2">上年</th>
              <th className="text-right py-2">变动</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => {
              const change = item.cur - item.prev;
              return (
                <tr key={item.label} className="border-b border-white/[0.03]">
                  <td className="py-2 text-ink-secondary">{item.label}</td>
                  <td className="py-2 text-right font-mono text-ink-primary">{item.fmt(item.cur)}</td>
                  <td className="py-2 text-right font-mono text-ink-muted">{item.fmt(item.prev)}</td>
                  <td className="py-2 text-right font-mono" style={{ color: change >= 0 ? '#4ade80' : '#f87171' }}>
                    {change >= 0 ? '+' : ''}{item.label === 'ROE' || item.label === '净利率' ? change.toFixed(1) + 'pp' : change.toFixed(3)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Contribution bars */}
      {contributions.net_margin !== 0 && (
        <div>
          <p className="text-xs text-ink-muted mb-2">ROE 变动归因：</p>
          {contribItems.map(c => {
            const absMax = Math.max(...contribItems.map(x => Math.abs(x.val)));
            const pct = absMax > 0 ? Math.abs(c.val) / absMax * 100 : 0;
            return (
              <div key={c.label} className="flex items-center gap-2 mb-1.5 text-xs">
                <span className="w-20 text-right text-ink-muted shrink-0">{c.label}</span>
                <div className="flex-1 h-4 bg-white/[0.04] rounded overflow-hidden">
                  <div className="h-full rounded"
                    style={{
                      width: `${pct}%`,
                      background: c.val >= 0 ? '#4ade80' : '#f87171',
                      marginLeft: c.val >= 0 ? '0' : 'auto',
                      marginRight: c.val < 0 ? '0' : 'auto',
                    }}
                  />
                </div>
                <span className="w-16 font-mono" style={{ color: c.val >= 0 ? '#4ade80' : '#f87171' }}>
                  {c.val >= 0 ? '+' : ''}{c.val.toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
