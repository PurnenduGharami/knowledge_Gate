
'use client';

import { useAppContext } from '@/contexts/AppContext';
import { useModelSelection } from '@/hooks/useModelSelection';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export function CurrentlyUsedModels() {
  const { profile, userDataLoading } = useAppContext();
  const { allModels, isLoading: modelsLoading } = useModelSelection();

  const getModelName = (id: string) => allModels.find(m => m.id === id)?.name || id;

  const isLoading = userDataLoading || modelsLoading;

  const modeDetails = {
    standard: "Standard",
    multi: "Multi-Source",
    summary: "Summary",
    conflict: "Conflict",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Model Configuration</CardTitle>
        <CardDescription>This is your current AI model setup for each search mode.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <>
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </>
        ) : (
          Object.entries(modeDetails).map(([modeKey, name]) => {
            const mode = modeKey as keyof typeof modeDetails;
            const pref = profile.modelPrefs.find(p => p.mode === mode);
            if (!pref) return null;

            return (
              <div key={mode} className="p-3 border rounded-lg">
                <h4 className="font-semibold">{name}</h4>
                {pref.type === 'automatic' ? (
                  <Badge variant="secondary">Automatic</Badge>
                ) : (
                  <div className="mt-2">
                    {pref.modelIds.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {pref.modelIds.map(id => (
                          <Badge key={id} variant="outline">{getModelName(id)}</Badge>
                        ))}
                      </div>
                    ) : (
                      <Badge variant="destructive">Manual (No Models Selected)</Badge>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
