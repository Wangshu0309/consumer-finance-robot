import type { PredictResponse } from '../types';

interface WarningListProps {
  data: PredictResponse;
}

export default function WarningList({ data }: WarningListProps) {
  const { warnings, insufficient_data } = data;

  if (insufficient_data) {
    return (
      <div className="insufficient-badge">
        历史数据不足（少于2年），无法完成规则排雷
      </div>
    );
  }

  if (!warnings || warnings.length === 0) {
    return (
      <div className="safe-badge">
        <div className="flex items-center justify-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <span>财务逻辑暂未发现显著异常</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {warnings.map((w, i) => (
        <div key={i} className="warning-card relative overflow-hidden">
          <div className="relative flex gap-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>{w}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
