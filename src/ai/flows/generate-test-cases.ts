
'use server';

/**
 * @fileOverview Test case generation AI agent.
 *
 * - generateTestCases - A function that generates test cases for a given code submission.
 * - GenerateTestCasesInput - The input type for the generateTestCases function.
 * - GenerateTestCasesOutput - The return type for the generateTestCases function.
 */

import {z} from 'genkit';

const GenerateTestCasesInputSchema = z.object({
  code: z.string().describe('The code submission to generate test cases for.'),
  programmingLanguage: z
    .string()
    .describe('The programming language of the code submission.'),
  problemDescription: z.string().describe('The description of the coding problem.'),
});
export type GenerateTestCasesInput = z.infer<typeof GenerateTestCasesInputSchema>;

const GenerateTestCasesOutputSchema = z.object({
  testCases: z.array(z.string()).describe('The generated test cases.'),
});
export type GenerateTestCasesOutput = z.infer<typeof GenerateTestCasesOutputSchema>;

export async function generateTestCases(input: GenerateTestCasesInput): Promise<GenerateTestCasesOutput> {
  const generateTestCasesFlow = await import('./generate-test-cases-flow');
  return generateTestCasesFlow.generateTestCasesFlow(input);
}
