
'use server';
/**
 * @fileOverview A flow to summarize text.
 *
 * - summarize - A function that handles summarizing text.
 * - SummarizeInput - The input type for the summarize function.
 * - SummarizeOutput - The return type for the summarize function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeInputSchema = z.object({
  texts: z.array(z.string()).describe('An array of text blocks to be summarized.'),
});
type SummarizeInput = z.infer<typeof SummarizeInputSchema>;

const SummarizeOutputSchema = z.object({
  summary: z.string().describe('The concise summary of all the provided texts.'),
});
type SummarizeOutput = z.infer<typeof SummarizeOutputSchema>;

export async function summarize(input: SummarizeInput): Promise<SummarizeOutput> {
  return summarizeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizePrompt',
  input: {schema: SummarizeInputSchema},
  output: {schema: SummarizeOutputSchema},
  prompt: `You are a text summarization expert. Synthesize the following pieces of text, which are different AI responses to the same query, into a single, coherent, and concise summary. Your output must be clean, professional, and use double newlines to separate paragraphs.

Here are the texts to summarize:
{{#each texts}}
---
{{{this}}}
---
{{/each}}`,
});

const summarizeFlow = ai.defineFlow(
  {
    name: 'summarizeFlow',
    inputSchema: SummarizeInputSchema,
    outputSchema: SummarizeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
