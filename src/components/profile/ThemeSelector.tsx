
'use client';

import { useAppContext } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Check, Sun, Moon, Laptop } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

const themes = [
  { name: 'Slate', value: 'slate', colors: ['#020817', '#f8fafc', '#64748b'] },
  { name: 'Neutral', value: 'neutral', colors: ['#171717', '#fafafa', '#e5e5e5']},
  { name: 'Stone', value: 'stone', colors: ['#292524', '#fafaf9', '#a8a29e']},
  { name: 'Rose', value: 'rose', colors: ['#881337', '#fff1f2', '#e11d48'] },
  { name: 'Zinc', value: 'zinc', colors: ['#18181b', '#fafafa', '#71717a'] },
  { name: 'Violet', value: 'violet', colors: ['#4c1d95', '#f5f3ff', '#8b5cf6']},
  { name: 'Green', value: 'green', colors: ['#14532d', '#f0fdf4', '#4ade80']},
  { name: 'Parchment', value: 'parchment', colors: ['#3a2d1e', '#fbf9f2', '#dcd4a1'] },
];

export function ThemeSelector() {
  const { profile, updateTheme, updateColorMode, userDataLoading } = useAppContext();
  const currentTheme = profile.theme || 'slate';

  if (userDataLoading) {
    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>Theme</CardTitle>
                        <CardDescription>Select a color palette and mode.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="h-6 w-24 rounded-md bg-muted animate-pulse"></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="w-full h-16 rounded-md bg-muted animate-pulse" />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>Customize the look and feel of the application.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
            <Label className="text-base">Color Mode</Label>
            <RadioGroup
              value={profile.colorMode}
              onValueChange={(value: 'light' | 'dark' | 'system') => updateColorMode(value)}
              className="grid max-w-md grid-cols-3 gap-4 pt-2"
            >
              <Label className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary">
                <RadioGroupItem value="light" id="light" className="sr-only" />
                <Sun className="mb-3 h-6 w-6" />
                Light
              </Label>
              <Label className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary">
                <RadioGroupItem value="dark" id="dark" className="sr-only" />
                <Moon className="mb-3 h-6 w-6" />
                Dark
              </Label>
              <Label className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary">
                <RadioGroupItem value="system" id="system" className="sr-only" />
                <Laptop className="mb-3 h-6 w-6" />
                System
              </Label>
            </RadioGroup>
        </div>
        
        <Separator/>

        <div>
            <Label className="text-base">Color Palette</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                {themes.map((theme) => (
                    <div key={theme.value}>
                        <button
                        onClick={() => updateTheme(theme.value)}
                        className={cn(
                            'w-full rounded-md border-2 p-1 transition-colors',
                            currentTheme === theme.value ? 'border-primary' : 'border-transparent hover:border-muted-foreground/50'
                        )}
                        >
                        <div className="flex items-center justify-between rounded-md bg-muted px-2 py-1">
                            <span className="text-sm font-semibold">{theme.name}</span>
                            {currentTheme === theme.value && <Check className="h-4 w-4 text-primary" />}
                        </div>
                        <div className="mt-2 flex gap-1 p-1">
                            <div className="h-5 w-full rounded" style={{ backgroundColor: theme.colors[0] }} />
                            <div className="h-5 w-full rounded" style={{ backgroundColor: theme.colors[1] }} />
                            <div className="h-5 w-full rounded" style={{ backgroundColor: theme.colors[2] }} />
                        </div>
                        </button>
                    </div>
                ))}
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
