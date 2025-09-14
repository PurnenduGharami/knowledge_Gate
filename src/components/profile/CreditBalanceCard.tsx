
'use client';

import { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { USD_TO_SPARKS_RATE, formatSparks } from '@/lib/credits';
import { Coins, RefreshCw, Hourglass } from 'lucide-react';
import { cn } from '@/lib/utils';

function formatTimeLeft(ms: number) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m`;
}

export function CreditBalanceCard() {
  const { profile, userDataLoading } = useAppContext();
  const [timeLeft, setTimeLeft] = useState('');
  const [timeIsLow, setTimeIsLow] = useState(false);

  useEffect(() => {
    if (userDataLoading || !profile.lastRefillUTC || (profile.refillsUsed ?? 0) >= 30) {
      setTimeLeft('');
      return;
    }

    const intervalId = setInterval(() => {
      const nextRefillTime = new Date(profile.lastRefillUTC!).getTime() + (24 * 60 * 60 * 1000);
      const now = new Date().getTime();
      const difference = nextRefillTime - now;

      if (difference <= 0) {
        setTimeLeft('Refill available now!');
        setTimeIsLow(false);
        clearInterval(intervalId);
        return;
      }
      
      setTimeIsLow(difference < 2 * 60 * 60 * 1000); // Check if less than 2 hours
      setTimeLeft(formatTimeLeft(difference));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [userDataLoading, profile.lastRefillUTC, profile.refillsUsed]);
  
  if (userDataLoading) {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-10 w-1/2" />
                <div className="space-y-2 pt-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                </div>
                <Skeleton className="h-10 w-full" />
            </CardContent>
        </Card>
    )
  }

  const refillsUsed = profile.refillsUsed ?? 0;
  const isQuotaReached = refillsUsed >= 30;

  return (
    <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
                <Coins className="h-5 w-5 text-muted-foreground" />
                Chaos Sparks
            </CardTitle>
            <CardDescription>
                Your universal balance for all AI interactions.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div>
                <p className="text-3xl font-bold tracking-tight">
                    {formatSparks(profile.chaosSparks)}
                </p>
            </div>
            
            <div className="text-sm text-muted-foreground border-t pt-4 space-y-2">
                 <div className="flex items-center justify-between">
                    <span className="font-medium flex items-center gap-2"><RefreshCw className="h-4 w-4" /> Daily Refills Used</span>
                    <span className="font-semibold text-foreground">{refillsUsed} / 30</span>
                </div>
                 <div className="flex items-center justify-between">
                    <span className="font-medium flex items-center gap-2"><Hourglass className="h-4 w-4" /> Next Refill In</span>
                    {isQuotaReached ? (
                        <span className="font-semibold text-destructive">Quota Reached</span>
                    ) : (
                        <span className={cn("font-semibold text-foreground", timeIsLow && "text-red-500")}>
                            {timeLeft}
                        </span>
                    )}
                </div>
            </div>

            {isQuotaReached && (
                 <p className="text-center text-xs text-destructive bg-destructive/10 p-2 rounded-md">
                    You’ve reached your 30-day Spark quota. Upgrade your plan to continue using Knowledge Gate.
                </p>
            )}
            
             <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button disabled className="w-full">
                            Recharge Sparks (Coming Soon)
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{USD_TO_SPARKS_RATE} Sparks = 1 USD. You receive 100 Sparks free per day for 30 days.</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </CardContent>
    </Card>
  );
}
