import { formatProb } from '../utils/format';
import type { PredictResponse } from '../types';

interface ProbDisplayProps {
  data: PredictResponse;
}

function getProgressClass(prob: number | null): string {
  if (prob === null) return 'bg-white/[0.06]';
  if (prob >= 0.6) return 'green-progress';
  if (prob >= 0.4) return 'amber-progress';
  return 'red-progress';
}

function getTextClass(prob: number | null): string {
  if (prob === null) return 'text-text-muted';
  if (prob >= 0.6) return 'text-success';
  if (prob >= 0.4) return 'text-warning';
  return 'text-danger';
}

export default function ProbDisplay({ data }: ProbDisplayProps) {
  const { prob, from_ml, insufficient_data } = data;

  return (
    <div className="card-gold p-10 text-center">
      <p className="text-xs tracking-[0.15em] uppercase text-text-muted mb-6 font-mono">
        Probability Estimate
      </p>

      <div className="relative inline-block">
        {prob !== null && !insufficient_data && (
          <div
            className="absolute -inset-8 rounded-full opacity-20 blur-3xl"
            style={{
              background: prob >= 0.6
                ? 'radial-gradient(circle, #4ade80, transparent)'
                : prob >= 0.4
                  ? 'radial-gradient(circle, #fb923c, transparent)'
                  : 'radial-gradient(circle, #f87171, transparent)',
            }}
          />
        )}
        <span className={`relative prob-number ${insufficient_data || prob === null ? 'text-text-muted' : 'gold-gradient-text'}`}>
          {insufficient_data ? '--' : formatProb(prob)}
        </span>
        {!insufficient_data && prob !== null && (
          <span className={`relative text-3xl font-light ml-1 ${getTextClass(prob)}`}>%</span>
        )}
      </div>

      <p className="mt-4 text-xs text-text-muted tracking-wide">
        {insufficient_data
          ? '历史数据不足，无法完成预测'
          : '归母净利润同比增长概率'}
      </p>

      {!insufficient_data && (
        <p className="mt-1 text-[11px] text-text-muted/70">
          {from_ml
            ? 'XGBoost + Logistic Regression Ensemble'
            : '启发式模型 · 运行 train.py 启用 ML 预测'}
        </p>
      )}

      {/* Progress bar */}
      <div className="mt-8 h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${getProgressClass(prob)}`}
          style={{ width: insufficient_data || prob === null ? '0%' : formatProb(prob) + '%' }}
        />
      </div>

      {/* Scale markers */}
      <div className="flex justify-between mt-2 text-[10px] text-text-muted/50 font-mono">
        <span>0</span>
        <span>25</span>
        <span>50</span>
        <span>75</span>
        <span>100</span>
      </div>
    </div>
  );
}
