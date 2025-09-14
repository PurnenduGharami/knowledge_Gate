
'use server';
/**
 * @fileOverview A Genkit flow for summarizing and compressing chat history.
 *
 * - compressChatHistory - A function that takes a list of messages and returns a concise summary.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { ChatMessageSchema } from '@/types/search';

const CompressChatInputSchema = z.object({
  messages: z.array(ChatMessageSchema).describe('A chunk of chat messages to be summarized.'),
});
type CompressChatInput = z.infer<typeof CompressChatInputSchema>;

const CompressChatOutputSchema = z.object({
  summary: z.string().describe('The ultra-condensed, one-line summary of the conversation.'),
});
type CompressChatOutput = z.infer<typeof CompressChatOutputSchema>;

export async function compressChatHistory(input: CompressChatInput): Promise<CompressChatOutput> {
  return compressChatFlow(input);
}

const systemPrompt = `You are an expert chat history compressor. Your task is to create an extremely concise, one-line summary of the provided conversation snippet.
Your summary MUST be very short and use aggressive, creative abbreviations.

Here are some examples of the style you should use:
- "function" -> "fn"
- "component" -> "comp"
- "response" -> "resp"
- "configuration" -> "config"
- "discussed" -> "disc'd"
- "User asked about React components, and the assistant explained the useState hook." -> "U: React comps -> A: exp'd useState."
- "The user got an error 'cannot find module' and the assistant suggested checking 'tsconfig.json'." -> "err: 'cannot find module' -> sol: check tsconfig.json"

Now, compress the following conversation into a single, abbreviated line.`;

const prompt = ai.definePrompt({
  name: 'compressChatPrompt',
  input: { schema: CompressChatInputSchema },
  output: { schema: CompressChatOutputSchema },
  prompt: `${systemPrompt}

Conversation to summarize:
{{#each messages}}
- {{role}}: {{text}}
{{/each}}`,
  config: {
    // Use a fast and cheap model for this utility task.
    model: 'googleai/gemini-1.5-flash', 
    temperature: 0, // Low temperature for deterministic, factual summaries.
  },
});

const compressChatFlow = ai.defineFlow(
  {
    name: 'compressChatFlow',
    inputSchema: CompressChatInputSchema,
    outputSchema: CompressChatOutputSchema,
  },
  async input => {
    // If there's only one message, just abbreviate it.
    if (input.messages.length === 1) {
        const text = input.messages[0].text;
        const summary = text.length > 75 ? text.substring(0, 75) + '...' : text;
        return { summary };
    }
    
    const { output } = await prompt(input);
    return output!;
  }
);
