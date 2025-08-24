
'use server';

/**
 * @fileOverview A code comparison AI agent.
 *
 * - compareCode - A function that compares two code snippets for similarity.
 * - CompareCodeInput - The input type for the compareCode function.
 * - CompareCodeOutput - The return type for the compareCode function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CompareCodeInputSchema = z.object({
  code1: z.string().describe('The first code snippet.'),
  code2: z.string().describe('The second code snippet.'),
  language: z.string().describe('The programming language of both snippets.'),
});
export type CompareCodeInput = z.infer<typeof CompareCodeInputSchema>;

const CompareCodeOutputSchema = z.object({
  similarity: z.number().min(0).max(100).describe('The similarity score between the two code snippets, from 0 to 100.'),
  explanation: z.string().describe('A brief explanation of the similarities or differences found.'),
});
export type CompareCodeOutput = z.infer<typeof CompareCodeOutputSchema>;


export async function compareCode(input: CompareCodeInput): Promise<CompareCodeOutput> {
  const compareCodeFlow = await import('./compare-code-flow');
  return compareCodeFlow.compareCodeFlow(input);
}
