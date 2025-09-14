'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { SearchMode } from '@/types/search';

interface ModeSelectorProps {
  currentMode: SearchMode;
  onModeChange: (mode: SearchMode) => void;
  disabled: boolean;
}

export function ModeSelector({ currentMode, onModeChange, disabled }: ModeSelectorProps) {
    const modes: { value: SearchMode; label: string, disabled?: boolean }[] = [
        { value: 'standard', label: 'Standard' },
        { value: 'multi', label: 'Multi-Source' },
        { value: 'summary', label: 'Summary' },
        { value: 'conflict', label: 'Conflict' },
        { value: 'custom', label: 'Custom' },
    ];
  
  return (
    <>
        <div className="sm:hidden">
            <Select onValueChange={(value) => onModeChange(value as SearchMode)} value={currentMode} disabled={disabled}>
                <SelectTrigger className="h-auto w-[150px]">
                    <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                    {modes.map((mode) => (
                        <SelectItem key={mode.value} value={mode.value} disabled={mode.disabled}>
                            {mode.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>

        <div className="hidden sm:block">
            <Tabs value={currentMode} onValueChange={(value) => onModeChange(value as SearchMode)} className="w-auto">
              <TabsList>
                {modes.map((mode) => (
                  <TabsTrigger key={mode.value} value={mode.value} disabled={disabled || mode.disabled}>
                    {mode.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
        </div>
    </>
  );
}
