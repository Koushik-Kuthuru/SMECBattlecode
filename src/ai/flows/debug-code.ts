
'use server';

/**
 * @fileOverview A code debugging agent that uses Judge0.
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

const DebugCodeOutputSchema = z.object({
  stdout: z.string().describe("The standard output from the user's code."),
  stderr: z.string().describe("The standard error from the user's code, if any."),
  compile_output: z.string().describe("Compilation output, if any."),
  status: z.string().describe("The execution status description."),
});
export type DebugCodeOutput = z.infer<typeof DebugCodeOutputSchema>;


export async function debugCode(input: DebugCodeInput): Promise<DebugCodeOutput> {
  const { debugCodeFlow } = await import('./debug-code-flow');
  // The problemId is not strictly needed for a debug run against custom input,
  // but we can pass an empty string or a placeholder if the flow expects it.
  // In this new implementation, it's not needed.
  return debugCodeFlow(input);
}
