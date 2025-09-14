
'use server';
/**
 * @fileOverview A middleware utility to compress chat history to save tokens.
 * Implements Phase 1 of the Chat Context Compression System design.
 */
import type { ChatMessage } from '@/types/search';
import { compressChatHistory } from '@/ai/flows/compress-chat-flow';

// --- Configuration Constants ---

// Layer 1: Keep the last 3 messages verbatim for immediate context
const IMMEDIATE_CONTEXT_COUNT = 3;
// Layer 2: Condense every 5 messages into a micro-summary
const MICRO_SUMMARY_CHUNK_SIZE = 5;
// Using character-based approximation (4 chars ≈ 1 token)
const TOKEN_ESTIMATION_THRESHOLD_CHARS = 3500 * 4; // ~3.5k tokens

/**
 * A simple token estimator based on character count.
 * @param messages The array of chat messages.
 * @returns An estimated token count.
 */
function estimateTokenCount(messages: ChatMessage[]): number {
  const totalChars = messages.reduce((acc, msg) => acc + msg.text.length, 0);
  return Math.ceil(totalChars / 4);
}

/**
 * The main compression function. It acts as middleware to reduce chat history size if needed.
 * @param messages The full array of chat messages for the current turn.
 * @returns A potentially compressed array of chat messages.
 */
export async function compressMessages(messages: ChatMessage[]): Promise<ChatMessage[]> {
  const totalChars = messages.reduce((acc, msg) => acc + msg.text.length, 0);

  // If the total character count is below the threshold, do nothing.
  if (totalChars < TOKEN_ESTIMATION_THRESHOLD_CHARS) {
    return messages;
  }

  console.log('Chat history exceeds threshold. Compressing...');

  // Layer 1: Keep the most recent messages raw for immediate context.
  const immediateContext = messages.slice(-IMMEDIATE_CONTEXT_COUNT);
  const historyToCompress = messages.slice(0, -IMMEDIATE_CONTEXT_COUNT);

  if (historyToCompress.length === 0) {
    return messages; // Should not happen if threshold is met, but a good safeguard.
  }

  // Layer 2: Create micro-summaries of the older history.
  const summaryChunks: Promise<string>[] = [];
  for (let i = 0; i < historyToCompress.length; i += MICRO_SUMMARY_CHUNK_SIZE) {
    const chunk = historyToCompress.slice(i, i + MICRO_SUMMARY_CHUNK_SIZE);
    if (chunk.length > 0) {
      // Call the Genkit flow to summarize this chunk
      summaryChunks.push(
        compressChatHistory({ messages: chunk }).then(res => res.summary)
      );
    }
  }

  const summaries = await Promise.all(summaryChunks);
  const compressedHistoryText = `CONTEXT SUMMARY: ${summaries.join('; ')}`;
  
  // Create a single system message representing the compressed history.
  const compressedHistoryMessage: ChatMessage = {
    id: `summary-${Date.now()}`,
    role: 'system',
    text: compressedHistoryText,
    timestamp: Date.now(),
  };
  
  // Return the compressed historical context followed by the raw immediate context.
  return [compressedHistoryMessage, ...immediateContext];
}
