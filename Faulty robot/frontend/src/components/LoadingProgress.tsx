import { useState, useEffect } from 'react';

const STEPS = [
  { label: '获取财务数据', detail: 'AkShare 接口请求中' },
  { label: '提取特征指标', detail: '营收 / 毛利 / 现金流 / 周转' },
  { label: 'ML 模型预测', detail: 'XGBoost + Logistic Regression' },
  { label: '规则排雷检测', detail: '收入真实性 · 渠道健康度 · 利润含金量' },
  { label: '生成投资分析', detail: '综合分析报告撰写中' },
];

export default function LoadingProgress() {
  const [step, setStep] = useState(0);
  const [fill, setFill] = useState(0);

  useEffect(() => {
    // Simulate progress: accelerate through steps
    const durations = [600, 1200, 800, 600, 500];
    let timeout: ReturnType<typeof setTimeout>;

    const advance = (i: number) => {
      if (i >= STEPS.length) return;
      setStep(i);
      setFill(((i + 1) / STEPS.length) * 100);
      timeout = setTimeout(() => advance(i + 1), durations[i]);
    };

    advance(0);
    return () => clearTimeout(timeout);
  }, []);

  const currentStep = STEPS[Math.min(step, STEPS.length - 1)];

  return (
    <div className="card-gold p-8 fade-in">
      {/* Progress bar */}
      <div className="relative h-2 bg-white/[0.05] rounded-full overflow-hidden mb-6">
        <div
          className="absolute inset-y-0 left-0 gold-progress rounded-full transition-all duration-700 ease-out"
          style={{ width: `${fill}%` }}
        />
        {/* Shimmer */}
        <div
          className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"
          style={{ left: `${Math.max(0, fill - 10)}%` }}
        />
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-between mb-4">
        {STEPS.map((s, i) => (
          <div key={s.label} className="flex flex-col items-center gap-1">
            <div
              className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${
                i < step
                  ? 'bg-gold shadow-[0_0_6px_rgba(201,168,76,0.4)]'
                  : i === step
                    ? 'bg-gold animate-pulse-gold'
                    : 'bg-white/[0.08]'
              }`}
            />
            <span className="text-[9px] text-text-muted hidden sm:block">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Current action */}
      <div className="flex items-center gap-3 mt-4">
        <div className="flex gap-1">
          <span
            className="w-1 h-1 rounded-full bg-gold animate-bounce"
            style={{ animationDelay: '0ms' }}
          />
          <span
            className="w-1 h-1 rounded-full bg-gold animate-bounce"
            style={{ animationDelay: '150ms' }}
          />
          <span
            className="w-1 h-1 rounded-full bg-gold animate-bounce"
            style={{ animationDelay: '300ms' }}
          />
        </div>
        <div>
          <p className="text-sm text-ink-primary font-medium">{currentStep.label}</p>
          <p className="text-xs text-text-muted mt-0.5">{currentStep.detail}</p>
        </div>
      </div>
    </div>
  );
}
