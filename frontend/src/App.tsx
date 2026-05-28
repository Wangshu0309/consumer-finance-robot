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
    <div className="max-w-[720px] mx-auto px-5 py-8 pb-16">
      {/* Header */}
      <header className="text-center py-8">
        <h1 className="text-2xl font-extrabold text-primary tracking-wide">
          大消费行业智能财务分析机器人
        </h1>
        <p className="mt-1.5 text-sm text-gray-500">智能化投研辅助工具 · 大消费与零售制造</p>
      </header>

      {/* Input */}
      <StockInput onAnalyze={predict} disabled={isLoading} />

      {/* Loading */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="w-10 h-10 mx-auto mb-4 border-4 border-gray-200 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-gray-500">正在获取财务数据并运行分析...</p>
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-red-600 text-sm">
          {state.message}
        </div>
      )}

      {/* Results */}
      {isSuccess && state.data && (
        <div className="mt-5">
          {/* Stock info bar */}
          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-lg font-bold text-gray-900">{state.data.stock_name}</span>
            <span className="text-xs text-gray-500">{state.data.stock_code}</span>
            <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-full">
              {state.data.fiscal_year} 年报
            </span>
          </div>

          <ProbDisplay data={state.data} />
          <WarningList data={state.data} />
          <FeatureTable features={state.data.features} />
        </div>
      )}

      {/* Footer */}
      <footer className="mt-12 text-center text-xs text-gray-400">
        数据来源：AkShare 公开财务接口 &nbsp;|&nbsp; 分析结果仅供参考，不构成投资建议
      </footer>
    </div>
  );
}
