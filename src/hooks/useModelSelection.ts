import { useState, useEffect, useCallback } from 'react';
import type { OpenRouterModel } from '@/types/search';
import {
  getModels as fetchAllModels,
  getStandardModels,
  getMultiSourceModels,
  getSummaryModels,
  getConflictModels,
} from '@/utils/openRouter';

// Client-side failure tracking is removed as the backend now handles fallbacks gracefully.

export function useModelSelection() {
  const [allModels, setAllModels] = useState<OpenRouterModel[]>([]);
  const [availableModels, setAvailableModels] = useState<OpenRouterModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAndFilterModels = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const models = await fetchAllModels();
      setAllModels(models);
      // We now consider all fetched models as available.
      // The backend will handle fallbacks if a model is rate-limited or fails.
      setAvailableModels(models);

    } catch (e) {
      setError(e as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAndFilterModels();
  }, [fetchAndFilterModels]);

  return {
    allModels, // For custom selector
    availableModels, // For automated modes
    isLoading,
    error,
    refreshModels: fetchAndFilterModels,
    modelSelectors: {
        getStandardModels: () => getStandardModels(availableModels),
        getMultiSourceModels: () => getMultiSourceModels(availableModels),
        getSummaryModels: () => getSummaryModels(availableModels),
        getConflictModels: () => getConflictModels(availableModels),
    }
  };
}
