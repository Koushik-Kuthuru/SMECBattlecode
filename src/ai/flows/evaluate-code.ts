
'use server';

/**
 * @fileOverview A code evaluation agent that uses the Piston API.
 *
 * - evaluateCode - A function that evaluates a code submission against test cases.
 * - EvaluateCodeInput - The input type for the evaluateCode function.
 * - EvaluateCodeOutput - The return type for the evaluateCode function.
 */

import { z } from 'genkit';

const TestCaseResultSchema = z.object({
  testCaseInput: z.string().describe("The input for the test case."),
  expectedOutput: z.string().describe("The expected output for the test case."),
  actualOutput: z.string().describe("The actual output from the user's code."),
  passed: z.boolean().describe("Whether the user's code passed the test case."),
  status: z.string().describe("The status description from the judge (e.g., 'Accepted', 'Wrong Answer')."),
  stdout: z.string().nullable().describe("The standard output from the user's code."),
  stderr: z.string().nullable().describe("The standard error from the user's code, if any."),
  compile_output: z.string().nullable().describe("The compilation output, if any."),
});


const EvaluateCodeInputSchema = z.object({
  problemId: z.string().describe('The ID of the problem to evaluate against.'),
  code: z.string().describe('The code submission to evaluate.'),
  programmingLanguage: z.string().describe('The programming language of the code submission.'),
});
export type EvaluateCodeInput = z.infer<typeof EvaluateCodeInputSchema>;

const EvaluateCodeOutputSchema = z.object({
  results: z.array(TestCaseResultSchema).describe('The results for each test case.'),
  allPassed: z.boolean().describe('Whether all test cases passed.'),
  feedback: z.string().describe('Overall feedback on the submission.'),
});
export type EvaluateCodeOutput = z.infer<typeof EvaluateCodeOutputSchema>;

export async function evaluateCode(input: EvaluateCodeInput): Promise<EvaluateCodeOutput> {
  const { evaluateCodeFlow } = await import('./evaluate-code-flow');
  return evaluateCodeFlow(input);
}
