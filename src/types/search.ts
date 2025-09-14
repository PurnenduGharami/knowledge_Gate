import { z } from 'zod';
import type { Tier } from './profile';

export type SearchMode = "standard" | "multi" | "summary" | "conflict" | "custom";

export interface OpenRouterModel {
  id: string;
  name: string;
  rank: number;
  provider: string;
  family: string;
  isFree: boolean;
  tier: Tier;
  pricing: {
    prompt: number;
    completion: number;
    request: number;
  };
}

export interface ModelCache {
  lastUpdated: string; // ISO date string
  models: OpenRouterModel[];
}

export interface ProviderResult {
  providerId: string;
  name: string;
  status: "loading" | "success" | "error";
  resultText?: string;
  inConflict?: boolean; // For conflict mode
  tokensUsed?: number;
  sparksSpent?: number;
  costUSD?: number;
}

export interface FallbackInfo {
  attempted: string[]; // provider names tried in order
  used: string;        // the one that returned success
  rateLimitExceeded: boolean;
}

export interface ConflictPair {
    a: string; // providerId
    b: string; // providerId
    diffSnippets: { fromA: string; fromB: string }[];
}

export interface CustomSettings {
    selectedProviderIds: string[];
    summarize: boolean;
}

export interface Project {
  id: string;
  name:string;
  createdAt: number;
  isDefault?: boolean;
  color?: string;
  isArchived: boolean;
}

// For chat messages
export interface ChatMessage {
  id: string;              // UUID
  role: 'user' | 'assistant' | 'system';
  text: string;            // raw or tagged text
  timestamp: number;
  tokensUsed?: number;
  sparksSpent?: number;
  costUSD?: number;
}

// Stored with each history item
export interface ChatContext {
  chatId: string;
  contextToken: string;    // small summary or hash
}


export interface HistoryItem {
  id: string;
  query: string;
  projectId: string; // references Project.id
  results: ProviderResult[];
  timestamp: number;
  mode: SearchMode;
  fallbackInfo?: FallbackInfo | null;
  notes?: string;
  isFavorite?: boolean;
  chatContext?: ChatContext;
}

const OpenRouterUsageSchema = z.object({
  prompt_tokens: z.number().optional(),
  completion_tokens: z.number().optional(),
  total_tokens: z.number().optional(),
}).optional();

export type UsageStats = z.infer<typeof OpenRouterUsageSchema>;

export const QueryProviderInputSchema = z.object({
  query: z.string().describe('The user query to send to the provider.'),
  modelId: z.string().describe('The OpenRouter model ID to use.'),
  isUserSelection: z.boolean().optional().describe('Indicates if this is a user-selected model, to prevent fallback.'),
  // pricing is removed from the input schema for security reasons. The server will fetch it.
  max_tokens: z.number().optional().describe('The maximum number of tokens to generate.'),
});
export type QueryProviderInput = z.infer<typeof QueryProviderInputSchema>;

export const QueryProviderOutputSchema = z.object({
  response: z.string().describe('The text response from the provider.'),
  originalModelId: z.string().optional().describe('The model ID originally requested.'),
  fallbackUsed: z.boolean().optional().describe('Indicates if a fallback model was used.'),
  fallbackModelId: z.string().optional().describe('The model ID of the fallback model used.'),
  rateLimitExceeded: z.boolean().optional().describe('Indicates if the primary model failed due to rate limits.'),
  usage: OpenRouterUsageSchema,
  costUSD: z.number().optional().describe("Cost in USD, calculated locally from token usage and pricing."),
  sparksSpent: z.number().optional().describe("Total sparks spent, calculated locally."),
  // A new field for handling server-side errors gracefully
  error: z.boolean().optional(),
  message: z.string().optional(),
});
export type QueryProviderOutput = z.infer<typeof QueryProviderOutputSchema>;


// Schemas for Continue Chat Flow
export const ChatMessageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'assistant', 'system']),
  text: z.string(),
  timestamp: z.number(),
  tokensUsed: z.number().optional(),
  sparksSpent: z.number().optional(),
  costUSD: z.number().optional(),
});

export const ContinueChatRequestSchema = z.object({
  contextToken: z.string().describe('A small string or summary of a prior exchange.'),
  recentMessages: z.array(ChatMessageSchema).describe('The last N messages to preserve recent context.'),
});
export type ContinueChatRequest = z.infer<typeof ContinueChatRequestSchema>;


// =================================================================
// START OF THE FIX
// =================================================================

// This is the response for a SUCCESSFUL chat continuation
export const ContinueChatResponseSchema = z.object({
  message: ChatMessageSchema.describe('The new assistant message with a generated id & timestamp.'),
  usage: OpenRouterUsageSchema,
  modelIdUsed: z.string().describe('The actual model ID used for the transaction log.'), // <-- THE NEW, REQUIRED FIELD
});
export type ContinueChatResponse = z.infer<typeof ContinueChatResponseSchema>;

// This is a plain type for a FAILED chat continuation
export type ContinueChatErrorResponse = {
  error: true;
  message: string;
};

// =================================================================
// END OF THE FIX
// =================================================================