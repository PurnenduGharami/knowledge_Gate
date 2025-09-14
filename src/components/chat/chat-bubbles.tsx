
'use client';

import { formatDistanceToNow } from 'date-fns';
import { Bot, User, Coins } from 'lucide-react';
import { parseResponse } from '@/utils/parseResponse';
import type { ChatMessage } from '@/types/search';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatSparksDetailed } from '@/lib/credits';

interface BubbleProps {
  message: ChatMessage;
}

export function UserBubble({ message }: BubbleProps) {
  return (
    <div className="flex items-start gap-3 justify-end">
      <div className="flex flex-col items-end gap-1">
        <div className="bg-primary text-primary-foreground p-3 rounded-xl rounded-br-none max-w-lg">
          <p className="text-sm whitespace-pre-wrap">{message.text}</p>
        </div>
        <span className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
        </span>
      </div>
      <Avatar>
        <AvatarFallback><User /></AvatarFallback>
      </Avatar>
    </div>
  );
}

export function AssistantBubble({ message }: BubbleProps) {
  const showUsage = typeof message.sparksSpent !== 'undefined' && typeof message.tokensUsed !== 'undefined';
  
  return (
    <div className="flex items-start gap-3">
      <Avatar>
        <AvatarFallback><Bot /></AvatarFallback>
      </Avatar>
      <div className="flex flex-col items-start gap-1 w-full">
        <div className="bg-muted text-muted-foreground p-3 rounded-xl rounded-bl-none max-w-lg">
          <div className="prose prose-sm dark:prose-invert max-w-none text-foreground">
            {parseResponse(message.text)}
          </div>
        </div>
        <div className="flex items-center justify-between w-full max-w-lg">
            <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
            </span>
            {showUsage && (
                <span className="text-xs text-muted-foreground italic flex items-center gap-1">
                    {message.tokensUsed} tokens / 
                    <Coins className="h-3 w-3" /> {formatSparksDetailed(message.sparksSpent!)}
                </span>
            )}
        </div>
      </div>
    </div>
  );
}

export function LoadingBubble() {
    return (
        <div className="flex items-start gap-3">
            <Avatar>
                <AvatarFallback><Bot /></AvatarFallback>
            </Avatar>
            <div className="bg-muted text-muted-foreground p-3 rounded-xl rounded-bl-none">
                <div className="flex items-center gap-1">
                    <span className="h-2 w-2 bg-foreground rounded-full animate-pulse [animation-delay:-0.3s]" />
                    <span className="h-2 w-2 bg-foreground rounded-full animate-pulse [animation-delay:-0.15s]" />
                    <span className="h-2 w-2 bg-foreground rounded-full animate-pulse" />
                </div>
            </div>
        </div>
    )
}
