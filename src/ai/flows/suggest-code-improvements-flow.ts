
'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestCodeImprovementsInputSchema = z.object({
  code: z.string().describe('The code to be improved.'),
  programmingLanguage: z.string().describe('The programming language of the code.'),
});

const SuggestCodeImprovementsOutputSchema = z.object({
  improvements: z.string().describe('The suggested improvements for the code.'),
});

const prompt = ai.definePrompt({
  name: 'suggestCodeImprovementsPrompt',
  input: {schema: SuggestCodeImprovementsInputSchema},
  output: {schema: SuggestCodeImprovementsOutputSchema},
  prompt: `You are an expert software engineer specializing in code quality and improvements.\n\nYou will use the provided code and programming language to suggest improvements to the code, such as better variable names, more efficient algorithms, or any other way to improve the code quality.\n\nProgramming Language: {{{programmingLanguage}}}\nCode: {{{code}}}`,
});

export const suggestCodeImprovementsFlow = ai.defineFlow(
  {
    name: 'suggestCodeImprovementsFlow',
    inputSchema: SuggestCodeImprovementsInputSchema,
    outputSchema: SuggestCodeImprovementsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
