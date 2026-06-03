import { useEffect } from 'react';
import { usePredict } from './hooks/usePredict';
import StockInput from './components/StockInput';
import ProbDisplay from './components/ProbDisplay';
import SummaryCard from './components/SummaryCard';
import WarningList from './components/WarningList';
import FeatureTable from './components/FeatureTable';
import AnalysisText from './components/AnalysisText';
import LoadingProgress from './components/LoadingProgress';
import TrendChart from './components/TrendChart';
import RevenueBarChart from './components/RevenueBarChart';
import MarginLineChart from './components/MarginLineChart';
import CashFlowChart from './components/CashFlowChart';
import TurnoverChart from './components/TurnoverChart';
import PriceChart from './components/PriceChart';
import ReturnsTable from './components/ReturnsTable';
import ValidationPanel from './components/ValidationPanel';
import DuPontPanel from './components/DuPontPanel';
import PeerComparisonPanel from './components/PeerComparisonPanel';
import ValuationPanel from './components/ValuationPanel';

function SectionHeader({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) {
  return (
    <div className="flex items-baseline gap-2.5 mb-3">
      <span className="text-sm">{icon}</span>
      <span className="text-sm font-semibold text-ink-primary tracking-wide">{title}</span>
      {subtitle && <span className="text-[11px] text-ink-muted">· {subtitle}</span>}
    </div>
  );
}

export default function App() {
  const { state, predict } = usePredict();
  const isLoading = state.status === 'loading';
  const isSuccess = state.status === 'success';
  const isError = state.status === 'error';

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code && state.status === 'idle') predict(code);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAnalyze = (code: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('code', code);
    window.history.replaceState({}, '', url.toString());
    predict(code);
  };

  return (
    <div className="max-w-[880px] mx-auto px-5 py-8 pb-20">
      {/* Header */}
      <header className="text-center py-6 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-[radial-gradient(circle,rgba(201,168,76,0.04)_0%,transparent_70%)] pointer-events-none" />
        <div className="relative">
          <p className="text-xs tracking-[0.25em] uppercase text-gold font-medium mb-2">
            Consumer &amp; Retail Intelligence
          </p>
          <h1 className="text-xl font-bold text-ink-primary tracking-wide">
            大消费行业智能财务分析
          </h1>
          <div className="ornament-diamond mt-3 mb-1 max-w-[220px] mx-auto">
            <svg width="6" height="6" viewBox="0 0 8 8" fill="rgba(201,168,76,0.4)"><rect width="8" height="8" transform="rotate(45,4,4)"/></svg>
          </div>
        </div>
      </header>

      <StockInput onAnalyze={handleAnalyze} disabled={isLoading} />
      {isLoading && <LoadingProgress />}

      {isError && (
        <div className="mt-4 card border-danger/20 bg-[rgba(127,29,29,0.15)] px-5 py-4 text-sm text-danger">
          {state.message}
        </div>
      )}

      {isSuccess && state.data && (
        <div className="mt-5 space-y-6">
          {/* ① 核心结论 */}
          {!state.data.insufficient_data && state.data.summary && (
            <div className="fade-in">
              <SectionHeader icon="📋" title="核心结论" subtitle="综合评级与关键要点" />
              <SummaryCard summary={state.data.summary} />
            </div>
          )}

          {/* ② 核心预测区 */}
          <div className="fade-in fade-in-delay-1">
            <SectionHeader icon="🔮" title="核心预测" subtitle="归母净利润同比增长概率" />
            <ProbDisplay data={state.data} />
          </div>

          {/* ③ 经营基本面 */}
          {state.data.trend && state.data.trend.length >= 2 && (
            <div className="fade-in fade-in-delay-2">
              <SectionHeader icon="📊" title="经营基本面" subtitle="营收、利润与毛利率趋势" />
              <div className="space-y-4">
                <div className="card-gold p-5">
                  <p className="text-xs text-gold font-mono mb-3">营收趋势（亿）</p>
                  <RevenueBarChart data={state.data.trend} />
                </div>
                <div className="card-gold p-5">
                  <p className="text-xs text-gold font-mono mb-3">营收与利润</p>
                  <TrendChart data={state.data.trend} />
                </div>
                <div className="card-gold p-5">
                  <p className="text-xs text-gold font-mono mb-3">毛利率趋势</p>
                  <MarginLineChart data={state.data.trend} />
                </div>
              </div>
            </div>
          )}

          {/* ④ 财务健康度 */}
          <div className="fade-in fade-in-delay-3">
            <SectionHeader icon="🛡️" title="财务健康度" subtitle="现金流质量与周转效率" />
            <div className="flex flex-col gap-4">
              <WarningList data={state.data} />
              <FeatureTable features={state.data.features} />
              {state.data.trend && state.data.trend.length >= 2 && (
                <>
                  <div className="card-gold p-5">
                    <p className="text-xs text-gold font-mono mb-3">经营现金流 vs 归母净利润（亿）</p>
                    <CashFlowChart data={state.data.trend} />
                  </div>
                  <div className="card-gold p-5">
                    <p className="text-xs text-gold font-mono mb-3">存货 & 应收账款周转天数</p>
                    <TurnoverChart data={state.data.trend} />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ⑤ 深度分析 */}
          <div className="fade-in fade-in-delay-4 space-y-5">
            {/* 交叉验证 */}
            {state.data.validation && state.data.validation.length > 0 && (
              <div>
                <SectionHeader icon="🔍" title="指标勾稽验证" subtitle="关键指标间的逻辑自洽性检查" />
                <ValidationPanel signals={state.data.validation} />
              </div>
            )}

            {/* 杜邦分析 */}
            {state.data.dupont && state.data.dupont.current?.roe > 0 && (
              <div className="card-gold p-5">
                <p className="text-xs text-gold font-mono mb-3">杜邦分析 · ROE 拆解</p>
                <DuPontPanel data={state.data.dupont} />
              </div>
            )}

            {/* 同业对比 */}
            {state.data.peers && state.data.peers.peers?.length > 0 && (
              <div className="card-gold p-5">
                <p className="text-xs text-gold font-mono mb-3">同业对比</p>
                <PeerComparisonPanel data={state.data.peers} />
              </div>
            )}
          </div>

          {/* ⑥ 行情表现 */}
          {state.data.price_data && state.data.price_data.length >= 2 && (
            <div className="fade-in fade-in-delay-5">
              <SectionHeader icon="📈" title="行情表现" subtitle="股价趋势与收益统计" />
              <div className="card-gold p-5">
                <p className="text-xs text-gold font-mono mb-3">股价走势（月线 · 前复权）</p>
                <PriceChart data={state.data.price_data} />
              </div>
              {state.data.returns && state.data.returns.current_price && (
                <div className="mt-4 space-y-4">
                  <div className="card-gold p-5">
                    <ReturnsTable data={state.data.returns} />
                  </div>
                  {state.data.valuation && (state.data.valuation.pe || state.data.valuation.pb) && (
                    <div className="card-gold p-5">
                      <p className="text-xs text-gold font-mono mb-3">估值分析 · PE / PB / PS</p>
                      <ValuationPanel data={state.data.valuation} />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ⑦ AI 分析 */}
          <div className="fade-in fade-in-delay-6">
            <SectionHeader icon="📝" title="AI 投资分析" subtitle="智能生成投资建议" />
            <AnalysisText text={state.data.analysis} />
          </div>

          {/* Disclaimer — right after AI analysis */}
          <div className="mt-6 px-4 py-3 rounded-xl border border-amber-500/15 bg-[rgba(124,45,18,0.1)]">
            <p className="text-xs text-ink-muted leading-relaxed text-center">
              <span className="text-amber-400/80 font-medium">免责声明：</span>
              分析结果仅供参考，不构成投资建议。投资有风险，决策须谨慎。模型基于历史财务数据训练，不对未来表现做任何保证。
            </p>
            <p className="text-[10px] text-ink-muted text-center mt-1.5">
              数据来源：AkShare 公开财务接口（新浪财经 & 同花顺） · 最新数据截止 FY{state.data.fiscal_year}
            </p>
          </div>
        </div>
      )}

      <footer className="mt-12 text-center">
        <hr className="ornament-line mb-4 max-w-[300px] mx-auto" />
        <p className="text-xs text-ink-muted">
          Consumer Finance Robot · 大消费行业智能财务分析
        </p>
      </footer>
    </div>
  );
}
