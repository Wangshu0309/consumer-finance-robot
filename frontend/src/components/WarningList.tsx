import type { PredictResponse } from '../types';

interface WarningListProps {
  data: PredictResponse;
}

export default function WarningList({ data }: WarningListProps) {
  const { warnings, insufficient_data } = data;

  if (insufficient_data) {
    return (
      <div className="mt-4 bg-orange-50 border border-orange-200 rounded-xl px-5 py-3 text-orange-700 text-sm">
        历史数据不足（少于2年），无法完成规则排雷。
      </div>
    );
  }

  if (!warnings || warnings.length === 0) {
    return (
      <div className="mt-4 safe-badge text-center">
        ✅ 财务逻辑暂未发现显著异常
      </div>
    );
  }

  return (
    <div className="mt-4 flex flex-col gap-2.5">
      {warnings.map((w, i) => (
        <div key={i} className="warning-card">
          <span className="mr-1.5">⚠️</span>
          {w}
        </div>
      ))}
    </div>
  );
}
