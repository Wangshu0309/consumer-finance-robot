import { formatProb, getProbColorClass, getGaugeColorClass } from '../utils/format';
import type { PredictResponse } from '../types';

interface ProbDisplayProps {
  data: PredictResponse;
}

export default function ProbDisplay({ data }: ProbDisplayProps) {
  const { prob, from_ml, insufficient_data } = data;

  return (
    <div className="bg-white rounded-xl shadow-lg p-10 text-center">
      <p className="text-sm text-gray-500 mb-2">归母净利润同比增长概率</p>

      <div className="flex items-baseline justify-center gap-1">
        <span className={`prob-number ${getProbColorClass(prob)}`}>
          {insufficient_data ? '--' : formatProb(prob)}
        </span>
        {!insufficient_data && prob !== null && (
          <span className="text-3xl font-semibold text-gray-400">%</span>
        )}
      </div>

      <p className="mt-2 text-xs text-gray-400">
        {insufficient_data
          ? '历史数据不足，无法完成预测'
          : from_ml
            ? '基于 XGBoost+LR 集成模型预测'
            : '基于启发式模型预测（运行 train.py 训练 ML 模型）'}
      </p>

      <div className="mt-6 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${getGaugeColorClass(prob)}`}
          style={{ width: insufficient_data || prob === null ? '0%' : formatProb(prob) + '%' }}
        />
      </div>
    </div>
  );
}
