
'use server';

/**
 * @fileOverview A code evaluation agent that uses Judge0.
 *
 * - evaluateCode - A function that evaluates a code submission against test cases using Judge0.
 * - EvaluateCodeInput - The input type for the evaluateCode function eyewrvwery
 * - EvaluateCodeOutput - The return type for the evaluateCode function.
 */

import { z } from 'genkit';

const TestCaseResultSchema = z.object({
  testCaseInput: z.string().describe("The input for the test case."),
  expectedOutput: z.string().describe("The expected output for the test case."),
  actualOutput: z.string().describe("The actual output from the user's code."),
  passed: z.boolean().describe("Whether the user's code passed the test case."),
});

const EvaluateCodeInputSchema = z.object({
  code: z.string().describe('The code submission to evaluate.'),
  programmingLanguage: z.string().describe('The programming language of the code submission.'),
  problemDescription: z.string().describe('The description of the coding problem.'),
  testCases: z.array(z.object({
    input: z.string(),
    output: z.string(),
  })).describe('The test cases to evaluate against.'),
});
export type EvaluateCodeInput = z.infer<typeof EvaluateCodeInputSchema>;

const EvaluateCodeOutputSchema = z.object({
  results: z.array(TestCaseResultSchema).describe('The results for each test case.'),
  allPassed: z.boolean().describe('Whether all test cases passed.'),
  feedback: z.string().describe('Overall feedback on the submission.'),
});
export type EvaluateCodeOutput = z.infer<typeof EvaluateCodeOutputSchema>;

export async function evaluateCode(input: EvaluateCodeInput): Promise<EvaluateCodeOutput> {
  const evaluateCodeFlow = await import('./evaluate-code-flow');
  return evaluateCodeFlow.evaluateCodeFlow(input);
}
