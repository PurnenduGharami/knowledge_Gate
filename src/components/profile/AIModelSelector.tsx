
'use client';

import { useState, useMemo } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useModelSelection } from '@/hooks/useModelSelection';
import type { OpenRouterModel } from '@/types/search';
import type { Tier } from '@/types/profile';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TierTabs } from './TierTabs';
import { Badge } from '@/components/ui/badge';
import { X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface AIModelSelectorProps {
  mode: "standard" | "multi" | "summary" | "conflict";
  description: string;
}

const MODE_LIMITS = {
  standard: 1,
  multi: 5,
  summary: 10,
  conflict: 5,
};

const ENFORCE_FAMILY_UNIQUENESS = {
  standard: false,
  multi: true,
  summary: false,
  conflict: true,
};

export function AIModelSelector({ mode, description }: AIModelSelectorProps) {
  const { profile, updateModelPreference } = useAppContext();
  const { allModels, isLoading: isLoadingModels } = useModelSelection();
  const { toast } = useToast();

  const [activeTier, setActiveTier] = useState<Tier | 'all'>('all');

  const preference = useMemo(() => {
    return profile.modelPrefs.find(p => p.mode === mode) || { mode, type: 'automatic', modelIds: [] };
  }, [profile.modelPrefs, mode]);

  const selectedModels = useMemo(() => {
    return allModels.filter(m => preference.modelIds.includes(m.id));
  }, [allModels, preference.modelIds]);

  const handleTypeChange = (type: "automatic" | "manual") => {
    updateModelPreference({ ...preference, type });
  };
  
  const handleModelToggle = (model: OpenRouterModel) => {
    let newModelIds = [...preference.modelIds];
    const limit = MODE_LIMITS[mode];
    const enforceUniqueFamily = ENFORCE_FAMILY_UNIQUENESS[mode];

    if (newModelIds.includes(model.id)) {
      // Deselect
      newModelIds = newModelIds.filter(id => id !== model.id);
    } else {
      // Select
      if (newModelIds.length >= limit) {
        toast({ title: "Limit Reached", description: `You can only select up to ${limit} model(s) for this mode.`, variant: "destructive" });
        return;
      }
      if (enforceUniqueFamily) {
        const selectedFamilies = new Set(selectedModels.map(m => m.family));
        if (selectedFamilies.has(model.family)) {
            toast({ title: "Family Already Selected", description: `You can only select one model per family for this mode.`, variant: "destructive" });
            return;
        }
      }
      newModelIds.push(model.id);
    }
    updateModelPreference({ ...preference, modelIds: newModelIds });
  };
  
  const filteredModels = useMemo(() => {
      if (activeTier === 'all') return allModels;
      return allModels.filter(m => m.tier === activeTier);
  }, [allModels, activeTier]);


  return (
    <div className="space-y-4 p-4 border rounded-lg bg-background">
      <p className="text-sm text-muted-foreground">{description}</p>
      <RadioGroup value={preference.type} onValueChange={handleTypeChange} className="flex space-x-4">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="automatic" id={`${mode}-automatic`} />
          <Label htmlFor={`${mode}-automatic`}>Automatic</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="manual" id={`${mode}-manual`} />
          <Label htmlFor={`${mode}-manual`}>Manual</Label>
        </div>
      </RadioGroup>

      {preference.type === 'manual' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <TierTabs activeTier={activeTier} onTierChange={setActiveTier} />
          </div>
          <div className="md:col-span-2">
            <Command className="border rounded-lg h-80">
                <CommandInput placeholder="Filter by name or family..." />
                <ScrollArea className="flex-grow">
                    <CommandList>
                        <CommandEmpty>{isLoadingModels ? "Loading models..." : "No models found."}</CommandEmpty>
                        <CommandGroup>
                        {filteredModels.map(model => (
                            <CommandItem
                                key={model.id}
                                value={`${model.name} ${model.family}`}
                                onSelect={() => handleModelToggle(model)}
                                className="flex items-center justify-between cursor-pointer"
                            >
                                <div className="flex items-center gap-2">
                                     <div className="w-4">
                                        {preference.modelIds.includes(model.id) && <Check className="h-4 w-4" />}
                                    </div>
                                    <div>
                                        <p className="font-medium">{model.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {model.provider} / {model.family}
                                        </p>
                                    </div>
                                </div>
                                <Badge variant={model.isFree ? "secondary" : "outline"}>{model.tier}</Badge>
                            </CommandItem>
                        ))}
                        </CommandGroup>
                    </CommandList>
                </ScrollArea>
            </Command>
             <div className="pt-4">
                <h4 className="text-sm font-medium mb-2">Selected Models ({selectedModels.length} / {MODE_LIMITS[mode]})</h4>
                <div className="flex flex-wrap gap-2">
                {selectedModels.length > 0 ? (
                    selectedModels.map(model => (
                        <Badge key={model.id} variant="default" className="flex items-center gap-1">
                            {model.name}
                            <button onClick={() => handleModelToggle(model)} className="rounded-full hover:bg-primary-foreground/20">
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))
                ) : (
                    <p className="text-sm text-muted-foreground">No models selected.</p>
                )}
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
