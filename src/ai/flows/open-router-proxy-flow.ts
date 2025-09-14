
'use server';
/**
 * @fileOverview A secure Genkit flow to proxy requests to the OpenRouter API.
 * This flow is intended to be deployed as a Cloud Function to bypass App Hosting's
 * outbound networking restrictions.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getModelById } from '@/utils/openRouter';
import { calculateSparksFromUsage } from '@/lib/credits';
import { QueryProviderOutputSchema } from '@/types/search';

// A more generic input schema that can handle both single queries and chat conversations.
const OpenRouterProxyInputSchema = z.object({
  modelId: z.string().describe('The OpenRouter model ID to use.'),
  messages: z.array(z.object({
    role: z.string(),
    content: z.string(),
  })).describe('The array of messages for the conversation.'),
  max_tokens: z.number().optional().describe('The maximum number of tokens to generate.'),
});
type OpenRouterProxyInput = z.infer<typeof OpenRouterProxyInputSchema>;

// This is the actual Genkit flow definition.
// When deployed, this becomes a Cloud Function.
const openRouterProxyFlow = ai.defineFlow(
  {
    name: 'openRouterProxyFlow',
    inputSchema: OpenRouterProxyInputSchema,
    outputSchema: QueryProviderOutputSchema, // We can reuse this output schema
  },
  async (input) => {
    const { modelId, messages, max_tokens } = input;
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      // This error will be thrown in the Cloud Function's logs
      throw new Error('CRITICAL: OPENROUTER_API_KEY is not set in the function environment.');
    }

    // Server-side fetch of model details for security
    const model = await getModelById(modelId);
    if (!model || !model.pricing) {
      throw new Error(`Pricing information could not be determined for model ${modelId}.`);
    }
    const pricing = model.pricing;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30-second timeout

    const body: {
      model: string;
      messages: { role: string; content: string }[];
      max_tokens?: number;
      stream: boolean;
    } = {
      model: modelId,
      messages,
      stream: false, // Explicitly disable streaming.
    };

    if (max_tokens) {
      body.max_tokens = max_tokens;
    }

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://knowlegegate.com',
          'X-Title': 'KnowledgeGate',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API request failed with status ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      
      const fullTextResponse = data.choices?.[0]?.message?.content || '';
      const usageData = data.usage;
      
      if (!fullTextResponse && !usageData) {
        throw new Error("Invalid or empty response from OpenRouter API.");
      }

      const { costUSD, sparksSpent } = calculateSparksFromUsage(usageData, pricing);

      // **THE FIX**: Create a new, plain object to ensure it's serializable.
      // This prevents complex Genkit objects from being returned to the Next.js server.
      const result: z.infer<typeof QueryProviderOutputSchema> = { 
          response: fullTextResponse, 
          originalModelId: modelId,
          usage: usageData ? {
            prompt_tokens: usageData.prompt_tokens,
            completion_tokens: usageData.completion_tokens,
            total_tokens: usageData.total_tokens,
          } : undefined,
          costUSD: costUSD,
          sparksSpent: sparksSpent,
      };

      return result;

    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error(`[openRouterProxyFlow] Error during fetch for model ${modelId}:`, error);
      // Re-throw the error so the calling action knows it failed.
      throw error;
    }
  }
);

// We export a simple wrapper function. From another server action, calling this
// will invoke the Genkit flow.
export async function callOpenRouterProxy(input: OpenRouterProxyInput) {
    const result = await openRouterProxyFlow(input);
    // Force serialization to a plain object before returning from the server action context.
    return JSON.parse(JSON.stringify(result));
}
