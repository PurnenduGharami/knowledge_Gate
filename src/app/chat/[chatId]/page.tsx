
'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useChat } from '@/hooks/useChat';
import { ChatInput } from '@/components/chat/chat-input';
import { UserBubble, AssistantBubble, LoadingBubble } from '@/components/chat/chat-bubbles';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function ChatPage() {
  const params = useParams();
  const chatId = Array.isArray(params.chatId) ? params.chatId[0] : params.chatId;

  const { messages, isLoading, initialQuery, sendMessage, isCreditLimited } = useChat(chatId);

  return (
    <div className="flex flex-col h-screen w-full bg-card">
      <header className="flex items-center p-4 border-b shrink-0">
        <Button asChild variant="ghost" size="icon" className="mr-2">
            <Link href="/main/history">
                <ArrowLeft />
            </Link>
        </Button>
        {isLoading && !initialQuery ? (
          <Skeleton className="h-6 w-1/2" />
        ) : (
          <h1 className="text-lg font-semibold truncate" title={initialQuery}>{initialQuery || 'Chat'}</h1>
        )}
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          if (message.role === 'user') {
            return <UserBubble key={message.id} message={message} />;
          }
          return <AssistantBubble key={message.id} message={message} />;
        })}
        {isLoading && messages.length > 0 && <LoadingBubble />}
      </main>
      
      <footer className="p-4 shrink-0">
        <div className="w-4/5 mx-auto">
            <ChatInput onSend={sendMessage} isLoading={isLoading || isCreditLimited} />
        </div>
      </footer>
    </div>
  );
}
