import { useState, useCallback } from 'react';
import RNFSTurbo from 'react-native-fs-turbo';

import { useAIStore } from '@store/aiStore';
import { FoodAnalysisResult } from '@types';

export function useAnalyzeFood() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FoodAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (photoPath: string) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const base64 = await RNFSTurbo.readFile(photoPath, 'base64');
      const provider = useAIStore.getState().getProvider();
      const data = await provider.analyzeFood(base64);
      setResult(data);
    } catch (e: any) {
      setError(e.message ?? 'Failed to analyze food');
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, result, error, analyze };
}
