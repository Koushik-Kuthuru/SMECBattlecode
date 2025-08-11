
'use server';

/**
 * @fileOverview An AI-generated code detection agent.
 *
 * - detectAiGeneratedCode - A function that analyzes code to detect if it was written by an AI.
 * - DetectAiGeneratedCodeInput - The input type for the detectAiGeneratedCode function.
 * - DetectAiGeneratedCodeOutput - The return type for the detectAiGeneratedCode function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectAiGeneratedCodeInputSchema = z.object({
  code: z.string().describe('The code submission to analyze.'),
  programmingLanguage: z.string().describe('The programming language of the code submission.'),
});
export type DetectAiGeneratedCodeInput = z.infer<typeof DetectAiGeneratedCodeInputSchema>;

const DetectAiGeneratedCodeOutputSchema = z.object({
  isAiGenerated: z.boolean().describe('Whether the code is suspected to be AI-generated.'),
  confidence: z.number().min(0).max(100).describe('The confidence score (0-100) of the assessment.'),
  explanation: z.string().describe('A brief explanation for the assessment.'),
});
export type DetectAiGeneratedCodeOutput = z.infer<typeof DetectAiGeneratedCodeOutputSchema>;

export async function detectAiGeneratedCode(input: DetectAiGeneratedCodeInput): Promise<DetectAiGeneratedCodeOutput> {
  return detectAiGeneratedCodeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'detectAiGeneratedCodePrompt',
  input: {schema: DetectAiGeneratedCodeInputSchema},
  output: {schema: DetectAiGeneratedCodeOutputSchema},
  prompt: `You are an expert code reviewer specializing in distinguishing between human-written and AI-generated code. Your task is to analyze a code submission and determine if it was likely written by an AI.

  **Programming Language:**
  {{{programmingLanguage}}}

  **Code Submission:**
  \`\`\`{{{programmingLanguage}}}
  {{{code}}}
  \`\`\`

  **Instructions:**
  1.  Analyze the code for common characteristics of AI-generated code, such as:
      - Overly descriptive or verbose variable names (e.g., 'number_to_check').
      - Unnecessary or overly detailed comments explaining basic code.
      - Use of complex algorithms or obscure language features for simple problems.
      - Hyper-efficient, one-liner solutions that are correct but hard to read.
      - Lack of typical human errors, typos, or "code smell".
      - Very generic or "textbook" implementation styles.
  2.  Based on your analysis, set the 'isAiGenerated' flag to true if you suspect AI involvement, otherwise false.
  3.  Provide a confidence score (0-100) for your assessment.
  4.  Provide a brief 'explanation' for your decision, highlighting the specific characteristics you observed.

  Return a JSON object matching the specified output schema.
  `,
});

const detectAiGeneratedCodeFlow = ai.defineFlow(
  {
    name: 'detectAiGeneratedCodeFlow',
    inputSchema: DetectAiGeneratedCodeInputSchema,
    outputSchema: DetectAiGeneratedCodeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
