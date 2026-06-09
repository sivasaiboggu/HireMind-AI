import { useState, useCallback } from 'react';
import { useAppStore } from '../store/appStore';

export interface UseGeminiState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export function useGemini<Args extends any[], T>(
  apiFn: (...args: Args) => Promise<T>,
  creditCost: number = 5
) {
  const [state, setState] = useState<UseGeminiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const useCredit = useAppStore((s) => s.useCredit);
  const addToast = useAppStore((s) => s.addToast);

  const execute = useCallback(
    async (...args: Args): Promise<T | null> => {
      setState({ data: null, loading: true, error: null });
      
      // Deduct AI credits
      const hasCredit = await useCredit(creditCost);
      if (!hasCredit) {
        const err = new Error('Insufficient AI credits. Refill required.');
        setState({ data: null, loading: false, error: err });
        return null;
      }

      try {
        const result = await apiFn(...args);
        setState({ data: result, loading: false, error: null });
        return result;
      } catch (err: any) {
        const error = err instanceof Error ? err : new Error(err?.message || 'AI generation failed');
        setState({ data: null, loading: false, error });
        addToast('error', error.message);
        return null;
      }
    },
    [apiFn, creditCost, useCredit, addToast]
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}
