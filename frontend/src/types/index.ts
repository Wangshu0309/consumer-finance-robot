export interface FeatureData {
  revenue_growth_yoy: number;
  gross_margin_change: number;
  net_cash_ratio: number;
  selling_expense_ratio: number;
  inventory_turnover_days_change: number;
  ar_turnover_days_change: number;
}

export interface PredictResponse {
  stock_code: string;
  stock_name: string;
  fiscal_year: number;
  prob: number | null;
  from_ml: boolean;
  warnings: string[];
  insufficient_data: boolean;
  features: FeatureData | null;
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
