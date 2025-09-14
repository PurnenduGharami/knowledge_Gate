'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import type { ProviderResult, SearchMode, FallbackInfo, CustomSettings, HistoryItem, ChatContext, OpenRouterModel, QueryProviderOutput, UsageStats, SparkTransaction } from '@/types/search';
import { ResultCard } from './result-card';
import { useToast } from '@/hooks/use-toast';
import { ModeSelector } from './mode-selector';
import { ResultToolbar } from './result-toolbar';
import { queryProvider } from '@/ai/flows/query-provider-flow';
import { detectConflicts } from '@/utils/conflict';
import { CustomSelector } from './custom-selector';
import { useModelSelection } from '@/hooks/useModelSelection';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';
import { generateContextToken } from '@/utils/contextToken';
import { useAppContext } from '@/contexts/AppContext';
import { USD_TO_SPARKS_RATE, FLAT_TRANSACTION_FEE_SPARKS } from '@/lib/credits';
import { SpendConfirmationDialog } from './SpendConfirmationDialog';

// Extend ProviderResult for internal use during multi-model search
type InProgressProviderResult = ProviderResult & { originalModelId: string };

type SearchHandlerResult = {
  finalResults: InProgressProviderResult[];
  finalFallbackInfo: FallbackInfo | null;
}

export function KnowledgeGate() {
  const [query, setQuery] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>('standard');
  const [results, setResults] = useState<InProgressProviderResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fallbackInfo, setFallbackInfo] = useState<FallbackInfo | null>(null);
  const [chatContext, setChatContext] = useState<ChatContext | null>(null);
  const searchCancelled = useRef(false);

  // New state for the spend confirmation dialog
  const [confirmationRequest, setConfirmationRequest] = useState<{
    model: OpenRouterModel;
    resolve: (value: number | null) => void;
  } | null>(null);

  const { toast } = useToast();
  // All context values are now from useAppContext
  const { profile, deductSparks, logTransactions, addHistoryItem, activeProject } = useAppContext();
  const searchParams = useSearchParams();
  const { allModels, availableModels, isLoading: isLoadingModels, modelSelectors } = useModelSelection();
  
  const [customSettings, setCustomSettings] = useState<CustomSettings>({
    selectedProviderIds: [],
    summarize: false,
  });
  const [customSettingsInitialized, setCustomSettingsInitialized] = useState(false);
  
  useEffect(() => {
    if (availableModels.length > 0 && !customSettingsInitialized) {
      const defaultProviders = modelSelectors.getMultiSourceModels();
      setCustomSettings(prev => ({ ...prev, selectedProviderIds: defaultProviders.map(p => p.id) }));
      setCustomSettingsInitialized(true);
    }
  }, [availableModels, customSettingsInitialized, modelSelectors]);

  useEffect(() => {
    const rerunQuery = searchParams.get('rerun_query');
    if (rerunQuery) {
      setQuery(rerunQuery);
    }
  }, [searchParams]);

  const getBudgetForModel = useCallback((model: OpenRouterModel): Promise<number | null> => {
    if (model.tier === 'Basic' || model.isFree) {
      return Promise.resolve(profile.chaosSparks); 
    }

    return new Promise((resolve) => {
      setConfirmationRequest({ model, resolve });
    });
  }, [profile.chaosSparks]);
  
  // ====================================================================================
  // THE ONLY CHANGE IS IN THIS FUNCTION
  // It now correctly handles the error object returned from the server.
  // ====================================================================================
  const executeQuery = async (modelId: string, query: string, isUserSelection: boolean): Promise<QueryProviderOutput> => {
    const model = allModels.find(m => m.id === modelId);
    if (!model) throw new Error(`Model ${modelId} not found.`);
    
    const budget = await getBudgetForModel(model);
    
    if (budget === null) { // User cancelled the dialog
        const error = new Error('Search cancelled by user.');
        (error as any).isCancellation = true;
        throw error;
    }

    if (profile.chaosSparks < FLAT_TRANSACTION_FEE_SPARKS) {
        toast({ title: 'Insufficient Sparks', description: 'Your balance is too low for this transaction.', variant: 'destructive'});
        throw new Error('Insufficient Chaos Sparks.');
    }
    
    const max_tokens = (() => {
        if (model.pricing.completion <= 0) return undefined;
        
        const usableSparks = budget - FLAT_TRANSACTION_FEE_SPARKS;
        if (usableSparks <= 0) return 0;
        
        const usableUSD = usableSparks / USD_TO_SPARKS_RATE;
        const tokens = Math.floor(usableUSD / model.pricing.completion);
        return tokens > 0 ? tokens : 0;
    })();
    
    if (max_tokens === 0) {
        throw new Error("Budget too low to generate any tokens.");
    }

    // Call the server action
    const result = await queryProvider({ query, modelId, isUserSelection, max_tokens });

    // THE FIX: Check if the returned object is an error object.
    // If it is, throw a NEW error on the CLIENT-SIDE.
    // This allows the existing try/catch blocks in handle... functions to work correctly.
    if (result.error) {
        throw new Error(result.message);
    }

    // If it's not an error, return the successful result.
    return result;
  };
  
  const getModelsForMode = (mode: SearchMode): { models: OpenRouterModel[], isUserSelection: boolean } => {
    const pref = profile.modelPrefs.find(p => p.mode === mode);
    if (pref?.type === 'manual' && pref.modelIds.length > 0) {
      const userModels = allModels.filter(m => pref.modelIds.includes(m.id));
      return { models: userModels, isUserSelection: true };
    }
    
    switch(mode) {
      case 'standard': return { models: modelSelectors.getStandardModels(), isUserSelection: false };
      case 'multi': return { models: modelSelectors.getMultiSourceModels(), isUserSelection: false };
      case 'summary': return { models: modelSelectors.getSummaryModels(), isUserSelection: false };
      case 'conflict': return { models: modelSelectors.getConflictModels(), isUserSelection: false };
      case 'custom':
         const customModels = allModels.filter(m => customSettings.selectedProviderIds.includes(m.id));
         return { models: customModels, isUserSelection: true };
      default: return { models: [], isUserSelection: false };
    }
  };

  const handleStandardSearch = async (query: string, cancelledRef: React.MutableRefObject<boolean>): Promise<SearchHandlerResult> => {
    const { models, isUserSelection } = getModelsForMode('standard');
    if (models.length === 0) {
        toast({ title: "No models available", description: "Could not find any models for standard search.", variant: "destructive" });
        return { finalResults: [], finalFallbackInfo: null };
    }
    
    if (cancelledRef.current) return { finalResults: [], finalFallbackInfo: null };
    const loadingResult: InProgressProviderResult = { providerId: 'standard-loading', name: 'Standard Search', status: 'loading', originalModelId: 'standard-loading' };
    setResults([loadingResult]);
    
    for (const model of models) {
        if (cancelledRef.current) return { finalResults: [], finalFallbackInfo: null };
        try {
            setResults([{ ...loadingResult, resultText: `Querying ${model.name}...`}]);
            
            // This 'await' will now correctly throw an error if the server returned an error object.
            const resultFromServer = await executeQuery(model.id, query, isUserSelection);
            
            if (cancelledRef.current) return { finalResults: [], finalFallbackInfo: null };
            
            const successResult: InProgressProviderResult = {
                providerId: resultFromServer.originalModelId!,
                name: model.name,
                status: 'success',
                resultText: resultFromServer.response,
                originalModelId: resultFromServer.originalModelId!,
                tokensUsed: resultFromServer.usage?.total_tokens,
                sparksSpent: resultFromServer.sparksSpent,
                costUSD: resultFromServer.costUSD,
            };
            setResults([successResult]);
            setFallbackInfo(null);
            return { finalResults: [successResult], finalFallbackInfo: null };
        } catch (error: any) {
            // This 'catch' block will now correctly execute when a model is rate-limited.
            if (cancelledRef.current) return { finalResults: [], finalFallbackInfo: null };
            
            if (error.isCancellation) {
              const cancelResult = { providerId: 'error', name: model.name, status: 'error', resultText: 'Search cancelled by user.', originalModelId: model.id };
              setResults([cancelResult]);
              return { finalResults: [cancelResult], finalFallbackInfo: null };
            }

             if (isUserSelection) {
                toast({ title: "Selected model failed", description: "Please choose another model from your Profile.", variant: "destructive" });
                const errorResult: InProgressProviderResult = { providerId: 'error', name: model.name, status: 'error', resultText: error.message, originalModelId: model.id };
                setResults([errorResult]);
                return { finalResults: [errorResult], finalFallbackInfo: null };
            }

            if (models.indexOf(model) < models.length - 1) {
              setResults([{ ...loadingResult, resultText: `Model ${model.name} failed, trying next...`}]);
            }
        }
    }
    
    const errorResult: InProgressProviderResult = { providerId: 'error', name: 'All Providers', status: 'error', resultText: 'All available free models failed.', originalModelId: 'error' };
    if (cancelledRef.current) return { finalResults: [], finalFallbackInfo: null };
    setResults([errorResult]);
    return { finalResults: [errorResult], finalFallbackInfo: null };
  };

  const handleMultiModelSearch = async (query: string, modelsToUse: OpenRouterModel[], isUserSelection: boolean, cancelledRef: React.MutableRefObject<boolean>): Promise<SearchHandlerResult> => {
    if (cancelledRef.current) return { finalResults: [], finalFallbackInfo: null };
    
    const initialResults: InProgressProviderResult[] = modelsToUse.map((model) => ({
      providerId: model.id,
      name: model.name,
      status: 'loading',
      originalModelId: model.id,
    }));
    setResults(initialResults);

    const promises = modelsToUse.map(async (model): Promise<InProgressProviderResult> => {
        if (cancelledRef.current) return { providerId: model.id, originalModelId: model.id, name: model.name, status: 'error', resultText: 'Search cancelled.'};
        try {
            const resultFromServer = await executeQuery(model.id, query, isUserSelection);
            if (cancelledRef.current) return { providerId: model.id, originalModelId: model.id, name: model.name, status: 'error', resultText: 'Search cancelled.'};
            
            return { 
              providerId: resultFromServer.originalModelId!, 
              name: model.name,
              status: 'success', 
              resultText: resultFromServer.response, 
              originalModelId: model.id, 
              tokensUsed: resultFromServer.usage?.total_tokens,
              sparksSpent: resultFromServer.sparksSpent,
              costUSD: resultFromServer.costUSD
            };
        } catch (e: any) {
            if (cancelledRef.current) return { providerId: model.id, originalModelId: model.id, name: model.name, status: 'error', resultText: 'Search cancelled.'};
            if (e.isCancellation) {
              return { providerId: model.id, originalModelId: model.id, name: model.name, status: 'error', resultText: 'Search cancelled by user.' };
            }
            if (isUserSelection) {
                 toast({ title: `Model "${model.name}" failed`, description: e.message, variant: "destructive", duration: 5000 });
            }
            return { providerId: model.id, originalModelId: model.id, name: model.name, status: 'error', resultText: e.message };
        }
    });
    
    promises.forEach(async (promise) => {
        if (cancelledRef.current) return;
        const result = await promise;
        if (cancelledRef.current) return;
        setResults(prev => cancelledRef.current ? [] : prev.map(r => r.originalModelId === result.originalModelId ? result : r));
    });

    const finalResults = await Promise.all(promises);
    return { finalResults, finalFallbackInfo: null };
  };

  const handleSummarySearch = async (query: string, cancelledRef: React.MutableRefObject<boolean>): Promise<SearchHandlerResult> => {
    const { models: modelsToUse, isUserSelection } = getModelsForMode('summary');
    if (modelsToUse.length === 0) {
      toast({ title: 'No models selected for Summary', variant: 'destructive'});
      return { finalResults: [], finalFallbackInfo: null };
    }
    if (cancelledRef.current) return { finalResults: [], finalFallbackInfo: null };
    const { finalResults: multiResults } = await handleMultiModelSearch(query, modelsToUse, isUserSelection, cancelledRef);
    if (cancelledRef.current) return { finalResults: [], finalFallbackInfo: null };
    
    const successfulTexts = multiResults.filter(r => r.status === 'success').map(r => r.resultText!);
    
    if (successfulTexts.length === 0) {
        const finalResult: InProgressProviderResult = { providerId: 'summary-error', name: 'Summary', status: 'error', resultText: 'No successful responses to summarize.', originalModelId: 'summary-error' };
        if (cancelledRef.current) return { finalResults: [], finalFallbackInfo: null };
        setResults([finalResult]);
        return { finalResults: [finalResult], finalFallbackInfo: null };
    }
    
    const summaryResult: InProgressProviderResult = { providerId: 'summary', name: 'Summary', status: 'loading', resultText: 'Generating summary...', originalModelId: 'summary'};
    setResults([summaryResult]);

    try {
        const { response, usage, costUSD, sparksSpent } = await executeQuery('google/gemini-flash-1.5', `Summarize these texts: ${successfulTexts.join(' ')}`, false);
        
        const finalResult: InProgressProviderResult = { 
          ...summaryResult, 
          status: 'success', 
          resultText: response, 
          tokensUsed: usage?.total_tokens,
          sparksSpent: sparksSpent,
          costUSD: costUSD
        };
        const allResults = [...multiResults, finalResult];
        setResults([finalResult]);
        return { finalResults: allResults, finalFallbackInfo: null };
    } catch (e: any) {
        if (e.isCancellation) {
           const cancelResult = { ...summaryResult, status: 'error', resultText: 'Search cancelled by user.' };
           setResults([cancelResult]);
           return { finalResults: [...multiResults, cancelResult], finalFallbackInfo: null };
        }
        const errorResult: InProgressProviderResult = { ...summaryResult, status: 'error', resultText: e.message };
        setResults([errorResult]);
        return { finalResults: [...multiResults, errorResult], finalFallbackInfo: null };
    }
  };

  const handleConflictSearch = async (query: string, cancelledRef: React.MutableRefObject<boolean>): Promise<SearchHandlerResult> => {
    const { models: modelsToUse, isUserSelection } = getModelsForMode('conflict');
     if (modelsToUse.length === 0) {
      toast({ title: 'No models selected for Conflict', variant: 'destructive'});
      return { finalResults: [], finalFallbackInfo: null };
    }
    if (cancelledRef.current) return { finalResults: [], finalFallbackInfo: null };
    const { finalResults: multiResults } = await handleMultiModelSearch(query, modelsToUse, isUserSelection, cancelledRef);
    if (cancelledRef.current) return { finalResults: [], finalFallbackInfo: null };
    const conflicts = detectConflicts(multiResults);
    const conflictProviderIds = new Set(conflicts.flatMap(c => [c.a, c.b]));
    const finalResults = multiResults.map(r => ({
        ...r,
        inConflict: conflictProviderIds.has(r.providerId)
    }));
    setResults(finalResults);
    return { finalResults, finalFallbackInfo: null };
  };
  
  const handleCustomSearch = async (query: string, cancelledRef: React.MutableRefObject<boolean>): Promise<SearchHandlerResult> => {
    const { models: customModels, isUserSelection } = getModelsForMode('custom');
    if (customModels.length === 0) {
        toast({ title: 'No models selected', description: 'Please select at least one model in Custom settings.', variant: 'destructive' });
        return { finalResults: [], finalFallbackInfo: null };
    }
    return await handleMultiModelSearch(query, customModels, isUserSelection, cancelledRef);
  };

  const handleSearch = async (searchQuery: string) => {
    const trimmedQuery = searchQuery.trim();
    if (isLoading || !trimmedQuery) return;
    
    if (profile.chaosSparks < FLAT_TRANSACTION_FEE_SPARKS) {
      toast({ title: 'Not enough Chaos Sparks', description: "Your balance is too low to perform a search.", variant: 'destructive'});
      return;
    }

    searchCancelled.current = false;
    setIsLoading(true);
    setResults([]);
    setFallbackInfo(null);
    setChatContext(null);
    
    let searchResult: SearchHandlerResult = { finalResults: [], finalFallbackInfo: null };

    switch (searchMode) {
      case 'standard':
        searchResult = await handleStandardSearch(trimmedQuery, searchCancelled);
        break;
      case 'multi':
        const { models: multiModels, isUserSelection: isMultiUser } = getModelsForMode('multi');
        searchResult = await handleMultiModelSearch(trimmedQuery, multiModels, isMultiUser, searchCancelled);
        break;
      case 'summary':
        searchResult = await handleSummarySearch(trimmedQuery, searchCancelled);
        break;
      case 'conflict':
        searchResult = await handleConflictSearch(trimmedQuery, searchCancelled);
        break;
      case 'custom':
        searchResult = await handleCustomSearch(trimmedQuery, searchCancelled);
        break;
    }

    if (searchCancelled.current) {
        setIsLoading(false);
        setResults([]);
        return;
    }

    const successfulResults = searchResult.finalResults.filter(r => r.status === 'success');
    
    if (successfulResults.length > 0) {
        const totalSparksSpent = successfulResults.reduce((sum, r) => sum + (r.sparksSpent || 0), 0);
        
        if (totalSparksSpent > profile.chaosSparks) {
          toast({ title: 'Insufficient Sparks', description: `This query cost ${totalSparksSpent.toFixed(4)} but you only have ${profile.chaosSparks.toFixed(4)}. Some results may not have been paid for.`, variant: 'destructive', duration: 10000 });
        } else if (totalSparksSpent > 0) {
          deductSparks(totalSparksSpent);
        }

        const transactionsToLog: Omit<SparkTransaction, 'id' | 'timestamp'>[] = successfulResults
            .filter(r => r.sparksSpent && r.sparksSpent > 0)
            .map(r => ({
                modelUsed: r.originalModelId,
                sparksCharged: r.sparksSpent!,
                costUSD: r.costUSD || 0,
                tokensUsed: r.tokensUsed || 0,
                searchType: searchMode,
            }));

        if (transactionsToLog.length > 0) {
            logTransactions(transactionsToLog);
        }
    }
    
    let finalChatContext: ChatContext | undefined = undefined;
    if (successfulResults.length > 0) {
      finalChatContext = {
        chatId: uuidv4(),
        contextToken: generateContextToken(trimmedQuery, successfulResults),
      };
      setChatContext(finalChatContext);
    }
    
    if (searchResult.finalResults.length > 0) {
      const resultsToSaveAndDisplay = searchMode === 'summary' 
        ? searchResult.finalResults.slice(-1)
        : searchResult.finalResults;

      const historyResults: ProviderResult[] = resultsToSaveAndDisplay.map(
        ({ originalModelId, ...rest }) => rest
      );

      addHistoryItem({
        query: trimmedQuery,
        results: historyResults,
        mode: searchMode,
        fallbackInfo: searchResult.finalFallbackInfo,
        chatContext: finalChatContext,
      });

      if (searchMode === 'summary') {
          setResults(resultsToSaveAndDisplay);
      }
    }

    setIsLoading(false);
  };

  const handleStopSearch = () => {
    searchCancelled.current = true;
    setIsLoading(false);
    setResults([]);
    setFallbackInfo(null);
    setChatContext(null);
  };
  
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSearch(query);
    }
  };

  const isCreditLimited = profile.chaosSparks < FLAT_TRANSACTION_FEE_SPARKS;
  const isSearchDisabled = isLoading || isLoadingModels || isCreditLimited;
  const hasSearched = isLoading || results.length > 0;
  const showResults = results.length > 0;

  return (
    <div className={cn(
        "flex w-full flex-grow flex-col items-center transition-all duration-300 relative",
        hasSearched ? "justify-start pt-8" : "justify-center"
      )}>
      <div className='w-full space-y-6 flex flex-col items-center'>
          <div className="text-center">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight font-mono">Knowledge Gate</h1>
              <p className="text-muted-foreground mt-2">A gateway to the world’s collective intelligence.</p>
          </div>

          <div className="w-full max-w-2xl space-y-2">
              <div className="flex w-full items-stretch gap-2">
                  <div className="relative flex-grow">
                      <Input
                          type="text"
                          placeholder={
                            isLoadingModels ? "Loading models..." : 
                            isCreditLimited ? "Please recharge to continue" :
                            "What knowledge do you seek...?"
                          }
                          className="h-12 w-full text-base"
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          onKeyDown={handleKeyDown}
                          disabled={isSearchDisabled}
                      />
                  </div>
                  {isLoading ? (
                    <Button onClick={handleStopSearch} variant="destructive" className="h-12 shrink-0 px-4 sm:px-8 text-base">
                      <X className="mr-2 h-5 w-5" />
                      Stop
                    </Button>
                  ) : (
                    <Button onClick={() => handleSearch(query)} disabled={isSearchDisabled || !query.trim()} className="h-12 shrink-0 px-4 sm:px-8 text-base">
                      {isLoadingModels ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        'Search'
                      )}
                    </Button>
                  )}
              </div>

              <div className="flex w-full items-center gap-2">
                  <div className="flex-shrink-0">
                      <ModeSelector currentMode={searchMode} onModeChange={setSearchMode} disabled={isSearchDisabled} />
                  </div>
                  { searchMode === 'custom' && (
                      <div className="flex-shrink-0">
                        <CustomSelector 
                            allModels={allModels}
                            settings={customSettings}
                            onSettingsChange={setCustomSettings}
                            disabled={isSearchDisabled}
                        />
                      </div>
                  )}
                  <div className="relative flex-grow w-full min-w-0">
                      <div className="flex h-10 items-center justify-center rounded-lg border border-input bg-background px-3 py-2 text-sm">
                          {activeProject?.name || "Select a project"}
                      </div>
                  </div>
              </div>
          </div>
        
        {availableModels.length === 0 && !isLoadingModels && (
          <div className="text-center text-muted-foreground pt-10">
            <p>Could not load any AI models from OpenRouter.</p>
            <p>This could be a network issue or a problem with the API key.</p>
          </div>
        )}

        {showResults && searchMode === 'multi' && <div className="w-full"><ResultToolbar results={results} /></div>}

        <div className='w-full overflow-x-hidden'>
          {showResults ? (
              <div className="w-full space-y-4">
              {results.map((result, index) => (
                  <ResultCard key={`${result.originalModelId}-${index}`} result={result} searchMode={searchMode} fallbackInfo={fallbackInfo} chatContext={chatContext} />
              ))}
              </div>
          ) : (
              !isSearchDisabled && availableModels.length > 0 && (
                  <div className="text-center text-muted-foreground pt-20">
                      <p>The scrolls are blank. Your query's answer awaits discovery.</p>
                  </div>
              )
          )}
        </div>
      </div>
      {confirmationRequest && (
        <SpendConfirmationDialog
          isOpen={!!confirmationRequest}
          model={confirmationRequest.model}
          userSparks={profile.chaosSparks}
          onClose={() => {
            confirmationRequest.resolve(null);
            setConfirmationRequest(null);
          }}
          onConfirm={(budget) => {
            confirmationRequest.resolve(budget);
            setConfirmationRequest(null);
          }}
        />
      )}
    </div>
  );
}