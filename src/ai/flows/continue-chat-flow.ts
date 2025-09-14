'use server';
/**
 * @fileOverview A robust flow to continue a chat conversation using OpenRouter.
 */
import { v4 as uuidv4 } from 'uuid';
import type {
  ContinueChatRequest,
  ContinueChatResponse,
  ContinueChatErrorResponse,
} from '@/types/search';
import { compressMessages } from '@/utils/chatCompressor';
import { callOpenRouterProxy } from '@/ai/flows/open-router-proxy-flow';

const FALLBACK_CHAT_MODEL_ID = 'google/gemini-flash-1.5';

export async function continueChat({
  contextToken,
  recentMessages,
}: ContinueChatRequest): Promise<ContinueChatResponse | ContinueChatErrorResponse> {

  if (!contextToken) {
    return { error: true, message: 'Chat context is missing. Cannot continue.' };
  }
  if (!recentMessages || recentMessages.length === 0) {
    return { error: true, message: 'No recent messages provided to continue chat.' };
  }

  let originalQuery: string;
  let chatModelId: string;
  try {
    const tokenPayload = JSON.parse(contextToken);
    originalQuery = tokenPayload.originalQuery;
    chatModelId = tokenPayload.modelId || FALLBACK_CHAT_MODEL_ID;
  } catch (error) {
    console.error("Failed to parse context token:", contextToken, error);
    return { error: true, message: 'Invalid context token provided.' };
  }

  // =================================================================
  // START OF THE FIX
  // =================================================================
  const systemMessage = `You are the Gatekeeper, the official AI assistant for the KnowledgeGate application. Your personality is helpful, knowledgeable, and slightly mysterious, in keeping with the theme of the app. You are continuing a conversation that began with the user's query: "${originalQuery}". The initial response has already been provided. Continue the conversation naturally based on the message history. If you see a 'CONTEXT SUMMARY', use it to understand the older parts of the conversation. Use double newlines to separate paragraphs.`;

  const compressedMessages = await compressMessages(recentMessages);
  
  // This is the new, more compatible way to construct the prompt.
  const allMessagesForApi = compressedMessages.map((msg, index) => {
    // If it's the very first user message, prepend the system instructions.
    if (index === 0 && msg.role === 'user') {
      return {
        role: 'user',
        content: `${systemMessage}\n\n---\n\nUSER'S FIRST MESSAGE:\n${msg.text}`
      };
    }
    // For all other messages, just use their role and text.
    return {
      role: msg.role,
      content: msg.text,
    };
  });
  // =================================================================
  // END OF THE FIX
  // =================================================================

  try {
    const proxyResult = await callOpenRouterProxy({
      modelId: chatModelId,
      messages: allMessagesForApi,
    });
    
    if (proxyResult.error) {
        throw new Error(proxyResult.message);
    }

    const result: ContinueChatResponse = {
      message: {
        id: uuidv4(),
        role: 'assistant' as const,
        text: proxyResult.response,
        timestamp: Date.now(),
        tokensUsed: proxyResult.usage?.total_tokens,
        sparksSpent: proxyResult.sparksSpent,
        costUSD: proxyResult.costUSD,
      },
      usage: proxyResult.usage,
      modelIdUsed: chatModelId,
    };
    return result;

  } catch (error: any) {
    console.error(`[continueChat] The proxy flow failed for model ${chatModelId}:`, error);
    return { error: true, message: error.message || 'The AI proxy failed to respond.' };
  }
}