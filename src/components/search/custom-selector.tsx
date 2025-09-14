
'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { OpenRouterModel, CustomSettings } from '@/types/search';
import { SlidersHorizontal, X, Check } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { TierTabs } from '@/components/profile/TierTabs';
import type { Tier } from '@/types/profile';

interface CustomSelectorProps {
  allModels: OpenRouterModel[];
  settings: CustomSettings;
  onSettingsChange: (settings: CustomSettings) => void;
  disabled: boolean;
}

export function CustomSelector({ allModels, settings, onSettingsChange, disabled }: CustomSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTier, setActiveTier] = useState<Tier | 'all'>('all');

    const handleModelToggle = (modelId: string) => {
        const newSelectedIds = settings.selectedProviderIds.includes(modelId)
            ? settings.selectedProviderIds.filter(id => id !== modelId)
            : [...settings.selectedProviderIds, modelId];
        onSettingsChange({ ...settings, selectedProviderIds: newSelectedIds });
    };

    const handleSummarizeToggle = (checked: boolean) => {
        onSettingsChange({ ...settings, summarize: checked });
    };
    
    const atLeastOneProviderSelected = settings.selectedProviderIds.length > 0;

    const filteredModels = useMemo(() => {
        if (activeTier === 'all') return allModels;
        return allModels.filter(m => m.tier === activeTier);
    }, [allModels, activeTier]);
    
    const selectedModels = useMemo(() => {
        // Preserve order of selection
        return settings.selectedProviderIds.map(id => allModels.find(m => m.id === id)).filter(Boolean) as OpenRouterModel[];
    }, [allModels, settings.selectedProviderIds]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                 <Button variant="ghost" size="icon" disabled={disabled}>
                    <SlidersHorizontal className="h-5 w-5" />
                    <span className="sr-only">Custom Settings</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="w-[90%] max-w-7xl max-h-[90vh] flex flex-col p-0">
                <DialogHeader className="p-6 pb-4 border-b flex-shrink-0">
                    <DialogTitle>Custom Search Configuration</DialogTitle>
                    <DialogDescription>
                        Manually select models, filter by tier, and choose how to display results.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-grow overflow-y-auto">
                    <div className="p-6 grid grid-cols-1 gap-6">
                        {/* Section 2: AI Model List */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="md:col-span-1">
                                <TierTabs activeTier={activeTier} onTierChange={setActiveTier} />
                            </div>
                            <div className="md:col-span-3">
                                <Command className="border rounded-lg h-96">
                                    <CommandInput placeholder="Filter by name or family..." />
                                    <ScrollArea className="flex-grow">
                                        <CommandList>
                                            <CommandEmpty>No models found.</CommandEmpty>
                                            <CommandGroup>
                                                {filteredModels.map(model => (
                                                    <CommandItem
                                                        key={model.id}
                                                        value={`${model.name} ${model.family}`}
                                                        onSelect={() => handleModelToggle(model.id)}
                                                        className="flex items-center justify-between cursor-pointer"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-4">
                                                                {settings.selectedProviderIds.includes(model.id) && <Check className="h-4 w-4" />}
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
                            </div>
                        </div>

                        {/* Section 3: Selected Models */}
                        <div>
                            <h4 className="text-sm font-medium mb-2">Selected Models ({selectedModels.length})</h4>
                            <div className="flex flex-wrap gap-2 min-h-[2.25rem] p-2 border rounded-md bg-muted/50">
                            {selectedModels.length > 0 ? (
                                selectedModels.map(model => (
                                    <Badge key={model.id} variant="default" className="flex items-center gap-1">
                                        {model.name}
                                        <button onClick={() => handleModelToggle(model.id)} className="rounded-full hover:bg-primary-foreground/20">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground px-2">No models selected.</p>
                            )}
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Section 4: Actions */}
                <div className="border-t p-6 flex-shrink-0">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center space-x-2">
                            <Switch id="summarize-switch" checked={settings.summarize} onCheckedChange={handleSummarizeToggle} />
                            <Label htmlFor="summarize-switch">Summarize results if more than one model is selected</Label>
                        </div>
                        
                        <DialogFooter className="p-0 sm:justify-end">
                            <Button onClick={() => setIsOpen(false)} disabled={!atLeastOneProviderSelected}>Done</Button>
                        </DialogFooter>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
