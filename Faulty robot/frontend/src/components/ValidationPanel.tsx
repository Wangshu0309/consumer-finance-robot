import type { ValidationSignal } from '../types';

interface Props { signals: ValidationSignal[] }

const levelStyles: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  warning: { bg: 'rgba(127,29,29,0.15)', border: 'rgba(248,113,113,0.2)', text: '#fca5a5', icon: '⚠' },
  caution: { bg: 'rgba(124,45,18,0.12)', border: 'rgba(251,146,60,0.2)', text: '#fdba74', icon: '⚡' },
  positive: { bg: 'rgba(20,83,45,0.12)', border: 'rgba(74,222,128,0.15)', text: '#86efac', icon: '✓' },
};

export default function ValidationPanel({ signals }: Props) {
  if (!signals || signals.length === 0) return null;

  return (
    <div className="space-y-2">
      {signals.map((s, i) => {
        const st = levelStyles[s.level] || levelStyles.caution;
        return (
          <div key={i} className="flex items-start gap-3 px-4 py-3 rounded-lg border text-sm"
            style={{ background: st.bg, borderColor: st.border, color: st.text }}>
            <span className="text-base mt-0.5">{st.icon}</span>
            <div>
              <p className="font-semibold">{s.signal}</p>
              <p className="text-xs opacity-80 mt-0.5">{s.detail}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
