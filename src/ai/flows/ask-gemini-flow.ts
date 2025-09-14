'use server';
/**
 * @fileOverview A flow to query the Gemini model directly as a fallback.
 *
 * - askGemini - A function that takes a query and returns a response from Gemini.
 * - AskGeminiInput - The input type for the askGemini function.
 * - AskGeminiOutput - The return type for the askGemini function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AskGeminiInputSchema = z.object({
  query: z.string().describe('The user query to send to Gemini.'),
});
type AskGeminiInput = z.infer<typeof AskGeminiInputSchema>;

const AskGeminiOutputSchema = z.object({
  response: z.string().describe('The text response from Gemini.'),
});
type AskGeminiOutput = z.infer<typeof AskGeminiOutputSchema>;

export async function askGemini(input: AskGeminiInput): Promise<AskGeminiOutput> {
  return askGeminiFlow(input);
}

const askGeminiFlow = ai.defineFlow(
  {
    name: 'askGeminiFlow',
    inputSchema: AskGeminiInputSchema,
    outputSchema: AskGeminiOutputSchema,
  },
  async (input) => {
    const {text} = await ai.generate({
      prompt: input.query,
    });

    return { response: text };
  }
);
