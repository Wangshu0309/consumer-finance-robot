import type { ValuationData } from '../types';

interface Props { data: ValuationData }

export default function ValuationPanel({ data }: Props) {
  if (!data?.pe && !data?.pb) return null;

  const cards = [
    {
      label: '市盈率 (PE)',
      current: data.pe?.current,
      detail: `EPS ${data.pe?.eps} 元`,
      color: !data.pe ? '' : data.pe.current < 20 ? '#4ade80' : data.pe.current < 40 ? '#f59e0b' : '#f87171',
    },
    {
      label: '市净率 (PB)',
      current: data.pb?.current,
      detail: `BPS ${data.pb?.bps} 元`,
      color: !data.pb ? '' : data.pb.current < 3 ? '#4ade80' : data.pb.current < 6 ? '#f59e0b' : '#f87171',
    },
    {
      label: '市销率 (PS)',
      current: data.ps?.current,
      detail: `SPS ${data.ps?.sps} 元`,
      color: !data.ps ? '' : data.ps.current < 5 ? '#4ade80' : data.ps.current < 10 ? '#f59e0b' : '#f87171',
    },
  ].filter(c => c.current != null);

  if (cards.length === 0) return null;

  return (
    <div>
      {/* Valuation cards */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {cards.map(c => (
          <div key={c.label} className="text-center p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <p className="text-[10px] text-ink-muted mb-1">{c.label}</p>
            <p className="text-lg font-mono font-bold" style={{ color: c.color }}>
              {c.current?.toFixed(1)}
            </p>
            <p className="text-[10px] text-ink-muted mt-0.5">{c.detail}</p>
          </div>
        ))}
      </div>

      {/* PE Band */}
      {data.pe_band && data.pe_band.length >= 2 && (
        <div>
          <p className="text-xs text-ink-muted mb-2">当前价格下的历史 PE 参考</p>
          <div className="flex items-end gap-2 h-24">
            {data.pe_band.map(p => {
              const maxPE = Math.max(...data.pe_band.map(x => x.pe));
              const h = (p.pe / maxPE) * 100;
              return (
                <div key={p.year} className="flex-1 flex flex-col items-center justify-end">
                  <span className="text-[10px] font-mono mb-1" style={{ color: p.pe < 20 ? '#4ade80' : p.pe < 40 ? '#f59e0b' : '#f87171' }}>
                    {p.pe.toFixed(1)}
                  </span>
                  <div className="w-full rounded-t-sm"
                    style={{
                      height: `${h}%`,
                      background: p.pe < 20 ? 'rgba(74,222,128,0.3)' : p.pe < 40 ? 'rgba(251,146,60,0.3)' : 'rgba(248,113,113,0.3)',
                      minHeight: 4,
                    }}
                  />
                  <span className="text-[9px] text-ink-muted mt-1">{p.year}</span>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-ink-muted/70 mt-2">
            柱高 = 当前股价 ÷ 各年 EPS，展示估值水平的历史变化趋势
          </p>
        </div>
      )}
    </div>
  );
}
