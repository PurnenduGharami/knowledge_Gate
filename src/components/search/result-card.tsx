
'use client';

import Link from 'next/link';
import { Loader2, ServerCrash, Copy, AlertTriangle, Coins } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ProviderResult, SearchMode, FallbackInfo, ChatContext } from '@/types/search';
import { useToast } from '@/hooks/use-toast';
import { parseResponse } from '@/utils/parseResponse';
import { formatSparksDetailed } from '@/lib/credits';


interface ResultCardProps {
  result: ProviderResult;
  searchMode: SearchMode;
  fallbackInfo?: FallbackInfo | null;
  chatContext?: ChatContext | null;
}

export function ResultCard({ result, searchMode, fallbackInfo, chatContext }: ResultCardProps) {
  const { toast } = useToast();

  const handleCopy = () => {
    if (result.resultText) {
      navigator.clipboard.writeText(result.resultText);
      toast({ title: 'Copied to clipboard!' });
    }
  };

  const renderContent = () => {
    switch (result.status) {
      case 'loading':
        return (
          <div className="flex items-center space-x-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>{result.resultText || 'Loading...'}</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center space-x-2 text-destructive">
             <ServerCrash className="h-5 w-5" />
            <p>{result.resultText || 'The request failed. Please try again later.'}</p>
          </div>
        );
      case 'success':
        if (!result.resultText) {
          return <p>No response generated.</p>;
        }
        return (
            <div className="prose dark:prose-invert max-w-none">
                {parseResponse(result.resultText)}
            </div>
        );
      default:
        return null;
    }
  };

  const renderTitle = () => {
    if (searchMode === 'standard') {
        return `Standard → ${result.name}`;
    }
    return result.name;
  };

  const showContinueChat = result.status === 'success' && chatContext?.chatId;
  const showUsage = typeof result.sparksSpent !== 'undefined' && typeof result.tokensUsed !== 'undefined';

  return (
    <Card className={cn("w-full", result.inConflict && "border-yellow-500")}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
                <CardTitle className="text-base font-medium">
                    {renderTitle()}
                </CardTitle>
            </div>
            <div className="flex items-center gap-2">
                {result.status === 'success' && searchMode === 'multi' && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy}>
                        <Copy className="h-4 w-4" />
                    </Button>
                )}
                 {result.inConflict && (
                    <Badge variant="destructive" className="bg-yellow-600 hover:bg-yellow-700">
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        Conflict
                    </Badge>
                )}
                 {result.status === 'error' && (
                    <Badge variant="destructive">
                        Error
                    </Badge>
                )}
            </div>
        </CardHeader>
        <CardContent>
            {renderContent()}
        </CardContent>
        {(showContinueChat || showUsage) && (
            <CardFooter className="flex-col items-start gap-4">
                {showUsage && (
                    <div className="w-full space-y-2 text-xs text-muted-foreground">
                        <div className="flex justify-between">
                            <span>Tokens used: {result.tokensUsed}</span>
                            <span className="flex items-center gap-1">
                                Sparks spent:
                                <Coins className="h-3 w-3" /> {formatSparksDetailed(result.sparksSpent!)}
                            </span>
                        </div>
                    </div>
                )}
                {showContinueChat && (
                    <Link href={`/chat/${chatContext.chatId}`} passHref>
                        <Button variant="secondary" size="sm">
                            Continue this Chat
                        </Button>
                    </Link>
                )}
            </CardFooter>
        )}
    </Card>
  );
}
