import { useState, useEffect, useRef, FormEvent, KeyboardEvent } from 'react';

interface StockInputProps {
  onAnalyze: (code: string) => void;
  disabled: boolean;
}

interface HistoryEntry {
  code: string;
  name: string;
}

const HISTORY_KEY = 'stock-query-history';
const MAX_HISTORY = 8;

function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveHistory(entries: HistoryEntry[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, MAX_HISTORY)));
}

export default function StockInput({ onAnalyze, disabled }: StockInputProps) {
  const [value, setValue] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Autocomplete: lookup stock name when 6 digits typed
  useEffect(() => {
    const code = value.trim();
    if (/^\d{6}$/.test(code)) {
      debounceRef.current = setTimeout(async () => {
        try {
          const resp = await fetch(`/api/stock-name/${code}`);
          const data = await resp.json();
          setSuggestion(data.name && data.name !== code ? data.name : '');
        } catch { setSuggestion(''); }
      }, 200);
    } else {
      setSuggestion('');
    }
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [value]);

  const addToHistory = (code: string, name: string) => {
    const updated = [{ code, name }, ...history.filter(h => h.code !== code)];
    setHistory(updated);
    saveHistory(updated);
  };

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    const code = value.trim();
    if (!disabled && code) {
      addToHistory(code, suggestion || code);
      onAnalyze(code);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleHistoryClick = (code: string) => {
    setValue(code);
    addToHistory(code, '');
    onAnalyze(code);
  };

  return (
    <section className="card-gold p-6">
      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入股票代码，如 600519"
            autoComplete="off"
            autoFocus
            disabled={disabled}
            className="w-full px-5 py-3.5 text-base bg-[#0a0d16] border border-white/[0.08] rounded-xl
                       text-ink-primary outline-none transition-all duration-200
                       placeholder:text-ink-muted
                       focus:border-gold/40 focus:bg-[#0c0f1a]
                       disabled:opacity-40 disabled:cursor-not-allowed"
          />
          {/* Suggestion overlay */}
          {suggestion && (
            <div className="mt-1.5 px-1">
              <p className="text-sm text-gold font-mono">{suggestion}</p>
            </div>
          )}
        </div>
        <button
          type="submit"
          disabled={disabled || !value.trim()}
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

      {/* History chips */}
      {history.length > 0 && (
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-ink-muted shrink-0">最近查询：</span>
          {history.map(h => (
            <button
              key={h.code}
              onClick={() => handleHistoryClick(h.code)}
              disabled={disabled}
              className="text-sm px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06]
                         text-ink-secondary hover:text-gold hover:border-gold/30 transition-colors
                         disabled:opacity-40"
              title={h.name || h.code}
            >
              {h.name || h.code}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
