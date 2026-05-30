import { useState, useCallback } from 'react';
import type { PredictResponse, PredictState } from '../types';

export function usePredict() {
  const [state, setState] = useState<PredictState>({ status: 'idle' });

  const predict = useCallback(async (stockCode: string) => {
    if (!stockCode.trim()) {
      setState({ status: 'error', message: '请输入股票代码' });
      return;
    }

    setState({ status: 'loading' });

    try {
      const apiBase = import.meta.env.VITE_API_URL || '';
      const resp = await fetch(`${apiBase}/api/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock_code: stockCode.trim() }),
      });
      const json = await resp.json();

      if (!json.success) {
        setState({ status: 'error', message: json.detail || json.error || '分析失败，请稍后重试' });
        return;
      }

      setState({ status: 'success', data: json.data as PredictResponse });
    } catch {
      setState({ status: 'error', message: '网络请求失败，请确认服务已启动' });
    }
  }, []);

  const reset = useCallback(() => {
    setState({ status: 'idle' });
  }, []);

  return { state, predict, reset };
}
