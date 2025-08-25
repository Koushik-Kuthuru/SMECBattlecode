
'use server';

/**
 * @fileOverview A code execution agent for sample test cases.
 *
 * - runCode - A function that runs code against sample test cases.
 * - RunCodeInput - The input type for the runCode function.
 * - RunCodeOutput - The return type for the runCode function.
 */

import { z } from 'genkit';
import { type EvaluateCodeOutput } from './evaluate-code'; // Re-use the output type

const RunCodeInputSchema = z.object({
  problemId: z.string().describe('The ID of the problem to run against.'),
  code: z.string().describe('The code submission to run.'),
  programmingLanguage: z.string().describe('The programming language of the code submission.'),
});
export type RunCodeInput = z.infer<typeof RunCodeInputSchema>;

export type RunCodeOutput = EvaluateCodeOutput;

export async function runCode(input: RunCodeInput): Promise<RunCodeOutput> {
  const { runCodeFlow } = await import('./run-code-flow');
  return runCodeFlow(input);
}
