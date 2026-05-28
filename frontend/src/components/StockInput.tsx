import { useState, FormEvent, KeyboardEvent } from 'react';

interface StockInputProps {
  onAnalyze: (code: string) => void;
  disabled: boolean;
}

export default function StockInput({ onAnalyze, disabled }: StockInputProps) {
  const [value, setValue] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onAnalyze(value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onAnalyze(value);
    }
  };

  return (
    <section className="bg-white rounded-xl shadow-lg p-7">
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="请输入股票代码（如 600519）"
          autoComplete="off"
          autoFocus
          disabled={disabled}
          className="flex-1 px-4 py-3 text-base border-2 border-gray-200 rounded-lg outline-none
                     transition-colors focus:border-primary disabled:opacity-50
                     placeholder:text-gray-400"
        />
        <button
          type="submit"
          disabled={disabled}
          className="px-7 py-3 text-base font-semibold text-white bg-primary rounded-lg
                     hover:bg-primary-light active:scale-97 transition-all
                     disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
        >
          开始分析
        </button>
      </form>
      <p className="mt-2.5 text-xs text-gray-400">支持沪深京 A 股代码，基于最新年报数据进行分析</p>
    </section>
  );
}
