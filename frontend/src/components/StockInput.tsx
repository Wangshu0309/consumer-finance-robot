import { useState, FormEvent, KeyboardEvent } from 'react';

interface StockInputProps {
  onAnalyze: (code: string) => void;
  disabled: boolean;
}

export default function StockInput({ onAnalyze, disabled }: StockInputProps) {
  const [value, setValue] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!disabled && value.trim()) onAnalyze(value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!disabled && value.trim()) onAnalyze(value);
    }
  };

  return (
    <section className="card-gold p-6">
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入股票代码，如 600519"
          autoComplete="off"
          autoFocus
          disabled={disabled}
          className="flex-1 px-5 py-3.5 text-base bg-[#0a0d16] border border-white/[0.08] rounded-xl
                     text-text-primary outline-none transition-all duration-200
                     placeholder:text-text-muted
                     focus:border-gold/40 focus:bg-[#0c0f1a]
                     disabled:opacity-40 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={disabled}
          className="px-8 py-3.5 text-sm font-semibold tracking-wide rounded-xl
                     bg-gold text-[#0a0d16] transition-all duration-200
                     hover:bg-gold-light hover:shadow-[0_0_24px_rgba(201,168,76,0.25)]
                     active:scale-[0.97]
                     disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-gold
                     whitespace-nowrap"
        >
          开始分析
        </button>
      </form>
      <p className="mt-3 text-xs text-text-muted">
        支持沪深京 A 股代码 · 基于最新年报数据
      </p>
    </section>
  );
}
