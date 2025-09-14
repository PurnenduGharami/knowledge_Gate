'use server';
/**
 * @fileOverview The primary server action that connects the client-side search component
 * to the server-side Genkit AI flow. It handles data transformation and robust error catching.
 */
import {
  type QueryProviderInput,
  type QueryProviderOutput,
} from '@/types/search';
import { callOpenRouterProxy } from '@/ai/flows/open-router-proxy-flow';

/**
 * The public-facing server action that orchestrates an AI query.
 *
 * It receives a simple query from the client, transforms it into the message
 * format required by the AI proxy, calls the proxy, and most importantly,

 * catches any errors thrown by the proxy flow, returning them as a structured,
 * serializable object that the client can safely handle without crashing the app.
 *
 * @param input The query details from the client. The 'pricing' property is omitted
 * as it is handled authoritatively on the server.
 * @returns A promise that resolves to either a successful `QueryProviderOutput`
 * or a structured `{ error: true, message: string }` object.
 */
export async function queryProvider(
  input: Omit<QueryProviderInput, 'pricing'>
): Promise<QueryProviderOutput | { error: true; message: string }> {

  // Destructure the input for clarity. The 'isUserSelection' property is passed by the
  // client but is not needed by the proxy flow itself.
  const { query, modelId, max_tokens } = input;

  console.log(`[Server Action] Received query for model: ${modelId}`);

  // This try...catch block is the most critical part of the file.
  // It ensures that any error thrown by the Genkit flow is caught and
  // returned as a clean object, rather than crashing the server process.
  try {
    // 1. Transform the client's simple query string into the 'messages' array
    //    format that the Chat Completions API (and our proxy) expects.
    const messages = [{ role: 'user', content: query }];

    // 2. Call the secure, server-side Genkit flow with the correctly formatted input.
    const result = await callOpenRouterProxy({
      modelId,
      messages,
      max_tokens,
    });

    // 3. On success, return the complete result object.
    return result;

  } catch (error: any) {
    // 4. On failure, catch the thrown error.
    console.error(`[Server Action] Error calling Genkit proxy for model ${modelId}:`, error);

    // 5. Return a structured, serializable error object to the client.
    //    This prevents a server crash and allows the client-side code
    //    in knowledge-gate.tsx to handle the failure gracefully.
    return {
      error: true,
      message: error.message || 'An unknown error occurred while contacting the AI model.',
    };
  }
}