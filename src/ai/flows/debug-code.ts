
'use server';

/**
 * @fileOverview A code debugging agent that uses the Piston API.
 *
 * - debugCode - A function that executes code with a given input and returns the output.
 * - DebugCodeInput - The input type for the debugCode function.
 * - DebugCodeOutput - The return type for the debugCodeOutput function.
 */

import { z } from 'genkit';

const DebugCodeInputSchema = z.object({
  code: z.string().describe('The code submission to debug.'),
  programmingLanguage: z.string().describe('The programming language of the code submission.'),
  input: z.string().describe('The standard input to provide to the code.'),
});
export type DebugCodeInput = z.infer<typeof DebugCodeInputSchema>;

const PistonExecutionOutputSchema = z.object({
  stdout: z.string().describe('The standard output of the code execution.'),
  stderr: z.string().describe('The standard error of the code execution, if any.'),
  output: z.string().describe('The combined output (stdout and stderr).'),
  code: z.number().optional().describe('The exit code of the execution.'),
  signal: z.string().nullable().optional().describe('The signal that terminated the execution, if any.'),
}).optional();

const DebugCodeOutputSchema = z.object({
  language: z.string().optional(),
  version: z.string().optional(),
  run: PistonExecutionOutputSchema,
  compile: PistonExecutionOutputSchema,
});
export type DebugCodeOutput = z.infer<typeof DebugCodeOutputSchema>;


export async function debugCode(input: DebugCodeInput): Promise<DebugCodeOutput> {
  const { debugCodeFlow } = await import('./debug-code-flow');
  return debugCodeFlow(input);
}
