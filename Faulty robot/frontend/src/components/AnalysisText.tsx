interface AnalysisTextProps { text: string }

interface Section {
  title: string;
  icon: JSX.Element;
  body: string[];
}

const iconMap: Record<string, JSX.Element> = {
  '核心结论': <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>,
  '关键指标解读': <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  '投资建议': <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
};

export default function AnalysisText({ text }: AnalysisTextProps) {
  if (!text) return null;

  // Parse ## sections
  const sections: Section[] = [];
  const blocks = text.split('## ').filter(Boolean);
  for (const block of blocks) {
    const lines = block.trim().split('\n');
    const title = lines[0].trim();
    const body = lines.slice(1).join('\n').trim().split('\n\n').filter(Boolean);
    sections.push({
      title,
      icon: iconMap[title] || iconMap['投资建议'],
      body: body.length ? body : [lines.slice(1).join('\n').trim()],
    });
  }

  if (sections.length === 0) {
    // Fallback: plain text
    return (
      <div className="card-gold p-8">
        <p className="text-sm text-ink-secondary leading-relaxed">{text}</p>
      </div>
    );
  }

  return (
    <div className="card-gold p-8 space-y-6">
      <div className="flex items-center gap-2.5 pb-4 border-b border-white/[0.06]">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <span className="text-sm font-semibold text-gold tracking-wide">AI 投资分析</span>
      </div>

      {sections.map((sec) => (
        <div key={sec.title}>
          <div className="flex items-center gap-2 mb-2.5">
            {sec.icon}
            <span className="text-xs font-semibold text-ink-primary tracking-wide">{sec.title}</span>
          </div>
          <div className="space-y-2 pl-6">
            {sec.body.map((p, i) => {
              const isWarning = p.includes('风险提示') || p.includes('⚠');
              return (
                <p key={i} className={`text-sm leading-relaxed ${
                  isWarning
                    ? 'bg-[rgba(127,29,29,0.2)] border border-danger/15 rounded-lg px-4 py-3 text-red-300/90'
                    : 'text-ink-secondary'
                }`}>
                  {p}
                </p>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
