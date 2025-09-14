'use client';

import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { ChatMessage } from '@/types/search';
import { continueChat } from '@/ai/flows/continue-chat-flow';
import { useToast } from './use-toast';
import { useAppContext } from '@/contexts/AppContext';
import { FLAT_TRANSACTION_FEE_SPARKS } from '@/lib/credits';

const CHATS_STORAGE_KEY = 'knowledgeGateChats';

export function useChat(chatId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isResponding, setIsResponding] = useState(false);
  const [initialQuery, setInitialQuery] = useState('');
  const [contextToken, setContextToken] = useState('');
  const { toast } = useToast();
  const { profile, deductSparks, logTransactions, history } = useAppContext();

  useEffect(() => {
    if (typeof window !== 'undefined' && chatId) {
      try {
        const parentHistoryItem = history.find(item => item.chatContext?.chatId === chatId);

        if (!parentHistoryItem) {
          toast({ title: 'Chat not found', description: 'Could not find the original search for this chat.', variant: 'destructive' });
          setIsLoading(false);
          return;
        }

        setInitialQuery(parentHistoryItem.query);
        if (parentHistoryItem.chatContext?.contextToken) {
            setContextToken(parentHistoryItem.chatContext.contextToken);
        }

        const allChats: Record<string, ChatMessage[]> = JSON.parse(window.localStorage.getItem(CHATS_STORAGE_KEY) || '{}');
        const existingMessages = allChats[chatId];
        
        if (existingMessages) {
          setMessages(existingMessages);
        } else {
           const initialAssistantMessage: ChatMessage = {
            id: uuidv4(),
            role: 'assistant',
            text: parentHistoryItem.results
                .filter(r => r.status === 'success' && r.resultText)
                .map(r => `## ${r.name}\n\n${r.resultText}`)
                .join('\n\n---\n\n'),
            timestamp: parentHistoryItem.timestamp,
            sparksSpent: parentHistoryItem.results.reduce((acc, r) => acc + (r.sparksSpent || 0), 0),
            costUSD: parentHistoryItem.results.reduce((acc, r) => acc + (r.costUSD || 0), 0)
          };
          setMessages([initialAssistantMessage]);
        }
      } catch (error) {
        console.error('Failed to load chat from storage', error);
        toast({ title: 'Error loading chat', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    }
  }, [chatId, toast, history]);

  useEffect(() => {
    if (typeof window !== 'undefined' && chatId && messages.length > 0 && !isLoading) {
      try {
        const allChats = JSON.parse(window.localStorage.getItem(CHATS_STORAGE_KEY) || '{}');
        allChats[chatId] = messages;
        window.localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(allChats));
      } catch (error) {
        console.error('Failed to save chat to storage', error);
      }
    }
  }, [messages, chatId, isLoading]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isResponding || !contextToken) {
      if (!contextToken) {
          toast({ title: 'Chat context not loaded', variant: 'destructive' });
      }
      return;
    }
    if (profile.chaosSparks < FLAT_TRANSACTION_FEE_SPARKS) {
      toast({ title: 'Not enough Chaos Sparks', variant: 'destructive' });
      return;
    }

    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      text: text.trim(),
      timestamp: Date.now(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsResponding(true);

    try {
      const recentMessages = [...messages, userMessage].slice(-5);
      const responseData = await continueChat({ contextToken, recentMessages });

      // =================================================================
      // START OF THE TYPE-SAFE FIX
      // =================================================================

      // THE FIX: This is a "type guard". It checks for the 'error' property.
      // Inside this block, TypeScript KNOWS responseData is the error type.
      if ('error' in responseData) {
          throw new Error(responseData.message); // This is now safe
      }

      // If the code reaches this point, TypeScript KNOWS responseData must be
      // the success type, so all the properties below are now safe to access.

      const { message, modelIdUsed } = responseData; // Safe
      const sparksToDeduct = message.sparksSpent || 0; // Safe
      
      if (profile.chaosSparks < sparksToDeduct) {
        toast({ title: 'Spark Limit Reached', variant: 'destructive' });
        setMessages(prev => prev.filter(m => m.id !== userMessage.id));
        return;
      }
      
      deductSparks(sparksToDeduct);
      
      logTransactions([{
        modelUsed: modelIdUsed, // Safe
        sparksCharged: sparksToDeduct,
        costUSD: message.costUSD || 0, // Safe
        tokensUsed: message.tokensUsed || 0, // Safe
        searchType: 'chat',
      }]);
      
      setMessages(currentMessages => [...currentMessages, message]); // Safe

      // =================================================================
      // END OF THE TYPE-SAFE FIX
      // =================================================================

    } catch (error: any) {
      console.error('Chat API error:', error);
      toast({ title: 'Error getting response', description: error.message, variant: 'destructive' });
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));
    } finally {
      setIsResponding(false);
    }
  }, [messages, isResponding, profile.chaosSparks, contextToken, toast, deductSparks, logTransactions, history]); // Added history to dependencies

  const isCreditLimited = profile.chaosSparks < FLAT_TRANSACTION_FEE_SPARKS;

  return { 
    messages, 
    isLoading: isLoading || isResponding, 
    initialQuery, 
    sendMessage,
    isCreditLimited,
  };
}