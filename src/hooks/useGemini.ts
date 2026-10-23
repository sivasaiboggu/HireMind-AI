import { useState, useCallback, useRef } from 'react';
import { useAppStore } from '../store/appStore';
import { generateThenCharge } from '../services/generation';

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

  const inFlight = useRef(false);
  const useCredit = useAppStore((s) => s.useCredit);
  const addToast = useAppStore((s) => s.addToast);

  const execute = useCallback(
    async (...args: Args): Promise<T | null> => {
      if (inFlight.current) return null;
      inFlight.current = true;
      setState({ data: null, loading: true, error: null });
      try {
        const result = await generateThenCharge(
          () => apiFn(...args),
          () => useAppStore.getState().credits >= creditCost,
          () => useCredit(creditCost),
        );
        setState({ data: result, loading: false, error: null });
        return result;
      } catch (err: any) {
        const error = err instanceof Error ? err : new Error(err?.message || 'AI generation failed');
        setState({ data: null, loading: false, error });
        addToast('error', error.message);
        return null;
      } finally {
        inFlight.current = false;
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
