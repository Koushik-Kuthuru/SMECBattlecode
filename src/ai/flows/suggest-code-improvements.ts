
'use server';

/**
 * @fileOverview A code improvement suggestion AI agent.
 *
 * - suggestCodeImprovements - A function that handles the code improvement suggestion process.
 * - SuggestCodeImprovementsInput - The input type for the suggestCodeImprovements function.
 * - SuggestCodeImprovementsOutput - The return type for the suggestCodeImprovements function.
 */

import {z} from 'genkit';

const SuggestCodeImprovementsInputSchema = z.object({
  code: z.string().describe('The code to be improved.'),
  programmingLanguage: z.string().describe('The programming language of the code.'),
});
export type SuggestCodeImprovementsInput = z.infer<typeof SuggestCodeImprovementsInputSchema>;

const SuggestCodeImprovementsOutputSchema = z.object({
  improvements: z.string().describe('The suggested improvements for the code.'),
});
export type SuggestCodeImprovementsOutput = z.infer<typeof SuggestCodeImprovementsOutputSchema>;

export async function suggestCodeImprovements(input: SuggestCodeImprovementsInput): Promise<SuggestCodeImprovementsOutput> {
  const suggestCodeImprovementsFlow = await import('./suggest-code-improvements-flow');
  return suggestCodeImprovementsFlow.suggestCodeImprovementsFlow(input);
}
