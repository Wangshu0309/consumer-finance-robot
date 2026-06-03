import type { ReturnsData } from '../types';

interface Props { data: ReturnsData }

export default function ReturnsTable({ data }: Props) {
  if (!data || !data.current_price) return null;

  const stats = [
    { label: '当前价格', value: `${data.current_price} 元`, color: '#e8e4d9' },
    { label: '累计收益', value: `${data.total_return_pct >= 0 ? '+' : ''}${data.total_return_pct}%`, color: data.total_return_pct >= 0 ? '#4ade80' : '#f87171' },
    { label: '年化收益 (CAGR)', value: `${data.cagr_pct >= 0 ? '+' : ''}${data.cagr_pct}%`, color: data.cagr_pct >= 0 ? '#4ade80' : '#f87171' },
    { label: '最大回撤', value: `-${data.max_drawdown_pct}%`, color: '#f87171' },
    { label: '年化波动率', value: `${data.annual_volatility_pct}%`, color: '#f59e0b' },
    { label: '夏普比率', value: `${data.sharpe_ratio}`, color: data.sharpe_ratio > 1 ? '#4ade80' : data.sharpe_ratio > 0.5 ? '#f59e0b' : '#f87171' },
    { label: '月度胜率', value: `${data.win_rate_pct}%`, color: data.win_rate_pct > 55 ? '#4ade80' : data.win_rate_pct > 45 ? '#f59e0b' : '#f87171' },
  ];

  return (
    <div className="overflow-x-auto">
      {/* Summary stats */}
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-4">
        {stats.map(s => (
          <div key={s.label} className="text-center p-2 rounded-lg bg-white/[0.03] border border-white/[0.05]">
            <p className="text-[10px] text-ink-muted mb-0.5">{s.label}</p>
            <p className="text-xs font-mono font-semibold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Annual returns */}
      {data.annual_returns && data.annual_returns.length > 0 && (
        <div>
          <p className="text-xs text-gold font-mono mb-2">年度收益</p>
          <div className="flex flex-wrap gap-1.5">
            {data.annual_returns.map(yr => (
              <span key={yr.year}
                className="text-xs font-mono px-2 py-1 rounded-md"
                style={{
                  background: yr.return_pct >= 0 ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)',
                  color: yr.return_pct >= 0 ? '#4ade80' : '#f87171',
                }}
              >
                {yr.year}: {yr.return_pct >= 0 ? '+' : ''}{yr.return_pct}%
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
