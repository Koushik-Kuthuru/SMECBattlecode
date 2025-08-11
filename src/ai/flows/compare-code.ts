
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
  return compareCodeFlow(input);
}


const prompt = ai.definePrompt({
  name: 'compareCodePrompt',
  input: {schema: CompareCodeInputSchema},
  output: {schema: CompareCodeOutputSchema},
  prompt: `You are an expert in code analysis and plagiarism detection. Your task is to compare two code submissions and determine how similar they are.

  **Programming Language:**
  {{{language}}}

  **Code Submission 1:**
  \`\`\`{{{language}}}
  {{{code1}}}
  \`\`\`

  **Code Submission 2:**
  \`\`\`{{{language}}}
  {{{code2}}}
  \`\`\`

  **Instructions:**
  1.  Analyze the logic, structure, algorithms, and variable naming of both code snippets.
  2.  Calculate a similarity score from 0 (completely different) to 100 (identical or trivially different).
  3.  Provide a brief explanation for your score. Mention key similarities (e.g., "Both solutions use a two-pointer approach with identical loop conditions") or differences (e.g., "Submission 1 uses recursion, while Submission 2 uses an iterative approach"). Ignore minor differences like comments or whitespace unless they are part of a larger pattern of obfuscation.

  Return a JSON object matching the specified output schema.
  `,
});

const compareCodeFlow = ai.defineFlow(
  {
    name: 'compareCodeFlow',
    inputSchema: CompareCodeInputSchema,
    outputSchema: CompareCodeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

    