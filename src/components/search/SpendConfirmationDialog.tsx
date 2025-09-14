'use client';

import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Coins, Zap } from 'lucide-react';
import type { OpenRouterModel } from '@/types/search';
import { USD_TO_SPARKS_RATE, FLAT_TRANSACTION_FEE_SPARKS, formatSparks, formatSparksDetailed } from '@/lib/credits';

interface SpendConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (budget: number) => void;
  model: OpenRouterModel | null;
  userSparks: number;
}

const PRESETS = [
    { label: 'Low', sparks: 0.5 },
    { label: 'Standard', sparks: 1.0 },
    { label: 'High', sparks: 2.5 },
];

function getMaxTokensForBudget(sparkBudget: number, model: OpenRouterModel): number {
    if (!model || model.pricing.completion <= 0) return Infinity;

    const usableSparks = sparkBudget - FLAT_TRANSACTION_FEE_SPARKS;
    if (usableSparks <= 0) return 0;

    const usableUSD = usableSparks / USD_TO_SPARKS_RATE;
    const maxTokens = Math.floor(usableUSD / model.pricing.completion);
    
    return maxTokens > 0 ? maxTokens : 0;
}

export function SpendConfirmationDialog({ isOpen, onClose, onConfirm, model, userSparks }: SpendConfirmationDialogProps) {
  const [budget, setBudget] = useState(PRESETS[1].sparks);
  const [inputValue, setInputValue] = useState(PRESETS[1].sparks.toString());

  useEffect(() => {
    if (model) {
      const defaultBudget = PRESETS[1].sparks;
      setBudget(defaultBudget);
      setInputValue(defaultBudget.toString());
    }
  }, [model]);

  const maxTokens = useMemo(() => {
    if (!model) return 0;
    return getMaxTokensForBudget(budget, model);
  }, [budget, model]);

  const handleConfirm = () => {
    onConfirm(budget);
  };

  const handleBudgetChange = (value: string) => {
      setInputValue(value);
      const numericValue = parseFloat(value);
      if (!isNaN(numericValue) && numericValue > 0) {
          setBudget(numericValue);
      }
  }
  
  const isOverBudget = budget > userSparks;

  if (!model) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm Spend</DialogTitle>
          <DialogDescription>
            The model <span className="font-bold text-foreground">{model.name}</span> is in the <span className="font-bold text-foreground">{model.tier}</span> tier. Please set a spend limit for this request.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
            <div className="flex justify-around items-center text-center text-xs text-muted-foreground">
                <div>
                    <div className="font-semibold text-base text-foreground">{formatSparks(userSparks)}</div>
                    <div>Your Sparks</div>
                </div>
                <div>
                    <div className="font-semibold text-base text-foreground">
                        {maxTokens === Infinity ? '∞' : maxTokens.toLocaleString()}
                    </div>
                    <div>Max Tokens</div>
                </div>
            </div>

            <div>
                <Label htmlFor="spark-budget" className="text-base">Spark Budget</Label>
                <div className="flex items-center gap-4 mt-2">
                    <Input
                        id="spark-budget"
                        type="number"
                        value={inputValue}
                        onChange={(e) => handleBudgetChange(e.target.value)}
                        className="w-24 text-lg h-12"
                        min="0.01"
                        step="0.1"
                    />
                    <div className="flex-1 space-y-2">
                         <Slider
                            value={[budget]}
                            onValueChange={(value) => handleBudgetChange(value[0].toString())}
                            max={Math.min(10, userSparks)}
                            step={0.1}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            {PRESETS.map(p => <span key={p.label}>{p.label} ({p.sparks})</span>)}
                        </div>
                    </div>
                </div>
            </div>

            {isOverBudget && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Insufficient Sparks</AlertTitle>
                    <AlertDescription>
                        Your budget of {formatSparks(budget)} exceeds your available balance of {formatSparks(userSparks)}.
                    </AlertDescription>
                </Alert>
            )}
             {model.tier === 'Premium' && (
                <Alert variant="default" className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500/50">
                    <Zap className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    <AlertTitle className="text-yellow-800 dark:text-yellow-300">Premium Model Warning</AlertTitle>
                    <AlertDescription className="text-yellow-700 dark:text-yellow-500">
                        This is a powerful but expensive model. Monitor your spend carefully.
                    </AlertDescription>
                </Alert>
            )}

        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={isOverBudget || budget <= 0}>
            Confirm & Search ({formatSparksDetailed(budget)} Sparks)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
