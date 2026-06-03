export interface TrendPoint {
  year: number;
  revenue: number;
  net_profit: number;
  gross_margin: number;
  operating_cash_flow: number;
  revenue_growth: number;
  np_growth: number;
  expense_ratio: number;
  inventory_turnover_days: number;
  ar_turnover_days: number;
}

export interface SummaryData {
  rating: string;
  rating_color: string;
  highlights: string[];
  risks: string[];
}

export interface FeatureData {
  revenue_growth_yoy: number;
  gross_margin_change: number;
  net_cash_ratio: number;
  selling_expense_ratio: number;
  inventory_turnover_days_change: number;
  ar_turnover_days_change: number;
}

export interface PricePoint {
  date: string;
  open: number;
  close: number;
  high: number;
  low: number;
}

export interface ReturnsData {
  current_price: number;
  total_return_pct: number;
  cagr_pct: number;
  max_drawdown_pct: number;
  annual_volatility_pct: number;
  sharpe_ratio: number;
  win_rate_pct: number;
  annual_returns: Array<{ year: number; return_pct: number }>;
}

export interface PredictResponse {
  stock_code: string;
  stock_name: string;
  fiscal_year: number;
  prob: number | null;
  from_ml: boolean;
  warnings: string[];
  insufficient_data: boolean;
  analysis: string;
  summary: SummaryData;
  trend: TrendPoint[];
  features: FeatureData | null;
  price_data: PricePoint[];
  returns: ReturnsData;
}

export interface ApiResponse {
  success: boolean;
  error?: string;
  data?: PredictResponse;
}

export type PredictState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: PredictResponse }
  | { status: 'error'; message: string };
