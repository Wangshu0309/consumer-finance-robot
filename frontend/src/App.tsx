import { usePredict } from './hooks/usePredict';
import StockInput from './components/StockInput';
import ProbDisplay from './components/ProbDisplay';
import WarningList from './components/WarningList';
import FeatureTable from './components/FeatureTable';

export default function App() {
  const { state, predict } = usePredict();
  const isLoading = state.status === 'loading';
  const isSuccess = state.status === 'success';
  const isError = state.status === 'error';

  return (
    <div className="max-w-[760px] mx-auto px-6 py-10 pb-20">
      {/* Header */}
      <header className="text-center py-10">
        <p className="text-xs tracking-[0.25em] uppercase text-gold font-medium mb-4 font-mono">
          Consumer &amp; Retail Intelligence
        </p>
        <h1 className="text-2xl font-display font-bold text-text-primary tracking-wide">
          大消费行业智能财务分析
        </h1>
        <div className="mt-4 mx-auto w-12 h-[1px] bg-gradient-to-r from-transparent via-gold to-transparent" />
        <p className="mt-3 text-sm text-text-secondary">
          基于机器学习与财务审计规则 · 投研辅助工具
        </p>
      </header>

      {/* Input */}
      <StockInput onAnalyze={predict} disabled={isLoading} />

      {/* Loading */}
      {isLoading && (
        <div className="text-center py-16">
          <div className="relative mx-auto w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-gold/20" />
            <div className="absolute inset-2 rounded-full border-2 border-t-gold border-r-transparent border-b-transparent border-l-transparent animate-spin" />
            <div className="absolute inset-4 rounded-full border border-gold/10 animate-pulse-gold" />
          </div>
          <p className="mt-6 text-sm text-text-muted tracking-wide">正在获取财务数据并运行分析</p>
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="mt-6 card border-danger/20 bg-[rgba(127,29,29,0.15)] px-5 py-4 text-sm text-danger">
          {state.message}
        </div>
      )}

      {/* Results */}
      {isSuccess && state.data && (
        <div className="mt-6 space-y-4">
          {/* Stock info bar */}
          <div className="fade-in flex items-baseline gap-3 mb-2">
            <span className="text-xl font-display font-bold text-text-primary tracking-wide">
              {state.data.stock_name}
            </span>
            <span className="text-xs text-text-muted font-mono">{state.data.stock_code}</span>
            <span className="ml-auto text-xs text-text-muted bg-surface-elevated border border-white/[0.04] px-3 py-1 rounded-full">
              FY {state.data.fiscal_year}
            </span>
          </div>

          <div className="fade-in fade-in-delay-1">
            <ProbDisplay data={state.data} />
          </div>
          <div className="fade-in fade-in-delay-2">
            <WarningList data={state.data} />
          </div>
          <div className="fade-in fade-in-delay-3">
            <FeatureTable features={state.data.features} />
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-16 text-center">
        <div className="mx-auto w-24 h-[1px] bg-white/[0.06] mb-4" />
        <p className="text-xs text-text-muted">
          数据来源：AkShare 公开财务接口 &nbsp;·&nbsp; 分析结果仅供参考，不构成投资建议
        </p>
      </footer>
    </div>
  );
}
